import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/auth-context';
import { useAudioVisualizer } from '../../hooks/useAudioVisualizer'; // Import the new hook
import { Mic, MicOff, Video, VideoOff, X, PhoneOff, PhoneForwarded } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

const stunServers = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ],
};

const VideoCallModal = ({ callDetails, onClose }) => {
    const { socket } = useSocket();
    const { user } = useAuth();

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callStatus, setCallStatus] = useState(callDetails.isReceivingCall ? 'incoming' : 'calling');
    
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    
    // State for device selection
    const [devices, setDevices] = useState({ video: [], audio: [] });
    const [selectedMic, setSelectedMic] = useState('');
    const [selectedCam, setSelectedCam] = useState('');
    
    const peerConnectionRef = useRef();
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    
    const localVolume = useAudioVisualizer(localStream);
    const otherUser = callDetails.isReceivingCall ? callDetails.from : callDetails.to;

    // This effect handles getting devices and the initial media stream
    useEffect(() => {
        const getDevicesAndStream = async () => {
            try {
                // Get a temporary stream to trigger permission prompt
                await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
                const audioDevices = allDevices.filter(d => d.kind === 'audioinput');
                setDevices({ video: videoDevices, audio: audioDevices });

                if (videoDevices.length > 0) setSelectedCam(videoDevices[0].deviceId);
                if (audioDevices.length > 0) setSelectedMic(audioDevices[0].deviceId);
            } catch (err) {
                console.error("Error accessing media devices.", err);
                alert("Could not access camera/microphone. Please check permissions.");
                onClose();
            }
        };
        getDevicesAndStream();
    }, [onClose]);

    // This effect runs whenever the user changes their selected camera or mic
    useEffect(() => {
        const getNewStream = async () => {
            if (selectedCam && selectedMic) {
                // Stop any existing tracks
                localStream?.getTracks().forEach(track => track.stop());
                try {
                    const newStream = await navigator.mediaDevices.getUserMedia({
                        video: { deviceId: { exact: selectedCam } },
                        audio: { deviceId: { exact: selectedMic } },
                    });
                    setLocalStream(newStream);
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = newStream;
                    }
                } catch (err) { console.error("Error switching devices: ", err); }
            }
        };
        getNewStream();
        // Cleanup function
        return () => {
            localStream?.getTracks().forEach(track => track.stop());
        }
    }, [selectedCam, selectedMic]);

    // This effect handles the WebRTC connection logic
    useEffect(() => {
        if (!localStream || !socket || !otherUser) return;

        peerConnectionRef.current = new RTCPeerConnection(stunServers);
        localStream.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, localStream));
        peerConnectionRef.current.ontrack = (event) => setRemoteStream(event.streams[0]);
        peerConnectionRef.current.onicecandidate = (event) => {
            if (event.candidate) socket.emit('ice-candidate', { to: otherUser._id, candidate: event.candidate });
        };

        if (!callDetails.isReceivingCall) {
            setCallStatus("ringing");
            peerConnectionRef.current.createOffer()
                .then(offer => peerConnectionRef.current.setLocalDescription(offer))
                .then(() => socket.emit('call-user', { to: otherUser._id, offer: peerConnectionRef.current.localDescription, from: user }));
        }

        const handleAnswerMade = async ({ answer }) => {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            setCallStatus("active");
        };
        const handleIceCandidate = (data) => peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        const handleCallEnded = () => onClose();

        socket.on('answer-made', handleAnswerMade);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('call-ended', handleCallEnded);

        return () => {
            socket.off('answer-made', handleAnswerMade);
            socket.off('ice-candidate', handleIceCandidate);
            socket.off('call-ended', handleCallEnded);
        };
    }, [localStream, socket, user, otherUser, callDetails.isReceivingCall, onClose]);

    // This effect attaches the remote stream to the video element
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const handleToggleMute = () => {
        localStream?.getAudioTracks().forEach(track => { track.enabled = !track.enabled; });
        setIsMuted(prev => !prev);
    };

    const handleToggleCamera = () => {
        localStream?.getVideoTracks().forEach(track => { track.enabled = !track.enabled; });
        setIsCameraOff(prev => !prev);
    };
    
    const handleAnswerCall = async () => {
        if (!peerConnectionRef.current || !callDetails.offer) return;
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(callDetails.offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit('answer-call', { to: otherUser._id, answer });
        setCallStatus("active");
    };

    const handleClose = () => {
        if (otherUser?._id) socket.emit('end-call', { to: otherUser._id });
        if (peerConnectionRef.current) peerConnectionRef.current.close();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center backdrop-blur-sm">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full h-full flex flex-col relative text-white overflow-hidden">
                <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover"></video>
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${remoteStream ? 'opacity-0' : 'opacity-100'}`}>
                    {!remoteStream && (
                        <div className="text-center">
                             <UserAvatar user={otherUser} size={40} fontSizeClass="text-5xl" />
                             <p className="mt-4 text-xl font-semibold">{otherUser.name}</p>
                             <p className="mt-2 text-lg text-slate-300 animate-pulse">
                                {callStatus === 'ringing' ? 'Ringing...' : callStatus === 'incoming' ? 'Incoming Call...' : 'Connecting...'}
                             </p>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-24 right-6 w-36 h-24 sm:w-48 sm:h-36 rounded-lg object-cover border-2 border-slate-600 shadow-lg overflow-hidden bg-black">
                    {isCameraOff ? (
                        <div className="h-full w-full bg-slate-900 flex items-center justify-center">
                            <UserAvatar user={user} size={16} fontSizeClass="text-2xl" />
                        </div>
                    ) : (
                        <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover scale-x-[-1]"></video>
                    )}
                </div>
                
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-3 bg-slate-900/50 rounded-full">
                    {callStatus === "incoming" ? (
                        <>
                            <button onClick={handleClose} className="p-3 bg-red-600 rounded-full hover:bg-red-700"><PhoneOff size={24} /></button>
                            <button onClick={handleAnswerCall} className="p-3 bg-green-600 rounded-full hover:bg-green-700 animate-pulse"><PhoneForwarded size={24} /></button>
                        </>
                    ) : (
                        <>
                            <div className="relative flex items-center">
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-16 h-2 bg-slate-600 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-full transition-all duration-100" style={{ width: `${Math.min(localVolume * 150, 100)}%` }}></div>
                                </div>
                                <button onClick={handleToggleMute} className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-600' : 'bg-white/20 hover:bg-white/30'}`}>
                                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                                </button>
                            </div>
                            <button onClick={handleToggleCamera} className={`p-3 rounded-full transition-colors ${isCameraOff ? 'bg-red-600' : 'bg-white/20 hover:bg-white/30'}`}>
                                {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
                            </button>
                            <button onClick={handleClose} className="p-3 bg-red-600 rounded-full hover:bg-red-700"><PhoneOff size={24} /></button>
                        </>
                    )}
                </div>
                
                 <div className="absolute top-4 left-4 p-2 bg-slate-900/50 rounded-lg text-xs space-y-2">
                    <div>
                        <label htmlFor="camera-select" className="font-medium text-slate-300 block mb-1">Camera</label>
                        <select id="camera-select" value={selectedCam} onChange={(e) => setSelectedCam(e.target.value)} className="bg-slate-700 border-slate-600 rounded p-1 text-white">
                            {devices.video.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="mic-select" className="font-medium text-slate-300 block mb-1">Microphone</label>
                        <select id="mic-select" value={selectedMic} onChange={(e) => setSelectedMic(e.target.value)} className="bg-slate-700 border-slate-600 rounded p-1 text-white">
                            {devices.audio.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                 <button onClick={handleClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={24} /></button>
            </div>
        </div>
    );
};

export default VideoCallModal;