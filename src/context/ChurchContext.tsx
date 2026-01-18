import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Types
export interface Location {
    id: number;
    name: string;
    // Base values (Situação Atual)
    baseDisciples: number;
    baseCells: number;
    // Computed totals (Base + Commitments) - for Situação Futura
    disciples: number;
    cells: number;
    region: string;
    fullName?: string;
    address?: string;
    pastors?: string;
}

export interface CommitmentEntry {
    id: string;
    name: string;
    amount: number;
    locationId: number;
    locationName: string;
    timestamp: number;
}

export interface CellCommitmentEntry {
    id: string;
    leaderName: string;
    amount: number;
    locationId: number;
    locationName: string;
    timestamp: number;
}

interface ChurchState {
    discipleGoal: number;
    cellGoal: number;
    locations: Location[];
    viewMode: 'atual' | 'metas' | 'projecao';
    adminMode: 'disciples' | 'cells';
    discipleCommitments: CommitmentEntry[];
    cellCommitments: CellCommitmentEntry[];
}

interface ChurchContextType {
    state: ChurchState;
    // Computed values - Atual (base)
    totalVidasAtual: number;
    totalCelulasAtual: number;
    // Computed values - Commitments only (for goal progress)
    totalDiscipleCommitments: number;
    totalCellCommitments: number;
    // Computed values - Futuro (base + commitments)
    totalVidasFuturo: number;
    totalCelulasFuturo: number;
    // Progress (commitments only toward goals)
    discipleProgressPercent: number;
    cellProgressPercent: number;
    isSupabaseConnected: boolean;
    // Actions - Disciples
    addDiscipleCommitment: (locationId: number, amount: number, name: string) => void;
    removeDiscipleCommitment: (id: string) => void;
    // Actions - Cells
    addCellCommitment: (locationId: number, amount: number, leaderName: string) => void;
    removeCellCommitment: (id: string) => void;
    // Actions - General
    updateBaseStats: (locationId: number, field: keyof Location, value: number | string) => void;
    setViewMode: (mode: 'atual' | 'metas' | 'projecao') => void;
    setAdminMode: (mode: 'disciples' | 'cells') => void;
    setDiscipleGoal: (goal: number) => void;
    setCellGoal: (goal: number) => void;
    addLocation: (location: Omit<Location, 'id' | 'disciples' | 'cells'>) => void;
    removeLocation: (id: number) => void;
    resetState: () => void;
    refreshState: () => void;
}

// Initial Data
const INITIAL_STATE: ChurchState = {
    discipleGoal: 80,
    cellGoal: 20,
    viewMode: 'atual',
    adminMode: 'disciples',
    discipleCommitments: [],
    cellCommitments: [],
    locations: [
        {
            id: 1,
            name: "Igreja Sede",
            baseDisciples: 20,
            baseCells: 8,
            disciples: 20,
            cells: 8,
            region: "Sede",
            fullName: "IEAB Sede Natal",
            address: "Rua Monte Rei, 1161",
            pastors: "Pr. Evandilson Paiva & Pra. Fátima Paiva"
        },
        {
            id: 2,
            name: "Zona Norte",
            baseDisciples: 12,
            baseCells: 3,
            disciples: 12,
            cells: 3,
            region: "Norte",
            fullName: "IEAB Zona Norte",
            address: "Rua Artesão Dary Miranda, 1038",
            pastors: "Pb. Rubens Inácio"
        },
        {
            id: 3,
            name: "Transformação",
            baseDisciples: 7,
            baseCells: 1,
            disciples: 7,
            cells: 1,
            region: "Leste",
            fullName: "Congregação Transformação",
            address: "Rua dos Bobos, 0",
            pastors: "Miss. Elionete Pereira"
        }
    ]
};

const STORAGE_KEY = 'missao-ieab-state-v2';

const ChurchContext = createContext<ChurchContextType | undefined>(undefined);

