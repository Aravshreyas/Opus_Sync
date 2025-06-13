const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const mongoose = require('mongoose');

const getConversationsService = async (currentUserId) => {
    const conversations = await Conversation.find({ participants: currentUserId })
        .populate({ path: 'participants', select: 'name profilePicture defaultProfilePictureUrl' })
        .populate({ path: 'lastMessage' }) // Populate the full last message to access its status
        .populate('workspaceId', 'name')
        .sort({ updatedAt: -1 });

    // Use Promise.all to fetch unread counts concurrently
    const conversationsWithUnread = await Promise.all(
        conversations.map(async (convo) => {
            const unreadCount = await Message.countDocuments({
                conversationId: convo._id,
                status: { $ne: 'read' },
                senderId: { $ne: currentUserId } // Count messages sent by the other person that are not read
            });

            const otherParticipant = convo.participants.find(p => p._id.toString() !== currentUserId.toString());
            
            return {
                ...convo.toObject(),
                participants: undefined,
                otherParticipant: otherParticipant,
                unreadCount: unreadCount, // Add the calculated count
            };
        })
    );

    return { conversations: conversationsWithUnread };
};

const getMessagesService = async (currentUserId, otherUserId, workspaceId) => {
    if (!mongoose.Types.ObjectId.isValid(otherUserId) || !mongoose.Types.ObjectId.isValid(workspaceId)) {
        throw new BadRequestException("Invalid user or workspace ID format.");
    }
    const conversation = await Conversation.findOne({ workspaceId, participants: { $all: [currentUserId, otherUserId] } });
    if (!conversation) return { messages: [] };
    const messages = await Message.find({ conversationId: conversation._id })
        .populate("senderId", "name profilePicture defaultProfilePictureUrl")
        .sort({ createdAt: 'asc' });
    return { messages };
};



module.exports = { getConversationsService, getMessagesService };