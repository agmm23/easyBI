import { useState } from 'react';
import { DataSourceSetup } from '../components/DataSourceSetup';
import { DashboardSetup } from '../components/DashboardSetup';
import { LayoutGrid, Database, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

export function Configuration() {
    const [activeTab, setActiveTab] = useState<'data' | 'dashboard' | 'general'>('data');
    const { language, setLanguage, t } = useLanguage();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('config.title')}</h2>
                <p className="text-gray-500">{t('config.subtitle')}</p>
            </div>

            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('data')}
                    className={cn(
                        "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all",
                        activeTab === 'data'
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-900"
                    )}
                >
                    <Database className="w-4 h-4 mr-2" />
                    {t('config.tab.data')}
                </button>
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={cn(
                        "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all",
                        activeTab === 'dashboard'
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-900"
                    )}
                >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    {t('config.tab.dashboard')}
                </button>
                <button
                    onClick={() => setActiveTab('general')}
                    className={cn(
                        "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all",
                        activeTab === 'general'
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-900"
                    )}
                >
                    <Globe className="w-4 h-4 mr-2" />
                    {t('config.tab.general')}
                </button>
            </div>

            <div className="mt-6">
                {activeTab === 'data' && <DataSourceSetup />}
                {activeTab === 'dashboard' && <DashboardSetup />}
                {activeTab === 'general' && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('config.general.title')}</h3>
                        <div className="max-w-xs">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('config.general.language')}
                            </label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="en">English</option>
                                <option value="es">Español</option>
                            </select>
                            <p className="mt-2 text-sm text-gray-500">{t('config.general.selectLanguage')}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
