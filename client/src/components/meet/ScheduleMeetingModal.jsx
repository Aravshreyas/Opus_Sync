import AppLoader from "../common/AppLoader";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../context/ToastContext';
import UserAvatar from '../common/UserAvatar';
import { X, CalendarClock, Users } from 'lucide-react';

const ScheduleMeetingModal = ({ isOpen, onClose, contacts, onMeetingScheduled, slotInfo, editingMeeting }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [participants, setParticipants] = useState([]);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        const toLocalISOString = (date) => {
            const tzoffset = (new Date()).getTimezoneOffset() * 60000;
            return (new Date(new Date(date).getTime() - tzoffset)).toISOString().slice(0, 16);
        };

        if (editingMeeting) {
            setTitle(editingMeeting.title || '');
            setStartTime(editingMeeting.start ? toLocalISOString(editingMeeting.start) : '');
            setEndTime(editingMeeting.end ? toLocalISOString(editingMeeting.end) : '');
            setParticipants(editingMeeting.resource?.participants?.map(p => typeof p === 'object' ? p._id : p) || []);
        } else if (slotInfo?.start) {
            setStartTime(toLocalISOString(slotInfo.start));
            setEndTime(toLocalISOString(slotInfo.end));
        } else {
            // Reset if opening in create mode without slots
            setTitle(''); setParticipants([]); setStartTime(''); setEndTime('');
        }
    }, [slotInfo, editingMeeting, isOpen]);

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

            let response;
            if (editingMeeting) {
                response = await axios.put(`/meetings/${editingMeeting._id}`, payload);
                if (response.status === 200) {
                    toast.success('Meeting updated', `"${title}" has been updated.`);
                    onMeetingScheduled();
                    handleClose();
                }
            } else {
                response = await axios.post('/meetings/schedule', payload);
                if (response.status === 201) {
                    toast.success('Meeting scheduled', `"${title}" has been created. Invites sent to ${participants.length} participant${participants.length !== 1 ? 's' : ''}.`);
                    onMeetingScheduled();
                    handleClose();
                }
            }
        } catch (err) {
            console.error("Failed to schedule meeting:", err);
            const msg = err.response?.data?.message || 'Failed to schedule meeting.';
            setError(msg);
            toast.error('Scheduling failed', msg);
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
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <CalendarClock size={18} className="text-indigo-600" />
                        <h2 className="text-base font-semibold text-gray-900">{editingMeeting ? 'Edit Meeting' : 'Schedule a Meeting'}</h2>
                    </div>
                    <button onClick={handleClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-5 space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
                            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)}
                                className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                                placeholder="e.g. Sprint Planning" required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                <input type="datetime-local" id="startTime" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                                    className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" required />
                            </div>
                            <div>
                                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                <input type="datetime-local" id="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                                    className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" required />
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                                <Users size={14} /> Invite Members
                                {participants.length > 0 && <span className="text-xs text-indigo-600 font-normal">({participants.length} selected)</span>}
                            </label>
                            <div className="border border-gray-200 rounded-md max-h-40 overflow-y-auto divide-y divide-gray-100">
                                {contacts?.length > 0 ? contacts.map(contact => (
                                    <label key={contact._id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
                                        <div className="flex items-center gap-2.5">
                                            <UserAvatar user={contact} size={7} />
                                            <span className="text-sm text-gray-700">{contact.name}</span>
                                        </div>
                                        <input type="checkbox" checked={participants.includes(contact._id)} onChange={() => handleUserSelect(contact._id)}
                                            className="h-3.5 w-3.5 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer" />
                                    </label>
                                )) : (
                                    <p className="px-3 py-4 text-sm text-gray-400 text-center">No contacts available</p>
                                )}
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}
                    </div>
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg flex justify-end gap-2">
                        <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center transition-colors">
                            {isLoading && <AppLoader size="sm" />}
                            {editingMeeting ? 'Update Meeting' : 'Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleMeetingModal;