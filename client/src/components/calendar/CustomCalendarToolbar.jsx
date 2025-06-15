import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CustomCalendarToolbar = ({ label, onNavigate, onView, view }) => {
    return (
        <div className="rbc-toolbar mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <button 
                    type="button" 
                    onClick={() => onNavigate('TODAY')}
                    className="px-4 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                >
                    Today
                </button>
                <div className="flex items-center">
                    <button type="button" onClick={() => onNavigate('PREV')} className="p-2 text-slate-500 hover:text-slate-800" aria-label="Previous">
                        <ChevronLeft size={20} />
                    </button>
                    <button type="button" onClick={() => onNavigate('NEXT')} className="p-2 text-slate-500 hover:text-slate-800" aria-label="Next">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
            
            <div className="text-2xl font-bold text-slate-800">
                {label}
            </div>

            <div className="rbc-btn-group">
                {['month', 'week', 'day', 'agenda'].map(viewName => (
                    <button
                        key={viewName}
                        type="button"
                        onClick={() => onView(viewName)}
                        className={`capitalize px-4 py-1.5 text-sm font-medium border border-slate-300 transition-colors
                            ${view === viewName ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 hover:bg-slate-50'}
                            first:rounded-l-md last:rounded-r-md`}
                    >
                        {viewName}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CustomCalendarToolbar;