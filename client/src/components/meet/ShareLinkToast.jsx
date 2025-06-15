import React, { useState } from 'react';
import { Link2, Copy, Check, X } from 'lucide-react';

const ShareLinkToast = ({ link, onClose }) => {
    const [isCopied, setIsCopied] = useState(false);

    if (!link) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(link);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    };

    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-white shadow-2xl rounded-lg p-4 w-full max-w-md animate-in fade-in-0 slide-in-from-top-5 z-50 border">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-slate-800">Here's the link to your meeting</h3>
                <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100">
                    <X size={18} />
                </button>
            </div>
            <p className="text-sm text-slate-500 mb-3">Copy this link and send it to people you want to meet with. Be sure to save it so you can use it later, too.</p>
            <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-md">
                <Link2 className="text-slate-400 flex-shrink-0" size={18}/>
                <input type="text" readOnly value={link} className="bg-transparent text-sm text-slate-700 w-full outline-none" />
                <button onClick={handleCopy} className="text-sm font-semibold text-indigo-600 hover:bg-indigo-100 px-3 py-1 rounded-md flex-shrink-0">
                    {isCopied ? <Check size={16} className="text-green-600" /> : 'Copy'}
                </button>
            </div>
        </div>
    );
};

export default ShareLinkToast;