import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Video, Plus, Keyboard, Loader2, Calendar, Link as LinkIcon, ChevronRight,Link2 } from 'lucide-react';
import ScheduleMeetingModal from '../../components/meet/ScheduleMeetingModal';
import InstantMeetingModal from '../../components/meet/InstantMeetingModal';
import ShareLinkToast from '../../components/meet/ShareLinkToast';
import ShareableLinkModal from '../../components/meet/ShareableLinkModal';

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
    const newMeetingRef = useRef(null);
    

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
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);



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
                                <input name="code" type="text" placeholder="Enter a code or link" className="w-full pl-12 pr-24 py-3 text-md border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required/>
                                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 font-semibold text-slate-600 px-4 hover:text-indigo-600">Join</button>
                            </form>
                        </div>
                    </div>

                    {/* New Visual Element */}
                    <div className="w-full aspect-video bg-gradient-to-tr from-blue-100 via-indigo-100 to-purple-100 rounded-2xl shadow-inner-lg flex items-center justify-center p-8 overflow-hidden relative">
                        <Video size={128} className="absolute -left-10 -bottom-10 text-white/40 opacity-50 -rotate-12"/>
                        <Calendar size={96} className="absolute -right-8 -top-8 text-white/40 opacity-50 rotate-12"/>
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
                        {isLoading ? <div className="text-center p-10"><Loader2 className="animate-spin text-indigo-600"/></div>
                        : todaysMeetings.length > 0 ? (
                            <div className="space-y-2">
                                {todaysMeetings.map(meeting => (
                                    <Link to={`/meet/join/${meeting.resource.meetingId}`} key={meeting._id}
                                          className="group flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-indigo-100 text-indigo-600 rounded-lg p-3">
                                                <Video size={20}/>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-700 group-hover:text-indigo-600">{meeting.title}</p>
                                                <p className="text-sm text-slate-500">
                                                    {new Date(meeting.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-slate-400 group-hover:translate-x-1 transition-transform"/>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 px-4 h-full flex flex-col items-center justify-center">
                                <Calendar size={48} className="mx-auto text-slate-300"/>
                                <p className="text-slate-500 mt-4 font-medium">No meetings scheduled for today</p>
                                <p className="text-sm text-slate-400 mt-1">Click 'New Meeting' to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ScheduleMeetingModal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} contacts={contacts} onMeetingScheduled={fetchPageData} />
            <InstantMeetingModal isOpen={isInstantModalOpen} onClose={() => setIsInstantModalOpen(false)} />
                <ShareableLinkModal isOpen={isShareLinkModalOpen} onClose={() => setIsShareLinkModalOpen(false)} onLinkCreated={(link) => { setIsShareLinkModalOpen(false); setShareableLink(link); }} />
            <ShareLinkToast link={shareableLink} onClose={() => setShareableLink('')} />
        </div>
    );
};

export default MeetPage;