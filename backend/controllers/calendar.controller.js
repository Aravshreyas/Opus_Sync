const asyncHandler = require("../middlewares/asyncHandler.middleware");
const { HTTPSTATUS } = require("../config/http.config");
const { getCalendarEventsService,scheduleMeetingService } = require("../services/calendar.service");

const getCalendarEventsController = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const workspaceId = req.user.currentWorkspace;
    
    const events = await getCalendarEventsService(userId, workspaceId);
    
    return res.status(HTTPSTATUS.OK).json({ 
        message: "Calendar events fetched successfully",
        events,
    });
});

module.exports = { getCalendarEventsController };