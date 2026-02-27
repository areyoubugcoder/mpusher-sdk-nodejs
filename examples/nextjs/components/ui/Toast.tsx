'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              animate-[slideIn_0.3s_ease] px-4 py-3 rounded-lg border text-sm backdrop-blur-md flex items-center gap-2 shadow-lg w-max
              ${toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-700 text-emerald-200' : ''}
              ${toast.type === 'error' ? 'bg-red-900/90 border-red-700 text-red-200' : ''}
              ${toast.type === 'info' ? 'bg-brand-900/90 border-brand-700 text-brand-200' : ''}
            `}
                    >
                        {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                        {toast.type === 'info' && <Info className="w-4 h-4 text-brand-400" />}
                        <span>{toast.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
