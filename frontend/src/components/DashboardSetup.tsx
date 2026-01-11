import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Layout, Settings, Grid, Square } from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';

export function DashboardSetup() {
    const [datasources, setDatasources] = useState<any[]>([]);
    const { sections, refreshSections } = useDashboard();

    // New Section State
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [newSectionColumns, setNewSectionColumns] = useState(2); // Default to 2

    // New Chart State (per section form)
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [chartTitle, setChartTitle] = useState('');
    const [selectedSource, setSelectedSource] = useState('');
    const [chartType, setChartType] = useState('bar');
    const [xColumn, setXColumn] = useState('');
    const [yColumn, setYColumn] = useState('');
    const [yColumn2, setYColumn2] = useState('');
    const [dateColumn, setDateColumn] = useState('');
    const [availableColumns, setAvailableColumns] = useState<string[]>([]);

    // Breakdown State
    const [breakdownColumn, setBreakdownColumn] = useState('');
    const [breakdownType, setBreakdownType] = useState('bar');
    const [breakdownColumn2, setBreakdownColumn2] = useState('');
    const [breakdownType2, setBreakdownType2] = useState('bar');

    useEffect(() => {
        fetch('http://localhost:8000/api/datasources/')
            .then(res => res.json())
            .then(data => setDatasources(data));
        // No need to fetch sections, context does it
    }, []);

    useEffect(() => {
        if (selectedSource) {
            const source = datasources.find(d => d.id === selectedSource);
            if (source) {
                const cols = source.columns || [];
                setAvailableColumns(cols);

                // Heuristic: Auto-select date column
                const dateKeywords = ['date', 'fecha', 'time', 'year', 'month', 'day', 'año', 'mes', 'dia'];
                const foundDateCol = cols.find(col =>
                    dateKeywords.some(keyword => col.toLowerCase().includes(keyword))
                );

                if (foundDateCol) {
                    setXColumn(foundDateCol);
                    setDateColumn(foundDateCol);
                } else {
                    setXColumn('');
                    setDateColumn('');
                }
                setYColumn('');
                setYColumn2('');
            }
        } else {
            setAvailableColumns([]);
        }
    }, [selectedSource, datasources]);

    const handleCreateSection = async () => {
        if (!newSectionTitle) return;
        try {
            const response = await fetch('http://localhost:8000/api/dashboard-config/sections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newSectionTitle,
                    layout_columns: newSectionColumns
                })
            });
            if (response.ok) {
                setNewSectionTitle('');
                setNewSectionColumns(2);
                refreshSections();
            }
        } catch (err) { console.error(err); }
    };

    const handleUpdateSectionLayout = async (sectionId: string, columns: number) => {
        try {
            const response = await fetch(`http://localhost:8000/api/dashboard-config/sections/${sectionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    layout_columns: columns
                })
            });
            if (response.ok) {
                refreshSections();
            }
        } catch (err) { console.error(err); }
    };

    const handleAddChart = async (sectionId: string) => {
        if (!chartTitle || !selectedSource || !xColumn || !yColumn) {
            alert("Please fill all chart fields");
            return;
        }
        try {
            const response = await fetch(`http://localhost:8000/api/dashboard-config/sections/${sectionId}/charts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: chartTitle,
                    datasource_id: selectedSource,
                    chart_type: chartType,
                    x_column: xColumn,
                    y_column: yColumn,
                    y_column_2: yColumn2 || null,
                    chart_type_2: chartType,
                    date_column: dateColumn,
                    breakdown_x_column: breakdownColumn || null,
                    breakdown_chart_type: breakdownType,
                    breakdown_x_column_2: breakdownColumn2 || null,
                    breakdown_chart_type_2: breakdownType2
                })
            });
            if (response.ok) {
                setEditingSectionId(null);
                setChartTitle('');
                setSelectedSource('');
                setBreakdownColumn('');
                setYColumn2('');
                setBreakdownColumn2('');
                refreshSections();
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteSection = async (id: string) => {
        if (!confirm("Are you sure you want to delete this section and all its charts?")) return;
        try {
            await fetch(`http://localhost:8000/api/dashboard-config/sections/${id}`, { method: 'DELETE' });
            refreshSections();
        } catch (err) { console.error(err); }
    };

    const handleDeleteChart = async (sectionId: string, chartId: string) => {
        try {
            await fetch(`http://localhost:8000/api/dashboard-config/sections/${sectionId}/charts/${chartId}`, { method: 'DELETE' });
            refreshSections();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="space-y-8">
            {/* Create Section Form */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Dashboard Group</h3>
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Group Title</label>
                        <input
                            type="text"
                            value={newSectionTitle}
                            onChange={(e) => setNewSectionTitle(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border h-10"
                            placeholder="e.g. Sales, Operations"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Charts per Row</label>
                        <select
                            value={newSectionColumns}
                            onChange={(e) => setNewSectionColumns(Number(e.target.value))}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white h-10"
                        >
                            <option value={1}>1 Chart (Full Width)</option>
                            <option value={2}>2 Charts (Half Width)</option>
                        </select>
                    </div>
                    <button
                        onClick={handleCreateSection}
                        className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium h-[42px]"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Group
                    </button>
                </div>
            </div>

            {/* List Sections */}
            <div className="space-y-6">
                {sections.map(section => (
                    <div key={section.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                                <h4 className="text-xl font-bold text-gray-900 flex items-center">
                                    <Layout className="w-5 h-5 mr-2 text-indigo-600" />
                                    {section.title}
                                </h4>
                                <div className="flex items-center bg-white rounded-md border border-gray-200 p-1">
                                    <button
                                        onClick={() => handleUpdateSectionLayout(section.id, 1)}
                                        className={`p-1.5 rounded ${section.layout_columns === 1 ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                        title="1 Chart per Row"
                                    >
                                        <Square className="w-4 h-4" />
                                    </button>
                                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                    <button
                                        onClick={() => handleUpdateSectionLayout(section.id, 2)}
                                        className={`p-1.5 rounded ${!section.layout_columns || section.layout_columns === 2 ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                        title="2 Charts per Row"
                                    >
                                        <Grid className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDeleteSection(section.id)}
                                className="text-red-500 hover:text-red-700 text-sm flex items-center"
                            >
                                <Trash2 className="w-4 h-4 mr-1" /> Delete Group
                            </button>
                        </div>

                        {/* Charts List */}
                        <div className={`grid grid-cols-1 ${(!section.layout_columns || section.layout_columns === 2) ? 'md:grid-cols-2' : ''} gap-4 mb-4`}>
                            {section.charts?.map((chart: any) => (
                                <div key={chart.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative group">
                                    <h5 className="font-semibold text-gray-800">{chart.title}</h5>
                                    <p className="text-xs text-gray-500 mt-1">{chart.chart_type} • {chart.x_column} vs {chart.y_column}</p>
                                    <button
                                        onClick={() => handleDeleteChart(section.id, chart.id)}
                                        className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded transition opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {/* Add Chart Card */}
                            {!editingSectionId && (
                                <button
                                    onClick={() => setEditingSectionId(section.id)}
                                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-gray-500 hover:text-indigo-600 h-full min-h-[100px]"
                                >
                                    <Plus className="w-8 h-8 mb-2" />
                                    <span className="font-medium">Add Chart</span>
                                </button>
                            )}
                        </div>

                        {/* Add Chart Form */}
                        {editingSectionId === section.id && (
                            <div className="bg-white p-6 rounded-lg border border-indigo-100 shadow-inner mt-4 animate-in fade-in slide-in-from-top-2">
                                <h5 className="font-semibold text-gray-900 mb-4">New Chart for {section.title}</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        value={chartTitle}
                                        onChange={(e) => setChartTitle(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border h-10"
                                        placeholder="Chart Title"
                                    />
                                    <select
                                        value={selectedSource}
                                        onChange={(e) => setSelectedSource(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border h-10"
                                    >
                                        <option value="">Select Data Source...</option>
                                        {datasources.map(ds => (
                                            <option key={ds.id} value={ds.id}>{ds.name}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={chartType}
                                        onChange={(e) => setChartType(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border h-10"
                                    >
                                        <option value="bar">Bar Chart</option>
                                        <option value="line">Line Chart</option>
                                        <option value="area">Area Chart</option>
                                    </select>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={xColumn}
                                            onChange={(e) => setXColumn(e.target.value)}
                                            className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border h-10"
                                        >
                                            <option value="">X Axis...</option>
                                            {availableColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                        </select>
                                        <select
                                            value={yColumn}
                                            onChange={(e) => setYColumn(e.target.value)}
                                            className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border h-10"
                                        >
                                            <option value="">Y Axis...</option>
                                            {availableColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                        </select>
                                        {/* Spacer for X axis column */}
                                        <div></div>
                                        <select
                                            value={yColumn2}
                                            onChange={(e) => setYColumn2(e.target.value)}
                                            className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border h-10"
                                        >
                                            <option value="">Y Axis 2 (Optional)...</option>
                                            {availableColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-full">
                                        <select
                                            value={dateColumn}
                                            onChange={(e) => setDateColumn(e.target.value)}
                                            className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                                        >
                                            <option value="">Date Column (Optional for filtering)...</option>
                                            {availableColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                        </select>
                                    </div>

                                    <div className="col-span-full border-t pt-4 mt-2">
                                        <h6 className="text-sm font-medium text-gray-700 mb-2">Breakdown 1 Configuration (Optional)</h6>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <select
                                                value={breakdownColumn}
                                                onChange={(e) => setBreakdownColumn(e.target.value)}
                                                className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                                            >
                                                <option value="">No Breakdown...</option>
                                                {availableColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                            </select>
                                            <select
                                                value={breakdownType}
                                                onChange={(e) => setBreakdownType(e.target.value)}
                                                className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                                                disabled={!breakdownColumn}
                                            >
                                                <option value="bar">Bar Chart</option>
                                                <option value="line">Line Chart</option>
                                                <option value="area">Area Chart</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="col-span-full border-t pt-4 mt-2">
                                        <h6 className="text-sm font-medium text-gray-700 mb-2">Breakdown 2 Configuration (Optional - Cascading)</h6>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <select
                                                value={breakdownColumn2}
                                                onChange={(e) => setBreakdownColumn2(e.target.value)}
                                                className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                                                disabled={!breakdownColumn}
                                            >
                                                <option value="">No Second Breakdown...</option>
                                                {availableColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                            </select>
                                            <select
                                                value={breakdownType2}
                                                onChange={(e) => setBreakdownType2(e.target.value)}
                                                className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                                                disabled={!breakdownColumn2}
                                            >
                                                <option value="bar">Bar Chart</option>
                                                <option value="line">Line Chart</option>
                                                <option value="area">Area Chart</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end space-x-2">
                                    <button
                                        onClick={() => setEditingSectionId(null)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleAddChart(section.id)}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                                    >
                                        Add Chart
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {sections.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No dashboard sections configured.</p>
                )}
            </div>
        </div>

    );
}

