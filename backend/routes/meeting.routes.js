const { Router } = require("express");
const { scheduleMeetingController, getMeetingDetailsController, createShareableLinkController, deleteMeetingController, updateMeetingController } = require('../controllers/meeting.controller');

const meetingRoutes = Router();

// POST /api/meetings/schedule
meetingRoutes.post("/schedule", scheduleMeetingController);

// GET /api/meetings/details/:meetingId
meetingRoutes.get("/details/:meetingId", getMeetingDetailsController);

// POST /api/meetings/create-link
meetingRoutes.post("/create-link", createShareableLinkController);

// DELETE /api/meetings/:meetingId
meetingRoutes.delete("/:meetingId", deleteMeetingController);

// PUT /api/meetings/:meetingId
meetingRoutes.put("/:meetingId", updateMeetingController);

module.exports = meetingRoutes;