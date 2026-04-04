import React from 'react';
import UserAvatar from '../common/UserAvatar';
import MessageTicks from './MessageTicks';

const MessageItem = ({ message, isOwnMessage }) => {
    if (!message) return null;
    // senderId can be a populated object {_id, name, ...} or a plain string
    const senderObj = typeof message.senderId === 'object' ? message.senderId : { _id: message.senderId, name: '?' };

    const timeString = new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit', hour12: true
    });

    return (
        <div className={`flex items-end gap-1.5 my-1.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            {!isOwnMessage && <UserAvatar user={senderObj} size={7} />}
            <div className={`px-3 py-1.5 rounded-2xl max-w-[70%] break-words ${isOwnMessage
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                }`}>
                <p className="text-[13px] leading-relaxed">{message.content}</p>
                <div className={`flex items-center gap-1 mt-0.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[10px] leading-none ${isOwnMessage ? 'text-indigo-200' : 'text-gray-400'
                        }`}>
                        {timeString}
                    </span>
                    {isOwnMessage && <MessageTicks status={message.status} />}
                </div>
            </div>
        </div>
    );
};

export default MessageItem;