// Helper: Migrate old state to new structure
const migrateState = (oldState: any): ChurchState => {
    if (oldState.discipleGoal !== undefined) {
        // Already new format
        return { ...INITIAL_STATE, ...oldState };
    }

    // Migrate from old format
    const migrated: ChurchState = {
        discipleGoal: oldState.goal || 80,
        cellGoal: 20,
        viewMode: 'atual',
        adminMode: 'disciples',
        discipleCommitments: oldState.commitmentHistory || [],
        cellCommitments: [],
        locations: (oldState.locations || INITIAL_STATE.locations).map((loc: any) => ({
            ...loc,
            baseDisciples: loc.disciples || loc.baseDisciples || 0,
            baseCells: loc.cells || loc.baseCells || 0,
            disciples: loc.disciples || 0,
            cells: loc.cells || 0
        }))
    };

    return migrated;
};

export const ChurchProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<ChurchState>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return migrateState(JSON.parse(saved));
        }
        // Try old key
        const oldSaved = localStorage.getItem('missao-ieab-state');
        if (oldSaved) {
            return migrateState(JSON.parse(oldSaved));
        }
        return INITIAL_STATE;
    });

    const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

    // Computed values - Atual (base only)
    const totalVidasAtual = useMemo(() =>
        state.locations.reduce((acc, curr) => acc + curr.baseDisciples, 0),
        [state.locations]
    );

    const totalCelulasAtual = useMemo(() =>
        state.locations.reduce((acc, curr) => acc + curr.baseCells, 0),
        [state.locations]
    );

    // Computed values - Commitments only (for goals)
    const totalDiscipleCommitments = useMemo(() =>
        state.discipleCommitments.reduce((acc, c) => acc + c.amount, 0),
        [state.discipleCommitments]
    );

    const totalCellCommitments = useMemo(() =>
        state.cellCommitments.reduce((acc, c) => acc + c.amount, 0),
        [state.cellCommitments]
    );

    // Computed values - Futuro (base + commitments)
    const totalVidasFuturo = useMemo(() =>
        totalVidasAtual + totalDiscipleCommitments,
        [totalVidasAtual, totalDiscipleCommitments]
    );

    const totalCelulasFuturo = useMemo(() =>
        totalCelulasAtual + totalCellCommitments,
        [totalCelulasAtual, totalCellCommitments]
    );

    // Progress percentages (based on COMMITMENTS ONLY toward goals, no cap)
    const discipleProgressPercent = useMemo(() =>
        (totalDiscipleCommitments / state.discipleGoal) * 100,
        [totalDiscipleCommitments, state.discipleGoal]
    );

    const cellProgressPercent = useMemo(() =>
        (totalCellCommitments / state.cellGoal) * 100,
        [totalCellCommitments, state.cellGoal]
    );

    // Sync LOCAL
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    // Sync SUPABASE
    useEffect(() => {
        if (!supabase) return;

        const db = supabase;

        const fetchCloudState = async () => {
            if (!db) return;
            try {
                const { data, error } = await db
                    .from('app_state')
                    .select('data')
                    .eq('id', 1)
                    .single();

                if (data && data.data) {
                    setState(migrateState(data.data));
                    setIsSupabaseConnected(true);
                } else if (error && error.code === 'PGRST116') {
                    await db.from('app_state').insert({ id: 1, data: state });
                    setIsSupabaseConnected(true);
                }
            } catch (err) {
                console.error("Failed to sync:", err);
            }
        };

        fetchCloudState();

        const channel = db
            .channel('app_state_changes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_state', filter: 'id=eq.1' },
                (payload) => {
                    if (payload.new && payload.new.data) {
                        setState(() => migrateState(payload.new.data));
                    }
                })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') setIsSupabaseConnected(true);
            });

        return () => {
            db.removeChannel(channel);
        };
    }, []);

    const pushToCloud = async (newState: ChurchState) => {
        if (supabase) {
            await supabase.from('app_state').upsert({ id: 1, data: newState, updated_at: new Date().toISOString() });
        }
    };

    // === DISCIPLE ACTIONS ===
    const addDiscipleCommitment = useCallback((locationId: number, amount: number, name: string) => {
        setState(prev => {
            const location = prev.locations.find(l => l.id === locationId);

            const newEntry: CommitmentEntry = {
                id: Date.now().toString(),
                name,
                amount,
                locationId,
                locationName: location?.name || 'Desconhecido',
                timestamp: Date.now()
            };

            const newState = {
                ...prev,
                discipleCommitments: [newEntry, ...prev.discipleCommitments]
            };

            pushToCloud(newState);
            return newState;
        });
    }, []);

    const removeDiscipleCommitment = useCallback((id: string) => {
        setState(prev => {
            const newState = {
                ...prev,
                discipleCommitments: prev.discipleCommitments.filter(c => c.id !== id)
            };
            pushToCloud(newState);
            return newState;
        });
    }, []);

    // === CELL ACTIONS ===
    const addCellCommitment = useCallback((locationId: number, amount: number, leaderName: string) => {
        setState(prev => {
            const location = prev.locations.find(l => l.id === locationId);

            const newEntry: CellCommitmentEntry = {
                id: Date.now().toString(),
                leaderName,
                amount,
                locationId,
                locationName: location?.name || 'Desconhecido',
                timestamp: Date.now()
            };

            const newState = {
                ...prev,
                cellCommitments: [newEntry, ...prev.cellCommitments]
            };

            pushToCloud(newState);
            return newState;
        });
    }, []);

    const removeCellCommitment = useCallback((id: string) => {
        setState(prev => {
            const newState = {
                ...prev,
                cellCommitments: prev.cellCommitments.filter(c => c.id !== id)
            };
            pushToCloud(newState);
            return newState;
        });
    }, []);

    // === GENERAL ACTIONS ===
    const updateBaseStats = useCallback((locationId: number, field: keyof Location, value: number | string) => {
        setState(prev => {
            const newState = {
                ...prev,
                locations: prev.locations.map(loc =>
                    loc.id === locationId ? { ...loc, [field]: value } : loc
                )
            };
            pushToCloud(newState);
            return newState;
        });
    }, []);

    const setViewMode = useCallback((mode: 'atual' | 'metas' | 'projecao') => {
        setState(prev => {
            const newState = { ...prev, viewMode: mode };
            pushToCloud(newState);
            return newState;
        });
    }, []);

    const setAdminMode = useCallback((mode: 'disciples' | 'cells') => {
        setState(prev => {
            const newState = { ...prev, adminMode: mode };
            pushToCloud(newState);
            return newState;
        });
    }, []);

    const setDiscipleGoal = useCallback((goal: number) => {
        setState(prev => {
            const newState = { ...prev, discipleGoal: Math.max(1, goal) };
            pushToCloud(newState);
            return newState;
        });
    }, []);

    const setCellGoal = useCallback((goal: number) => {
        setState(prev => {
            const newState = { ...prev, cellGoal: Math.max(1, goal) };
            pushToCloud(newState);
            return newState;
        });
    }, []);

    const addLocation = useCallback((location: Omit<Location, 'id' | 'disciples' | 'cells'>) => {
        setState(prev => {
            const maxId = Math.max(...prev.locations.map(l => l.id), 0);
            const newLocation: Location = {
                ...location,
                id: maxId + 1,
                disciples: location.baseDisciples,
                cells: location.baseCells
            };
            const newState = {
                ...prev,
                locations: [...prev.locations, newLocation]
            };
            pushToCloud(newState);
            return newState;
        });
    }, []);

    const removeLocation = useCallback((id: number) => {
        setState(prev => {
            const newState = {
                ...prev,
                locations: prev.locations.filter(l => l.id !== id),
                // Also remove commitments for this location
                discipleCommitments: prev.discipleCommitments.filter(c => c.locationId !== id),
                cellCommitments: prev.cellCommitments.filter(c => c.locationId !== id)
            };
            pushToCloud(newState);
            return newState;
        });
    }, []);

    const resetState = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('missao-ieab-state');
        const newState = INITIAL_STATE;
        setState(newState);
        pushToCloud(newState);
    }, []);

    const refreshState = useCallback(() => {
        if (supabase) {
            supabase.from('app_state').select('data').eq('id', 1).single()
                .then(({ data }) => {
                    if (data && data.data) setState(migrateState(data.data));
                });
        }
    }, []);

    return (
        <ChurchContext.Provider value={{
            state,
            totalVidasAtual,
            totalCelulasAtual,
            totalDiscipleCommitments,
            totalCellCommitments,
            totalVidasFuturo,
            totalCelulasFuturo,
            discipleProgressPercent,
            cellProgressPercent,
            isSupabaseConnected,
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
            refreshState
        }}>
            {children}
        </ChurchContext.Provider>
    );
};

export const useChurchState = () => {
    const context = useContext(ChurchContext);
    if (context === undefined) {
        throw new Error('useChurchState must be used within a ChurchProvider');
    }
    return context;
};
