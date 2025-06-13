import React from 'react';
import { Loader2 } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { useOnlineUsers } from '../../context/OnlineUsersContext'; // Import the new hook

const ConversationList = ({ items, loading, onConversationSelect, activeConversationId, unreadMessages }) => {
    const { onlineUsers } = useOnlineUsers();

    return (
        <div className="w-1/3 md:w-1/4 border-r border-slate-200 bg-slate-50 flex flex-col">
            <div className="p-4 border-b border-slate-200">
                <h1 className="text-lg font-semibold text-slate-800">Messages</h1>
            </div>
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-center text-slate-500"><Loader2 className="animate-spin inline-block"/></div>
                ) : (
                    <ul>
                        {items.map(item => {
                            if (!item.otherParticipant) return null; // Safety check
                            const isOnline = onlineUsers.includes(item.otherParticipant._id);
                            const unreadCount = unreadMessages[item._id] || 0;

                            return (
                                <li key={item._id}>
                                    <button 
                                        onClick={() => onConversationSelect(item)} 
                                        className={`flex items-center gap-3 w-full p-3 text-left transition-colors duration-150 ease-in-out hover:bg-slate-200/50 ${
                                            activeConversationId === item.otherParticipant._id ? 'bg-indigo-100' : ''
                                        }`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <UserAvatar user={item.otherParticipant} size={10} />
                                            {isOnline && (
                                                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex items-center justify-between">
                                                <p className={`font-semibold text-sm truncate ${unreadCount > 0 ? 'text-slate-900' : 'text-slate-800'}`}>
                                                    {item.otherParticipant.name}
                                                </p>
                                                {unreadCount > 0 && (
                                                    <span className="flex-shrink-0 ml-2 h-2.5 w-2.5 rounded-full bg-blue-500" />
                                                )}
                                            </div>
                                            <p className={`text-xs truncate ${unreadCount > 0 ? 'font-bold text-slate-700' : 'text-slate-500'}`}>
                                                {item.lastMessage?.content || "Click to start chatting"}
                                            </p>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ConversationList;