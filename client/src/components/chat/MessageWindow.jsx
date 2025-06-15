import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/auth-context';
import { useOnlineUsers } from '../../context/OnlineUsersContext';
import { Loader2, SendHorizontal, Video } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import MessageItem from './MessageItem';

const MessageWindow = ({ activeConversation }) => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const { onlineUsers } = useOnlineUsers();
    
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    
    const messageEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const { otherParticipant, _id: conversationId, isNewContact } = activeConversation;
    const workspaceId = activeConversation.workspaceId?._id || user.currentWorkspace?._id;
    const isParticipantOnline = onlineUsers.includes(otherParticipant?._id);

    // Effect 1: Fetch initial message history
    useEffect(() => {
        setIsTyping(false);
        if (isNewContact || !conversationId) {
            setMessages([]); setIsLoading(false); return;
        }
        setIsLoading(true);
        axios.get(`/conversations/${otherParticipant._id}?workspaceId=${workspaceId}`)
            .then(res => setMessages(res.data.messages || []))
            .catch(err => { console.error("Failed to fetch messages:", err); setMessages([]); })
            .finally(() => setIsLoading(false));
    }, [isNewContact, conversationId, otherParticipant._id, workspaceId]);

    // Effect 2: Auto-scroll
    useEffect(() => {
        setTimeout(() => { messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
    }, [messages, isTyping]); 

    // Effect 3: Main socket event listeners
    useEffect(() => {
        if (!socket || !user || !otherParticipant) return;

        // Listener for new messages
        const handleNewMessage = (incomingMessage) => {
            const senderId = incomingMessage.senderId?._id;
            const recipientId = incomingMessage.recipientId;
            const isMyOwnEcho = (senderId === user._id && recipientId === otherParticipant._id);
            const isMessageFromChatPartner = (senderId === otherParticipant._id && recipientId === user._id);
            
            if (isMyOwnEcho || isMessageFromChatPartner) {
                setMessages(prev => [...prev, incomingMessage]);
            }
        };
        
        // Listener for when the other user has read your messages
        const handleMessagesRead = ({ conversationId: readConvoId }) => {
            if (readConvoId === conversationId) {
                setMessages(prev => prev.map(msg => 
                    msg.senderId._id === user._id ? { ...msg, status: 'read' } : msg
                ));
            }
        };

        const handleTyping = ({ senderId }) => { if (senderId === otherParticipant._id) setIsTyping(true); };
        const handleStopTyping = ({ senderId }) => { if (senderId === otherParticipant._id) setIsTyping(false); };

        socket.on('newMessage', handleNewMessage);
        socket.on('messagesRead', handleMessagesRead); // <-- Listen for read receipts
        socket.on('typing', handleTyping);
        socket.on('stopTyping', handleStopTyping);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('messagesRead', handleMessagesRead); // <-- Cleanup listener
            socket.off('typing', handleTyping);
            socket.off('stopTyping', handleStopTyping);
        };
    }, [socket, user, otherParticipant, conversationId]);

    // Effect 4: Emit "mark as read" when conversation is viewed
    useEffect(() => {
        // Find any messages sent by the other person that are not yet marked as 'read'
        const hasUnreadMessages = messages.some(msg => msg.status !== 'read' && msg.senderId._id === otherParticipant._id);

        if (socket && conversationId && hasUnreadMessages) {
            // Tell the server that you have read the messages in this conversation
            socket.emit('markMessagesAsRead', { conversationId, otherUserId: otherParticipant._id });
        }
    }, [socket, messages, conversationId, otherParticipant._id]); // Run when messages change

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;
        
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('stopTyping', { recipientId: otherParticipant._id });

        socket.emit('sendMessage', {
            recipientId: otherParticipant._id,
            content: newMessage,
            workspaceId: workspaceId,
            conversationId: isNewContact ? null : conversationId,
        });
        setNewMessage("");
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        if (!socket || !isParticipantOnline) return;
        if (!typingTimeoutRef.current) socket.emit('startTyping', { recipientId: otherParticipant._id });
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stopTyping', { recipientId: otherParticipant._id });
            typingTimeoutRef.current = null;
        }, 2000);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <UserAvatar user={otherParticipant} size={10} />
                    {isParticipantOnline && <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />}
                </div>
                <div>
                    <h2 className="font-semibold text-slate-800">{otherParticipant.name}</h2>
                    <p className={`text-xs ${isParticipantOnline ? 'text-green-600' : 'text-slate-500'}`}>
                        {isTyping ? "Typing..." : isParticipantOnline ? 'Online' : 'Offline'}
                    </p>
                </div>
                 
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {isLoading ? <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-slate-400" /></div> : (
                    messages.map((msg) => (
                        <MessageItem key={msg._id} message={msg} isOwnMessage={msg.senderId?._id === user._id} />
                    ))
                )}
                {isTyping && (
                    <div className="flex items-end gap-2 my-2 justify-start">
                         <div className="flex-shrink-0"><UserAvatar user={otherParticipant} size={8} /></div>
                        <div className="px-4 py-3 rounded-2xl bg-slate-200 rounded-bl-none"><div className="flex items-center justify-center space-x-1"><span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span><span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span><span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce"></span></div></div>
                    </div>
                )}
                <div ref={messageEndRef} />
            </div>
            <div className="p-4 border-t border-slate-200 bg-white flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input type="text" value={newMessage} onChange={handleInputChange} placeholder="Type a message..." className="w-full px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500" autoComplete="off" />
                    <button type="submit" className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-indigo-300 flex-shrink-0" disabled={!newMessage.trim()} aria-label="Send message"><SendHorizontal size={20} /></button>
                </form>
            </div>
        </div>
    );
};

export default MessageWindow;