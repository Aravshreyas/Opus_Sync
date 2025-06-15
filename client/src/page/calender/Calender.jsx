import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Loader2 } from 'lucide-react';
import EventDetailsModal from '../../components/calendar/EventDetailsModal';
import CustomCalendarToolbar from '../../components/calendar/CustomCalendarToolbar'; // Import custom toolbar
import ScheduleMeetingModal from '../../components/meet/ScheduleMeetingModal'; // Import scheduling modal

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CalendarPage = () => {
    const [events, setEvents] = useState([]);
    const [contacts, setContacts] = useState([]); // For the scheduling modal
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    
    // --- NEW STATE FOR FULLY CONTROLLED CALENDAR ---
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState(Views.MONTH);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [slotInfo, setSlotInfo] = useState(null);

    const fetchEvents = useCallback(async () => {
        // setLoading(true); // Only show main loader on initial fetch
        try {
            const response = await axios.get('/calendar/calendar-events');
            const formattedEvents = response.data.events.map(event => ({
                ...event,
                start: new Date(event.start),
                end: new Date(event.end),
            }));
            setEvents(formattedEvents);
        } catch (error) {
            console.error("Failed to fetch calendar events:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            await Promise.all([
                fetchEvents(),
                axios.get('/user/chat-contacts').then(res => setContacts(res.data.contacts || []))
            ]);
            setLoading(false);
        };
        fetchInitialData();
    }, [fetchEvents]);

    // --- NEW HANDLERS FOR CALENDAR INTERACTIVITY ---
    const handleNavigate = useCallback((newDate) => setDate(newDate), [setDate]);
    const handleView = useCallback((newView) => setView(newView), [setView]);
    
    const handleSelectSlot = useCallback((slot) => {
        setSlotInfo(slot);
        setIsScheduleModalOpen(true);
    }, []);

    const eventStyleGetter = (event) => {
        const style = {
            backgroundColor: event.resource?.type === 'meeting' ? '#4f46e5' : '#10b981',
            borderRadius: '5px', opacity: 0.8, color: 'white', border: '0px', display: 'block'
        };
        return { style };
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-indigo-600"/></div>;
    }

    return (
        <div className="p-4 md:p-6 h-full flex flex-col ">
            <header className="mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-slate-900">Calendar</h1>
                <p className="text-slate-500 mt-1">Your schedule at a glance. Click a slot to create an event.</p>
            </header>
            <div className="bg-white p-4 rounded-xl shadow-lg flex-grow h-[calc(100vh-12rem)]">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    views={[Views.MONTH, Views.WEEK, Views.DAY]}
                    // --- NEW PROPS FOR FULL CONTROL ---
                    date={date}
                    view={view}
                    onNavigate={handleNavigate}
                    onView={handleView}
                    onSelectEvent={setSelectedEvent}
                    onSelectSlot={handleSelectSlot}
                    selectable // This enables clicking on empty slots
                    components={{
                        toolbar: CustomCalendarToolbar // Use our new custom toolbar
                    }}
                    eventPropGetter={eventStyleGetter}
                />
            </div>

            <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
            <ScheduleMeetingModal 
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                contacts={contacts}
                onMeetingScheduled={fetchEvents} // Refetch events after scheduling
                slotInfo={slotInfo} // Pass selected slot info to pre-fill dates
            />
        </div>
    );
};

export default CalendarPage;