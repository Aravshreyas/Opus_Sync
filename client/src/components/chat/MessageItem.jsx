import React from 'react';
import UserAvatar from '../common/UserAvatar';
import MessageTicks from './MessageTicks'; // Import the new component

const MessageItem = ({ message, isOwnMessage }) => {
    if (!message?.senderId?._id) return null; 

    return (
        <div className={`flex items-end gap-2 my-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            {!isOwnMessage && <UserAvatar user={message.senderId} size={8} />}
            <div className={`px-3 py-2 rounded-lg max-w-sm md:max-w-md break-words shadow-sm ${
                isOwnMessage ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-800'
            }`}>
                <p className="text-sm pb-1">{message.content}</p>
                {isOwnMessage && (
                    <div className="flex justify-end items-center gap-1 -mb-1 -mr-1">
                        <span className="text-xs text-indigo-200/75">
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                        <MessageTicks status={message.status} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageItem;