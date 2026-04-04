const asyncHandler = require("../middlewares/asyncHandler.middleware");
const { HTTPSTATUS } = require("../config/http.config");
const { scheduleMeetingService, getMeetingDetailsService, createShareableLinkService, deleteMeetingService, updateMeetingService } = require("../services/meeting.service");
const { BadRequestException } = require("../utils/appError");

const scheduleMeetingController = asyncHandler(async (req, res) => {
    const { title, description, startTime, endTime, participants, isInstantMeeting } = req.body;
    const createdBy = req.user._id;
    const workspaceId = req.user.currentWorkspace;

    if (!workspaceId) {
        throw new BadRequestException("User is not associated with a workspace.");
    }

    const { meeting } = await scheduleMeetingService({
        title,
        description,
        startTime,
        endTime,
        participantIds: participants,
        createdBy,
        workspaceId,
        isInstantMeeting
    });

    return res.status(HTTPSTATUS.CREATED).json({
        message: "Meeting scheduled successfully",
        meeting,
    });
});

const getMeetingDetailsController = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    const { meeting } = await getMeetingDetailsService(meetingId);
    return res.status(HTTPSTATUS.OK).json({ meeting });
});

const createShareableLinkController = asyncHandler(async (req, res) => {
    const createdBy = req.user._id;
    const workspaceId = req.user.currentWorkspace;
    const { title } = req.body
    const { meeting } = await createShareableLinkService({ title, createdBy, workspaceId });
    return res.status(HTTPSTATUS.CREATED).json({ meeting });
});

const deleteMeetingController = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    const userId = req.user._id;
    const result = await deleteMeetingService(meetingId, userId);
    return res.status(HTTPSTATUS.OK).json(result);
});

const updateMeetingController = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    const userId = req.user._id;
    const updates = req.body;
    const { meeting } = await updateMeetingService(meetingId, userId, updates);
    return res.status(HTTPSTATUS.OK).json({ message: "Meeting updated successfully", meeting });
});

module.exports = { scheduleMeetingController, getMeetingDetailsController, createShareableLinkController, deleteMeetingController, updateMeetingController };