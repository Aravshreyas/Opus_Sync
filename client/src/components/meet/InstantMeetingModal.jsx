import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const InstantMeetingModal = ({ isOpen, onClose }) => {
    const [title, setTitle] = useState("Instant Meeting");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleStartMeeting = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axios.post('/meetings/schedule', {
                title: title || "Instant Meeting",
                isInstantMeeting: true,
                // Instant meetings start now and last for 1 hour by default
                startTime: new Date(),
                endTime: new Date(Date.now() + 60 * 60 * 1000),
            });
            const newMeeting = response.data.meeting;
            if (newMeeting?.meetingId) {
                navigate(`/meet/join/${newMeeting.meetingId}`);
            }
        } catch (err) {
            console.error("Failed to create instant meeting:", err);
            alert("Could not start instant meeting.");
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <form onSubmit={handleStartMeeting} className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Start an instant meeting</h2>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm mb-4"
                    placeholder="Enter a meeting name (optional)"
                />
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white border border-slate-300 rounded-md hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Start Meeting
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InstantMeetingModal;