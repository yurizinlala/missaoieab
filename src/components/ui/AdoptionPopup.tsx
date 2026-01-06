import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
const ADOPTION_EVENT = 'adoption-popup';
const ADOPTION_STORAGE_KEY = 'missao-adoption-popup';

interface AdoptionData {
    name: string;
    amount: number;
    timestamp: number;
}

export const AdoptionPopup = () => {
    const [data, setData] = useState<AdoptionData | null>(null);

    useEffect(() => {
        // 1. Listen for Local Event
        const handleLocal = (e: CustomEvent<AdoptionData>) => {
            setData(e.detail);
            setTimeout(() => setData(null), 5000);
        };

        // 2. Listen for Storage Event (Cross-Tab)
        const handleStorage = (e: StorageEvent) => {
            if (e.key === ADOPTION_STORAGE_KEY && e.newValue) {
                try {
                    const payload = JSON.parse(e.newValue) as AdoptionData;
                    // Only show if it's recent (last 3 seconds)
                    if (Date.now() - payload.timestamp < 3000) {
                        setData(payload);
                        setTimeout(() => setData(null), 5000);
                    }
                } catch { /* ignore */ }
            }
        };

        window.addEventListener(ADOPTION_EVENT as any, handleLocal);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener(ADOPTION_EVENT as any, handleLocal);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    return (
        <AnimatePresence>
            {data && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="fixed inset-0 bg-emerald-600/95 backdrop-blur-md flex items-center justify-center z-[100] p-6 text-center select-none cursor-default"
                >
                    <div className="text-white flex flex-col items-center animate-in mb-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 10 }}
                            className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 shadow-xl"
                        >
                            <Check size={60} className="text-white stroke-[3px]" />
                        </motion.div>

                        <h3 className="text-3xl md:text-5xl font-bold mb-4 font-sansation">Registrado!</h3>

                        <div className="text-emerald-100 text-xl md:text-3xl leading-relaxed">
                            <span className="font-bold text-white block text-2xl md:text-4xl mb-2">{data.name}</span>
                            adotou
                            <br />
                            <motion.span
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-6xl md:text-[5rem] font-bold text-yellow-300 drop-shadow-md block mt-4"
                            >
                                +{data.amount}
                            </motion.span>
                            <span className="opacity-80 text-sm md:text-lg uppercase tracking-widest mt-2 block">Vidas</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


