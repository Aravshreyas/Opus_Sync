const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp: { // This will store the HASHED OTP
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 5, // The document will be automatically deleted after 5 minutes
    },
});

const OtpModel = mongoose.model("Otp", otpSchema);
module.exports = OtpModel;