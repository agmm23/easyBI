import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardChartProps {
    chart: any;
    timeGrouping?: string;
    startDate?: string;
    endDate?: string;
    className?: string;
}

export function DashboardChart({ chart, timeGrouping, startDate, endDate, className }: DashboardChartProps) {

    const [data, setData] = useState<any>(null);
    const [breakdownData, setBreakdownData] = useState<any>(null);
    const [breakdownData2, setBreakdownData2] = useState<any>(null);
    const [selectedBreakdown, setSelectedBreakdown] = useState<string | null>(null);
    const [selectedBreakdown2, setSelectedBreakdown2] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [breakdownLoading, setBreakdownLoading] = useState(false);
    const [breakdownLoading2, setBreakdownLoading2] = useState(false);

    useEffect(() => {
        let url = `http://localhost:8000/api/datasources/${chart.datasource_id}/data?sort_by=${chart.x_column}&x_column=${chart.x_column}&y_column=${chart.y_column}&group_by=${timeGrouping || 'day'}`;

        // If date_column is not set, try to use x_column if it seems to be a date-based chart
        // This is a common convention in this app where the X axis for time series IS the date column
        const dateColumn = chart.date_column || chart.x_column;

        if (dateColumn && (startDate || endDate)) {
            url += `&date_column=${dateColumn}`;
            if (startDate) url += `&start_date=${startDate}`;
            if (endDate) url += `&end_date=${endDate}`;
        }



        setLoading(true);
        fetch(url)
            .then(res => res.json())
            .then(data => setData(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));


        // Fetch Breakdown Data if configured
        if (chart.breakdown_x_column) {
            let breakdownUrl = `http://localhost:8000/api/datasources/${chart.datasource_id}/data?sort_by=${chart.x_column}&x_column=${chart.x_column}&y_column=${chart.y_column}&group_by=${timeGrouping || 'day'}&breakdown_column=${chart.breakdown_x_column}`;

            if (dateColumn && (startDate || endDate)) {
                breakdownUrl += `&date_column=${dateColumn}`;
                if (startDate) breakdownUrl += `&start_date=${startDate}`;
                if (endDate) breakdownUrl += `&end_date=${endDate}`;
            }

            setBreakdownLoading(true);
            fetch(breakdownUrl)
                .then(res => res.json())
                .then(respData => {
                    // Process Data: Pivot from Long to Wide
                    // received: rows: [{x: '...', breakdown: '...', y: 10}]
                    // wanted: [{x: '...', 'catA': 10, 'catB': 20}]

                    if (!respData.rows) return;

                    const rows = respData.rows;
                    const pivoted: any = {};
                    const breakdownKeys = new Set<string>();

                    rows.forEach((row: any) => {
                        const xVal = row[chart.x_column];
                        const breakdownVal = row[chart.breakdown_x_column] || 'Unknown';
                        const yVal = row[chart.y_column];

                        if (!pivoted[xVal]) {
                            pivoted[xVal] = { [chart.x_column]: xVal };
                        }
                        pivoted[xVal][breakdownVal] = yVal;
                        breakdownKeys.add(breakdownVal);
                    });

                    const pivotedList = Object.values(pivoted);
                    // Sort if needed (assuming x_column sort from backend is roughly preserved or we rely on re-sorting?)
                    // The backend sorts by sort_by. If pivoted, object keys order isn't guaranteed. 
                    // Best to sort pivotedList by x_column.
                    pivotedList.sort((a: any, b: any) => {
                        if (a[chart.x_column] < b[chart.x_column]) return -1;
                        if (a[chart.x_column] > b[chart.x_column]) return 1;
                        return 0;
                    });

                    const sortedKeys = Array.from(breakdownKeys).sort();

                    setBreakdownData({
                        rows: pivotedList,
                        keys: sortedKeys
                    });
                })
                .catch(err => console.error("Breakdown fetch error", err))
                .finally(() => setBreakdownLoading(false));

        } else {
            setBreakdownData(null);
        }

    }, [chart.datasource_id, chart.date_column, chart.x_column, chart.y_column, chart.breakdown_x_column, timeGrouping, startDate, endDate]);

    // Fetch Second Breakdown Data (Cascading)
    useEffect(() => {
        if (chart.breakdown_x_column_2) {
            let breakdownUrl2 = `http://localhost:8000/api/datasources/${chart.datasource_id}/data?sort_by=${chart.x_column}&x_column=${chart.x_column}&y_column=${chart.y_column}&group_by=${timeGrouping || 'day'}&breakdown_column=${chart.breakdown_x_column_2}`;

            const dateColumn = chart.date_column || chart.x_column;
            if (dateColumn && (startDate || endDate)) {
                breakdownUrl2 += `&date_column=${dateColumn}`;
                if (startDate) breakdownUrl2 += `&start_date=${startDate}`;
                if (endDate) breakdownUrl2 += `&end_date=${endDate}`;
            }

            // Apply Cascading Filter from First Breakdown
            if (selectedBreakdown && chart.breakdown_x_column) {
                breakdownUrl2 += `&filter_column=${chart.breakdown_x_column}&filter_value=${selectedBreakdown}`;
            }

            setBreakdownLoading2(true);
            fetch(breakdownUrl2)
                .then(res => res.json())
                .then(respData => {
                    if (!respData.rows) {
                        setBreakdownData2(null);
                        return;
                    }

                    const rows = respData.rows;
                    const pivoted: any = {};
                    const breakdownKeys = new Set<string>();

                    rows.forEach((row: any) => {
                        const xVal = row[chart.x_column];
                        const breakdownVal = row[chart.breakdown_x_column_2] || 'Unknown';
                        const yVal = row[chart.y_column];

                        if (!pivoted[xVal]) {
                            pivoted[xVal] = { [chart.x_column]: xVal };
                        }
                        pivoted[xVal][breakdownVal] = yVal;
                        breakdownKeys.add(breakdownVal);
                    });

                    const pivotedList = Object.values(pivoted);
                    pivotedList.sort((a: any, b: any) => {
                        if (a[chart.x_column] < b[chart.x_column]) return -1;
                        if (a[chart.x_column] > b[chart.x_column]) return 1;
                        return 0;
                    });

                    const sortedKeys = Array.from(breakdownKeys).sort();

                    setBreakdownData2({
                        rows: pivotedList,
                        keys: sortedKeys
                    });
                })
                .catch(err => console.error("Breakdown 2 fetch error", err))
                .finally(() => setBreakdownLoading2(false));

        } else {
            setBreakdownData2(null);
        }
    }, [chart.datasource_id, chart.date_column, chart.x_column, chart.y_column, chart.breakdown_x_column, chart.breakdown_x_column_2, timeGrouping, startDate, endDate, selectedBreakdown]);

    // Reset second selection when first selection changes
    useEffect(() => {
        setSelectedBreakdown2(null);
    }, [selectedBreakdown]);


    if (loading) return <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl">Loading...</div>;
    if (!data) return <div className="h-[300px] flex items-center justify-center text-red-400 bg-red-50 rounded-xl">Error loading data</div>;

    const ChartComponent = {
        'bar': BarChart,
        'line': LineChart,
        'area': AreaChart
    }[chart.chart_type] || BarChart;

    const DataComponent = {
        'bar': Bar,
        'line': Line,
        'area': Area
    }[chart.chart_type] || Bar;

    const BreakdownChartComponent = {
        'bar': BarChart,
        'line': LineChart,
        'area': AreaChart
    }[chart.breakdown_chart_type || 'bar'] || BarChart;

    const BreakdownDataComponent = {
        'bar': Bar,
        'line': Line,
        'area': Area
    }[chart.breakdown_chart_type || 'bar'] || Bar;

    const BreakdownChartComponent2 = {
        'bar': BarChart,
        'line': LineChart,
        'area': AreaChart
    }[chart.breakdown_chart_type_2 || 'bar'] || BarChart;

    const BreakdownDataComponent2 = {
        'bar': Bar,
        'line': Line,
        'area': Area
    }[chart.breakdown_chart_type_2 || 'bar'] || Bar;

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28', '#ff8042', '#a4de6c'];
    // Distinct palette for second breakdown (Material Soft Tones - Similar style, different colors)
    const COLORS_2 = ['#fa8072', '#4db6ac', '#7986cb', '#ffd54f', '#ba68c8', '#4fc3f7', '#a1887f', '#dce775', '#ff8a65'];


    const formatDate = (value: any) => {
        if (typeof value !== 'string') return value;
        // Basic cleanup: remove time component
        const datePart = value.split('T')[0];

        if (timeGrouping === 'month') {
            // For monthly view, show "Jan 2024"
            try {
                const date = new Date(datePart);
                // Check if valid date
                if (isNaN(date.getTime())) return datePart;
                const formatted = date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
                return formatted !== "Invalid Date" ? formatted : datePart;
            } catch {
                return datePart;
            }
        }
        return datePart;
    };

    return (
        <div className={`bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col space-y-4 ${className || ''}`}>
            <div className="flex-1 min-h-[200px] w-full flex flex-col">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">{chart.title}</h3>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <ChartComponent data={data.rows}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey={chart.x_column}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                dy={10}
                                tickFormatter={(value) => {
                                    if (typeof value !== 'string') return value;
                                    const datePart = value.split('T')[0];
                                    if (timeGrouping === 'month') {
                                        try {
                                            const date = new Date(datePart);
                                            if (isNaN(date.getTime())) return datePart;
                                            return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
                                        } catch { return datePart; }
                                    }
                                    return datePart;
                                }}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} labelFormatter={formatDate} />
                            <Legend />
                            <DataComponent
                                type="monotone"
                                dataKey={chart.y_column}
                                fill="#6366f1"
                                stroke="#6366f1"
                                strokeWidth={2}
                                name={chart.y_column}
                                radius={[4, 4, 0, 0]}
                            />
                        </ChartComponent>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Breakdown Chart */}
            {breakdownData && breakdownData.rows.length > 0 && (
                <div className="flex-1 min-h-[200px] w-full border-t border-gray-100 pt-4 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Breakdown by {chart.breakdown_x_column}
                        </h4>
                        {selectedBreakdown && (
                            <button
                                onClick={() => setSelectedBreakdown(null)}
                                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition flex items-center"
                            >
                                Clear Filter: {selectedBreakdown}
                            </button>
                        )}
                    </div>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BreakdownChartComponent data={breakdownData.rows}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey={chart.x_column}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 10 }}
                                    dy={10}
                                    tickFormatter={(value) => {
                                        if (typeof value !== 'string') return value;
                                        return value.split('T')[0];
                                    }}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} labelFormatter={formatDate} />
                                <Legend
                                    wrapperStyle={{ fontSize: '10px', cursor: 'pointer' }}
                                    onClick={(e: any) => setSelectedBreakdown(prev => prev === e.dataKey ? null : e.dataKey)}
                                />
                                {breakdownData.keys
                                    .filter((key: string) => !selectedBreakdown || key === selectedBreakdown)
                                    .map((key: string) => {
                                        const originalIndex = breakdownData.keys.indexOf(key);
                                        return (
                                            <BreakdownDataComponent
                                                key={key}
                                                type="monotone"
                                                dataKey={key}
                                                stackId={chart.breakdown_chart_type === 'bar' ? 'a' : undefined}
                                                fill={COLORS[originalIndex % COLORS.length]}
                                                stroke={COLORS[originalIndex % COLORS.length]}
                                                strokeWidth={1.5}
                                                name={key}
                                                radius={[0, 0, 0, 0]}
                                                cursor="pointer"
                                                onClick={() => setSelectedBreakdown(prev => prev === key ? null : key)}
                                            />
                                        );
                                    })}
                            </BreakdownChartComponent>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Breakdown Chart 2 */}
            {breakdownData2 && breakdownData2.rows.length > 0 && (
                <div className="flex-1 min-h-[200px] w-full border-t border-gray-100 pt-4 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Breakdown by {chart.breakdown_x_column_2}
                        </h4>
                        {selectedBreakdown2 && (
                            <button
                                onClick={() => setSelectedBreakdown2(null)}
                                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition flex items-center"
                            >
                                Clear Filter: {selectedBreakdown2}
                            </button>
                        )}
                    </div>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BreakdownChartComponent2 data={breakdownData2.rows}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey={chart.x_column}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 10 }}
                                    dy={10}
                                    tickFormatter={(value) => {
                                        if (typeof value !== 'string') return value;
                                        return value.split('T')[0];
                                    }}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} labelFormatter={formatDate} />
                                <Legend
                                    wrapperStyle={{ fontSize: '10px', cursor: 'pointer' }}
                                    onClick={(e: any) => setSelectedBreakdown2(prev => prev === e.dataKey ? null : e.dataKey)}
                                />
                                {breakdownData2.keys
                                    .filter((key: string) => !selectedBreakdown2 || key === selectedBreakdown2)
                                    .map((key: string) => {
                                        const originalIndex = breakdownData2.keys.indexOf(key);
                                        return (
                                            <BreakdownDataComponent2
                                                key={key}
                                                type="monotone"
                                                dataKey={key}
                                                stackId={chart.breakdown_chart_type_2 === 'bar' ? 'a' : undefined}
                                                fill={COLORS_2[originalIndex % COLORS_2.length]}
                                                stroke={COLORS_2[originalIndex % COLORS_2.length]}
                                                strokeWidth={1.5}
                                                name={key}
                                                radius={[0, 0, 0, 0]}
                                                cursor="pointer"
                                                onClick={() => setSelectedBreakdown2(prev => prev === key ? null : key)}
                                            />
                                        );
                                    })}
                            </BreakdownChartComponent2>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
