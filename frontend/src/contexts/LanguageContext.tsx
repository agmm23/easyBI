import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
    en: {
        'nav.aiAnalyst': 'AI Analyst',
        'nav.configuration': 'Configuration',
        'nav.dashboards': 'Dashboards',
        'nav.noGroups': 'No groups yet',
        'config.title': 'Configuration',
        'config.subtitle': 'Manage data sources and dashboard layout.',
        'config.tab.data': 'Data Sources',
        'config.tab.dashboard': 'Dashboard Setup',
        'config.tab.general': 'General',
        'config.general.title': 'General Settings',
        'config.general.language': 'Language',
        'config.general.selectLanguage': 'Select interface language',
        'ai.title': 'AI Analyst',
        'ai.subtitle': 'Ask questions about your data and get instant insights.',
        'ai.inputPlaceholder': 'Ask a question about your data...',
        'ai.analyzing': 'Analyzing data...',
        'ai.error': 'An error occurred',
        'dashboard.loading': 'Loading dashboard...',
        'dashboard.error': 'Error loading dashboard',
        'dashboard.empty': 'Dashboard Empty',
        'dashboard.noSections': "You haven't configured any sections yet.",
        'dashboard.configure': 'Configure Dashboard',
        'dashboard.groupNotFound': 'Group Not Found',
        'dashboard.selectGroup': 'Please select a dashboard from the sidebar.',
        'dashboard.view': 'Dashboard View',
        'dashboard.groupBy': 'Group By:',
        'dashboard.dateRange': 'Date Range:',
        'dashboard.noCharts': 'No charts in this group yet.',
        'period.all': 'All Time',
        'period.last_week': 'Last Week',
        'period.last_month': 'Last Month',
        'period.last_3_months': 'Last 3 Months',
        'period.last_6_months': 'Last 6 Months',
        'period.last_year': 'Last Year',
        'period.ytd': 'Year to Date',
        'period.custom': 'Custom',
        'period.day': 'Day',
        'period.week': 'Week',
        'period.month': 'Month',
        'common.start': 'Start Date',
        'common.end': 'End Date',
        'common.clear': 'Clear',
        'common.to': 'to',
    },
    es: {
        'nav.aiAnalyst': 'Analista IA',
        'nav.configuration': 'Configuración',
        'nav.dashboards': 'Tableros',
        'nav.noGroups': 'Sin grupos aún',
        'config.title': 'Configuración',
        'config.subtitle': 'Gestiona fuentes de datos y diseño del tablero.',
        'config.tab.data': 'Fuentes de Datos',
        'config.tab.dashboard': 'Configurar Tablero',
        'config.tab.general': 'General',
        'config.general.title': 'Configuración General',
        'config.general.language': 'Idioma',
        'config.general.selectLanguage': 'Seleccionar idioma de la interfaz',
        'ai.title': 'Analista IA',
        'ai.subtitle': 'Haz preguntas sobre tus datos y obtén insights instantáneos.',
        'ai.inputPlaceholder': 'Haz una pregunta sobre tus datos...',
        'ai.analyzing': 'Analizando datos...',
        'ai.error': 'Ocurrió un error',
        'dashboard.loading': 'Cargando tablero...',
        'dashboard.error': 'Error cargando tablero',
        'dashboard.empty': 'Tablero Vacío',
        'dashboard.noSections': "No has configurado ninguna sección aún.",
        'dashboard.configure': 'Configurar Tablero',
        'dashboard.groupNotFound': 'Grupo No Encontrado',
        'dashboard.selectGroup': 'Por favor selecciona un tablero de la barra lateral.',
        'dashboard.view': 'Vista de Tablero',
        'dashboard.groupBy': 'Agrupar Por:',
        'dashboard.dateRange': 'Rango de Fechas:',
        'dashboard.noCharts': 'No hay gráficos en este grupo aún.',
        'period.all': 'Todo el tiempo',
        'period.last_week': 'Última semana',
        'period.last_month': 'Último mes',
        'period.last_3_months': 'Últimos 3 meses',
        'period.last_6_months': 'Últimos 6 meses',
        'period.last_year': 'Último año',
        'period.ytd': 'Año actual',
        'period.custom': 'Personalizado',
        'period.day': 'Día',
        'period.week': 'Semana',
        'period.month': 'Mes',
        'common.start': 'Fecha Inicio',
        'common.end': 'Fecha Fin',
        'common.clear': 'Limpiar',
        'common.to': 'a',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('language');
        return (saved === 'en' || saved === 'es') ? saved : 'en';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
