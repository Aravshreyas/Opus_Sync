import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/auth-context';
import { useAudioVisualizer } from '../../hooks/useAudioVisualizer';
import { Loader2, Mic, MicOff, Video, VideoOff, ShieldAlert, ShieldX, User, Clock, ChevronDown } from 'lucide-react';
import GroupMeetingRoom from '../../components/meet/GroupMeetingRoom';
import UserAvatar from '../../components/common/UserAvatar';

const MeetingLobbyPage = () => {
    const { meetingId } = useParams();
    const { socket } = useSocket();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [meetingDetails, setMeetingDetails] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [status, setStatus] = useState('loading');
    const [liveKitToken, setLiveKitToken] = useState('');
    
    // State for device controls
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [audioDevices, setAudioDevices] = useState([]);
    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedMicId, setSelectedMicId] = useState('');
    const [selectedCamId, setSelectedCamId] = useState('');
    
    const localVideoRef = useRef(null);
    const volume = useAudioVisualizer(localStream);

    // This function gets device permissions and lists available devices
    const getDevices = useCallback(async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); // Get permissions first
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audio = devices.filter(d => d.kind === 'audioinput');
            const video = devices.filter(d => d.kind === 'videoinput');
            setAudioDevices(audio);
            setVideoDevices(video);
            if (audio.length > 0) setSelectedMicId(audio[0].deviceId);
            if (video.length > 0) setSelectedCamId(video[0].deviceId);
        } catch (err) {
            console.error("Lobby: Could not get media devices.", err);
            setStatus('failed-media');
        }
    }, []);

    // Effect 1: Initial setup to get meeting details and devices
    useEffect(() => {
        const setupLobby = async () => {
            try {
                const meetingRes = await axios.get(`/meetings/details/${meetingId}`);
                setMeetingDetails(meetingRes.data.meeting);
                await getDevices(); // Get devices after fetching meeting details
                setStatus('ready');
            } catch (err) {
                console.error("Lobby setup failed:", err);
                setStatus('failed-meeting');
            }
        };
        setupLobby();
    }, [meetingId, getDevices]);

    // Effect 2: Get and update the media stream when user selects a different device
    useEffect(() => {
        if (!selectedCamId || !selectedMicId) return;

        const getStream = async () => {
            // Stop any existing tracks before getting a new stream
            localStream?.getTracks().forEach(track => track.stop());
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: selectedCamId } },
                    audio: { deviceId: { exact: selectedMicId } },
                });
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (err) { console.error("Error switching devices:", err); }
        };
        getStream();
        
        // This cleanup is important when the component unmounts
        return () => { localStream?.getTracks().forEach(track => track.stop()); };
    }, [selectedCamId, selectedMicId]);

    // Effect 3: Listen for server responses after requesting to join
    useEffect(() => {
        if (!socket) return;
        const handleJoinApproved = ({ token }) => setLiveKitToken(token);
        const handleWaiting = () => setStatus('waiting');
        const handleDenied = () => setStatus('denied');
        
        socket.on('join-request-approved', handleJoinApproved);
        socket.on('waiting-for-host', handleWaiting);
        socket.on('join-request-denied', handleDenied);

        return () => {
            socket.off('join-request-approved', handleJoinApproved);
            socket.off('waiting-for-host', handleWaiting);
            socket.off('join-request-denied', handleDenied);
        };
    }, [socket]);

    const handleAskToJoin = () => {
        setStatus('requesting');
        socket.emit('request-to-join', { meetingId });
    };

    const toggleMute = () => {
        localStream?.getAudioTracks().forEach(track => { track.enabled = !track.enabled; });
        setIsMuted(prev => !prev);
    };

    const toggleCamera = () => {
        localStream?.getVideoTracks().forEach(track => { track.enabled = !track.enabled; });
        setIsCameraOff(prev => !prev);
    };

    // If we have a token, the request was approved, so render the meeting room.
    if (liveKitToken) {
        return <GroupMeetingRoom token={liveKitToken} roomName={meetingId} onClose={() => navigate('/meet')} videoDeviceId={selectedCamId} audioDeviceId={selectedMicId}  initialVideoEnabled={!isCameraOff}
                initialAudioEnabled={!isMuted} />;
    }

    // --- RENDER THE LOBBY UI ---
    return (
        <div className="flex items-center justify-center min-h-screen  p-4">
            <div className="w-full max-w-5xl">
                {status === 'loading' ? (
                    <div className="flex justify-center items-center"><Loader2 className="animate-spin h-10 w-10 text-indigo-600"/></div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* --- Video Preview Column --- */}
                        <div className="relative w-full aspect-video bg-slate-900 rounded-xl shadow-2xl overflow-hidden flex items-center justify-center">
                            {isCameraOff ? <UserAvatar user={user} size={24} fontSizeClass="text-4xl" /> : (
                                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                            )}
                            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3">
                                <div className="relative">
                                    {!isMuted && <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-3 bg-slate-700 rounded-full overflow-hidden"><div className="bg-green-400 h-full transition-all duration-100" style={{ width: `${Math.min(volume * 150, 100)}%` }}></div></div>}
                                    <button onClick={toggleMute} className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-red-600 text-white' : 'bg-black/40 text-white hover:bg-white/20 backdrop-blur-sm'}`}>
                                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                                    </button>
                                </div>
                                <button onClick={toggleCamera} className={`p-4 rounded-full transition-colors ${isCameraOff ? 'bg-red-600 text-white' : 'bg-black/40 text-white hover:bg-white/20 backdrop-blur-sm'}`}>
                                    {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
                                </button>
                            </div>
                        </div>

                        {/* --- Join Controls Column --- */}
                        <div className="flex flex-col items-center md:items-start">
                            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{meetingDetails?.title || 'Meeting'}</h1>
                            
                            {/* NEW: Meeting Details */}
                            <div className="flex items-center gap-6 text-slate-500 my-4 text-sm">
                                {meetingDetails?.startTime && (<div className="flex items-center gap-2"><Clock size={16}/><span>{new Date(meetingDetails.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>)}
                                <div className="flex items-center gap-2"><User size={16}/><span>{meetingDetails?.createdBy?.name}</span></div>
                            </div>
                            
                            <div className="w-full md:w-auto mb-8">
                                {status === 'ready' && <button onClick={handleAskToJoin} className="w-full py-3 px-10 bg-indigo-600 text-white rounded-full text-lg font-semibold hover:bg-indigo-700 shadow-lg transition-all">Ask to Join</button>}
                                {status === 'requesting' && <button disabled className="w-full py-3 px-10 bg-indigo-500 text-white rounded-full text-lg font-semibold flex items-center justify-center"><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Asking to join...</button>}
                                {status === 'waiting' && <div className="text-lg font-semibold text-yellow-600">Waiting for host to approve...</div>}
                                {status === 'denied' && <div className="text-lg font-semibold text-red-600">Request to join was denied.</div>}
                            </div>
                            
                            {/* NEW: Device Selectors */}
                            <div className="w-full space-y-3 pt-4 border-t">
                                <DeviceSelector icon={<Video size={18}/>} label="Camera" devices={videoDevices} selectedId={selectedCamId} onSelect={setSelectedCamId} />
                                <DeviceSelector icon={<Mic size={18}/>} label="Microphone" devices={audioDevices} selectedId={selectedMicId} onSelect={setSelectedMicId} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// A helper component for the dropdowns to keep the main component cleaner
const DeviceSelector = ({ icon, label, devices, selectedId, onSelect }) => (
    <div className="flex items-center gap-3 text-sm">
        <div className="text-slate-500">{icon}</div>
        <div className="relative flex-1">
            <select
                value={selectedId}
                onChange={(e) => onSelect(e.target.value)}
                className="w-full appearance-none bg-slate-100 border-none rounded-md py-2 pl-3 pr-8 text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
                {devices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
                ))}
            </select>
            <ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
    </div>
);

export default MeetingLobbyPage;