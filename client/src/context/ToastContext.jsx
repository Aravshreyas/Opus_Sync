import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext({ toast: () => { } });
export const useToast = () => useContext(ToastContext);

let toastIdCounter = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = useCallback(({ title, description, variant = 'default', duration = 4000 }) => {
        const id = ++toastIdCounter;
        setToasts(prev => [...prev, { id, title, description, variant, duration }]);
        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
        return id;
    }, [removeToast]);

    // Shorthand helpers
    toast.success = (title, description) => toast({ title, description, variant: 'success' });
    toast.error = (title, description) => toast({ title, description, variant: 'error' });
    toast.warning = (title, description) => toast({ title, description, variant: 'warning' });
    toast.info = (title, description) => toast({ title, description, variant: 'info' });

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map(t => (
                    <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const variantConfig = {
    default: { icon: Info, bg: 'bg-white', border: 'border-gray-200', iconColor: 'text-gray-500', titleColor: 'text-gray-900' },
    success: { icon: CheckCircle, bg: 'bg-white', border: 'border-green-200', iconColor: 'text-green-600', titleColor: 'text-gray-900' },
    error: { icon: XCircle, bg: 'bg-white', border: 'border-red-200', iconColor: 'text-red-600', titleColor: 'text-gray-900' },
    warning: { icon: AlertTriangle, bg: 'bg-white', border: 'border-amber-200', iconColor: 'text-amber-600', titleColor: 'text-gray-900' },
    info: { icon: Info, bg: 'bg-white', border: 'border-indigo-200', iconColor: 'text-indigo-600', titleColor: 'text-gray-900' },
};

const ToastItem = ({ toast, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const config = variantConfig[toast.variant] || variantConfig.default;
    const Icon = config.icon;

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 200);
    };

    return (
        <div
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg ${config.bg} ${config.border} transition-all duration-200 ease-out ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                }`}
        >
            <Icon size={18} className={`mt-0.5 flex-shrink-0 ${config.iconColor}`} />
            <div className="flex-1 min-w-0">
                {toast.title && <p className={`text-sm font-medium ${config.titleColor}`}>{toast.title}</p>}
                {toast.description && <p className="text-xs text-gray-500 mt-0.5">{toast.description}</p>}
            </div>
            <button onClick={handleClose} className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={14} />
            </button>
        </div>
    );
};
