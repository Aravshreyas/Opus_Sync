import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

const MessageTicks = ({ status }) => {
    if (status === 'read') {
        return <CheckCheck size={16} className="text-blue-500" />;
    }
    if (status === 'delivered') {
        return <CheckCheck size={16} className="text-slate-400" />;
    }
    // Default is 'sent'
    return <Check size={16} className="text-slate-400" />;
};

export default MessageTicks;