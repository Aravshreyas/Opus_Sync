import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useOutletContext } from 'react-router-dom'; // <-- Import useOutletContext
import { useAuth } from '../../context/auth-context';
import { useSocket } from '../../context/SocketContext';
import { MessageSquarePlus, Loader2 } from 'lucide-react';
import ConversationList from '../../components/chat/ConversationList';
import MessageWindow from '../../components/chat/MessageWindow';

const ChatPage = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const { handleStartCall } = useOutletContext(); // <-- Get function from AppLayout
    
    const [sidebarItems, setSidebarItems] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [loadingSidebar, setLoadingSidebar] = useState(true);
    const [unreadMessages, setUnreadMessages] = useState({});

    // This file no longer needs: callDetails, isMakingCall, handleEndCall, etc.

    const activeConversationRef = useRef(activeConversation);
    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation]);

    const fetchAndPrepareSidebar = useCallback(async () => {
        if (!user) return;
        setLoadingSidebar(true);
        try {
            const [contactsRes, convosRes] = await Promise.all([
                axios.get(`/user/chat-contacts`),
                axios.get(`/conversations`)
            ]);
            const allContacts = contactsRes.data.contacts || [];
            const existingConvos = convosRes.data.conversations || [];
            const convosMap = new Map(existingConvos.map(convo => [convo.otherParticipant?._id, convo]));
            const chatList = allContacts
                .filter(contact => contact._id !== user._id)
                .map(contact => {
                    return convosMap.get(contact._id) || { _id: contact._id, isNewContact: true, otherParticipant: contact, lastMessage: null, updatedAt: contact.createdAt };
                });
            chatList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            setSidebarItems(chatList);
        } catch (err) {
            console.error("Failed to fetch chat sidebar data:", err);
        } finally {
            setLoadingSidebar(false);
        }
    }, [user]);

    useEffect(() => { fetchAndPrepareSidebar(); }, [fetchAndPrepareSidebar]);

    // Listener for sidebar updates
    useEffect(() => {
        if (!socket) return;
        const handleNewMessage = (newMessage) => {
            // This listener ONLY handles sidebar and unread counts for inactive chats now
            fetchAndPrepareSidebar();
            if (activeConversationRef.current?._id !== newMessage.conversationId) {
                setUnreadMessages(prev => ({...prev, [newMessage.conversationId]: (prev[newMessage.conversationId] || 0) + 1}));
            }
        };
        socket.on('newMessage', handleNewMessage);
        return () => { socket.off('newMessage', handleNewMessage); };
    }, [socket, fetchAndPrepareSidebar]);

    const handleConversationSelect = (item) => {
        setActiveConversation(item);
        setUnreadMessages(prev => {
            const newUnread = { ...prev };
            if (newUnread[item._id]) delete newUnread[item._id];
            return newUnread;
        });
    };

    return (
        <div className="flex h-[calc(100vh-theme(space.14))]">
            <ConversationList 
                items={sidebarItems}
                loading={loadingSidebar}
                onConversationSelect={handleConversationSelect}
                activeConversationId={activeConversation?.otherParticipant?._id}
                unreadMessages={unreadMessages}
            />
            
            <div className="w-2/3 md:w-3/4">
                {activeConversation ? (
                    <MessageWindow 
                        key={activeConversation.otherParticipant._id}
                        activeConversation={activeConversation}
                        onStartCall={() => handleStartCall(activeConversation.otherParticipant)}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-50">
                        <MessageSquarePlus size={48} className="text-slate-400 mb-2"/>
                        <h2 className="text-lg font-semibold">Unified Inbox</h2>
                        <p className="text-sm">Select a contact to start chatting.</p>
                    </div>
                )}
            </div>
            {/* VideoCallModal is no longer rendered here */}
        </div>
    );
};

export default ChatPage;