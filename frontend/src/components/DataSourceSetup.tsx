import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Database, Save, Trash2, Link } from 'lucide-react';

export function DataSourceSetup() {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<any>(null);
    const [uploadedFile, setUploadedFile] = useState<string | null>(null);

    // Google Sheets State
    const [sheetUrl, setSheetUrl] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [selectedType, setSelectedType] = useState<'upload' | 'google_sheets'>('upload');

    // Form State
    const [sourceName, setSourceName] = useState('');
    const [description, setDescription] = useState('');

    // Data Sources List
    const [datasources, setDatasources] = useState<any[]>([]);

    useEffect(() => {
        fetchDatasources();
    }, []);

    const fetchDatasources = () => {
        fetch('http://localhost:8000/api/datasources/')
            .then(res => res.json())
            .then(data => setDatasources(data))
            .catch(err => console.error(err));
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const response = await fetch('http://localhost:8000/api/upload/', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            setPreview(data.preview);
            setUploadedFile(data.filename);
            setSourceName(file.name.split('.')[0]);
            setSelectedType('upload');
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleConnectSheet = async () => {
        if (!sheetUrl) return;
        setConnecting(true);
        try {
            const response = await fetch('http://localhost:8000/api/datasources/preview-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: sheetUrl, type: 'google_sheets' })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Failed to connect');
            }

            const data = await response.json();
            setPreview(data.preview);
            setSourceName('Google Sheet Data');
            setDescription('Imported from Public Google Sheet');
        } catch (error: any) {
            console.error('Connection failed:', error);
            alert(`Connection failed: ${error.message}`);
        } finally {
            setConnecting(false);
        }
    };

    const handleSaveSource = async () => {
        if (!sourceName) return;
        if (selectedType === 'upload' && !uploadedFile) return;
        if (selectedType === 'google_sheets' && !sheetUrl) return;

        try {
            const payload = {
                name: sourceName,
                description: description,
                type: selectedType === 'upload' ? 'csv' : 'google_sheets',
                path: selectedType === 'upload' ? `uploads/${uploadedFile}` : sheetUrl,
                columns: preview?.columns || []
            };

            const response = await fetch('http://localhost:8000/api/datasources/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                setPreview(null);
                setUploadedFile(null);
                setSheetUrl('');
                setSourceName('');
                setDescription('');
                fetchDatasources();
            } else {
                alert('Failed to save data source');
            }
        } catch (error) {
            console.error(error);
            alert('Error saving data source');
        }
    };

    const handleDeleteSource = async (id: string) => {
        if (!confirm("Are you sure? This might break dashboard charts relying on this source.")) return;
        try {
            await fetch(`http://localhost:8000/api/datasources/${id}`, { method: 'DELETE' });
            fetchDatasources();
        } catch (err) { console.error(err) }
    };

    return (
        <div className="space-y-8">
            {/* Upload Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Data Source</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4">
                        {/* Option 1: File Upload */}
                        <div
                            onClick={() => setSelectedType('upload')}
                            className={`p-4 rounded-xl border transition-colors cursor-pointer group text-center ${selectedType === 'upload' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                        >
                            <div className="mx-auto w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                <FileSpreadsheet className="w-5 h-5 text-green-700" />
                            </div>
                            <h3 className="font-medium text-gray-900 text-sm">Excel / CSV</h3>
                            <div className="mt-2">
                                <label className="inline-block text-xs font-medium text-indigo-700 hover:underline cursor-pointer">
                                    {uploading ? 'Uploading...' : 'Click to Upload'}
                                    <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} disabled={uploading} />
                                </label>
                            </div>
                        </div>

                        {/* Option 2: Google Sheets */}
                        <div
                            onClick={() => { setSelectedType('google_sheets'); setPreview(null); }}
                            className={`p-4 rounded-xl border transition-colors cursor-pointer group text-center ${selectedType === 'google_sheets' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                        >
                            <div className="mx-auto w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                <Link className="w-5 h-5 text-green-700" />
                            </div>
                            <h3 className="font-medium text-gray-900 text-sm">Google Sheets</h3>
                            <p className="text-xs text-gray-500 mt-1">Public Link</p>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                        {selectedType === 'google_sheets' && !preview && (
                            <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300">
                                <h4 className="font-medium text-gray-900 mb-2">Enter Google Sheet URL</h4>
                                <p className="text-sm text-gray-500 mb-4">Make sure the sheet is accessible to "Anyone with the link".</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                        value={sheetUrl}
                                        onChange={(e) => setSheetUrl(e.target.value)}
                                    />
                                    <button
                                        onClick={handleConnectSheet}
                                        disabled={connecting || !sheetUrl}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                                    >
                                        {connecting ? 'Connecting...' : 'Connect'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {preview ? (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Source Name</label>
                                    <input
                                        type="text"
                                        value={sourceName}
                                        onChange={(e) => setSourceName(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={2}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Columns Detected</p>
                                    <div className="flex flex-wrap gap-2">
                                        {preview.columns.map((col: string) => (
                                            <span key={col} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600">
                                                {col}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => { setPreview(null); setUploadedFile(null); setSheetUrl(''); }}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveSource}
                                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Data Source
                                    </button>
                                </div>
                            </div>
                        ) : (
                            selectedType === 'upload' && (
                                <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 min-h-[200px]">
                                    <p>Upload a file to configure details</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Existing Data Sources */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Data Sources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {datasources.map(ds => (
                        <div key={ds.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        {ds.type === 'database' ? <Database className="w-5 h-5 text-blue-600" /> :
                                            ds.type === 'google_sheets' ? <Link className="w-5 h-5 text-green-600" /> :
                                                <FileSpreadsheet className="w-5 h-5 text-green-600" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{ds.name}</h4>
                                        <p className="text-xs text-gray-500">{ds.columns.length} columns</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteSource(ds.id)}
                                    className="p-1 text-gray-300 hover:text-red-500 transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            {ds.description && (
                                <p className="mt-4 text-sm text-gray-600 line-clamp-2">{ds.description}</p>
                            )}
                            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-1">
                                {ds.columns.slice(0, 3).map((col: string) => (
                                    <span key={col} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">
                                        {col}
                                    </span>
                                ))}
                                {ds.columns.length > 3 && <span className="text-[10px] text-gray-400">+{ds.columns.length - 3} more</span>}
                            </div>
                        </div>
                    ))}
                    {datasources.length === 0 && (
                        <div className="col-span-full py-10 text-center text-gray-400">
                            No data sources found. Upload one or connect a Sheet to get started.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
