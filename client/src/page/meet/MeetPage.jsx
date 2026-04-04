import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Video, Plus, Keyboard, Calendar, Link as LinkIcon, ChevronRight, Link2, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../context/ToastContext';
import AppLoader from "../../components/common/AppLoader";
import ScheduleMeetingModal from '../../components/meet/ScheduleMeetingModal';
import InstantMeetingModal from '../../components/meet/InstantMeetingModal';
import ShareLinkToast from '../../components/meet/ShareLinkToast';
import ShareableLinkModal from '../../components/meet/ShareableLinkModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const MeetPage = () => {
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isInstantModalOpen, setIsInstantModalOpen] = useState(false);
    const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [todaysMeetings, setTodaysMeetings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [shareableLink, setShareableLink] = useState('');
    const [isShareLinkModalOpen, setIsShareLinkModalOpen] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const newMeetingRef = useRef(null);
    const [editingMeeting, setEditingMeeting] = useState(null);
    const [activeDropdownId, setActiveDropdownId] = useState(null);
    const dropdownRef = useRef(null);

    // State for the delete confirmation dialog
    const [meetingToDelete, setMeetingToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);


    const fetchPageData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [contactsRes, eventsRes] = await Promise.all([
                axios.get('/user/chat-contacts'),
                axios.get('/calendar/calendar-events')
            ]);
            setContacts(contactsRes.data.contacts || []);
            const allEvents = eventsRes.data.events || [];
            const today = new Date().toDateString();
            const filteredMeetings = allEvents
                .filter(event => event.resource?.type === 'meeting' && new Date(event.start).toDateString() === today)
                .sort((a, b) => new Date(a.start) - new Date(b.start));
            setTodaysMeetings(filteredMeetings);
        } catch (err) { console.error("Failed to fetch page data:", err); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchPageData(); }, [fetchPageData]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (newMeetingRef.current && !newMeetingRef.current.contains(event.target)) {
                setIsNewMeetingOpen(false);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdownId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDeleteMeeting = async () => {
        if (!meetingToDelete) return;
        setIsDeleting(true);
        try {
            await axios.delete(`/meetings/${meetingToDelete}`);
            toast.success('Meeting deleted', 'The meeting has been removed from your calendar.');
            setMeetingToDelete(null);
            fetchPageData();
        } catch (err) {
            console.error("Failed to delete meeting:", err);
            toast.error('Failed to delete', err.response?.data?.message || 'Could not delete meeting.');
            setMeetingToDelete(null);
        } finally {
            setIsDeleting(false);
            setActiveDropdownId(null);
        }
    };

    const isCreator = (meeting) => {
        const creatorId = typeof meeting.resource?.createdBy === 'object' ? meeting.resource?.createdBy?._id : meeting.resource?.createdBy;
        return creatorId === user?._id;
    };



    return (
        <div className="p-4 md:p-8  min-h-full">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">

                {/* --- Left Column: Action Hub (takes more space) --- */}
                <div className="lg:col-span-3">
                    <header className="mb-8">
                        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Meetings</h1>
                        <p className="text-slate-500 mt-2 text-lg">High-quality, secure video conferencing for your team.</p>
                    </header>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                        <div ref={newMeetingRef} className="relative w-full sm:w-auto">
                            <button
                                onClick={() => setIsNewMeetingOpen(prev => !prev)}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
                            >
                                <Plus /> New Meeting
                            </button>
                            {isNewMeetingOpen && (
                                <div className="absolute top-full mt-2 w-72 bg-white rounded-lg shadow-2xl border border-slate-100 z-10 animate-in fade-in-0 zoom-in-95">
                                    <ul className="p-2">
                                        <li onClick={() => { setIsInstantModalOpen(true); setIsNewMeetingOpen(false); }} className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-100 cursor-pointer">
                                            <Video className="text-indigo-600" size={20} />
                                            <p className="font-semibold text-slate-700 text-sm">Start an instant meeting</p>
                                        </li>
                                        <li onClick={() => { setIsScheduleModalOpen(true); setIsNewMeetingOpen(false); }} className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-100 cursor-pointer">
                                            <Calendar className="text-indigo-600" size={20} />
                                            <p className="font-semibold text-slate-700 text-sm">Schedule for later</p>
                                        </li>
                                        <li onClick={() => { setIsShareLinkModalOpen(true); setIsNewMeetingOpen(false); }} className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-100 cursor-pointer">
                                            <Link2 className="text-indigo-600" />
                                            <div>
                                                <p className="font-semibold text-slate-800">Get a link to share</p>
                                                <p className="text-xs text-slate-500">Create a link for a future meeting</p>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="relative w-full sm:flex-1">
                            <form onSubmit={(e) => { e.preventDefault(); navigate(`/meet/join/${e.target.elements.code.value.trim()}`); }}>
                                <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input name="code" type="text" placeholder="Enter a code or link" className="w-full pl-12 pr-24 py-3 text-md border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
                                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 font-semibold text-slate-600 px-4 hover:text-indigo-600">Join</button>
                            </form>
                        </div>
                    </div>

                    {/* New Visual Element */}
                    <div className="w-full aspect-video bg-gradient-to-tr from-blue-100 via-indigo-100 to-purple-100 rounded-2xl shadow-inner-lg flex items-center justify-center p-8 overflow-hidden relative">
                        <Video size={128} className="absolute -left-10 -bottom-10 text-white/40 opacity-50 -rotate-12" />
                        <Calendar size={96} className="absolute -right-8 -top-8 text-white/40 opacity-50 rotate-12" />
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-slate-700">Connect with your team</h2>
                            <p className="mt-2 max-w-sm text-slate-500">Simple, secure, and integrated with your workspace tasks and calendar.</p>
                        </div>
                    </div>
                </div>

                {/* --- Right Column: Today's Schedule --- */}
                <div className="w-full lg:col-span-2">
                    <div className="bg-white p-4 rounded-xl shadow-lg h-full">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 px-2 border-b pb-3">Today's Schedule</h2>
                        {isLoading ? <AppLoader />
                            : todaysMeetings.length > 0 ? (
                                <div className="space-y-2">
                                    {todaysMeetings.map(meeting => (
                                        <div key={meeting._id} className="group relative flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 transition-colors">
                                            <Link to={`/meet/join/${meeting.resource.meetingId}`} className="flex items-center gap-4 flex-1">
                                                <div className="bg-indigo-100 text-indigo-600 rounded-lg p-3">
                                                    <Video size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-700 group-hover:text-indigo-600 truncate max-w-[200px] sm:max-w-xs">{meeting.title}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {new Date(meeting.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </Link>
                                            <div className="flex items-center gap-2">
                                                <Link to={`/meet/join/${meeting.resource.meetingId}`}>
                                                    <ChevronRight className="text-slate-400 hover:text-indigo-600 transition-colors p-1" size={24} />
                                                </Link>
                                                {isCreator(meeting) && (
                                                    <div className="relative" ref={activeDropdownId === meeting._id ? dropdownRef : null}>
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveDropdownId(prev => prev === meeting._id ? null : meeting._id); }}
                                                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>
                                                        {activeDropdownId === meeting._id && (
                                                            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setEditingMeeting(meeting); setIsScheduleModalOpen(true); setActiveDropdownId(null); }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                                >
                                                                    <Edit2 size={14} className="text-slate-500" /> Edit
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setMeetingToDelete(meeting._id); setActiveDropdownId(null); }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                >
                                                                    <Trash2 size={14} className="text-red-500" /> Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 px-4 h-full flex flex-col items-center justify-center">
                                    <Calendar size={48} className="mx-auto text-slate-300" />
                                    <p className="text-slate-500 mt-4 font-medium">No meetings scheduled for today</p>
                                    <p className="text-sm text-slate-400 mt-1">Click 'New Meeting' to get started.</p>
                                </div>
                            )}
                    </div>
                </div>
            </div>

            {/* Modals and Toasts */}
            <ConfirmDialog
                isOpen={Boolean(meetingToDelete)}
                onClose={() => setMeetingToDelete(null)}
                onConfirm={handleDeleteMeeting}
                title="Delete Meeting"
                message="Are you sure you want to delete this meeting? This action cannot be undone and will remove the meeting from all participants' calendars."
                confirmText="Delete Meeting"
                isDestructive={true}
                isLoading={isDeleting}
            />

            <ScheduleMeetingModal
                isOpen={isScheduleModalOpen}
                onClose={() => { setIsScheduleModalOpen(false); setEditingMeeting(null); }}
                contacts={contacts}
                onMeetingScheduled={fetchPageData}
                editingMeeting={editingMeeting}
            />
            <InstantMeetingModal isOpen={isInstantModalOpen} onClose={() => setIsInstantModalOpen(false)} />
            <ShareableLinkModal isOpen={isShareLinkModalOpen} onClose={() => setIsShareLinkModalOpen(false)} onLinkCreated={(link) => { setIsShareLinkModalOpen(false); setShareableLink(link); }} />
            <ShareLinkToast link={shareableLink} onClose={() => setShareableLink('')} />
        </div>
    );
};

export default MeetPage;