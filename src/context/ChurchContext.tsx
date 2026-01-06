import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';

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
    // Computed values (memoized)
    totalVidas: number;
    totalCelulas: number;
    progressPercent: number;
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
        if (saved) {
            const parsed = JSON.parse(saved);
            // Ensure commitmentHistory exists for backwards compatibility
            return { ...INITIAL_STATE, ...parsed, commitmentHistory: parsed.commitmentHistory || [] };
        }
        return INITIAL_STATE;
    });

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

    // Persist to localStorage whenever state changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    // Listen for storage changes (Cross-tab sync)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                setState(JSON.parse(e.newValue));
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

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

            return {
                ...prev,
                totalDisciples: prev.totalDisciples + amount,
                locations: newLocations,
                commitmentHistory: [newEntry, ...prev.commitmentHistory].slice(0, 50) // Keep last 50
            };
        });
    }, []);

    const updateBaseStats = useCallback((locationId: number, field: keyof Location, value: number | string) => {
        setState(prev => ({
            ...prev,
            locations: prev.locations.map(loc =>
                loc.id === locationId ? { ...loc, [field]: value } : loc
            )
        }));
    }, []);

    const setViewMode = useCallback((mode: 'reality' | 'construction') => {
        setState(prev => ({ ...prev, viewMode: mode }));
    }, []);

    const setGoal = useCallback((goal: number) => {
        setState(prev => ({ ...prev, goal: Math.max(1, goal) }));
    }, []);

    const addLocation = useCallback((location: Omit<Location, 'id'>) => {
        setState(prev => {
            const maxId = Math.max(...prev.locations.map(l => l.id), 0);
            return {
                ...prev,
                locations: [...prev.locations, { ...location, id: maxId + 1 }]
            };
        });
    }, []);

    const removeLocation = useCallback((id: number) => {
        setState(prev => ({
            ...prev,
            locations: prev.locations.filter(l => l.id !== id)
        }));
    }, []);

    const resetState = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOAST_KEY);
        setState(INITIAL_STATE);
    }, []);

    const refreshState = useCallback(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setState(JSON.parse(saved));
    }, []);

    return (
        <ChurchContext.Provider value={{
            state,
            totalVidas,
            totalCelulas,
            progressPercent,
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
