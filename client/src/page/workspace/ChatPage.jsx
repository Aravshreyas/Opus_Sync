import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/auth-context';
import { useSocket } from '../../context/SocketContext';
import AppLoader from "../../components/common/AppLoader";
import { MessageSquare, Search, X } from 'lucide-react';
import ConversationList from '../../components/chat/ConversationList';
import MessageWindow from '../../components/chat/MessageWindow';

const ChatPage = () => {
    const { user, loading } = useAuth();
    const { socket } = useSocket();
    const currentWorkspaceId = typeof user?.currentWorkspace === 'object' ? user?.currentWorkspace?._id : user?.currentWorkspace;

    const [sidebarItems, setSidebarItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [loadingSidebar, setLoadingSidebar] = useState(true);
    const [unreadMessages, setUnreadMessages] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMessageView, setIsMobileMessageView] = useState(false);

    const activeConversationRef = useRef(activeConversation);
    useEffect(() => { activeConversationRef.current = activeConversation; }, [activeConversation]);

    const fetchAndPrepareSidebar = useCallback(async () => {
        if (!user || !currentWorkspaceId) return;
        setLoadingSidebar(true);
        try {
            const [contactsRes, convosRes] = await Promise.all([
                axios.get(`/user/chat-contacts`),
                axios.get(`/conversations?workspaceId=${currentWorkspaceId}`)
            ]);
            const allContacts = contactsRes.data.contacts || [];
            const existingConvos = convosRes.data.conversations || [];
            const convosMap = new Map(existingConvos.map(convo => [convo.otherParticipant?._id, convo]));
            const chatList = allContacts
                .filter(contact => contact._id !== user._id)
                .map(contact => convosMap.get(contact._id) || {
                    _id: contact._id, isNewContact: true, otherParticipant: contact,
                    lastMessage: null, updatedAt: contact.createdAt
                });
            chatList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            setSidebarItems(chatList);
            setFilteredItems(chatList);
        } catch (err) {
            console.error("Failed to fetch chat sidebar data:", err);
        } finally {
            setLoadingSidebar(false);
        }
    }, [user, currentWorkspaceId]);

    useEffect(() => { fetchAndPrepareSidebar(); }, [fetchAndPrepareSidebar]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredItems(sidebarItems);
        } else {
            const q = searchQuery.toLowerCase();
            setFilteredItems(sidebarItems.filter(item =>
                item.otherParticipant?.name?.toLowerCase().includes(q)
            ));
        }
    }, [searchQuery, sidebarItems]);

    useEffect(() => {
        if (!socket) return;
        const handleNewMessage = (newMessage) => {
            fetchAndPrepareSidebar();
            const activeId = activeConversationRef.current?._id;
            const convoId = newMessage.conversationId;
            if (activeId !== convoId) {
                setUnreadMessages(prev => ({
                    ...prev,
                    [convoId]: (prev[convoId] || 0) + 1
                }));
            }
        };
        socket.on('newMessage', handleNewMessage);
        return () => { socket.off('newMessage', handleNewMessage); };
    }, [socket, fetchAndPrepareSidebar]);

    const handleConversationSelect = (item) => {
        setActiveConversation(item);
        setIsMobileMessageView(true);
        setUnreadMessages(prev => {
            const updated = { ...prev };
            delete updated[item._id];
            return updated;
        });
    };

    // Guard: don't render main UI until auth is ready
    if (loading || !user) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50/50">
                <AppLoader label="Loading conversations..." />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-7rem)] bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm -mt-2">
            {/* Contacts Panel */}
            <div className={`${isMobileMessageView ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-[340px] flex-col border-r border-gray-200 bg-white`}>
                <div className="px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
                    <h1 className="text-base font-semibold text-gray-900 mb-3">Messages</h1>
                    <div className="relative">
                        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search people..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-7 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 transition-colors"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X size={13} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <ConversationList
                        items={filteredItems}
                        loading={loadingSidebar}
                        onConversationSelect={handleConversationSelect}
                        activeConversationId={activeConversation?.otherParticipant?._id}
                        unreadMessages={unreadMessages}
                    />
                </div>
            </div>

            {/* Message Area */}
            <div className={`${isMobileMessageView ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-50`}>
                {activeConversation ? (
                    <MessageWindow
                        key={activeConversation.otherParticipant._id}
                        activeConversation={activeConversation}
                        onBack={() => setIsMobileMessageView(false)}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 select-none">
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
                            <MessageSquare size={24} className="text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Select a conversation</p>
                        <p className="text-xs text-gray-400 mt-1">Choose someone from the left to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;