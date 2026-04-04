const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

const livekitHost = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const roomServiceClient = new RoomServiceClient(livekitHost, apiKey, apiSecret);

const createLiveKitToken = async ({ roomName, participantName }) => {
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

    const token = await at.toJwt();
    console.log(`[LiveKit Service] ✅ Successfully generated token for ${participantName}`);
    return token;
};
const getLiveParticipantsService = async (roomName) => {
    try {
        const participants = await roomServiceClient.listParticipants(roomName);
        // Format the data to send back to the client
        const participantData = participants.map(p => ({
            sid: p.sid,
            identity: p.identity,
            name: p.name,
            metadata: p.metadata ? JSON.parse(p.metadata) : {},
        }));
        return { participants: participantData };
    } catch (error) {
        console.error(`Failed to get participants for room ${roomName}:`, error);
        // Return an empty list if the room doesn't exist or there's an error
        return { participants: [] };
    }
};

module.exports = { createLiveKitToken, getLiveParticipantsService };