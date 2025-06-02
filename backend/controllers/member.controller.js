
const  asyncHandler  = require("../middlewares/asyncHandler.middleware");
const { HTTPSTATUS } = require("../config/http.config");
const { joinWorkspaceByInviteService } = require("../services/member.service");
const { BadRequestException, UnauthorizedException } = require("../utils/appError");

const joinWorkspaceController = asyncHandler(async (req, res) => {
    const inviteCode = req.params.inviteCode;

    if (!inviteCode) {
        throw BadRequestException("Invite code is required");
    }

    const userId = req.user ? req.user._id : null;
    if (!userId) {
        throw UnauthorizedException("User not authenticated");
    }

    const { workspaceId, role } = await joinWorkspaceByInviteService(userId, inviteCode);

    return res.status(HTTPSTATUS.OK).json({
        message: "Successfully joined the workspace",
        workspaceId,
        role,
    });
});

module.exports = { joinWorkspaceController };