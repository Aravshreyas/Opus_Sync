const MeetingModel = require("../models/meeting.model");
const { BadRequestException,NotFoundException } = require("../utils/appError");
const { sendEmail } = require("./email.service"); // Make sure the email service is imported

const sendMeetingInvites = (meeting) => {
    // Construct the unique join link for the meeting
    const meetingUrl = `${process.env.FRONTEND_ORIGIN}/meet/join/${meeting.meetingId}`;
    
    // Loop through every participant (including the creator)
    meeting.participants.forEach(participant => {
        if (!participant || !participant.email) {
            console.warn("Skipping email for participant with missing details:", participant);
            return;
        }

        // Format the start and end times for readability
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        const startTimeFormatted = new Date(meeting.startTime).toLocaleString('en-US', options);

        const message = `
Hello ${participant.name},

You have been invited to the following meeting by ${meeting.createdBy.name}:

Title: ${meeting.title}
Time: ${startTimeFormatted}
Code: ${meeting.meetingId}

Join the meeting using this link:
${meetingUrl}

Description:
${meeting.description || 'No description provided.'}
        `;

        sendEmail({
            email: participant.email,
            subject: `Meeting Invitation: ${meeting.title}`,
            message: message,
        }).catch(err => {
            // Log any errors but don't let a single failed email stop the others.
            console.error(`Failed to send meeting invitation to ${participant.email}:`, err);
        });
    });
};


const scheduleMeetingService = async (meetingData) => {
    const { title, description, startTime, endTime, participantIds, createdBy, workspaceId, isInstantMeeting } = meetingData;

    if (!title || !startTime || !endTime) {
        throw new BadRequestException("Title, start time, and end time are required.");
    }
    if (new Date(startTime) >= new Date(endTime)) {
        throw new BadRequestException("End time must be after start time.");
    }

      const allParticipants = [...new Set([createdBy.toString(), ...(participantIds || [])])];

    const newMeeting = await MeetingModel.create({
        title,
        description: description || "",
        startTime,
        endTime,
        participants: allParticipants,
        createdBy,
        workspaceId,
        isInstantMeeting: isInstantMeeting || false,
    });

    // Populate all necessary details for the email invitations
    const populatedMeeting = await MeetingModel.findById(newMeeting._id)
        .populate("participants", "name email") // We need participant emails
        .populate("createdBy", "name email");   // We need the creator's name

    if (!populatedMeeting) {
        throw new NotFoundException("Failed to create and populate meeting.");
    }

    // --- SEND EMAIL INVITATIONS ---
    // This happens after the meeting is successfully saved.
    // It runs in the background so the API can respond quickly to the user.
    sendMeetingInvites(populatedMeeting);
    
    return { meeting: populatedMeeting };
};

const getMeetingDetailsService = async (meetingId) => {
    const meeting = await MeetingModel.findOne({ meetingId: meetingId })
        .populate("createdBy", "name");
        
    if (!meeting) {
        throw NotFoundException("Meeting not found.");
    }
    return { meeting };
};


const createShareableLinkService = async ({title, createdBy, workspaceId }) => {
    const newMeeting = await MeetingModel.create({
        title, // A default title
        // No startTime or endTime are provided
        participants: [createdBy], // The creator is the only initial participant
        createdBy,
        workspaceId,
    });
    return { meeting: newMeeting };
};

module.exports = { scheduleMeetingService,getMeetingDetailsService, createShareableLinkService   };