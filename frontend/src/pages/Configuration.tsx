import React, { useState } from 'react';
import { DataSourceSetup } from '../components/DataSourceSetup';
import { DashboardSetup } from '../components/DashboardSetup';
import { LayoutGrid, Database } from 'lucide-react';
import { cn } from '../lib/utils';

export function Configuration() {
    const [activeTab, setActiveTab] = useState<'data' | 'dashboard'>('data');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
                <p className="text-gray-500">Manage data sources and dashboard layout.</p>
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
                    Data Sources
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
                    Dashboard Setup
                </button>
            </div>

            <div className="mt-6">
                {activeTab === 'data' ? <DataSourceSetup /> : <DashboardSetup />}
            </div>
        </div>
    );
}
