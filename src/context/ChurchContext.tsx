import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { broadcastToast } from '../components/Toaster';

// Types
export interface Location {
    id: number;
    name: string;
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

interface ChurchState {
    goal: number;
    locations: Location[];
    totalDisciples: number;
    viewMode: 'reality' | 'construction';
    commitmentHistory: CommitmentEntry[];
}

interface ChurchContextType {
    state: ChurchState;
    // Computed values
    totalVidas: number;
    totalCelulas: number;
    progressPercent: number;
    isSupabaseConnected: boolean;
    // Actions
    addCommitment: (locationId: number, amount: number, name: string) => void;
    updateBaseStats: (locationId: number, field: keyof Location, value: number | string) => void;
    setViewMode: (mode: 'reality' | 'construction') => void;
    setGoal: (goal: number) => void;
    addLocation: (location: Omit<Location, 'id'>) => void;
    removeLocation: (id: number) => void;
    resetState: () => void;
    refreshState: () => void;
}

// Initial Data
const INITIAL_STATE: ChurchState = {
    goal: 80,
    totalDisciples: 0,
    viewMode: 'reality',
    commitmentHistory: [],
    locations: [
        {
            id: 1,
            name: "Igreja Sede",
            disciples: 150,
            cells: 45,
            region: "Main",
            fullName: "IEAB Sede Internacional",
            address: "Rua Exemplo, 123 - Centro",
            pastors: "Pr. Presidente & Pra. Exemplo"
        },
        {
            id: 2,
            name: "Congregação Zona Norte",
            disciples: 50,
            cells: 15,
            region: "North",
            fullName: "IEAB Zona Norte",
            address: "Av. Norte, 456 - Bairro",
            pastors: "Pr. Local"
        },
        {
            id: 3,
            name: "Congregação Transformação",
            disciples: 30,
            cells: 8,
            region: "East",
            fullName: "IEAB Transformação",
            address: "Rua Leste, 789 - Bairro",
            pastors: "Pr. Local 2"
        }
    ]
};

const STORAGE_KEY = 'missao-ieab-state';
const TOAST_KEY = 'missao-latest-toast';

const ChurchContext = createContext<ChurchContextType | undefined>(undefined);

export const ChurchProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<ChurchState>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        // If we have saved data, start with it for faster paint
        return saved ? { ...INITIAL_STATE, ...JSON.parse(saved) } : INITIAL_STATE;
    });

    const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

    // Memoized computed values
    const totalVidas = useMemo(() =>
        state.locations.reduce((acc, curr) => acc + curr.disciples, 0),
        [state.locations]
    );

    const totalCelulas = useMemo(() =>
        state.locations.reduce((acc, curr) => acc + curr.cells, 0),
        [state.locations]
    );

    const progressPercent = useMemo(() =>
        Math.min((state.totalDisciples / state.goal) * 100, 100),
        [state.totalDisciples, state.goal]
    );

    // Sync LOCAL (fallback)
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    // Sync SUPABASE (Cloud)
    useEffect(() => {
        if (!supabase) {
            console.warn("Supabase not configured. Falling back to local/tab sync only.");
            return;
        }

        // 1. Initial Fetch
        const fetchCloudState = async () => {
            try {
                const { data, error } = await supabase
                    .from('app_state')
                    .select('data')
                    .eq('id', 1)
                    .single();

                if (data && data.data) {
                    setState({ ...INITIAL_STATE, ...data.data });
                    setIsSupabaseConnected(true);
                } else if (error && error.code === 'PGRST116') {
                    // Row doesn't exist, create it with current state
                    await supabase.from('app_state').insert({ id: 1, data: state });
                    setIsSupabaseConnected(true);
                }
            } catch (err) {
                console.error("Failed to sync with Supabase:", err);
            }
        };

        fetchCloudState();

        // 2. Realtime Subscription
        const channel = supabase
            .channel('app_state_changes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_state', filter: 'id=eq.1' },
                (payload) => {
                    if (payload.new && payload.new.data) {
                        // Received update from cloud
                        setState(prev => {
                            // Determine if we need to trigger a toast (hacky diff check or use explicit toast channel)
                            // For simplicity, we assume toast logic handled by the triggering client separately via broadcast
                            return payload.new.data;
                        });
                    }
                })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') setIsSupabaseConnected(true);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Sync Helper: Push to Cloud
    const pushToCloud = async (newState: ChurchState) => {
        if (supabase) {
            // Optimistic update locally is already handled by state setter
            // Fire and forget update to DB
            await supabase.from('app_state').upsert({ id: 1, data: newState, updated_at: new Date().toISOString() });
        }
    };

    const addCommitment = useCallback((locationId: number, amount: number, name: string) => {
        setState(prev => {
            const location = prev.locations.find(l => l.id === locationId);
            const newLocations = prev.locations.map(loc => {
                if (loc.id === locationId) {
                    return { ...loc, disciples: loc.disciples + amount };
                }
                return loc;
            });

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
                totalDisciples: prev.totalDisciples + amount,
                locations: newLocations,
                commitmentHistory: [newEntry, ...prev.commitmentHistory].slice(0, 50)
            };

            pushToCloud(newState);
            return newState;
        });
    }, []);

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

    const setViewMode = useCallback((mode: 'reality' | 'construction') => {
        setState(prev => {
            const newState = { ...prev, viewMode: mode };
            pushToCloud(newState);
            return newState;
        });
    }, []);

    const setGoal = useCallback((goal: number) => {
        setState(prev => {
            const newState = { ...prev, goal: Math.max(1, goal) };
            pushToCloud(newState);
            return newState;
        });
    }, []);

    const addLocation = useCallback((location: Omit<Location, 'id'>) => {
        setState(prev => {
            const maxId = Math.max(...prev.locations.map(l => l.id), 0);
            const newState = {
                ...prev,
                locations: [...prev.locations, { ...location, id: maxId + 1 }]
            };
            pushToCloud(newState);
            return newState;
        });
    }, []);

    const removeLocation = useCallback((id: number) => {
        setState(prev => {
            const newState = {
                ...prev,
                locations: prev.locations.filter(l => l.id !== id)
            };
            pushToCloud(newState);
            return newState;
        });
    }, []);

    const resetState = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOAST_KEY);
        const newState = INITIAL_STATE;
        setState(newState);
        pushToCloud(newState);
    }, []);

    const refreshState = useCallback(() => {
        // Force Fetch
        if (supabase) {
            supabase.from('app_state').select('data').eq('id', 1).single()
                .then(({ data }) => {
                    if (data && data.data) setState(data.data);
                });
        }
    }, []);

    return (
        <ChurchContext.Provider value={{
            state,
            totalVidas,
            totalCelulas,
            progressPercent,
            isSupabaseConnected,
            addCommitment,
            updateBaseStats,
            setViewMode,
            setGoal,
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
