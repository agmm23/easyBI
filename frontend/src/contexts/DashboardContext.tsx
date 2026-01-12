import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface DashboardSection {
    id: string;
    title: string;
    layout_columns?: number;
    charts: any[];
}

interface DashboardContextType {
    sections: DashboardSection[];
    loading: boolean;
    refreshSections: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [sections, setSections] = useState<DashboardSection[]>([]);
    const [loading, setLoading] = useState(true);
    const { authFetch, user } = useAuth();

    const fetchSections = () => {
        if (!user) return;
        // setLoading(true); // Optional: depends if we want to show loading on every refresh
        authFetch('http://localhost:8000/api/dashboard-config/sections')
            .then(res => res.json())
            .then(data => setSections(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (user) {
            fetchSections();
        }
    }, [user]);

    return (
        <DashboardContext.Provider value={{ sections, loading, refreshSections: fetchSections }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
