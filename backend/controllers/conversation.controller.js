const asyncHandler = require("../middlewares/asyncHandler.middleware");
const { HTTPSTATUS } = require("../config/http.config");
const { getConversationsService, getMessagesService, } = require("../services/conversation.service");
const { BadRequestException } = require("../utils/appError");

const getConversationsController = asyncHandler(async (req, res) => {
    const currentUserId = req.user._id;
    const workspaceId = req.query.workspaceId || (typeof req.user.currentWorkspace === 'object' ? req.user.currentWorkspace._id : req.user.currentWorkspace);
    if (!workspaceId) throw new BadRequestException("Workspace ID is required.");
    const { conversations } = await getConversationsService(currentUserId, workspaceId);
    return res.status(HTTPSTATUS.OK).json({ conversations });
});

const getMessagesController = asyncHandler(async (req, res) => {
    const currentUserId = req.user._id;
    const { otherUserId } = req.params;
    const { workspaceId } = req.query;
    if (!workspaceId) throw new BadRequestException("Workspace ID is required as a query parameter.");
    const { messages } = await getMessagesService(currentUserId, otherUserId, workspaceId);
    return res.status(HTTPSTATUS.OK).json({ messages });
});



module.exports = { getConversationsController, getMessagesController };