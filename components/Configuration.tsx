
import React, { useState, useRef } from 'react';
import { DataSource, DataSourceType, WidgetConfig, ChartType, DashboardSection, DataPoint } from '../types';
import { Database, FileSpreadsheet, Plus, Trash2, LayoutGrid, FolderPlus, Layers, Upload, Sheet, Server } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface ConfigurationProps {
  dataSources: DataSource[];
  widgets: WidgetConfig[];
  sections: DashboardSection[];
  onAddDataSource: (ds: DataSource) => void;
  onDeleteDataSource: (id: string) => void;
  onAddWidget: (widget: WidgetConfig) => void;
  onDeleteWidget: (id: string) => void;
  onAddSection: (section: DashboardSection) => void;
  onDeleteSection: (id: string) => void;
}

export const Configuration: React.FC<ConfigurationProps> = ({
  dataSources,
  widgets,
  sections,
  onAddDataSource,
  onDeleteDataSource,
  onAddWidget,
  onDeleteWidget,
  onAddSection,
  onDeleteSection
}) => {
  const [activeTab, setActiveTab] = useState<'sources' | 'widgets' | 'sections'>('sources');
  
  // Source form state
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSourceType, setNewSourceType] = useState<DataSourceType>(DataSourceType.EXCEL);
  const [sourceName, setSourceName] = useState('');
  
  // Excel/File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // DB State
  const [dbConfig, setDbConfig] = useState({ host: 'localhost', port: '5432', user: '', password: '', database: '' });
  
  // Sheets State
  const [sheetConfig, setSheetConfig] = useState({ sheetId: '', range: 'Sheet1!A1:Z100' });

  // Section form state
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');

  // Widget form state
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [newWidgetTitle, setNewWidgetTitle] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedChartType, setSelectedChartType] = useState<ChartType>(ChartType.BAR);
  const [selectedXAxis, setSelectedXAxis] = useState('');
  const [selectedDataKeys, setSelectedDataKeys] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Source Handlers ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      if (!sourceName) {
        setSourceName(e.target.files[0].name.split('.')[0]);
      }
    }
  };

  const parseCSV = (text: string): DataPoint[] => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const result: DataPoint[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(',');
      if (currentLine.length === headers.length) {
        const obj: DataPoint = {};
        headers.forEach((header, index) => {
          const val = currentLine[index].trim();
          // Try to convert to number if possible
          const num = Number(val);
          obj[header] = isNaN(num) ? val : num;
        });
        result.push(obj);
      }
    }
    return result;
  };

  const handleAddSource = async () => {
    if (!sourceName) return;
    
    let parsedData: DataPoint[] = [];
    let configDetails: any = {};
    const currentYear = new Date().getFullYear();

    // 1. Handle EXCEL / CSV
    if (newSourceType === DataSourceType.EXCEL) {
      if (!selectedFile) {
        alert("Por favor selecciona un archivo.");
        return;
      }
      configDetails = { fileName: selectedFile.name };
      
      // Basic CSV parsing
      if (selectedFile.name.endsWith('.csv')) {
        const text = await selectedFile.text();
        parsedData = parseCSV(text);
      } else {
        // Mock for binary excel since we don't have xlsx library here
        // We generate dates so filters work
        parsedData = Array.from({ length: 5 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (4 - i)); // Last 5 months
            const monthName = d.toLocaleString('es-ES', { month: 'short' });
            return {
              Mes: monthName.charAt(0).toUpperCase() + monthName.slice(1),
              date: d.toISOString().split('T')[0],
              Ventas: Math.floor(Math.random() * 5000) + 1000,
              Gastos: Math.floor(Math.random() * 3000) + 500
            };
        });
      }
    } 
    // 2. Handle DATABASE
    else if (newSourceType === DataSourceType.DATABASE) {
      if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
        alert("Por favor completa los campos de conexión.");
        return;
      }
      configDetails = { ...dbConfig };
      // Mock DB Data
      parsedData = [
        { id: 1, producto: 'Producto A', stock: 120, precio: 45, date: new Date().toISOString().split('T')[0] },
        { id: 2, producto: 'Producto B', stock: 80, precio: 32, date: new Date().toISOString().split('T')[0] },
        { id: 3, producto: 'Producto C', stock: 200, precio: 15, date: new Date().toISOString().split('T')[0] },
        { id: 4, producto: 'Producto D', stock: 45, precio: 120, date: new Date().toISOString().split('T')[0] },
      ];
    } 
    // 3. Handle GOOGLE SHEETS
    else if (newSourceType === DataSourceType.GOOGLE_SHEETS) {
       if (!sheetConfig.sheetId) {
        alert("Por favor ingresa el ID de la hoja.");
        return;
      }
      configDetails = { ...sheetConfig };
      // Mock Sheets Data
      parsedData = [
        { region: 'Norte', clientes: 150, satisfaccion: 4.5, date: new Date().toISOString().split('T')[0] },
        { region: 'Sur', clientes: 120, satisfaccion: 4.2, date: new Date().toISOString().split('T')[0] },
        { region: 'Este', clientes: 200, satisfaccion: 4.8, date: new Date().toISOString().split('T')[0] },
        { region: 'Oeste', clientes: 90, satisfaccion: 3.9, date: new Date().toISOString().split('T')[0] },
      ];
    }

    const newSource: DataSource = {
      id: `src-${Date.now()}`,
      name: sourceName,
      type: newSourceType,
      data: parsedData,
      lastUpdated: new Date().toLocaleString(),
      config: configDetails
    };

    onAddDataSource(newSource);
    setIsAddingSource(false);
    resetSourceForm();
  };

  const resetSourceForm = () => {
    setSourceName('');
    setSelectedFile(null);
    setDbConfig({ host: 'localhost', port: '5432', user: '', password: '', database: '' });
    setSheetConfig({ sheetId: '', range: 'Sheet1!A1:Z100' });
  };

  // --- Section Handlers ---

  const handleAddSection = () => {
    if (!newSectionTitle) return;

    const newSection: DashboardSection = {
      id: `sec-${Date.now()}`,
      title: newSectionTitle,
      description: newSectionDesc || 'Sección personalizada'
    };

    onAddSection(newSection);
    setIsAddingSection(false);
    setNewSectionTitle('');
    setNewSectionDesc('');
  };

  // --- Widget Handlers ---

  const handleAddWidget = () => {
    if (!newWidgetTitle || !selectedSourceId || !selectedSectionId || !selectedXAxis || selectedDataKeys.length === 0) return;

    const newWidget: WidgetConfig = {
      id: `widget-${Date.now()}`,
      title: newWidgetTitle,
      sourceId: selectedSourceId,
      sectionId: selectedSectionId,
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
        <p className="text-gray-500">Gestiona secciones, conexiones de datos y visualizaciones</p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('sections')}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${
            activeTab === 'sections' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          1. Estructura (Secciones)
          {activeTab === 'sections' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></span>}
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${
            activeTab === 'sources' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          2. Conexiones (Backend)
          {activeTab === 'sources' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></span>}
        </button>
        <button
          onClick={() => setActiveTab('widgets')}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${
            activeTab === 'widgets' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          3. Gráficos
          {activeTab === 'widgets' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></span>}
        </button>
      </div>

      {/* --- SECTIONS TAB --- */}
      {activeTab === 'sections' && (
        <div className="space-y-6 animate-fade-in">
          {!isAddingSection ? (
            <div className="flex justify-end">
              <Button onClick={() => setIsAddingSection(true)}>
                <FolderPlus className="w-4 h-4 mr-2" /> Nueva Sección
              </Button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Crear nueva sección</h3>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <Input 
                  label="Título de la Sección" 
                  placeholder="Ej. Flujo de Caja, Clientes..." 
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                />
                <Input 
                  label="Descripción (Opcional)" 
                  placeholder="Breve descripción de lo que contiene esta sección" 
                  value={newSectionDesc}
                  onChange={(e) => setNewSectionDesc(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setIsAddingSection(false)}>Cancelar</Button>
                <Button onClick={handleAddSection}>Guardar Sección</Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {sections.map(s => (
              <div key={s.id} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{s.title}</h4>
                    <p className="text-xs text-gray-500">{s.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {widgets.filter(w => w.sectionId === s.id).length} gráficos activos
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => onDeleteSection(s.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- DATA SOURCES TAB --- */}
      {activeTab === 'sources' && (
        <div className="space-y-6 animate-fade-in">
          {!isAddingSource ? (
            <div className="flex justify-end">
              <Button onClick={() => setIsAddingSource(true)}>
                <Plus className="w-4 h-4 mr-2" /> Nueva Fuente
              </Button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Conectar Backend / Datos</h3>
              
              {/* Common Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Select 
                  label="Tipo de Origen"
                  value={newSourceType}
                  onChange={(e) => setNewSourceType(e.target.value as DataSourceType)}
                  options={[
                    { value: DataSourceType.EXCEL, label: 'Archivo Excel / CSV' },
                    { value: DataSourceType.GOOGLE_SHEETS, label: 'Google Sheets' },
                    { value: DataSourceType.DATABASE, label: 'Base de Datos (SQL)' }
                  ]}
                />
                <Input 
                  label="Nombre de la Fuente"
                  placeholder="Ej. Ventas Q1"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                />
              </div>

              {/* Dynamic Connection Forms */}
              <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 mb-6">
                
                {newSourceType === DataSourceType.EXCEL && (
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 text-green-700 mb-2">
                        <FileSpreadsheet className="w-5 h-5" />
                        <span className="font-medium">Subida de Archivos</span>
                     </div>
                     <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 transition-colors bg-white"
                        onClick={() => fileInputRef.current?.click()}
                     >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 font-medium">{selectedFile ? selectedFile.name : "Haz clic para subir .xlsx o .csv"}</p>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept=".csv,.xlsx" 
                          onChange={handleFileChange}
                        />
                     </div>
                     <p className="text-xs text-gray-500">Nota: Para esta demo, sube un archivo .csv simple.</p>
                  </div>
                )}

                {newSourceType === DataSourceType.GOOGLE_SHEETS && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                        <Sheet className="w-5 h-5" />
                        <span className="font-medium">Configuración Google Sheets</span>
                     </div>
                    <Input 
                      label="Spreadsheet ID" 
                      placeholder="Ej. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" 
                      value={sheetConfig.sheetId}
                      onChange={(e) => setSheetConfig({...sheetConfig, sheetId: e.target.value})}
                    />
                    <Input 
                      label="Rango (Opcional)" 
                      placeholder="Sheet1!A1:Z100" 
                      value={sheetConfig.range}
                      onChange={(e) => setSheetConfig({...sheetConfig, range: e.target.value})}
                    />
                    <Button variant="secondary" className="w-full" size="sm" onClick={() => alert("Simulando autenticación OAuth...")}>
                      Autenticar con Google
                    </Button>
                  </div>
                )}

                {newSourceType === DataSourceType.DATABASE && (
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <Server className="w-5 h-5" />
                        <span className="font-medium">Credenciales Base de Datos</span>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Input 
                          label="Host" 
                          placeholder="localhost" 
                          value={dbConfig.host}
                          onChange={(e) => setDbConfig({...dbConfig, host: e.target.value})}
                        />
                        <Input 
                          label="Puerto" 
                          placeholder="5432" 
                          value={dbConfig.port}
                          onChange={(e) => setDbConfig({...dbConfig, port: e.target.value})}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Input 
                          label="Usuario" 
                          placeholder="admin" 
                          value={dbConfig.user}
                          onChange={(e) => setDbConfig({...dbConfig, user: e.target.value})}
                        />
                        <Input 
                          label="Contraseña" 
                          type="password" 
                          placeholder="••••••" 
                          value={dbConfig.password}
                          onChange={(e) => setDbConfig({...dbConfig, password: e.target.value})}
                        />
                     </div>
                     <Input 
                        label="Nombre Base de Datos" 
                        placeholder="mi_empresa_db" 
                        value={dbConfig.database}
                        onChange={(e) => setDbConfig({...dbConfig, database: e.target.value})}
                     />
                  </div>
                )}
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
                  <div className={`p-3 rounded-full ${ds.type === DataSourceType.DATABASE ? 'bg-blue-100 text-blue-600' : ds.type === DataSourceType.GOOGLE_SHEETS ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                    {ds.type === DataSourceType.DATABASE && <Database className="w-5 h-5" />}
                    {ds.type === DataSourceType.GOOGLE_SHEETS && <Sheet className="w-5 h-5" />}
                    {ds.type === DataSourceType.EXCEL && <FileSpreadsheet className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{ds.name}</h4>
                    <p className="text-xs text-gray-500">
                      {ds.type} • {ds.data.length} registros
                    </p>
                    {ds.config && (
                      <p className="text-xs text-gray-400 font-mono mt-1">
                        {ds.type === DataSourceType.DATABASE ? `${ds.config.host}:${ds.config.port}/${ds.config.database}` : ''}
                        {ds.type === DataSourceType.EXCEL ? ds.config.fileName : ''}
                      </p>
                    )}
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

      {/* --- WIDGETS TAB --- */}
      {activeTab === 'widgets' && (
        <div className="space-y-6 animate-fade-in">
          {!isAddingWidget ? (
            <div className="flex justify-end">
              <Button onClick={() => setIsAddingWidget(true)}>
                <Plus className="w-4 h-4 mr-2" /> Nuevo Gráfico
              </Button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Configurar Gráfico</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <Input 
                    label="Título del Gráfico"
                    placeholder="Ej. Tendencia de Ventas"
                    value={newWidgetTitle}
                    onChange={(e) => setNewWidgetTitle(e.target.value)}
                  />
                  
                  <Select 
                    label="Ubicación (Sección)"
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    options={[
                      { value: '', label: 'Seleccionar sección...' },
                      ...sections.map(s => ({ value: s.id, label: s.title }))
                    ]}
                  />

                  <Select 
                    label="Fuente de Datos"
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    options={[
                      { value: '', label: 'Seleccionar fuente...' },
                      ...dataSources.map(ds => ({ value: ds.id, label: ds.name }))
                    ]}
                  />

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
                          className={`p-2 text-xs border rounded-lg text-center hover:bg-gray-50 transition-all ${selectedChartType === ct.type ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500' : 'border-gray-300 text-gray-600'}`}
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
                      <Select 
                        label="Eje X (Categoría)"
                        value={selectedXAxis}
                        onChange={(e) => setSelectedXAxis(e.target.value)}
                        options={[
                          { value: '', label: 'Seleccionar campo...' },
                          ...getAvailableKeys(selectedSourceId).map(key => ({ value: key, label: key }))
                        ]}
                      />
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Datos a Graficar (Valores)</label>
                        <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-2 bg-gray-50">
                          {getAvailableKeys(selectedSourceId).map(key => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
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
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <Layers className="w-8 h-8 mb-2 opacity-20" />
                      Selecciona una fuente primero
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => { setIsAddingWidget(false); resetWidgetForm(); }}>Cancelar</Button>
                <Button onClick={handleAddWidget} disabled={!selectedSourceId || !selectedSectionId || !selectedXAxis || selectedDataKeys.length === 0}>
                  Crear Widget
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {widgets.map(w => {
               const section = sections.find(s => s.id === w.sectionId);
               return (
                <div key={w.id} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-indigo-50 text-indigo-600">
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{w.title}</h4>
                      <div className="flex flex-col text-xs text-gray-500">
                        <span>Sección: <span className="font-semibold text-indigo-600">{section?.title || 'Sin asignar'}</span></span>
                        <span>{w.chartType} • {w.dataKeys.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => onDeleteWidget(w.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
