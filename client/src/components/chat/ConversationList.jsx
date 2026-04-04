import AppLoader from "../common/AppLoader";
import React from 'react';

import UserAvatar from '../common/UserAvatar';
import { useOnlineUsers } from '../../context/OnlineUsersContext';

const ConversationList = ({ items, loading, onConversationSelect, activeConversationId, unreadMessages }) => {
    const { onlineUsers } = useOnlineUsers();

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <AppLoader size="sm" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400">No contacts found</p>
            </div>
        );
    }

    return (
        <div className="py-1">
            {items.map(item => {
                if (!item.otherParticipant) return null;
                const isOnline = onlineUsers.includes(item.otherParticipant._id);
                const unreadCount = unreadMessages[item._id] || 0;
                const isActive = activeConversationId === item.otherParticipant._id;

                return (
                    <button
                        key={item._id}
                        onClick={() => onConversationSelect(item)}
                        className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors duration-100 ${isActive
                                ? 'bg-gray-100'
                                : 'hover:bg-gray-50'
                            }`}
                    >
                        <div className="relative flex-shrink-0">
                            <UserAvatar user={item.otherParticipant} size={9} />
                            {isOnline && (
                                <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-[1.5px] ring-white" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className={`text-sm truncate ${isActive ? 'font-semibold text-gray-900' :
                                        unreadCount > 0 ? 'font-semibold text-gray-900' :
                                            'font-medium text-gray-700'
                                    }`}>
                                    {item.otherParticipant.name}
                                </p>
                                {unreadCount > 0 && (
                                    <span className="flex-shrink-0 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-px rounded-full min-w-[16px] text-center leading-4">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </div>
                            <p className={`text-xs mt-0.5 truncate ${unreadCount > 0 ? 'text-gray-600 font-medium' : 'text-gray-400'
                                }`}>
                                {item.lastMessage?.content || "Start a conversation"}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default ConversationList;