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
        // Check for new disciple commitments
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
        // Check for new cell commitments
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
        totalVidasFuturo,
        totalCelulasFuturo,
        discipleProgressPercent,
        cellProgressPercent
    } = useChurchState();

    const [confettiTrigger, setConfettiTrigger] = useState(0);
    const [prevDiscipleTotal, setPrevDiscipleTotal] = useState(totalVidasFuturo);
    const [prevCellTotal, setPrevCellTotal] = useState(totalCelulasFuturo);
    const lastMilestoneRef = useRef(0);

    // Animated counters
    const animatedDisciples = useAnimatedNumber(state.viewMode === 'atual' ? totalVidasAtual : totalVidasFuturo, 1500);
    const animatedCells = useAnimatedNumber(state.viewMode === 'atual' ? totalCelulasAtual : totalCelulasFuturo, 1500);
    const animatedDiscipleProgress = useAnimatedNumber(discipleProgressPercent, 1000);
    const animatedCellProgress = useAnimatedNumber(cellProgressPercent, 1000);

    // Trigger effects on new commitments (only when in futuro mode for visuals)
    useEffect(() => {
        if (totalVidasFuturo > prevDiscipleTotal || totalCelulasFuturo > prevCellTotal) {
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
        setPrevDiscipleTotal(totalVidasFuturo);
        setPrevCellTotal(totalCelulasFuturo);
    }, [totalVidasFuturo, totalCelulasFuturo, state.discipleGoal, discipleProgressPercent]);

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
                        {isAtual ? 'Situação Atual' : 'Situação Futura'}
                    </span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={state.viewMode}
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
                        className={`text-3xl sm:text-4xl md:text-5xl font-sansation font-bold text-center mb-8 md:mb-12 uppercase tracking-wider ${isAtual
                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-blue-200 to-blue-400'
                                : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400'
                            }`}
                    >
                        {isAtual ? 'Nossa Realidade Atual' : 'Nossa Visão de Futuro'}
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
                            {/* Disciples Total */}
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Users size={20} className="text-blue-400" />
                                    <span className="text-blue-400 text-xs md:text-sm uppercase tracking-widest font-bold font-sansation">
                                        Discípulos
                                    </span>
                                </div>
                                <div className="text-4xl md:text-5xl font-bold text-white leading-none font-sansation">
                                    {animatedDisciples}
                                </div>
                                {!isAtual && (
                                    <div className="mt-2 text-xs text-gray-400">
                                        Meta: {state.discipleGoal} ({animatedDiscipleProgress.toFixed(0)}%)
                                    </div>
                                )}
                            </div>

                            <div className="hidden sm:block w-px h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

                            {/* Cells Total */}
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Grid3X3 size={20} className="text-purple-400" />
                                    <span className="text-purple-400 text-xs md:text-sm uppercase tracking-widest font-bold font-sansation">
                                        Células
                                    </span>
                                </div>
                                <div className="text-4xl md:text-5xl font-bold text-white leading-none font-sansation">
                                    {animatedCells}
                                </div>
                                {!isAtual && (
                                    <div className="mt-2 text-xs text-gray-400">
                                        Meta: {state.cellGoal} ({animatedCellProgress.toFixed(0)}%)
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Progress Bars (Only in Futuro mode) */}
                    {!isAtual && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            className="w-full max-w-2xl mt-8 space-y-4"
                        >
                            {/* Disciples Progress */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-blue-400 font-bold">Discípulos</span>
                                    <span className="text-gray-400">{totalVidasFuturo} / {state.discipleGoal}</span>
                                </div>
                                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${discipleProgressPercent}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                </div>
                            </div>

                            {/* Cells Progress */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-purple-400 font-bold">Células</span>
                                    <span className="text-gray-400">{totalCelulasFuturo} / {state.cellGoal}</span>
                                </div>
                                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${cellProgressPercent}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Glow Effect */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] blur-[100px] md:blur-[120px] -z-10 rounded-full mix-blend-screen opacity-30 animate-pulse ${isAtual ? 'bg-blue-600' : 'bg-amber-500'
                        }`} />
                </motion.div>
            </AnimatePresence>
        </ProjectorLayout>
    );
};
