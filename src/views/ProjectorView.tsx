import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChurchState } from '../context/ChurchContext';
import { ProjectorLayout } from '../components/layout/ProjectorLayout';
import { StatsCard } from '../components/ui/StatsCard';
import { Confetti } from '../components/ui/Confetti';
import { Toaster } from '../components/Toaster';
import { Home, Users, Grid3X3 } from 'lucide-react';
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
                        ? 'bg-blue-900/90 border-blue-400'
                        : 'bg-purple-900/90 border-purple-400'
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

    // Animated counters
    const animatedDiscipleCommitments = useAnimatedNumber(totalDiscipleCommitments, 1500);
    const animatedCellCommitments = useAnimatedNumber(totalCellCommitments, 1500);
    const animatedDiscipleProgress = useAnimatedNumber(discipleProgressPercent, 1000);
    const animatedCellProgress = useAnimatedNumber(cellProgressPercent, 1000);

    // Trigger effects on new commitments
    useEffect(() => {
        if (totalDiscipleCommitments > prevDiscipleTotal || totalCellCommitments > prevCellTotal) {
            setConfettiTrigger(c => c + 1);

            const milestones = [25, 50, 75, 100];
            const currentPercent = state.adminMode === 'disciples' ? discipleProgressPercent : cellProgressPercent;
            const prevPercent = state.adminMode === 'disciples'
                ? (prevDiscipleTotal / state.discipleGoal) * 100
                : (prevCellTotal / state.cellGoal) * 100;

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
    }, [totalDiscipleCommitments, totalCellCommitments, state.discipleGoal, state.cellGoal, discipleProgressPercent, cellProgressPercent, state.adminMode]);

    const openAdmin = () => {
        window.open('/admin', '_blank');
    };

    // Get future data per location (base + commitments)
    const getLocationFutureData = (loc: any) => {
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
    };

    return (
        <ProjectorLayout onOpenAdmin={openAdmin}>
            <Toaster />
            <Confetti trigger={confettiTrigger} />
            <CommitmentPopup
                discipleHistory={state.discipleCommitments}
                cellHistory={state.cellCommitments}
            />

            <AnimatePresence mode="wait">
                {/* === MODO ATUAL === */}
                {state.viewMode === 'atual' && (
                    <motion.div
                        key="atual"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.6 }}
                        className="w-full max-w-6xl flex flex-col items-center px-4"
                    >
                        <motion.h1
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-3xl sm:text-4xl md:text-5xl font-sansation font-bold text-center mb-8 md:mb-12 uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-blue-200 to-blue-400"
                        >
                            Nossa Realidade Atual
                        </motion.h1>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 w-full mb-8">
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
                                        value={loc.baseDisciples}
                                        subValue={loc.baseCells}
                                        address={loc.address}
                                        pastors={loc.pastors}
                                        label="Células"
                                        icon={<Home size={24} />}
                                        className="h-full min-h-[180px] md:min-h-[220px]"
                                    />
                                </motion.div>
                            ))}
                        </div>

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
                                        <span className="text-blue-400 text-xs md:text-sm uppercase tracking-widest font-bold">Discípulos</span>
                                    </div>
                                    <div className="text-4xl md:text-5xl font-bold text-white font-sansation">{totalVidasAtual}</div>
                                </div>
                                <div className="hidden sm:block w-px h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Grid3X3 size={20} className="text-purple-400" />
                                        <span className="text-purple-400 text-xs md:text-sm uppercase tracking-widest font-bold">Células</span>
                                    </div>
                                    <div className="text-4xl md:text-5xl font-bold text-white font-sansation">{totalCelulasAtual}</div>
                                </div>
                            </div>
                        </motion.div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600 blur-[120px] -z-10 rounded-full mix-blend-screen opacity-30 animate-pulse" />
                    </motion.div>
                )}

                {/* === MODO METAS (Based on adminMode) === */}
                {state.viewMode === 'metas' && (
                    <motion.div
                        key="metas"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col items-center justify-center text-center w-full px-4"
                    >
                        {state.adminMode === 'disciples' ? (
                            /* DISCIPLES GOAL */
                            <>
                                <h2 className="text-2xl sm:text-3xl md:text-4xl uppercase tracking-[0.2em] text-gold/80 mb-8 md:mb-12 font-sansation font-bold">
                                    Meta de Discipuladores
                                </h2>

                                <div className="relative mb-16">
                                    <motion.div className="text-[6rem] sm:text-[8rem] md:text-[12rem] font-bold leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] font-sansation tabular-nums">
                                        {animatedDiscipleCommitments}
                                    </motion.div>
                                    <div className="text-2xl sm:text-3xl md:text-4xl font-light text-white/40 mt-4 font-sansation">
                                        / {state.discipleGoal} VIDAS
                                    </div>

                                    <div className="w-[90vw] sm:w-[80vw] md:w-[70vw] max-w-4xl h-4 md:h-6 bg-white/5 rounded-full mt-12 md:mt-16 overflow-hidden relative shadow-inner border border-white/5">
                                        <motion.div
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(discipleProgressPercent, 100)}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                        />
                                    </div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-8 md:mt-12 px-6 md:px-8 py-2 md:py-3 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 font-bold text-xl md:text-2xl font-sansation inline-flex items-center gap-2"
                                    >
                                        <div className="w-3 h-3 rounded-full bg-blue-400 animate-ping" />
                                        {animatedDiscipleProgress.toFixed(1)}% Completo
                                    </motion.div>

                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/30 blur-[120px] -z-10 rounded-full mix-blend-screen opacity-50 animate-pulse" />
                                </div>
                            </>
                        ) : (
                            /* CELLS GOAL */
                            <>
                                <h2 className="text-2xl sm:text-3xl md:text-4xl uppercase tracking-[0.2em] text-purple-400/80 mb-8 md:mb-12 font-sansation font-bold">
                                    Meta de Células
                                </h2>

                                <div className="relative mb-16">
                                    <motion.div className="text-[6rem] sm:text-[8rem] md:text-[12rem] font-bold leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] font-sansation tabular-nums">
                                        {animatedCellCommitments}
                                    </motion.div>
                                    <div className="text-2xl sm:text-3xl md:text-4xl font-light text-white/40 mt-4 font-sansation">
                                        / {state.cellGoal} CÉLULAS
                                    </div>

                                    <div className="w-[90vw] sm:w-[80vw] md:w-[70vw] max-w-4xl h-4 md:h-6 bg-white/5 rounded-full mt-12 md:mt-16 overflow-hidden relative shadow-inner border border-white/5">
                                        <motion.div
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-purple-400 to-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(cellProgressPercent, 100)}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                        />
                                    </div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-8 md:mt-12 px-6 md:px-8 py-2 md:py-3 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 font-bold text-xl md:text-2xl font-sansation inline-flex items-center gap-2"
                                    >
                                        <div className="w-3 h-3 rounded-full bg-purple-400 animate-ping" />
                                        {animatedCellProgress.toFixed(1)}% Completo
                                    </motion.div>

                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/30 blur-[120px] -z-10 rounded-full mix-blend-screen opacity-50 animate-pulse" />
                                </div>
                            </>
                        )}
                    </motion.div>
                )}

                {/* === MODO PROJEÇÃO FUTURA === */}
                {state.viewMode === 'projecao' && (
                    <motion.div
                        key="projecao"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.6 }}
                        className="w-full max-w-6xl flex flex-col items-center px-4"
                    >
                        <motion.h1
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-3xl sm:text-4xl md:text-5xl font-sansation font-bold text-center mb-8 md:mb-12 uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-200 to-emerald-400"
                        >
                            Projeção Futura
                        </motion.h1>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 w-full mb-8">
                            {state.locations.map((loc, idx) => {
                                const futureData = getLocationFutureData(loc);
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
                                            value={futureData.disciples}
                                            subValue={futureData.cells}
                                            address={loc.address}
                                            pastors={loc.pastors}
                                            label="Células"
                                            icon={<Home size={24} />}
                                            className="h-full min-h-[180px] md:min-h-[220px] ring-2 ring-emerald-500/20"
                                        />
                                    </motion.div>
                                );
                            })}
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="flex justify-center w-full"
                        >
                            <div className="bg-emerald-500/5 backdrop-blur-xl px-8 md:px-16 py-6 md:py-8 rounded-3xl border border-emerald-500/20 flex flex-col sm:flex-row gap-8 sm:gap-16 items-center shadow-2xl">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Users size={20} className="text-emerald-400" />
                                        <span className="text-emerald-400 text-xs md:text-sm uppercase tracking-widest font-bold">Discípulos</span>
                                    </div>
                                    <div className="text-4xl md:text-5xl font-bold text-white font-sansation">
                                        {totalVidasAtual + totalDiscipleCommitments}
                                    </div>
                                    <div className="text-xs text-emerald-400/60 mt-1">
                                        ({totalVidasAtual} atual + {totalDiscipleCommitments} novos)
                                    </div>
                                </div>
                                <div className="hidden sm:block w-px h-20 bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent"></div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Grid3X3 size={20} className="text-emerald-400" />
                                        <span className="text-emerald-400 text-xs md:text-sm uppercase tracking-widest font-bold">Células</span>
                                    </div>
                                    <div className="text-4xl md:text-5xl font-bold text-white font-sansation">
                                        {totalCelulasAtual + totalCellCommitments}
                                    </div>
                                    <div className="text-xs text-emerald-400/60 mt-1">
                                        ({totalCelulasAtual} atual + {totalCellCommitments} novas)
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600 blur-[120px] -z-10 rounded-full mix-blend-screen opacity-30 animate-pulse" />
                    </motion.div>
                )}
            </AnimatePresence>
        </ProjectorLayout>
    );
};
