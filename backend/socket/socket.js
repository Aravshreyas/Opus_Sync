  const jwt = require('jsonwebtoken');
  const cookie = require('cookie');
  const mongoose = require('mongoose');
  const Conversation = require('../models/conversation.model');
  const Message = require('../models/message.model');
  const MeetingModel = require('../models/meeting.model');
const { createLiveKitToken } = require('../services/livekit.service');

  const userSocketMap = {}; 
  const getOnlineUsers = () => Object.keys(userSocketMap);

  const initializeSocket = (io) => {
    io.use((socket, next) => {
      try {
        let token = (socket.handshake.auth && socket.handshake.auth.token) || null;
        if (!token && socket.handshake.headers.cookie) {
          token = cookie.parse(socket.handshake.headers.cookie).jwt;
        }
        if (!token) return next(new Error("Authentication Error: Token not provided."));
        
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
          if (err) return next(new Error("Authentication Error: Invalid token."));
          socket.user = decoded;
          next();
        });
      } catch (err) { next(new Error("Authentication Error")); }
    });

    io.on('connection', (socket) => {
      const userId = socket.user.userId;
      userSocketMap[userId] = socket.id;
      socket.join(userId);
      io.emit('getOnlineUsers', getOnlineUsers());

      socket.on('disconnect', () => {
        delete userSocketMap[userId];
        io.emit('getOnlineUsers', getOnlineUsers());
      });


    // --- NEW: LOBBY AND MEETING JOIN LOGIC ---

      socket.on('request-to-join', async ({ meetingId }) => {
        try {
            const meeting = await MeetingModel.findOne({ meetingId: meetingId }).populate('participants', '_id').populate('createdBy', '_id');
            if (!meeting) {
                return socket.emit('join-request-failed', { message: "Meeting not found." });
            }

            const isInvited = meeting.participants.some(p => p._id.toString() === userId);
            const isAdmin = meeting.createdBy._id.toString() === userId;

            if (isInvited || isAdmin) {
                // FIX: Use socket.user.name directly
                const token = await createLiveKitToken({ roomName: meetingId, participantName: socket.user.name });
                socket.emit('join-request-approved', { token });
            } else {
                const adminSocketId = userSocketMap[meeting.createdBy._id.toString()];
                if (adminSocketId) {
                    io.to(adminSocketId).emit('new-join-request', { 
                        // FIX: Use socket.user.name directly
                        guest: { id: userId, name: socket.user.name },
                        meetingId: meetingId
                    });
                }
                socket.emit('waiting-for-host');
            }
        } catch (error) {
            console.error("Error in request-to-join:", error);
            socket.emit('join-request-failed', { message: "Server error." });
        }
    });

    socket.on('admit-guest', async ({ guest, meetingId }) => {
        const meeting = await MeetingModel.findOne({ meetingId });
        if (!meeting || meeting.createdBy.toString() !== userId) {
            return; // Security check: only the admin can admit
        }
        const token = await createLiveKitToken({ roomName: meetingId, participantName: guest.name });
        const guestSocketId = userSocketMap[guest.id];
        if (guestSocketId) {
            io.to(guestSocketId).emit('join-request-approved', { token });
        }
    });

    socket.on('deny-guest', async ({ guest, meetingId }) => {
        const meeting = await MeetingModel.findOne({ meetingId });
        if (!meeting || meeting.createdBy.toString() !== userId) {
            return; // Security check
        }
        const guestSocketId = userSocketMap[guest.id];
         if (guestSocketId) {
            io.to(guestSocketId).emit('join-request-denied');
         }
    });

      socket.on('sendMessage', async ({ recipientId, content, workspaceId, conversationId }) => {
        try {
          const senderId = userId;
          let conversation = await Conversation.findOne({ workspaceId, participants: { $all: [senderId, recipientId] } });
          if (!conversation) {
              conversation = await Conversation.create({ participants: [senderId, recipientId], workspaceId });
          }
          const newMessage = new Message({ conversationId: conversation._id, senderId, content });
          await newMessage.save();
          conversation.lastMessage = newMessage._id;
          await conversation.save();
          
          const messageToSend = await Message.findById(newMessage._id).populate("senderId", "name profilePicture defaultProfilePictureUrl");
          const payload = { ...messageToSend.toObject(), recipientId: recipientId, workspaceId: conversation.workspaceId };

          const recipientSocketId = userSocketMap[recipientId];
                  if (recipientSocketId) {
                      // If recipient is online, mark as delivered immediately
                      newMessage.status = 'delivered';
                      await newMessage.save();
                      payload.status = 'delivered';
                      io.to(recipientId).emit('newMessage', payload);
                  }
                  
                  socket.emit('newMessage', payload);
        } catch (error) { console.error("Error in sendMessage:", error); }
      });
      socket.on('markMessagesAsRead', async ({ conversationId, otherUserId }) => {
              try {
                  await Message.updateMany(
                      { conversationId: conversationId, senderId: otherUserId, status: { $ne: 'read' } },
                      { $set: { status: 'read' } }
                  );

                  // Notify the original sender that their messages have been read
                  io.to(otherUserId).emit('messagesRead', { conversationId: conversationId });

              } catch (error) {
                  console.error("Error in markMessagesAsRead event:", error);
              }
          });
      socket.on('startTyping', ({ recipientId }) => socket.to(recipientId).emit('typing', { senderId: userId }));
      socket.on('stopTyping', ({ recipientId }) => socket.to(recipientId).emit('stopTyping', { senderId: userId }));

      
    });
  };

  module.exports = { initializeSocket };