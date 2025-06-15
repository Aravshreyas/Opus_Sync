import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import axios from 'axios';

const ShareableLinkModal = ({ isOpen, onClose, onLinkCreated }) => {
    const [title, setTitle] = useState("Ad-hoc Meeting");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleCreateLink = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axios.post('/meetings/create-link', { title: title || "Ad-hoc Meeting" });
            const meeting = response.data.meeting;
            if (meeting?.meetingId) {
                const url = `${window.location.origin}/meet/join/${meeting.meetingId}`;
                onLinkCreated(url); // Pass the created link back to the parent
            }
        } catch (err) {
            console.error("Failed to create shareable link:", err);
            alert("Could not create meeting link.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <form onSubmit={handleCreateLink} className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Get a link to share</h2>
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
                        Create link
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ShareableLinkModal;