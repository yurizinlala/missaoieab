import React, { useState, useEffect } from 'react';
import { useChurchState } from '../context/ChurchContext';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Monitor, TrendingUp, Plus, MapPin, Users, Settings,
    Trash2, PlusCircle, RotateCcw, Wifi, WifiOff, Check,
    Clock, Target, ChevronDown, ChevronUp
} from 'lucide-react';
import { showToast, broadcastToast } from '../components/Toaster';

export const AdminView = () => {
    const {
        state, addCommitment, updateBaseStats, setViewMode, setGoal,
        addLocation, removeLocation, resetState
    } = useChurchState();

    const [newCommitment, setNewCommitment] = useState({ name: '', amount: 1, locationId: state.locations[0]?.id || 1 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [showAddChurch, setShowAddChurch] = useState(false);
    const [newChurch, setNewChurch] = useState({ name: '', region: '', disciples: 0, cells: 0 });
    const [confirmReset, setConfirmReset] = useState(false);

    // Check online status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Form Handlers
    const handleCommit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommitment.name.trim() || newCommitment.amount < 1) return;

        setIsSubmitting(true);

        // Simulate brief delay for feedback
        await new Promise(r => setTimeout(r, 300));

        addCommitment(newCommitment.locationId, newCommitment.amount, newCommitment.name.trim());

        const churchName = state.locations.find(l => l.id === Number(newCommitment.locationId))?.name || 'Local';
        const msg = `${newCommitment.name} +${newCommitment.amount} para ${churchName.replace('Congregação ', '')}!`;

        // Broadcast to other tabs
        broadcastToast(msg, 'Nova oferta registrada!');

        // Local feedback
        showToast("✓ Compromisso Adicionado!", churchName);

        setIsSubmitting(false);
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 2000);

        setNewCommitment(prev => ({ ...prev, name: '', amount: 1 }));
    };

    const handleAddChurch = () => {
        if (!newChurch.name.trim()) return;
        addLocation({
            name: newChurch.name.trim(),
            region: newChurch.region || 'Other',
            disciples: newChurch.disciples,
            cells: newChurch.cells
        });
        setNewChurch({ name: '', region: '', disciples: 0, cells: 0 });
        setShowAddChurch(false);
        showToast("Igreja Adicionada!", newChurch.name);
    };

    const handleReset = () => {
        if (confirmReset) {
            resetState();
            setConfirmReset(false);
            showToast("Estado Resetado", "Dados iniciais restaurados");
        } else {
            setConfirmReset(true);
            setTimeout(() => setConfirmReset(false), 3000);
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sansation pb-12">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-lg border-b border-gray-800 p-4 shadow-lg">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gold to-yellow-500">
                        Missão IEAB
                    </h1>

                    {/* Connection Status */}
                    <div className={clsx(
                        "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
                        isOnline ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    )}>
                        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                        {isOnline ? "Sincronizado" : "Offline"}
                    </div>
                </div>
            </header>

            <div className="max-w-xl mx-auto p-4 space-y-6">

                {/* 1. Mode Control */}
                <section className="space-y-2">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Modo de Exibição</h2>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-800/50 rounded-2xl border border-gray-700">
                        <button
                            onClick={() => setViewMode('reality')}
                            className={clsx(
                                "flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300",
                                state.viewMode === 'reality'
                                    ? "bg-blue-600 text-white shadow-lg ring-2 ring-blue-400/30"
                                    : "text-gray-400 hover:bg-gray-700"
                            )}
                        >
                            <Monitor className={clsx("mb-2 transition-transform", state.viewMode === 'reality' && "scale-110")} />
                            <span className="text-sm font-bold">Realidade</span>
                        </button>

                        <button
                            onClick={() => setViewMode('construction')}
                            className={clsx(
                                "flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300",
                                state.viewMode === 'construction'
                                    ? "bg-gold text-deep-blue shadow-lg ring-2 ring-yellow-400/30"
                                    : "text-gray-400 hover:bg-gray-700"
                            )}
                        >
                            <TrendingUp className={clsx("mb-2 transition-transform", state.viewMode === 'construction' && "scale-110")} />
                            <span className="text-sm font-bold">Metas</span>
                        </button>
                    </div>
                </section>

                {/* 2. Goal Editor */}
                <section className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Target size={16} />
                            <span className="text-xs font-bold uppercase">Meta Global</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={state.goal}
                                onChange={e => setGoal(Number(e.target.value))}
                                min={1}
                                className="w-20 bg-gray-900 border border-gray-600 rounded-lg px-3 py-1 text-white text-center font-bold focus:border-gold focus:outline-none"
                            />
                            <span className="text-gray-500 text-sm">vidas</span>
                        </div>
                    </div>
                    <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-gold to-amber-400 transition-all duration-500"
                            style={{ width: `${Math.min((state.totalDisciples / state.goal) * 100, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">
                        {state.totalDisciples} / {state.goal} ({((state.totalDisciples / state.goal) * 100).toFixed(1)}%)
                    </p>
                </section>

                {/* 3. Commitment Form */}
                <section className="space-y-2">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Registrar Oferta</h2>
                    <form onSubmit={handleCommit} className="bg-gray-800 rounded-2xl p-5 border border-gray-700 shadow-xl relative overflow-hidden">
                        <AnimatePresence>
                            {submitSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center z-20"
                                >
                                    <div className="text-emerald-400 flex flex-col items-center">
                                        <Check size={48} className="mb-2" />
                                        <span className="font-bold">Registrado!</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4 relative z-10">
                            <div>
                                <input
                                    type="text"
                                    value={newCommitment.name}
                                    onChange={e => setNewCommitment({ ...newCommitment, name: e.target.value })}
                                    placeholder="Nome do Discipulador"
                                    maxLength={50}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                                    required
                                    aria-label="Nome do discipulador"
                                />
                            </div>

                            <div className="grid grid-cols-[1fr,2fr] gap-3">
                                <div className="bg-gray-900 rounded-xl border border-gray-600 flex items-center px-3">
                                    <span className="text-gray-500 text-xs mr-2">Qtd:</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={newCommitment.amount}
                                        onChange={e => setNewCommitment({ ...newCommitment, amount: Math.min(100, Math.max(1, Number(e.target.value))) })}
                                        className="w-full bg-transparent text-white text-lg font-bold focus:outline-none py-3"
                                        aria-label="Quantidade"
                                    />
                                </div>

                                <div className="relative">
                                    <select
                                        value={newCommitment.locationId}
                                        onChange={e => setNewCommitment({ ...newCommitment, locationId: Number(e.target.value) })}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white appearance-none focus:outline-none focus:border-gold transition-all"
                                        aria-label="Selecionar igreja"
                                    >
                                        {state.locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {[1, 3, 5, 10].map(val => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setNewCommitment({ ...newCommitment, amount: val })}
                                        className={clsx(
                                            "flex-1 py-2 rounded-lg text-xs font-bold transition-colors",
                                            newCommitment.amount === val
                                                ? "bg-gold text-deep-blue"
                                                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                                        )}
                                    >
                                        +{val}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !newCommitment.name.trim()}
                                className={clsx(
                                    "w-full font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95",
                                    isSubmitting
                                        ? "bg-gray-600 cursor-wait"
                                        : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20"
                                )}
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Plus size={24} />
                                        Confirmar Entrega
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </section>

                {/* 4. History */}
                <section className="space-y-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="w-full flex items-center justify-between text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <h2 className="text-xs font-bold uppercase tracking-widest">Histórico Recente</h2>
                            <span className="bg-gray-700 px-2 py-0.5 rounded text-[10px]">{state.commitmentHistory.length}</span>
                        </div>
                        {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <AnimatePresence>
                        {showHistory && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-3 max-h-60 overflow-y-auto space-y-2">
                                    {state.commitmentHistory.length === 0 ? (
                                        <p className="text-gray-500 text-sm text-center py-4">Nenhum registro ainda</p>
                                    ) : (
                                        state.commitmentHistory.slice(0, 20).map(entry => (
                                            <div key={entry.id} className="flex items-center justify-between text-sm bg-gray-900/50 rounded-lg px-3 py-2">
                                                <div>
                                                    <span className="text-white font-medium">{entry.name}</span>
                                                    <span className="text-emerald-400 font-bold ml-2">+{entry.amount}</span>
                                                    <span className="text-gray-500 ml-2 text-xs">{entry.locationName}</span>
                                                </div>
                                                <span className="text-gray-500 text-xs">{formatTime(entry.timestamp)}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* 5. Church Configuration */}
                <section className="space-y-4 pt-4">
                    <div className="flex items-center justify-between text-gray-400 border-t border-gray-800 pt-6">
                        <div className="flex items-center gap-2">
                            <Settings size={16} />
                            <h2 className="text-xs font-bold uppercase tracking-widest">Configuração das Bases</h2>
                        </div>
                        <button
                            onClick={() => setShowAddChurch(!showAddChurch)}
                            className="flex items-center gap-1 text-xs text-gold hover:text-yellow-400 transition-colors"
                        >
                            <PlusCircle size={14} />
                            Adicionar
                        </button>
                    </div>

                    {/* Add Church Form */}
                    <AnimatePresence>
                        {showAddChurch && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Nome da Nova Igreja"
                                        value={newChurch.name}
                                        onChange={e => setNewChurch({ ...newChurch, name: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white text-sm focus:border-gold focus:outline-none"
                                    />
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Região"
                                            value={newChurch.region}
                                            onChange={e => setNewChurch({ ...newChurch, region: e.target.value })}
                                            className="bg-gray-900 border border-gray-600 rounded-lg p-2 text-white text-sm focus:border-gold focus:outline-none"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Discípulos"
                                            value={newChurch.disciples || ''}
                                            onChange={e => setNewChurch({ ...newChurch, disciples: Number(e.target.value) })}
                                            className="bg-gray-900 border border-gray-600 rounded-lg p-2 text-white text-sm focus:border-gold focus:outline-none"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Células"
                                            value={newChurch.cells || ''}
                                            onChange={e => setNewChurch({ ...newChurch, cells: Number(e.target.value) })}
                                            className="bg-gray-900 border border-gray-600 rounded-lg p-2 text-white text-sm focus:border-gold focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddChurch}
                                        disabled={!newChurch.name.trim()}
                                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-600 text-white font-bold py-2 rounded-lg text-sm transition-colors"
                                    >
                                        Criar Igreja
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Church List */}
                    <div className="space-y-3">
                        {state.locations.map(loc => (
                            <div key={loc.id} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600 transition-colors">
                                <div className="flex justify-between items-center mb-3">
                                    <p className="font-bold text-gold">{loc.name}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400 uppercase">{loc.region}</span>
                                        {state.locations.length > 1 && (
                                            <button
                                                onClick={() => removeLocation(loc.id)}
                                                className="text-red-400/50 hover:text-red-400 transition-colors p-1"
                                                aria-label="Remover igreja"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Discípulos</label>
                                        <input
                                            type="number"
                                            value={loc.disciples}
                                            onChange={e => updateBaseStats(loc.id, 'disciples', Number(e.target.value))}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white font-mono text-sm focus:border-gold focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Células</label>
                                        <input
                                            type="number"
                                            value={loc.cells}
                                            onChange={e => updateBaseStats(loc.id, 'cells', Number(e.target.value))}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white font-mono text-sm focus:border-gold focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={12} className="text-gray-500" />
                                        <input
                                            type="text"
                                            value={loc.address || ''}
                                            onChange={e => updateBaseStats(loc.id, 'address', e.target.value)}
                                            placeholder="Endereço"
                                            className="flex-1 bg-gray-900/50 border border-gray-700/50 rounded-lg p-2 text-gray-300 text-xs focus:border-gold focus:outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users size={12} className="text-gray-500" />
                                        <input
                                            type="text"
                                            value={loc.pastors || ''}
                                            onChange={e => updateBaseStats(loc.id, 'pastors', e.target.value)}
                                            placeholder="Pastores"
                                            className="flex-1 bg-gray-900/50 border border-gray-700/50 rounded-lg p-2 text-gray-300 text-xs focus:border-gold focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 6. Reset & Credits */}
                <section className="pt-8 border-t border-gray-800">
                    <button
                        onClick={handleReset}
                        className={clsx(
                            "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                            confirmReset
                                ? "bg-red-500 text-white"
                                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                        )}
                    >
                        <RotateCcw size={16} />
                        {confirmReset ? "Clique novamente para confirmar" : "Resetar Todos os Dados"}
                    </button>

                    <div className="text-center pt-8 pb-4 opacity-50">
                        <img src="/assets/ieablogo.png" alt="IEAB" className="h-12 mx-auto mb-2 brightness-200 grayscale" />
                        <p className="text-[10px] text-gray-500">Desenvolvido para Missão IEAB</p>
                        <p className="text-[10px] text-gray-600 mt-1">Sistema de Gestão Visual de Eventos</p>
                    </div>
                </section>
            </div>
        </div>
    );
};
