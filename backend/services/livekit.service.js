const { AccessToken } = require('livekit-server-sdk');

const createLiveKitToken = ({ roomName, participantName }) => {
    // Log the inputs to see what we're receiving
    console.log(`[LiveKit Service] Attempting to create token for room: "${roomName}" and participant: "${participantName}"`);

    // --- VALIDATION AND FIX ---
    // The LiveKit SDK requires a non-empty identity.
    if (!participantName || typeof participantName !== 'string' || participantName.trim() === '') {
        console.error("[LiveKit Service] ERROR: participantName is invalid. Cannot create token.");
        // Throw an error to be caught by the calling function in socket.js
        throw new Error("Participant name is required to generate a LiveKit token.");
    }
    if (!roomName || typeof roomName !== 'string' || roomName.trim() === '') {
        console.error("[LiveKit Service] ERROR: roomName is invalid. Cannot create token.");
        throw new Error("Room name is required to generate a LiveKit token.");
    }
    // -------------------------

    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
        throw new Error("LiveKit API Key or Secret is not configured on the server.");
    }
    
    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
        identity: participantName,
    });

    at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        // The room is only valid for a certain period
        roomValidity: '1h' 
    });

    const token = at.toJwt();
    console.log(`[LiveKit Service] ✅ Successfully generated token for ${participantName}`);
    return token;
};

module.exports = { createLiveKitToken };