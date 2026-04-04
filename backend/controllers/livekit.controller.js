const asyncHandler = require("../middlewares/asyncHandler.middleware");
const { HTTPSTATUS } = require("../config/http.config");
const { createLiveKitToken, getLiveParticipantsService } = require("../services/livekit.service");
const { BadRequestException } = require("../utils/appError");

const getLiveKitTokenController = asyncHandler(async (req, res) => {
    const { roomName } = req.body;
    const user = req.user;

    if (!roomName) {
        throw new BadRequestException("Room name is required.");
    }

    const token = await createLiveKitToken({
        roomName: roomName,
        participantName: user.name,
    });

    return res.status(HTTPSTATUS.OK).json({ token });
});

const getLiveParticipantsController = asyncHandler(async (req, res) => {
    const { roomName } = req.params;
    const { participants } = await getLiveParticipantsService(roomName);
    return res.status(HTTPSTATUS.OK).json({ participants });
});
module.exports = { getLiveKitTokenController, getLiveParticipantsController };