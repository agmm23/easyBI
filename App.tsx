import React, { useState } from 'react';
import { LayoutDashboard, Settings, Sparkles, BarChart3 } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Configuration } from './components/Configuration';
import { GeminiInsights } from './components/GeminiInsights';
import { INITIAL_DATA_SOURCES } from './constants';
import { DataSource, WidgetConfig, ChartType } from './types';

// Initial widgets setup
const INITIAL_WIDGETS: WidgetConfig[] = [
  {
    id: 'w-001',
    title: 'Tendencia de Ventas y Beneficios',
    sourceId: 'src-001',
    chartType: ChartType.AREA,
    xAxisKey: 'month',
    dataKeys: ['sales', 'profit']
  },
  {
    id: 'w-002',
    title: 'Distribución de Ventas',
    sourceId: 'src-001',
    chartType: ChartType.PIE,
    xAxisKey: 'month',
    dataKeys: ['sales']
  },
  {
    id: 'w-003',
    title: 'Valor de Inventario por Categoría',
    sourceId: 'src-002',
    chartType: ChartType.BAR,
    xAxisKey: 'category',
    dataKeys: ['value']
  }
];

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'config' | 'insights'>('dashboard');
  const [dataSources, setDataSources] = useState<DataSource[]>(INITIAL_DATA_SOURCES);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(INITIAL_WIDGETS);

  const handleAddDataSource = (newSource: DataSource) => {
    setDataSources([...dataSources, newSource]);
  };

  const handleDeleteDataSource = (id: string) => {
    setDataSources(dataSources.filter(ds => ds.id !== id));
    // Remove widgets associated with deleted source
    setWidgets(widgets.filter(w => w.sourceId !== id));
  };

  const handleAddWidget = (newWidget: WidgetConfig) => {
    setWidgets([...widgets, newWidget]);
  };

  const handleDeleteWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 fixed h-full z-20 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-indigo-600">
            <BarChart3 className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight text-gray-900">SimpleBI</span>
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === 'dashboard' 
                ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Panel Principal
          </button>
          
          <button
            onClick={() => setCurrentView('insights')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === 'insights' 
                ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            IA Insights
          </button>

          <button
            onClick={() => setCurrentView('config')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === 'config' 
                ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Settings className="w-5 h-5" />
            Configuración
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-4 text-white">
            <h4 className="font-bold text-sm mb-1">Plan Pro</h4>
            <p className="text-xs text-indigo-100 mb-3">Accede a análisis predictivos avanzados.</p>
            <button className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg w-full transition-colors font-medium">
              Mejorar Plan
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-gray-200 z-30 px-4 h-16 flex items-center justify-between">
         <div className="flex items-center gap-2 text-indigo-600">
            <BarChart3 className="w-6 h-6" />
            <span className="text-lg font-bold text-gray-900">SimpleBI</span>
          </div>
          {/* Simple mobile menu trigger - simplified for demo */}
          <div className="flex gap-4">
             <button onClick={() => setCurrentView('dashboard')} className={currentView === 'dashboard' ? 'text-indigo-600' : 'text-gray-500'}>
               <LayoutDashboard className="w-6 h-6"/>
             </button>
             <button onClick={() => setCurrentView('insights')} className={currentView === 'insights' ? 'text-indigo-600' : 'text-gray-500'}>
               <Sparkles className="w-6 h-6"/>
             </button>
             <button onClick={() => setCurrentView('config')} className={currentView === 'config' ? 'text-indigo-600' : 'text-gray-500'}>
               <Settings className="w-6 h-6"/>
             </button>
          </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {currentView === 'dashboard' && (
            <Dashboard 
              widgets={widgets} 
              dataSources={dataSources} 
              onAddWidget={() => setCurrentView('config')} 
            />
          )}
          {currentView === 'config' && (
            <Configuration 
              dataSources={dataSources}
              widgets={widgets}
              onAddDataSource={handleAddDataSource}
              onDeleteDataSource={handleDeleteDataSource}
              onAddWidget={handleAddWidget}
              onDeleteWidget={handleDeleteWidget}
            />
          )}
          {currentView === 'insights' && (
            <div className="h-full">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Análisis Inteligente</h2>
                <p className="text-gray-500">Consulta a Gemini sobre el estado de tu negocio</p>
              </div>
              <GeminiInsights dataSources={dataSources} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
