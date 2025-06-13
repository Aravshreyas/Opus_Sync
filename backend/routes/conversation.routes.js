const { Router } = require("express");
const isAuthenticated = require('../middlewares/isAuthenticated.middleware');
const { getConversationsController, getMessagesController } = require('../controllers/conversation.controller');

const conversationRoutes = Router();



// Route to get all conversations for the logged-in user
// GET /api/conversations/
conversationRoutes.get("/", getConversationsController);

// Route to get message history with a specific user
// GET /api/conversations/60d21b4667d0d8992e610c85 (example otherUserId)
conversationRoutes.get("/:otherUserId", getMessagesController);


module.exports = conversationRoutes;