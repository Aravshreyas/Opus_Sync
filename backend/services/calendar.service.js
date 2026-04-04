const MeetingModel = require("../models/meeting.model");
const TaskModel = require("../models/task.model");


const getCalendarEventsService = async (userId, workspaceId) => {
    // Fetch meetings and tasks concurrently for better performance
    const [meetings, tasks] = await Promise.all([
        // Find all meetings where the user is a participant
        MeetingModel.find({ participants: { $in: [userId] },isInstantMeeting: { $ne: true } }),
        // Find all tasks assigned to the user that have a due date
        TaskModel.find({ assignedTo: userId, dueDate: { $ne: null } })
    ]);

    // Format meetings into a standard calendar event object
    const meetingEvents = meetings.map(meeting => ({
        _id: meeting._id,
        title: meeting.title,
        start: meeting.startTime,
        end: meeting.endTime,
        allDay: false,
        resource: {
            type: 'meeting',
            description: meeting.description,
            participants: meeting.participants,
            meetingId: meeting.meetingId,
             createdBy: meeting.createdBy,
        }
    }));

    // Format tasks into a standard calendar event object
    const taskEvents = tasks.map(task => ({
        _id: task._id,
        title: `Task: ${task.title}`,
        start: task.dueDate,
        end: task.dueDate,
        allDay: true, // Tasks with a due date are treated as all-day events
        resource: {
            type: 'task',
            projectId: task.project,
            workspaceId:task.workspace,
            status: task.status
        }
    }));

    // Combine both arrays into a single list
    const allEvents = [...meetingEvents, ...taskEvents];
    return allEvents;
};

module.exports = { getCalendarEventsService };