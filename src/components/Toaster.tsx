import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

export interface ToastMessage {
    id: string;
    text: string;
    subText?: string;
}

const TOAST_KEY = 'missao-latest-toast';

export const Toaster = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // Listen for local custom events
    useEffect(() => {
        const handleToast = (e: CustomEvent<ToastMessage>) => {
            const newToast = { ...e.detail, id: Date.now().toString() };
            addToast(newToast);
        };

        window.addEventListener('toast-commitment', handleToast as EventListener);
        return () => window.removeEventListener('toast-commitment', handleToast as EventListener);
    }, []);

    // Listen for cross-tab toasts via localStorage
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === TOAST_KEY && e.newValue) {
                try {
                    const payload = JSON.parse(e.newValue);
                    if (payload && payload.text) {
                        const newToast = { ...payload, id: Date.now().toString() };
                        addToast(newToast);
                    }
                } catch {
                    // Ignore parse errors
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const addToast = (toast: ToastMessage) => {
        setToasts(prev => [...prev, toast]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, 5000);
    };

    return (
        <div className="fixed top-10 right-10 z-50 flex flex-col gap-4 pointer-events-none">
            <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.8 }}
                        className="flex items-center gap-4 bg-white/20 backdrop-blur-xl border border-gold/30 p-4 rounded-xl shadow-2xl min-w-[300px] font-sansation"
                    >
                        <div className="p-2 bg-gold/20 rounded-full text-gold">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-lg text-white">{toast.text}</p>
                            {toast.subText && <p className="text-sm text-gray-200">{toast.subText}</p>}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// Helper to trigger toast (local tab)
export const showToast = (text: string, subText?: string) => {
    const event = new CustomEvent('toast-commitment', { detail: { text, subText } });
    window.dispatchEvent(event);
};

// Helper to trigger cross-tab toast
export const broadcastToast = (text: string, subText?: string) => {
    const payload = { id: Date.now(), text, subText };
    localStorage.setItem(TOAST_KEY, JSON.stringify(payload));
};
