const { Router } = require("express");
const { scheduleMeetingController,getMeetingDetailsController, createShareableLinkController  } = require('../controllers/meeting.controller');

const meetingRoutes = Router();


// Route to schedule a new meeting
// POST /api/meetings/schedule
meetingRoutes.post("/schedule", scheduleMeetingController);

meetingRoutes.get("/details/:meetingId", getMeetingDetailsController);

meetingRoutes.post("/create-link", createShareableLinkController);

module.exports = meetingRoutes;