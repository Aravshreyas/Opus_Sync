  const jwt = require('jsonwebtoken');
  const cookie = require('cookie');
  const mongoose = require('mongoose');
  const Conversation = require('../models/conversation.model');
  const Message = require('../models/message.model');

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

   // When a user initiates a call to another user
    socket.on('call-user', (data) => {
        const { to, offer, from } = data;
        console.log(`[SIGNALING] User ${from.name} is calling user with ID ${to}`);
        // Forward the offer to the target user's private room
        io.to(to).emit('call-made', {
            offer,
            from,
        });
    });

    // When a user accepts a call
    socket.on('answer-call', (data) => {
        const { to, answer } = data;
        console.log(`[SIGNALING] Call answered. Sending answer to original caller: ${to}`);
        // Forward the answer back to the original caller's private room
        io.to(to).emit('answer-made', {
            answer,
        });
    });
    
    // For relaying network information (ICE candidates) between the two users
    socket.on('ice-candidate', (data) => {
        const { to, candidate } = data;
        io.to(to).emit('ice-candidate', { candidate });
    });

    // For ending a call
    socket.on('end-call', (data) => {
        const { to } = data;
        io.to(to).emit('call-ended');
    });

      
    });
  };

  module.exports = { initializeSocket };