import React from 'react';
import { Phone, X } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

const IncomingCallToast = ({ callDetails, onAccept, onDecline }) => {
    // This component is only visible if there's an incoming call
    if (!callDetails?.from) return null;

    const { from } = callDetails;

    return (
        <div className="fixed bottom-5 right-5 bg-white shadow-2xl rounded-lg p-4 w-80 animate-in slide-in-from-bottom-5 z-50">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <UserAvatar user={from} size={12} />
                </div>
                <div className="ml-3 flex-1">
                    <p className="text-sm text-gray-500">Incoming call...</p>
                    <p className="text-base font-medium text-gray-900">{from.name}</p>
                </div>
                <div className="flex-shrink-0 flex gap-2 ml-4">
                    <button 
                        onClick={onDecline}
                        className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                        title="Decline"
                    >
                        <X size={20} />
                    </button>
                    <button 
                        onClick={onAccept}
                        className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 animate-pulse"
                        title="Accept"
                    >
                        <Phone size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallToast;