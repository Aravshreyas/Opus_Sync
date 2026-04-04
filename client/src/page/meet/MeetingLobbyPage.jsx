import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/auth-context';
import { useAudioVisualizer } from '../../hooks/useAudioVisualizer';
import { Mic, MicOff, Video, VideoOff, User, Clock, ChevronDown, Users, ShieldCheck, LogIn } from 'lucide-react';
import GroupMeetingRoom from '../../components/meet/GroupMeetingRoom';
import UserAvatar from '../../components/common/UserAvatar';
import AppLoader from "../../components/common/AppLoader";

const MeetingLobbyPage = () => {
    const { meetingId } = useParams();
    const { socket } = useSocket();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [meetingDetails, setMeetingDetails] = useState(null);
    const [liveParticipants, setLiveParticipants] = useState([]);
    const [localStream, setLocalStream] = useState(null);
    const [status, setStatus] = useState('loading');
    const [liveKitToken, setLiveKitToken] = useState('');

    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [audioDevices, setAudioDevices] = useState([]);
    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedMicId, setSelectedMicId] = useState('');
    const [selectedCamId, setSelectedCamId] = useState('');

    const localVideoRef = useRef(null);
    const volume = useAudioVisualizer(localStream);

    // Determine the user's role in the meeting
    const userRole = useMemo(() => {
        if (!meetingDetails || !user) return 'guest';
        const userId = user._id;
        const creatorId = typeof meetingDetails.createdBy === 'object'
            ? meetingDetails.createdBy._id
            : meetingDetails.createdBy;
        if (userId === creatorId) return 'host';
        const isInvited = meetingDetails.participants?.some(p => {
            const pId = typeof p === 'object' ? p._id : p;
            return pId === userId;
        });
        if (isInvited) return 'invited';
        return 'guest';
    }, [meetingDetails, user]);

    const getDevices = useCallback(async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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

    useEffect(() => {
        const setupLobby = async () => {
            try {
                const [meetingRes, participantsRes] = await Promise.all([
                    axios.get(`/meetings/details/${meetingId}`),
                    axios.get(`/livekit/participants/${meetingId}`)
                ]);
                setMeetingDetails(meetingRes.data.meeting);
                setLiveParticipants(participantsRes.data.participants || []);
                await getDevices();
                setStatus('ready');
            } catch (err) {
                console.error("Lobby setup failed:", err);
                setStatus('failed-meeting');
            }
        };
        setupLobby();
    }, [meetingId, getDevices]);

    useEffect(() => {
        if (!selectedCamId || !selectedMicId) return;
        const getStream = async () => {
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
        return () => { localStream?.getTracks().forEach(track => track.stop()); };
    }, [selectedCamId, selectedMicId]);

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

    const handleJoinOrAsk = () => {
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

    if (liveKitToken) {
        return <GroupMeetingRoom token={liveKitToken} roomName={meetingId} onClose={() => navigate('/meet')} videoDeviceId={selectedCamId} audioDeviceId={selectedMicId} initialVideoEnabled={!isCameraOff} initialAudioEnabled={!isMuted} />;
    }

    // Derive button text and subtitle based on user role
    const getJoinButtonConfig = () => {
        switch (userRole) {
            case 'host':
                return {
                    text: 'Start Meeting',
                    subtitle: 'You are the host of this meeting',
                    icon: <ShieldCheck size={20} className="mr-2" />,
                    className: 'bg-green-600 hover:bg-green-700',
                };
            case 'invited':
                return {
                    text: 'Join Now',
                    subtitle: 'You have been invited to this meeting',
                    icon: <LogIn size={20} className="mr-2" />,
                    className: 'bg-indigo-600 hover:bg-indigo-700',
                };
            default:
                return {
                    text: 'Ask to Join',
                    subtitle: 'You\'ll need approval from the host to join',
                    icon: <Users size={20} className="mr-2" />,
                    className: 'bg-slate-700 hover:bg-slate-800',
                };
        }
    };

    const joinConfig = getJoinButtonConfig();

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="w-full max-w-5xl">
                {status === 'loading' ? (
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
                        <AppLoader label="Checking meeting status..." />
                    </div>
                ) : status === 'failed-meeting' ? (
                    <div className="text-center p-10 bg-white rounded-2xl shadow-lg">
                        <h2 className="text-2xl font-bold text-red-600 mb-2">Meeting Not Found</h2>
                        <p className="text-slate-500 mb-6">The meeting you're trying to join doesn't exist or has ended.</p>
                        <button onClick={() => navigate('/meet')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Back to Meetings</button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* --- Video Preview Column --- */}
                        <div className="relative w-full aspect-video bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center">
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

                            {/* Role badge */}
                            <span className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${userRole === 'host' ? 'bg-green-100 text-green-700' :
                                userRole === 'invited' ? 'bg-indigo-100 text-indigo-700' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                {userRole === 'host' ? '👑 Host' : userRole === 'invited' ? '✉️ Invited' : '👤 Guest'}
                            </span>

                            <div className="flex items-center gap-4 my-4">
                                <div className="flex items-center -space-x-2">
                                    {liveParticipants.length > 0 ? (
                                        liveParticipants.slice(0, 3).map(p => (
                                            <UserAvatar key={p.sid} user={{ name: p.identity, profilePicture: p.metadata?.profilePicture }} size={8} className="ring-2 ring-white" />
                                        ))
                                    ) : (
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-200 text-slate-500">
                                            <Users size={16} />
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500">
                                    {liveParticipants.length > 0 ? `${liveParticipants[0].name} ${liveParticipants.length > 1 ? `and ${liveParticipants.length - 1} others are` : 'is'} already here.` : "You'll be the first to join."}
                                </p>
                            </div>

                            {/* Meeting Details */}
                            <div className="flex items-center gap-6 text-slate-500 my-4 text-sm">
                                {meetingDetails?.startTime && (<div className="flex items-center gap-2"><Clock size={16} /><span>{new Date(meetingDetails.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>)}
                                <div className="flex items-center gap-2"><User size={16} /><span>{meetingDetails?.createdBy?.name || 'Unknown'}</span></div>
                            </div>

                            <div className="w-full md:w-auto mb-8 space-y-2">
                                {status === 'ready' && (
                                    <>
                                        <button onClick={handleJoinOrAsk} className={`w-full py-3 px-10 text-white rounded-full text-lg font-semibold shadow-lg transition-all flex items-center justify-center ${joinConfig.className}`}>
                                            {joinConfig.icon}
                                            {joinConfig.text}
                                        </button>
                                        <p className="text-xs text-slate-400 text-center">{joinConfig.subtitle}</p>
                                    </>
                                )}
                                {status === 'requesting' && (
                                    <button disabled className="w-full py-3 px-10 bg-indigo-500 text-white rounded-full text-lg font-semibold flex items-center justify-center">
                                        <AppLoader size="sm" />
                                        {userRole === 'guest' ? 'Asking to join...' : 'Joining...'}
                                    </button>
                                )}
                                {status === 'waiting' && (
                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-amber-600 flex items-center justify-center gap-2">
                                            <AppLoader size="sm" />
                                            Waiting for host to let you in...
                                        </div>
                                        <p className="text-sm text-slate-400 mt-1">The host will be notified of your request.</p>
                                    </div>
                                )}
                                {status === 'denied' && (
                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-red-600">Your request to join was declined</div>
                                        <button onClick={() => navigate('/meet')} className="mt-3 px-6 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">Back to Meetings</button>
                                    </div>
                                )}
                                {status === 'failed-media' && (
                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-amber-600">Camera/Microphone access denied</div>
                                        <p className="text-sm text-slate-500 mt-1">Please allow camera and microphone access in your browser settings.</p>
                                    </div>
                                )}
                            </div>

                            {/* Device Selectors */}
                            <div className="w-full space-y-3 pt-4 border-t">
                                <DeviceSelector icon={<Video size={18} />} label="Camera" devices={videoDevices} selectedId={selectedCamId} onSelect={setSelectedCamId} />
                                <DeviceSelector icon={<Mic size={18} />} label="Microphone" devices={audioDevices} selectedId={selectedMicId} onSelect={setSelectedMicId} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

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