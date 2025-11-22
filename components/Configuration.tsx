import React, { useState, ChangeEvent } from 'react';
import { DataSource, DataSourceType, WidgetConfig, ChartType } from '../types';
import { Database, FileSpreadsheet, Plus, Trash2, Table, LayoutGrid } from 'lucide-react';
import { Button } from './ui/Button';

interface ConfigurationProps {
  dataSources: DataSource[];
  widgets: WidgetConfig[];
  onAddDataSource: (ds: DataSource) => void;
  onDeleteDataSource: (id: string) => void;
  onAddWidget: (widget: WidgetConfig) => void;
  onDeleteWidget: (id: string) => void;
}

export const Configuration: React.FC<ConfigurationProps> = ({
  dataSources,
  widgets,
  onAddDataSource,
  onDeleteDataSource,
  onAddWidget,
  onDeleteWidget
}) => {
  const [activeTab, setActiveTab] = useState<'sources' | 'widgets'>('sources');
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceType, setNewSourceType] = useState<DataSourceType>(DataSourceType.EXCEL);

  // Widget form state
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [newWidgetTitle, setNewWidgetTitle] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [selectedChartType, setSelectedChartType] = useState<ChartType>(ChartType.BAR);
  const [selectedXAxis, setSelectedXAxis] = useState('');
  const [selectedDataKeys, setSelectedDataKeys] = useState<string[]>([]);

  const handleAddSource = () => {
    if (!newSourceName) return;
    
    // Mocking a new data source with random data for the demo
    const mockData = Array.from({ length: 6 }, (_, i) => ({
      category: `Item ${i + 1}`,
      value: Math.floor(Math.random() * 1000) + 100,
      cost: Math.floor(Math.random() * 500) + 50
    }));

    const newSource: DataSource = {
      id: `src-${Date.now()}`,
      name: newSourceName,
      type: newSourceType,
      data: mockData,
      lastUpdated: new Date().toLocaleString()
    };

    onAddDataSource(newSource);
    setIsAddingSource(false);
    setNewSourceName('');
  };

  const handleAddWidget = () => {
    if (!newWidgetTitle || !selectedSourceId || !selectedXAxis || selectedDataKeys.length === 0) return;

    const newWidget: WidgetConfig = {
      id: `widget-${Date.now()}`,
      title: newWidgetTitle,
      sourceId: selectedSourceId,
      chartType: selectedChartType,
      xAxisKey: selectedXAxis,
      dataKeys: selectedDataKeys
    };

    onAddWidget(newWidget);
    setIsAddingWidget(false);
    resetWidgetForm();
  };

  const resetWidgetForm = () => {
    setNewWidgetTitle('');
    setSelectedSourceId('');
    setSelectedXAxis('');
    setSelectedDataKeys([]);
  };

  const getAvailableKeys = (sourceId: string) => {
    const source = dataSources.find(ds => ds.id === sourceId);
    if (!source || source.data.length === 0) return [];
    return Object.keys(source.data[0]);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Configuración</h2>
        <p className="text-gray-500">Gestiona tus conexiones de datos y widgets visuales</p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('sources')}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative ${
            activeTab === 'sources' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Fuentes de Datos
          {activeTab === 'sources' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></span>}
        </button>
        <button
          onClick={() => setActiveTab('widgets')}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative ${
            activeTab === 'widgets' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Widgets y Gráficos
          {activeTab === 'widgets' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></span>}
        </button>
      </div>

      {activeTab === 'sources' && (
        <div className="space-y-6">
          {!isAddingSource ? (
            <div className="flex justify-end">
              <Button onClick={() => setIsAddingSource(true)}>
                <Plus className="w-4 h-4 mr-2" /> Nueva Fuente
              </Button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-fade-in">
              <h3 className="text-lg font-semibold mb-4">Conectar nueva fuente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ej. Ventas Q1"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={newSourceType}
                    onChange={(e) => setNewSourceType(e.target.value as DataSourceType)}
                  >
                    <option value={DataSourceType.EXCEL}>Excel / CSV</option>
                    <option value={DataSourceType.GOOGLE_SHEETS}>Google Sheets</option>
                    <option value={DataSourceType.DATABASE}>Base de Datos</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setIsAddingSource(false)}>Cancelar</Button>
                <Button onClick={handleAddSource}>Guardar Conexión</Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {dataSources.map(ds => (
              <div key={ds.id} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${ds.type === DataSourceType.DATABASE ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    {ds.type === DataSourceType.DATABASE ? <Database className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{ds.name}</h4>
                    <p className="text-xs text-gray-500">Actualizado: {ds.lastUpdated} • {ds.data.length} registros</p>
                  </div>
                </div>
                <button 
                  onClick={() => onDeleteDataSource(ds.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'widgets' && (
        <div className="space-y-6">
          {!isAddingWidget ? (
            <div className="flex justify-end">
              <Button onClick={() => setIsAddingWidget(true)}>
                <Plus className="w-4 h-4 mr-2" /> Nuevo Gráfico
              </Button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Configurar Gráfico</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título del Gráfico</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      value={newWidgetTitle}
                      onChange={(e) => setNewWidgetTitle(e.target.value)}
                      placeholder="Ej. Tendencia de Ventas"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuente de Datos</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      value={selectedSourceId}
                      onChange={(e) => setSelectedSourceId(e.target.value)}
                    >
                      <option value="">Seleccionar fuente...</option>
                      {dataSources.map(ds => (
                        <option key={ds.id} value={ds.id}>{ds.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Visualización</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { type: ChartType.BAR, label: 'Barras' },
                        { type: ChartType.LINE, label: 'Línea' },
                        { type: ChartType.AREA, label: 'Área' },
                        { type: ChartType.PIE, label: 'Circular' }
                      ].map(ct => (
                        <button
                          key={ct.type}
                          onClick={() => setSelectedChartType(ct.type)}
                          className={`p-2 text-xs border rounded-lg text-center hover:bg-gray-50 ${selectedChartType === ct.type ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500' : 'border-gray-300'}`}
                        >
                          {ct.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedSourceId ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Eje X (Categoría)</label>
                        <select 
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          value={selectedXAxis}
                          onChange={(e) => setSelectedXAxis(e.target.value)}
                        >
                          <option value="">Seleccionar campo...</option>
                          {getAvailableKeys(selectedSourceId).map(key => (
                            <option key={key} value={key}>{key}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Datos a Graficar (Valores)</label>
                        <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-2">
                          {getAvailableKeys(selectedSourceId).map(key => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={selectedDataKeys.includes(key)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDataKeys([...selectedDataKeys, key]);
                                  } else {
                                    setSelectedDataKeys(selectedDataKeys.filter(k => k !== key));
                                  }
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700">{key}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed">
                      Selecciona una fuente primero
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => { setIsAddingWidget(false); resetWidgetForm(); }}>Cancelar</Button>
                <Button onClick={handleAddWidget} disabled={!selectedSourceId || !selectedXAxis || selectedDataKeys.length === 0}>
                  Crear Widget
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {widgets.map(w => (
              <div key={w.id} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center hover:shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-indigo-50 text-indigo-600">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{w.title}</h4>
                    <p className="text-xs text-gray-500">{w.chartType} • {w.dataKeys.join(', ')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onDeleteWidget(w.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
