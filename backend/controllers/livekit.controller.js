const asyncHandler = require("../middlewares/asyncHandler.middleware");
const { HTTPSTATUS } = require("../config/http.config");
const { createLiveKitToken } = require("../services/livekit.service");
const { BadRequestException } = require("../utils/appError");

const getLiveKitTokenController = asyncHandler(async (req, res) => {
    const { roomName } = req.body;
    const user = req.user;

    if (!roomName) {
        throw new BadRequestException("Room name is required.");
    }

    const token = createLiveKitToken({
        roomName: roomName,
        participantName: user.name,
    });

    return res.status(HTTPSTATUS.OK).json({ token });
});

module.exports = { getLiveKitTokenController };