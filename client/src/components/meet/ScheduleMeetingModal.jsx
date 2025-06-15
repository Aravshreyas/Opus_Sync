import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/auth-context';
import UserAvatar from '../common/UserAvatar';
import { X, Loader2 } from 'lucide-react';

const ScheduleMeetingModal = ({ isOpen, onClose, contacts, onMeetingScheduled,slotInfo  }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [participants, setParticipants] = useState([]);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');


    useEffect(() => {
        if (slotInfo?.start) {
            // Format the date from the calendar slot into the string format the input expects
            const toLocalISOString = (date) => {
                const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
                const localISOTime = (new Date(date - tzoffset)).toISOString().slice(0, 16);
                return localISOTime;
            }
            setStartTime(toLocalISOString(slotInfo.start));
            setEndTime(toLocalISOString(slotInfo.end));
        }
    }, [slotInfo]);

    if (!isOpen) return null;

    
    const handleUserSelect = (userId) => {
        setParticipants(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId) 
                : [...prev, userId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !startTime || !endTime) {
            setError('Title, start time, and end time are required.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const payload = {
                title,
                participants,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
            };
            const response = await axios.post('/meetings/schedule', payload);
            
            if (response.status === 201) {
                alert(`Meeting scheduled! ID: ${response.data.meeting.meetingId}`);
                onMeetingScheduled(); // Notify parent to update
                handleClose();
            }
        } catch (err) {
            console.error("Failed to schedule meeting:", err);
            setError(err.response?.data?.message || 'Failed to schedule meeting.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClose = () => {
        setTitle(''); setParticipants([]); setStartTime(''); setEndTime('');
        setError(''); setIsLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Schedule a Meeting</h2>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-slate-100"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-slate-700">Meeting Title</label>
                            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="startTime" className="block text-sm font-medium text-slate-700">Start Time</label>
                                <input type="datetime-local" id="startTime" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" required />
                            </div>
                            <div>
                                <label htmlFor="endTime" className="block text-sm font-medium text-slate-700">End Time</label>
                                <input type="datetime-local" id="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Invite Members</label>
                            <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                                {contacts.map(contact => (
                                    <div key={contact._id} className="flex items-center justify-between p-2.5 border-b last:border-b-0 hover:bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar user={contact} size={8} />
                                            <span className="text-sm font-medium">{contact.name}</span>
                                        </div>
                                        <input type="checkbox" checked={participants.includes(contact._id)} onChange={() => handleUserSelect(contact._id)}
                                            className="h-4 w-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-600 text-center pt-2">{error}</p>}
                    </div>
                    <div className="p-4 bg-slate-50 border-t rounded-b-lg flex justify-end gap-3">
                        <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium bg-white border border-slate-300 rounded-md hover:bg-slate-50">Cancel</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Schedule Meeting
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleMeetingModal;