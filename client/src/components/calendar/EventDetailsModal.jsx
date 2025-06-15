import React from 'react';
import { Link } from 'react-router-dom';
import { X, Calendar, Clock, Video, CheckSquare, ArrowRight } from 'lucide-react';

const EventDetailsModal = ({ event, onClose }) => {
    if (!event) return null;

    const isMeeting = event.resource?.type === 'meeting';

    // Helper functions to format dates and times for better readability
    const formatDate = (date) => new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const linkTarget = isMeeting 
        ? `/meet/join/${event.resource?.meetingId}` 
        : `/workspace/${event.resource?.workspaceId}/project/${event.resource?.projectId}/tasks/${event._id}`;

    return (
        // Backdrop
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-in fade-in-0 zoom-in-95" 
                onClick={(e) => e.stopPropagation()} // Prevents modal from closing when clicking inside
            >
                {/* Header Section */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className={`flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center ${isMeeting ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                            {isMeeting ? <Video size={24} /> : <CheckSquare size={24} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{event.title}</h2>
                            <p className="text-sm text-gray-500">{isMeeting ? "Meeting Details" : "Task Deadline"}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
                        <X size={24} />
                    </button>
                </div>
                
                {/* Body Section */}
                <div className="p-6 space-y-5">
                    <div className="flex items-center gap-4 text-gray-700">
                        <Calendar size={20} className="text-gray-400 flex-shrink-0" />
                        <p className="font-medium">{formatDate(event.start)}</p>
                    </div>
                    
                    {/* Only show time range for meetings */}
                    {!event.allDay && (
                        <div className="flex items-center gap-4 text-gray-700">
                            <Clock size={20} className="text-gray-400 flex-shrink-0" />
                            <p className="font-medium">{formatTime(event.start)} - {formatTime(event.end)}</p>
                        </div>
                    )}
                </div>

                {/* Footer / Action Button */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl flex justify-end">
                    <Link to={linkTarget} className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm transition-all ${isMeeting ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'}`}>
                        {isMeeting ? "Join Meeting" : "View Task"}
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default EventDetailsModal;