import AppLoader from "../common/AppLoader";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/auth-context';
import { useOnlineUsers } from '../../context/OnlineUsersContext';
import { SendHorizontal, ArrowLeft, MessageSquare } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import MessageItem from './MessageItem';

const MessageWindow = ({ activeConversation, onBack }) => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const { onlineUsers } = useOnlineUsers();

    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [currentConversationId, setCurrentConversationId] = useState(null);

    const messageEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    // Use refs to track values needed in socket callbacks (avoids stale closures)
    const currentConvoIdRef = useRef(null);
    const userRef = useRef(user);
    const otherParticipantRef = useRef(null);

    // Derive props safely (all hooks are above this point)
    const otherParticipant = activeConversation?.otherParticipant;
    const initialConversationId = activeConversation?._id;
    const isNewContact = activeConversation?.isNewContact;
    const workspaceId = typeof activeConversation?.workspaceId === 'object'
        ? activeConversation?.workspaceId?._id
        : (activeConversation?.workspaceId || (typeof user?.currentWorkspace === 'object' ? user?.currentWorkspace?._id : user?.currentWorkspace));
    const isParticipantOnline = onlineUsers?.includes(otherParticipant?._id);

    // Keep refs in sync
    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { otherParticipantRef.current = otherParticipant; }, [otherParticipant]);
    useEffect(() => { currentConvoIdRef.current = currentConversationId; }, [currentConversationId]);

    // Init conversation ID
    useEffect(() => {
        setCurrentConversationId(isNewContact ? null : initialConversationId);
    }, [isNewContact, initialConversationId]);

    // Fetch message history
    useEffect(() => {
        setIsTyping(false);
        if (!otherParticipant || !workspaceId) { setMessages([]); setIsLoading(false); return; }
        if (isNewContact || !initialConversationId) {
            setMessages([]); setIsLoading(false); return;
        }
        setIsLoading(true);
        axios.get(`/conversations/${otherParticipant._id}?workspaceId=${workspaceId}`)
            .then(res => setMessages(res.data.messages || []))
            .catch(err => { console.error("Failed to fetch messages:", err); setMessages([]); })
            .finally(() => setIsLoading(false));
    }, [isNewContact, initialConversationId, otherParticipant?._id, workspaceId]);

    // Auto-scroll
    useEffect(() => {
        setTimeout(() => { messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
    }, [messages, isTyping]);

    // Socket event listeners — using refs to avoid stale closures
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (incomingMsg) => {
            const currentUser = userRef.current;
            const partner = otherParticipantRef.current;
            if (!currentUser || !partner) return;

            // The sender of this message (populated object from server)
            const msgSenderId = typeof incomingMsg.senderId === 'object'
                ? incomingMsg.senderId._id
                : incomingMsg.senderId;
            const msgRecipientId = incomingMsg.recipientId;

            // Case 1: I sent this message (echo back from server) — sender is me, recipient is partner
            const isMyOwnEcho = (msgSenderId === currentUser._id && msgRecipientId === partner._id);
            // Case 2: Partner sent this message to me — sender is partner, recipient is me
            const isFromPartner = (msgSenderId === partner._id && msgRecipientId === currentUser._id);

            if (isMyOwnEcho || isFromPartner) {
                setMessages(prev => {
                    if (prev.some(m => m._id === incomingMsg._id)) return prev;
                    return [...prev, incomingMsg];
                });
                // If this was a new contact, capture the conversation ID from the server response
                if (incomingMsg.conversationId && !currentConvoIdRef.current) {
                    setCurrentConversationId(incomingMsg.conversationId);
                }
            }
        };

        const handleMessagesRead = ({ conversationId: readConvoId }) => {
            const currentUser = userRef.current;
            if (readConvoId === currentConvoIdRef.current && currentUser) {
                setMessages(prev => prev.map(msg => {
                    const sid = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
                    return sid === currentUser._id ? { ...msg, status: 'read' } : msg;
                }));
            }
        };

        const handleTyping = ({ senderId }) => {
            if (senderId === otherParticipantRef.current?._id) setIsTyping(true);
        };
        const handleStopTyping = ({ senderId }) => {
            if (senderId === otherParticipantRef.current?._id) setIsTyping(false);
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('messagesRead', handleMessagesRead);
        socket.on('typing', handleTyping);
        socket.on('stopTyping', handleStopTyping);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('messagesRead', handleMessagesRead);
            socket.off('typing', handleTyping);
            socket.off('stopTyping', handleStopTyping);
        };
    }, [socket]); // Only depend on socket — use refs for everything else

    // Mark as read
    useEffect(() => {
        if (!socket || !currentConversationId || !messages.length || !otherParticipant) return;
        const hasUnread = messages.some(msg => {
            const sid = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
            return msg.status !== 'read' && sid === otherParticipant._id;
        });
        if (hasUnread) {
            socket.emit('markMessagesAsRead', { conversationId: currentConversationId, otherUserId: otherParticipant._id });
        }
    }, [socket, messages, currentConversationId, otherParticipant?._id]);

    const handleSendMessage = useCallback((e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !otherParticipant) return;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('stopTyping', { recipientId: otherParticipant._id });
        socket.emit('sendMessage', {
            recipientId: otherParticipant._id,
            content: newMessage,
            workspaceId,
            conversationId: currentConversationId || null,
        });
        setNewMessage("");
    }, [newMessage, socket, otherParticipant, workspaceId, currentConversationId]);

    const handleInputChange = useCallback((e) => {
        setNewMessage(e.target.value);
        if (!socket || !isParticipantOnline || !otherParticipant) return;
        if (!typingTimeoutRef.current) socket.emit('startTyping', { recipientId: otherParticipant._id });
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stopTyping', { recipientId: otherParticipant._id });
            typingTimeoutRef.current = null;
        }, 2000);
    }, [socket, isParticipantOnline, otherParticipant]);

    // Helper to safely extract sender ID for comparison
    const getSenderId = (msg) => typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;

    // Guard: don't render UI until ready (all hooks are above)
    if (!user || !otherParticipant) return null;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
                {onBack && (
                    <button onClick={onBack} className="md:hidden p-1 -ml-1 text-gray-500 hover:text-gray-700 transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                )}
                <div className="relative flex-shrink-0">
                    <UserAvatar user={otherParticipant} size={9} />
                    {isParticipantOnline && <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-[1.5px] ring-white" />}
                </div>
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-gray-900 truncate">{otherParticipant.name}</h2>
                    <p className={`text-xs ${isTyping ? 'text-indigo-600 font-medium' : isParticipantOnline ? 'text-green-600' : 'text-gray-400'}`}>
                        {isTyping ? "typing..." : isParticipantOnline ? 'Online' : 'Offline'}
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <AppLoader size="sm" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 select-none">
                        <MessageSquare size={28} className="mb-2 text-gray-300" />
                        <p className="text-xs">No messages yet. Say hello!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageItem key={msg._id} message={msg} isOwnMessage={getSenderId(msg) === user._id} />
                    ))
                )}
                {isTyping && (
                    <div className="flex items-end gap-2 mt-2">
                        <UserAvatar user={otherParticipant} size={7} />
                        <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-white border border-gray-200">
                            <div className="flex items-center space-x-1">
                                <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messageEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-200 bg-white shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder="Type a message..."
                        className="flex-1 px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 transition-colors"
                        autoComplete="off"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 flex-shrink-0 transition-colors"
                        aria-label="Send message"
                    >
                        <SendHorizontal size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MessageWindow;