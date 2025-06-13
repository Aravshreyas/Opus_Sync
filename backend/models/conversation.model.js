const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    isGroupChat: {
      type: Boolean,
      default: false, // Will be `true` if it's a group, `false` for a 1-on-1 DM
    },
    name: {
      type: String,
      trim: true, // The name of the group chat, e.g., "Project Phoenix Team"
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // The user who created and can manage the group
    },
    groupAvatar: {
        type: String,
        default: null, // A URL for the group's profile picture
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  { timestamps: true }
);

const ConversationModel = mongoose.model("Conversation", conversationSchema);
module.exports = ConversationModel;