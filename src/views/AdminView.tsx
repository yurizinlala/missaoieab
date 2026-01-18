import React, { useState, useEffect } from 'react';
import { useChurchState, CommitmentEntry, CellCommitmentEntry } from '../context/ChurchContext';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Grid3X3, Plus, MapPin, Settings,
    Trash2, PlusCircle, RotateCcw, Wifi, WifiOff, Check,
    Clock, Target, ChevronDown, ChevronUp, Download, Eye, Sparkles
} from 'lucide-react';
import { showToast, broadcastToast } from '../components/Toaster';

// Debounced Input Component
const DebouncedInput = ({
    value,
    onChange,
    className,
    placeholder,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { value: string | number }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (localValue !== value && onChange) {
                onChange({ target: { value: localValue } } as React.ChangeEvent<HTMLInputElement>);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [localValue, onChange, value]);

    return (
        <input
            {...props}
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            className={className}
            placeholder={placeholder}
        />
    );
};

// PDF Export Utility
const exportToPDF = (data: any[], type: 'disciples' | 'cells', locations: any[]) => {
    const title = type === 'disciples' ? 'Lista de Discipuladores' : 'Lista de Líderes de Célula';
    const headers = type === 'disciples'
        ? ['Nome', 'Igreja', 'Discípulos']
        : ['Líder', 'Igreja', 'Células'];

    const rows = data.map(entry => {
        const locName = locations.find(l => l.id === entry.locationId)?.name || entry.locationName;
        if (type === 'disciples') {
            return [entry.name, locName, entry.amount];
        } else {
            return [entry.leaderName, locName, entry.amount];
        }
    });

    // Calculate totals per location
    const totals: Record<string, number> = {};
    data.forEach(entry => {
        const locName = locations.find(l => l.id === entry.locationId)?.name || entry.locationName;
        totals[locName] = (totals[locName] || 0) + entry.amount;
    });

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #1e293b; border-bottom: 2px solid #f59e0b; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #1e293b; color: white; padding: 12px; text-align: left; }
                td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
                tr:nth-child(even) { background: #f8fafc; }
                .summary { margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px; }
                .summary h3 { margin: 0 0 10px 0; color: #92400e; }
                .total { font-weight: bold; color: #059669; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <h1>🙏 ${title}</h1>
            <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
            <table>
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                </tbody>
            </table>
            <div class="summary">
                <h3>Resumo por Igreja</h3>
                ${Object.entries(totals).map(([loc, total]) =>
        `<p>${loc}: <span class="total">${total}</span></p>`
    ).join('')}
                <p><strong>TOTAL GERAL: <span class="total">${data.reduce((a, c) => a + c.amount, 0)}</span></strong></p>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    }
};

export const AdminView = () => {
    const {
        state,
        totalDiscipleCommitments,
        totalCellCommitments,
        discipleProgressPercent,
        cellProgressPercent,
        addDiscipleCommitment,
        removeDiscipleCommitment,
        addCellCommitment,
        removeCellCommitment,
        updateBaseStats,
        setViewMode,
        setAdminMode,
        setDiscipleGoal,
        setCellGoal,
        addLocation,
        removeLocation,
        resetState,
        isSupabaseConnected
    } = useChurchState();

    // Form state
    const [discipleForm, setDiscipleForm] = useState({ name: '', amount: 1, locationId: state.locations[0]?.id || 1 });
    const [cellForm, setCellForm] = useState({ leaderName: '', amount: 1, locationId: state.locations[0]?.id || 1 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [lastEntry, setLastEntry] = useState<{ name: string; amount: number; type: string } | null>(null);

    // UI state
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showHistory, setShowHistory] = useState(false);
    const [showAddChurch, setShowAddChurch] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [newChurch, setNewChurch] = useState({ name: '', region: '', baseDisciples: 0, baseCells: 0 });
    const [confirmReset, setConfirmReset] = useState(false);

    // Online status
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

    // Sync location selection
    useEffect(() => {
        if (state.locations.length > 0) {
            const firstId = state.locations[0].id;
            if (!state.locations.find(l => l.id === discipleForm.locationId)) {
                setDiscipleForm(f => ({ ...f, locationId: firstId }));
            }
            if (!state.locations.find(l => l.id === cellForm.locationId)) {
                setCellForm(f => ({ ...f, locationId: firstId }));
            }
        }
    }, [state.locations]);

    // Form Handlers
    const handleDiscipleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!discipleForm.name.trim() || discipleForm.amount < 1) return;

        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 200));

        addDiscipleCommitment(discipleForm.locationId, discipleForm.amount, discipleForm.name.trim());

        const churchName = state.locations.find(l => l.id === discipleForm.locationId)?.name || 'Local';
        broadcastToast(`${discipleForm.name} +${discipleForm.amount} discípulos para ${churchName}!`, 'Novo discipulador!');
        showToast("✓ Discipulador Registrado!", churchName);

        setLastEntry({ name: discipleForm.name, amount: discipleForm.amount, type: 'discípulos' });
        setSubmitSuccess(true);
        setTimeout(() => { setSubmitSuccess(false); setLastEntry(null); }, 3000);

        setDiscipleForm(f => ({ ...f, name: '', amount: 1 }));
        setIsSubmitting(false);
    };

    const handleCellSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cellForm.leaderName.trim() || cellForm.amount < 1) return;

        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 200));

        addCellCommitment(cellForm.locationId, cellForm.amount, cellForm.leaderName.trim());

        const churchName = state.locations.find(l => l.id === cellForm.locationId)?.name || 'Local';
        broadcastToast(`${cellForm.leaderName} +${cellForm.amount} células para ${churchName}!`, 'Novo líder de célula!');
        showToast("✓ Líder Registrado!", churchName);

        setLastEntry({ name: cellForm.leaderName, amount: cellForm.amount, type: 'células' });
        setSubmitSuccess(true);
        setTimeout(() => { setSubmitSuccess(false); setLastEntry(null); }, 3000);

        setCellForm(f => ({ ...f, leaderName: '', amount: 1 }));
        setIsSubmitting(false);
    };

    const handleDeleteDisciple = (entry: CommitmentEntry) => {
        if (window.confirm(`Remover ${entry.name} (+${entry.amount} discípulos)?`)) {
            removeDiscipleCommitment(entry.id);
            showToast("🗑️ Removido", `${entry.name} -${entry.amount}`);
        }
    };

    const handleDeleteCell = (entry: CellCommitmentEntry) => {
        if (window.confirm(`Remover ${entry.leaderName} (+${entry.amount} células)?`)) {
            removeCellCommitment(entry.id);
            showToast("🗑️ Removido", `${entry.leaderName} -${entry.amount}`);
        }
    };

    const handleAddChurch = () => {
        if (!newChurch.name.trim()) return;
        addLocation({
            name: newChurch.name.trim(),
            region: newChurch.region || 'Outro',
            baseDisciples: newChurch.baseDisciples,
            baseCells: newChurch.baseCells
        });
        setNewChurch({ name: '', region: '', baseDisciples: 0, baseCells: 0 });
        setShowAddChurch(false);
        showToast("Igreja Adicionada!", newChurch.name);
    };

    const handleReset = () => {
        if (confirmReset) {
            resetState();
            setConfirmReset(false);
            showToast("Resetado", "Dados restaurados");
        } else {
            setConfirmReset(true);
            setTimeout(() => setConfirmReset(false), 3000);
        }
    };

    const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const currentHistory = state.adminMode === 'disciples' ? state.discipleCommitments : state.cellCommitments;
    const currentGoal = state.adminMode === 'disciples' ? state.discipleGoal : state.cellGoal;
    const currentTotal = state.adminMode === 'disciples' ? totalDiscipleCommitments : totalCellCommitments;
    const currentProgress = state.adminMode === 'disciples' ? discipleProgressPercent : cellProgressPercent;

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sansation pb-12">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-lg border-b border-gray-800 p-4 shadow-lg">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gold to-yellow-500">
                        Missão IEAB
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className={clsx(
                            "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium",
                            isOnline && isSupabaseConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"
                        )}>
                            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                            {isSupabaseConnected ? "Sync" : "Local"}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-xl mx-auto p-4 space-y-6">

                {/* 1. Admin Mode Switch */}
                <section className="space-y-2">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Tipo de Cadastro</h2>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-800/50 rounded-2xl border border-gray-700">
                        <button
                            onClick={() => setAdminMode('disciples')}
                            className={clsx(
                                "flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300",
                                state.adminMode === 'disciples'
                                    ? "bg-blue-600 text-white shadow-lg ring-2 ring-blue-400/30"
                                    : "text-gray-400 hover:bg-gray-700"
                            )}
                        >
                            <Users className={clsx("mb-2 transition-transform", state.adminMode === 'disciples' && "scale-110")} size={28} />
                            <span className="text-sm font-bold">Discipuladores</span>
                            <span className="text-[10px] opacity-70 mt-1">{state.discipleCommitments.length} cadastros</span>
                        </button>

                        <button
                            onClick={() => setAdminMode('cells')}
                            className={clsx(
                                "flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300",
                                state.adminMode === 'cells'
                                    ? "bg-purple-600 text-white shadow-lg ring-2 ring-purple-400/30"
                                    : "text-gray-400 hover:bg-gray-700"
                            )}
                        >
                            <Grid3X3 className={clsx("mb-2 transition-transform", state.adminMode === 'cells' && "scale-110")} size={28} />
                            <span className="text-sm font-bold">Células</span>
                            <span className="text-[10px] opacity-70 mt-1">{state.cellCommitments.length} cadastros</span>
                        </button>
                    </div>
                </section>

                {/* 2. Projector Mode Switch */}
                <section className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50">
                    <div className="flex flex-col gap-2">
                        <span className="text-xs text-gray-400">Tela do Projetor:</span>
                        <div className="grid grid-cols-3 gap-1 bg-gray-900 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('atual')}
                                className={clsx(
                                    "px-2 py-2 rounded text-xs font-bold transition-all flex flex-col items-center gap-1",
                                    state.viewMode === 'atual' ? "bg-blue-600 text-white" : "text-gray-500 hover:text-white"
                                )}
                            >
                                <Eye size={14} />
                                <span>Atual</span>
                            </button>
                            <button
                                onClick={() => setViewMode('metas')}
                                className={clsx(
                                    "px-2 py-2 rounded text-xs font-bold transition-all flex flex-col items-center gap-1",
                                    state.viewMode === 'metas' ? "bg-gold text-deep-blue" : "text-gray-500 hover:text-white"
                                )}
                            >
                                <Target size={14} />
                                <span>Metas</span>
                            </button>
                            <button
                                onClick={() => setViewMode('projecao')}
                                className={clsx(
                                    "px-2 py-2 rounded text-xs font-bold transition-all flex flex-col items-center gap-1",
                                    state.viewMode === 'projecao' ? "bg-emerald-600 text-white" : "text-gray-500 hover:text-white"
                                )}
                            >
                                <Sparkles size={14} />
                                <span>Projeção</span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* 3. Goal Editor */}
                <section className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Target size={16} />
                            <span className="text-xs font-bold uppercase">
                                Meta de {state.adminMode === 'disciples' ? 'Discípulos' : 'Células'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <DebouncedInput
                                type="number"
                                value={currentGoal}
                                onChange={(e) => state.adminMode === 'disciples'
                                    ? setDiscipleGoal(Number(e.target.value))
                                    : setCellGoal(Number(e.target.value))
                                }
                                min={1}
                                className="w-20 bg-gray-900 border border-gray-600 rounded-lg px-3 py-1 text-white text-center font-bold focus:border-gold focus:outline-none"
                            />
                            <span className="text-gray-500 text-sm">{state.adminMode === 'disciples' ? 'vidas' : 'células'}</span>
                        </div>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={clsx(
                                "h-full transition-all duration-500",
                                state.adminMode === 'disciples'
                                    ? "bg-gradient-to-r from-blue-500 to-blue-400"
                                    : "bg-gradient-to-r from-purple-500 to-purple-400"
                            )}
                            style={{ width: `${Math.min(currentProgress, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">
                        {currentTotal} / {currentGoal} ({currentProgress.toFixed(1)}%)
                    </p>
                </section>

                {/* 4. PDF Export Button - SEPARATE */}
                {currentHistory.length > 0 && (
                    <section>
                        <button
                            onClick={() => exportToPDF(currentHistory, state.adminMode, state.locations)}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-gold/20 to-amber-500/20 hover:from-gold/30 hover:to-amber-500/30 border border-gold/30 rounded-xl text-gold font-bold transition-all"
                        >
                            <Download size={18} />
                            Baixar Lista de {state.adminMode === 'disciples' ? 'Discipuladores' : 'Células'} (PDF)
                        </button>
                    </section>
                )}

                {/* 5. Registration Form */}
                <section className="space-y-2">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                        {state.adminMode === 'disciples' ? 'Registrar Discipulador' : 'Registrar Líder de Célula'}
                    </h2>

                    <form
                        onSubmit={state.adminMode === 'disciples' ? handleDiscipleSubmit : handleCellSubmit}
                        className="bg-gray-800 rounded-2xl p-5 border border-gray-700 shadow-xl relative overflow-hidden"
                    >
                        <AnimatePresence>
                            {submitSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className={clsx(
                                        "absolute inset-0 backdrop-blur-md flex items-center justify-center z-50 p-6 text-center",
                                        state.adminMode === 'disciples' ? "bg-blue-600/95" : "bg-purple-600/95"
                                    )}
                                >
                                    <div className="text-white flex flex-col items-center">
                                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                                            <Check size={40} className="text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-1">Registrado!</h3>
                                        {lastEntry && (
                                            <p className="text-white/80 text-lg">
                                                <span className="font-bold">{lastEntry.name}</span><br />
                                                <span className="text-3xl font-bold text-yellow-300">+{lastEntry.amount}</span> {lastEntry.type}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4 relative z-10">
                            <input
                                type="text"
                                value={state.adminMode === 'disciples' ? discipleForm.name : cellForm.leaderName}
                                onChange={e => state.adminMode === 'disciples'
                                    ? setDiscipleForm({ ...discipleForm, name: e.target.value })
                                    : setCellForm({ ...cellForm, leaderName: e.target.value })
                                }
                                placeholder={state.adminMode === 'disciples' ? "Nome do Discipulador" : "Nome do Líder de Célula"}
                                maxLength={50}
                                className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                                required
                            />

                            <div className="grid grid-cols-[1fr,2fr] gap-3">
                                <div className="bg-gray-900 rounded-xl border border-gray-600 flex items-center px-3">
                                    <span className="text-gray-500 text-xs mr-2">Qtd:</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={state.adminMode === 'disciples' ? discipleForm.amount : cellForm.amount}
                                        onChange={e => {
                                            const val = Math.min(100, Math.max(1, Number(e.target.value)));
                                            state.adminMode === 'disciples'
                                                ? setDiscipleForm({ ...discipleForm, amount: val })
                                                : setCellForm({ ...cellForm, amount: val });
                                        }}
                                        className="w-full bg-transparent text-white text-lg font-bold focus:outline-none py-3"
                                    />
                                </div>

                                <div className="relative">
                                    <select
                                        value={state.adminMode === 'disciples' ? discipleForm.locationId : cellForm.locationId}
                                        onChange={e => {
                                            const id = Number(e.target.value);
                                            state.adminMode === 'disciples'
                                                ? setDiscipleForm({ ...discipleForm, locationId: id })
                                                : setCellForm({ ...cellForm, locationId: id });
                                        }}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white appearance-none focus:outline-none focus:border-gold transition-all"
                                    >
                                        {state.locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {[1, 2, 3, 5].map(val => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => state.adminMode === 'disciples'
                                            ? setDiscipleForm({ ...discipleForm, amount: val })
                                            : setCellForm({ ...cellForm, amount: val })
                                        }
                                        className={clsx(
                                            "flex-1 py-2 rounded-lg text-xs font-bold transition-colors",
                                            (state.adminMode === 'disciples' ? discipleForm.amount : cellForm.amount) === val
                                                ? (state.adminMode === 'disciples' ? "bg-blue-500 text-white" : "bg-purple-500 text-white")
                                                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                                        )}
                                    >
                                        +{val}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={clsx(
                                    "w-full font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95",
                                    isSubmitting ? "bg-gray-600 cursor-wait" : "bg-emerald-500 hover:bg-emerald-400"
                                )}
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Plus size={24} />
                                        Confirmar
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </section>

                {/* 6. History (ALL entries) */}
                <section className="space-y-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="w-full flex items-center justify-between text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <h2 className="text-xs font-bold uppercase tracking-widest">
                                Histórico de {state.adminMode === 'disciples' ? 'Discipuladores' : 'Células'}
                            </h2>
                            <span className="bg-gray-700 px-2 py-0.5 rounded text-[10px]">{currentHistory.length}</span>
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
                                <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-3 max-h-96 overflow-y-auto space-y-2">
                                    {currentHistory.length === 0 ? (
                                        <p className="text-gray-500 text-sm text-center py-4">Nenhum registro ainda</p>
                                    ) : (
                                        currentHistory.map((entry: any) => (
                                            <div key={entry.id} className="flex items-center justify-between text-sm bg-gray-900/50 rounded-lg px-3 py-2">
                                                <div>
                                                    <span className="text-white font-medium">
                                                        {state.adminMode === 'disciples' ? entry.name : entry.leaderName}
                                                    </span>
                                                    <span className={clsx(
                                                        "font-bold ml-2",
                                                        state.adminMode === 'disciples' ? "text-blue-400" : "text-purple-400"
                                                    )}>+{entry.amount}</span>
                                                    <span className="text-gray-500 ml-2 text-xs">{entry.locationName}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-500 text-xs">{formatTime(entry.timestamp)}</span>
                                                    <button
                                                        onClick={() => state.adminMode === 'disciples'
                                                            ? handleDeleteDisciple(entry)
                                                            : handleDeleteCell(entry)
                                                        }
                                                        className="text-gray-600 hover:text-red-400 transition-colors p-1"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* 7. Church Configuration (Collapsible) */}
                <section className="space-y-4 pt-4 border-t border-gray-800">
                    <button
                        onClick={() => setShowConfig(!showConfig)}
                        className="w-full flex items-center justify-between text-gray-400 hover:text-gray-200"
                    >
                        <div className="flex items-center gap-2">
                            <Settings size={16} />
                            <h2 className="text-xs font-bold uppercase tracking-widest">Configuração das Bases</h2>
                        </div>
                        {showConfig ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <AnimatePresence>
                        {showConfig && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-4"
                            >
                                {/* Add Church Button */}
                                <button
                                    onClick={() => setShowAddChurch(!showAddChurch)}
                                    className="flex items-center gap-1 text-xs text-gold hover:text-yellow-400 transition-colors"
                                >
                                    <PlusCircle size={14} />
                                    Adicionar Igreja
                                </button>

                                {/* New Church Form */}
                                <AnimatePresence>
                                    {showAddChurch && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-3"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Nome da Igreja"
                                                value={newChurch.name}
                                                onChange={e => setNewChurch({ ...newChurch, name: e.target.value })}
                                                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white text-sm focus:border-gold focus:outline-none"
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="Discípulos atuais"
                                                    value={newChurch.baseDisciples}
                                                    onChange={e => setNewChurch({ ...newChurch, baseDisciples: Number(e.target.value) })}
                                                    className="bg-gray-900 border border-gray-600 rounded-lg p-2 text-white text-sm focus:border-gold focus:outline-none"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Células atuais"
                                                    value={newChurch.baseCells}
                                                    onChange={e => setNewChurch({ ...newChurch, baseCells: Number(e.target.value) })}
                                                    className="bg-gray-900 border border-gray-600 rounded-lg p-2 text-white text-sm focus:border-gold focus:outline-none"
                                                />
                                            </div>
                                            <button
                                                onClick={handleAddChurch}
                                                disabled={!newChurch.name.trim()}
                                                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-600 text-white font-bold py-2 rounded-lg text-sm"
                                            >
                                                Criar Igreja
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Church List */}
                                <div className="space-y-3">
                                    {state.locations.map(loc => (
                                        <div key={loc.id} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600 transition-colors">
                                            <div className="flex justify-between items-center mb-3">
                                                <p className="font-bold text-gold">{loc.name}</p>
                                                {state.locations.length > 1 && (
                                                    <button
                                                        onClick={() => removeLocation(loc.id)}
                                                        className="text-red-400/50 hover:text-red-400 transition-colors p-1"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Discípulos (atual)</label>
                                                    <DebouncedInput
                                                        type="number"
                                                        value={loc.baseDisciples}
                                                        onChange={(e) => updateBaseStats(loc.id, 'baseDisciples', Number(e.target.value))}
                                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white font-mono text-sm focus:border-gold focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Células (atual)</label>
                                                    <DebouncedInput
                                                        type="number"
                                                        value={loc.baseCells}
                                                        onChange={(e) => updateBaseStats(loc.id, 'baseCells', Number(e.target.value))}
                                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white font-mono text-sm focus:border-gold focus:outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={12} className="text-gray-500" />
                                                    <DebouncedInput
                                                        type="text"
                                                        value={loc.address || ''}
                                                        onChange={(e) => updateBaseStats(loc.id, 'address', e.target.value)}
                                                        placeholder="Endereço"
                                                        className="flex-1 bg-gray-900/50 border border-gray-700/50 rounded-lg p-2 text-gray-300 text-xs focus:border-gold focus:outline-none"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users size={12} className="text-gray-500" />
                                                    <DebouncedInput
                                                        type="text"
                                                        value={loc.pastors || ''}
                                                        onChange={(e) => updateBaseStats(loc.id, 'pastors', e.target.value)}
                                                        placeholder="Pastores"
                                                        className="flex-1 bg-gray-900/50 border border-gray-700/50 rounded-lg p-2 text-gray-300 text-xs focus:border-gold focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* 8. Reset */}
                <section className="pt-8 border-t border-gray-800">
                    <button
                        onClick={handleReset}
                        className={clsx(
                            "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                            confirmReset ? "bg-red-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        )}
                    >
                        <RotateCcw size={16} />
                        {confirmReset ? "Confirmar Reset" : "Resetar Dados"}
                    </button>

                    <div className="text-center pt-8 pb-4 opacity-50">
                        <img src="/assets/ieablogo.png" alt="IEAB" className="h-12 mx-auto mb-2 brightness-200 grayscale" />
                        <p className="text-[10px] text-gray-500">Missão IEAB 2026</p>
                    </div>
                </section>
            </div>
        </div>
    );
};
