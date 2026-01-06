import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardChartProps {
    chart: any;
    startDate?: string;
    endDate?: string;
    timeGrouping?: string;
}

export function DashboardChart({ chart, startDate, endDate, timeGrouping }: DashboardChartProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let url = `http://localhost:8000/api/datasources/${chart.datasource_id}/data?sort_by=${chart.x_column}&x_column=${chart.x_column}&y_column=${chart.y_column}&group_by=${timeGrouping || 'day'}`;

        // Add date filtering params if valid range and chart has date_column configured
        if (chart.date_column && startDate && endDate) {
            url += `&start_date=${startDate}&end_date=${endDate}&date_column=${chart.date_column}`;
        }

        setLoading(true);
        fetch(url)
            .then(res => res.json())
            .then(data => setData(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [chart.datasource_id, chart.date_column, startDate, endDate, timeGrouping]);

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
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">{chart.title}</h3>
            <div className="flex-1 min-h-[250px] w-full">
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
                                // Basic cleanup: remove time component
                                const datePart = value.split('T')[0];

                                if (timeGrouping === 'month') {
                                    // For monthly view, show "Jan 2024"
                                    try {
                                        const date = new Date(datePart);
                                        // Check if valid date
                                        if (isNaN(date.getTime())) return datePart;
                                        return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
                                    } catch {
                                        return datePart;
                                    }
                                }
                                return datePart;
                            }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            labelFormatter={formatDate}
                        />
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
    );
}
