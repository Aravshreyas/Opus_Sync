const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Import the v4 function from the uuid package

const meetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Meeting title is required."],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    startTime: {
        type: Date,
        required: false,
    },
    endTime: {
        type: Date,
        required: false,
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isInstantMeeting: { // <-- ADD THIS
        type: Boolean,
        default: false,
    },
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: true,
    },
    // This will now store a full UUID
    meetingId: {
        type: String,
        unique: true,
    },
}, { timestamps: true });

// Mongoose pre-save hook to automatically generate a unique ID using uuid
meetingSchema.pre('save', function(next) {
    if (this.isNew && !this.meetingId) {
        // Generate a standard Version 4 UUID
        this.meetingId = uuidv4();
    }
    next();
});

const MeetingModel = mongoose.model("Meeting", meetingSchema);
module.exports = MeetingModel;