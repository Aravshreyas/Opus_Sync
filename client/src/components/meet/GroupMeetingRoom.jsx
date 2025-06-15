import React, { useState, useEffect } from 'react';
import {
    LiveKitRoom,
    RoomAudioRenderer,
    VideoConference, // Import the all-in-one component
} from '@livekit/components-react';
import { useSocket } from '../../context/SocketContext';
import { Check, X } from 'lucide-react';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs'; // Also good to have here for clarity


// LobbyNotification component remains unchanged, it's perfect as is.
const LobbyNotification = ({ guest, onAdmit, onDeny }) => (
    <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur-md rounded-lg shadow-xl p-4 w-72 animate-in fade-in-0 slide-in-from-right-5 z-50">
        <p className="text-sm text-slate-300 mb-2">Wants to join:</p>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><span className="font-semibold text-white">{guest.name}</span></div>
            <div className="flex gap-2">
                <button onClick={() => onDeny(guest)} title="Deny" className="p-2 rounded-full bg-white/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"><X size={18} /></button>
                <button onClick={() => onAdmit(guest)} title="Admit" className="p-2 rounded-full bg-white/10 text-green-400 hover:bg-green-500 hover:text-white transition-colors"><Check size={18} /></button>
            </div>
        </div>
    </div>
);

const GroupMeetingRoom = ({ token, roomName, onClose, videoDeviceId, audioDeviceId,initialVideoEnabled,initialAudioEnabled, }) => {
    const { socket } = useSocket();
    const [waitingGuests, setWaitingGuests] = useState([]);

    // This logic for listening for and managing lobby requests remains the same.
    useEffect(() => {
        if (!socket) return;
        const handleNewJoinRequest = (data) => {
            setWaitingGuests(prev => [...prev.filter(g => g.id !== data.guest.id), data.guest]);
        };
        socket.on('new-join-request', handleNewJoinRequest);
        return () => { socket.off('new-join-request', handleNewJoinRequest); };
    }, [socket]);

    const admitGuest = (guest) => {
        socket.emit('admit-guest', { guest, meetingId: roomName });
        setWaitingGuests(prev => prev.filter(g => g.id !== guest.id));
    };

    const denyGuest = (guest) => {
        socket.emit('deny-guest', { guest, meetingId: roomName });
        setWaitingGuests(prev => prev.filter(g => g.id !== guest.id));
    };

    return (
        // The relative container allows us to position the lobby notifications on top
        <div className="relative w-full h-full" data-lk-theme="default">
            <LiveKitRoom
                serverUrl={import.meta.env.VITE_LIVEKIT_URL}
                token={token}
                connect={true}
                video={initialVideoEnabled === false ? false : { deviceId: videoDeviceId }}
                audio={initialAudioEnabled === false ? false : { deviceId: audioDeviceId }}
                onDisconnected={onClose}
                onError={(error) => {
                    console.error("LiveKit Room Connection Error:", error);
                    alert(`Error connecting to meeting: ${error.message}`);
                    onClose();
                }}
            >
                {/* We replaced the complex custom layout with this single, powerful component */}
                <VideoConference />
                
                {/* This is still recommended by LiveKit to ensure all audio plays correctly */}
                <RoomAudioRenderer />
            </LiveKitRoom>

            {/* The lobby notification logic remains outside and on top of the LiveKitRoom UI */}
            {waitingGuests.map(guest => (
                <LobbyNotification
                    key={guest.id}
                    guest={guest}
                    onAdmit={admitGuest}
                    onDeny={denyGuest}
                />
            ))}
        </div>
    );
};

export default GroupMeetingRoom;