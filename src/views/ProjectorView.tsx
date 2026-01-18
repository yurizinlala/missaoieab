import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChurchState } from '../context/ChurchContext';
import { ProjectorLayout } from '../components/layout/ProjectorLayout';
import { StatsCard } from '../components/ui/StatsCard';
import { Confetti } from '../components/ui/Confetti';
import { Toaster } from '../components/Toaster';
import { Home, Users, Grid3X3, Eye, Sparkles } from 'lucide-react';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

// Celebration sound
const playCelebrationSound = () => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch {
        // Audio not supported
    }
};

// Popup for new commitments
const CommitmentPopup = ({ discipleHistory, cellHistory }: { discipleHistory: any[]; cellHistory: any[] }) => {
    const [visible, setVisible] = useState(false);
    const [currentCommitment, setCurrentCommitment] = useState<any>(null);
    const [commitType, setCommitType] = useState<'disciple' | 'cell'>('disciple');
    const lastDiscipleIdRef = useRef<string | null>(null);
    const lastCellIdRef = useRef<string | null>(null);
    const queueRef = useRef<{ entry: any; type: 'disciple' | 'cell' }[]>([]);
    const isProcessingRef = useRef(false);

    useEffect(() => {
        if (discipleHistory.length > 0) {
            const latest = discipleHistory[0];
            if (lastDiscipleIdRef.current && latest.id !== lastDiscipleIdRef.current) {
                queueRef.current.push({ entry: latest, type: 'disciple' });
                processQueue();
            }
            lastDiscipleIdRef.current = latest.id;
        }
    }, [discipleHistory]);

    useEffect(() => {
        if (cellHistory.length > 0) {
            const latest = cellHistory[0];
            if (lastCellIdRef.current && latest.id !== lastCellIdRef.current) {
                queueRef.current.push({ entry: latest, type: 'cell' });
                processQueue();
            }
            lastCellIdRef.current = latest.id;
        }
    }, [cellHistory]);

    const processQueue = async () => {
        if (isProcessingRef.current || queueRef.current.length === 0) return;

        isProcessingRef.current = true;
        const { entry, type } = queueRef.current.shift()!;
        setCurrentCommitment(entry);
        setCommitType(type);
        setVisible(true);

        await new Promise(r => setTimeout(r, 5000));
        setVisible(false);
        await new Promise(r => setTimeout(r, 500));

        isProcessingRef.current = false;
        processQueue();
    };

    return (
        <AnimatePresence>
            {visible && currentCommitment && (
                <motion.div
                    initial={{ x: 100, opacity: 0, scale: 0.8 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    exit={{ x: 100, opacity: 0, scale: 0.8 }}
                    className={`fixed bottom-8 right-8 z-50 backdrop-blur-xl p-6 rounded-2xl shadow-2xl max-w-sm flex items-center gap-4 border-l-4 ${commitType === 'disciple'
                        ? 'bg-blue-900/90 border-blue-400 border-l-blue-400'
                        : 'bg-purple-900/90 border-purple-400 border-l-purple-400'
                        }`}
                >
                    <div className={`p-3 rounded-full ${commitType === 'disciple' ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                        {commitType === 'disciple' ? <Users size={32} className="text-blue-400" /> : <Grid3X3 size={32} className="text-purple-400" />}
                    </div>
                    <div>
                        <h3 className={`font-bold text-sm mb-1 ${commitType === 'disciple' ? 'text-blue-400' : 'text-purple-400'}`}>
                            {commitType === 'disciple' ? 'NOVO DISCIPULADOR!' : 'NOVA CÉLULA!'}
                        </h3>
                        <p className="text-white text-xl font-bold leading-tight">
                            {commitType === 'disciple' ? currentCommitment.name : currentCommitment.leaderName}
                        </p>
                        <p className="text-gray-300 text-sm mt-1">
                            <span className="text-gold font-bold">+{currentCommitment.amount}</span>
                            {commitType === 'disciple' ? ' discípulos' : ' células'} para{' '}
                            <span className="text-white font-medium">{currentCommitment.locationName}</span>
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const ProjectorView = () => {
    const {
        state,
        totalVidasAtual,
        totalCelulasAtual,
        totalDiscipleCommitments,
        totalCellCommitments,
        discipleProgressPercent,
        cellProgressPercent
    } = useChurchState();

    const [confettiTrigger, setConfettiTrigger] = useState(0);
    const [prevDiscipleTotal, setPrevDiscipleTotal] = useState(totalDiscipleCommitments);
    const [prevCellTotal, setPrevCellTotal] = useState(totalCellCommitments);
    const lastMilestoneRef = useRef(0);

    // Animated counters - for goals, use commitments only
    const animatedDiscipleCommitments = useAnimatedNumber(totalDiscipleCommitments, 1500);
    const animatedCellCommitments = useAnimatedNumber(totalCellCommitments, 1500);
    const animatedDiscipleProgress = useAnimatedNumber(discipleProgressPercent, 1000);
    const animatedCellProgress = useAnimatedNumber(cellProgressPercent, 1000);

    // Trigger effects on new commitments
    useEffect(() => {
        if (totalDiscipleCommitments > prevDiscipleTotal || totalCellCommitments > prevCellTotal) {
            setConfettiTrigger(c => c + 1);

            // Check for milestones
            const milestones = [25, 50, 75, 100];
            const currentPercent = discipleProgressPercent;
            const prevPercent = (prevDiscipleTotal / state.discipleGoal) * 100;

            for (const milestone of milestones) {
                if (prevPercent < milestone && currentPercent >= milestone && lastMilestoneRef.current < milestone) {
                    playCelebrationSound();
                    lastMilestoneRef.current = milestone;
                    break;
                }
            }
        }
        setPrevDiscipleTotal(totalDiscipleCommitments);
        setPrevCellTotal(totalCellCommitments);
    }, [totalDiscipleCommitments, totalCellCommitments, state.discipleGoal, discipleProgressPercent]);

    const openAdmin = () => {
        window.open('/admin', '_blank');
    };

    // Get location data based on mode
    const getLocationData = (loc: any) => {
        if (state.viewMode === 'atual') {
            return {
                disciples: loc.baseDisciples,
                cells: loc.baseCells
            };
        } else {
            // Futuro: base + commitments for this location
            const discipleCommits = state.discipleCommitments
                .filter(c => c.locationId === loc.id)
                .reduce((sum, c) => sum + c.amount, 0);
            const cellCommits = state.cellCommitments
                .filter(c => c.locationId === loc.id)
                .reduce((sum, c) => sum + c.amount, 0);
            return {
                disciples: loc.baseDisciples + discipleCommits,
                cells: loc.baseCells + cellCommits
            };
        }
    };

    const isAtual = state.viewMode === 'atual';

    return (
        <ProjectorLayout onOpenAdmin={openAdmin}>
            <Toaster />
            <Confetti trigger={confettiTrigger} />
            <CommitmentPopup
                discipleHistory={state.discipleCommitments}
                cellHistory={state.cellCommitments}
            />

            {/* Mode Indicator */}
            <div className="fixed top-4 right-4 z-40">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl border ${isAtual
                    ? 'bg-blue-900/50 border-blue-500/30 text-blue-300'
                    : 'bg-amber-900/50 border-amber-500/30 text-amber-300'
                    }`}>
                    {isAtual ? <Eye size={16} /> : <Sparkles size={16} />}
                    <span className="text-sm font-bold uppercase tracking-wider">
                        {isAtual ? 'Situação Atual' : 'Meta Global'}
                    </span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {isAtual ? (
                    /* SITUAÇÃO ATUAL - Shows current reality */
                    <motion.div
                        key="atual"
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
                            className="text-3xl sm:text-4xl md:text-5xl font-sansation font-bold text-center mb-8 md:mb-12 uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-blue-200 to-blue-400"
                        >
                            Nossa Realidade Atual
                        </motion.h1>

                        {/* Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 w-full mb-8">
                            {state.locations.map((loc, idx) => {
                                const data = getLocationData(loc);
                                return (
                                    <motion.div
                                        key={loc.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 + 0.3 }}
                                    >
                                        <StatsCard
                                            title={loc.name}
                                            fullName={loc.fullName}
                                            value={data.disciples}
                                            subValue={data.cells}
                                            address={loc.address}
                                            pastors={loc.pastors}
                                            label="Células"
                                            icon={<Home size={24} />}
                                            className="h-full min-h-[180px] md:min-h-[220px]"
                                        />
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Summary Stats */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="flex justify-center w-full"
                        >
                            <div className="bg-white/5 backdrop-blur-xl px-8 md:px-16 py-6 md:py-8 rounded-3xl border border-white/10 flex flex-col sm:flex-row gap-8 sm:gap-16 items-center shadow-2xl">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Users size={20} className="text-blue-400" />
                                        <span className="text-blue-400 text-xs md:text-sm uppercase tracking-widest font-bold">
                                            Total de Discípulos
                                        </span>
                                    </div>
                                    <div className="text-4xl md:text-5xl font-bold text-white leading-none font-sansation">
                                        {totalVidasAtual}
                                    </div>
                                </div>

                                <div className="hidden sm:block w-px h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Grid3X3 size={20} className="text-purple-400" />
                                        <span className="text-purple-400 text-xs md:text-sm uppercase tracking-widest font-bold">
                                            Total de Células
                                        </span>
                                    </div>
                                    <div className="text-4xl md:text-5xl font-bold text-white leading-none font-sansation">
                                        {totalCelulasAtual}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-blue-600 blur-[100px] md:blur-[120px] -z-10 rounded-full mix-blend-screen opacity-30 animate-pulse" />
                    </motion.div>
                ) : (
                    /* METAS - Big counter screen */
                    <motion.div
                        key="metas"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col items-center justify-center text-center w-full px-4"
                    >
                        <h2 className="text-2xl sm:text-3xl md:text-4xl uppercase tracking-[0.2em] md:tracking-[0.3em] text-gold/80 mb-8 md:mb-12 font-sansation font-bold">
                            Meta Global de Discipulado
                        </h2>

                        <div className="relative group cursor-default mb-16">
                            {/* HUGE Counter - Commitments only */}
                            <motion.div
                                key="counter"
                                className="text-[6rem] sm:text-[8rem] md:text-[12rem] font-bold leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] font-sansation tabular-nums"
                            >
                                {animatedDiscipleCommitments}
                            </motion.div>

                            {/* Goal Denominator */}
                            <div className="text-2xl sm:text-3xl md:text-4xl font-light text-white/40 mt-4 font-sansation">
                                / {state.discipleGoal} VIDAS
                            </div>

                            {/* Progress Bar */}
                            <div className="w-[90vw] sm:w-[80vw] md:w-[70vw] max-w-4xl h-4 md:h-6 bg-white/5 rounded-full mt-12 md:mt-16 overflow-hidden relative shadow-inner border border-white/5">
                                <motion.div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold via-yellow-400 to-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(discipleProgressPercent, 100)}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </div>

                            {/* Percentage Indicator */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 md:mt-12 px-6 md:px-8 py-2 md:py-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-bold text-xl md:text-2xl font-sansation inline-flex items-center gap-2"
                            >
                                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                                {animatedDiscipleProgress.toFixed(1)}% Completo
                            </motion.div>

                            {/* Glow Effect */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-amber-500/20 blur-[100px] md:blur-[120px] -z-10 rounded-full mix-blend-screen opacity-50 animate-pulse" />
                        </div>

                        {/* Cells Goal - Secondary */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/5 backdrop-blur-xl px-8 py-6 rounded-2xl border border-white/10 mt-8"
                        >
                            <div className="flex items-center gap-4">
                                <Grid3X3 size={32} className="text-purple-400" />
                                <div>
                                    <p className="text-purple-400 text-xs uppercase tracking-widest font-bold">Meta de Células</p>
                                    <p className="text-white text-3xl font-bold font-sansation">
                                        {animatedCellCommitments} <span className="text-white/40 text-lg font-light">/ {state.cellGoal}</span>
                                    </p>
                                </div>
                                <div className="ml-4 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full font-bold">
                                    {animatedCellProgress.toFixed(1)}%
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </ProjectorLayout>
    );
};
