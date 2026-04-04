import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

const MessageTicks = ({ status }) => {
    if (status === 'read') {
        return <CheckCheck size={14} className="text-blue-300" />;
    }
    if (status === 'delivered') {
        return <CheckCheck size={14} className="text-indigo-200" />;
    }
    return <Check size={14} className="text-indigo-200" />;
};

export default MessageTicks;