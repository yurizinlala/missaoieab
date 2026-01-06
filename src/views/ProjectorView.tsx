import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChurchState } from '../context/ChurchContext';
import { ProjectorLayout } from '../components/layout/ProjectorLayout';
import { StatsCard } from '../components/ui/StatsCard';
import { Confetti } from '../components/ui/Confetti';
import { Toaster } from '../components/Toaster';
import { Home } from 'lucide-react';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

// Celebration sound (using Web Audio API for cross-browser)
const playCelebrationSound = () => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch {
        // Audio not supported, ignore
    }
};

export const ProjectorView = () => {
    const { state, totalVidas, totalCelulas, progressPercent } = useChurchState();
    const [prevTotal, setPrevTotal] = useState(state.totalDisciples);
    const [confettiTrigger, setConfettiTrigger] = useState(0);
    const lastMilestoneRef = useRef(0);

    // Animated counter
    const animatedTotal = useAnimatedNumber(state.totalDisciples, 1500);
    const animatedProgress = useAnimatedNumber(Math.round(progressPercent * 10) / 10, 1000);

    // Trigger effects on new disciples
    useEffect(() => {
        if (state.totalDisciples > prevTotal) {
            setConfettiTrigger(c => c + 1);

            // Check for milestones (25%, 50%, 75%, 100%)
            const milestones = [25, 50, 75, 100];
            const currentPercent = (state.totalDisciples / state.goal) * 100;
            const prevPercent = (prevTotal / state.goal) * 100;

            for (const milestone of milestones) {
                if (prevPercent < milestone && currentPercent >= milestone && lastMilestoneRef.current < milestone) {
                    playCelebrationSound();
                    lastMilestoneRef.current = milestone;
                    break;
                }
            }
        }
        setPrevTotal(state.totalDisciples);
    }, [state.totalDisciples, state.goal, prevTotal]);

    const openAdmin = () => {
        window.open('/admin', '_blank');
    };

    return (
        <ProjectorLayout onOpenAdmin={openAdmin}>
            <Toaster />
            <Confetti trigger={confettiTrigger} />

            <AnimatePresence mode="wait">
                {state.viewMode === 'reality' ? (
                    <motion.div
                        key="reality"
                        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-full max-w-6xl flex flex-col items-center px-4"
                    >
                        {/* Title */}
                        <motion.h1
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-3xl sm:text-4xl md:text-5xl font-sansation font-bold text-center mb-8 md:mb-12 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 drop-shadow-sm uppercase tracking-wider"
                        >
                            Nossa Realidade Atual
                        </motion.h1>

                        {/* Cards Grid - Responsive */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 w-full">
                            {state.locations.map((loc, idx) => (
                                <motion.div
                                    key={loc.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 + 0.3 }}
                                >
                                    <StatsCard
                                        title={loc.name}
                                        fullName={loc.fullName}
                                        value={loc.disciples}
                                        subValue={loc.cells}
                                        address={loc.address}
                                        pastors={loc.pastors}
                                        label="Células"
                                        icon={<Home size={24} />}
                                        className="h-full min-h-[180px] md:min-h-[220px]"
                                    />
                                </motion.div>
                            ))}
                        </div>

                        {/* Aggregate Summary */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="flex justify-center mt-8 md:mt-16 w-full"
                        >
                            <div className="bg-white/5 backdrop-blur-xl px-8 md:px-16 py-6 md:py-8 rounded-full border border-white/10 flex flex-col sm:flex-row gap-8 sm:gap-16 items-center shadow-2xl">
                                <div className="text-center">
                                    <span className="text-gold/80 text-xs md:text-sm uppercase tracking-widest font-bold font-sansation">Total de Vidas</span>
                                    <div className="text-4xl md:text-5xl font-bold text-white leading-none mt-2 font-sansation">
                                        {totalVidas}
                                    </div>
                                </div>
                                <div className="hidden sm:block w-px h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                                <div className="text-center">
                                    <span className="text-gold/80 text-xs md:text-sm uppercase tracking-widest font-bold font-sansation">Total de Células</span>
                                    <div className="text-4xl md:text-5xl font-bold text-white leading-none mt-2 font-sansation">
                                        {totalCelulas}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="construction"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col items-center justify-center text-center w-full px-4"
                    >
                        <h2 className="text-2xl sm:text-3xl md:text-4xl uppercase tracking-[0.2em] md:tracking-[0.3em] text-gold/80 mb-8 md:mb-12 font-sansation font-bold">
                            Meta Global de Discipulado
                        </h2>

                        <div className="relative group cursor-default">
                            {/* Animated Counter */}
                            <motion.div
                                key="counter"
                                className="text-[6rem] sm:text-[8rem] md:text-[10rem] font-bold leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] font-sansation tabular-nums"
                            >
                                {animatedTotal}
                            </motion.div>

                            {/* Goal Denominator */}
                            <div className="text-2xl sm:text-3xl md:text-4xl font-light text-white/40 mt-4 font-sansation">
                                / {state.goal} VIDAS
                            </div>

                            {/* Progress Bar */}
                            <div className="w-[90vw] sm:w-[80vw] md:w-[70vw] max-w-4xl h-4 md:h-6 bg-white/5 rounded-full mt-12 md:mt-16 overflow-hidden relative shadow-inner border border-white/5">
                                <motion.div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold via-yellow-400 to-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </div>

                            {/* Massive Glow Effect */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-blue-600/20 blur-[100px] md:blur-[120px] -z-10 rounded-full mix-blend-screen opacity-50 animate-pulse" />
                        </div>

                        {/* Progress Indicator */}
                        {state.totalDisciples > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 md:mt-12 px-6 md:px-8 py-2 md:py-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-bold text-base md:text-lg font-sansation flex items-center gap-2"
                            >
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                {animatedProgress.toFixed(1)}% Completo
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </ProjectorLayout>
    );
};
