const { Router } = require("express");

const { getLiveKitTokenController,getLiveParticipantsController } = require('../controllers/livekit.controller');

const livekitRoutes = Router();

// This route must be protected so only logged-in users can get a token
livekitRoutes.post("/token",  getLiveKitTokenController);
livekitRoutes.get("/participants/:roomName", getLiveParticipantsController);

module.exports = livekitRoutes;