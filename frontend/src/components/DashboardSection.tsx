import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function DashboardSection({ section }: { section: any }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:8000/api/datasources/${section.datasource_id}/data`)
            .then(res => res.json())
            .then(data => setData(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [section.datasource_id]);

    if (loading) return <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>;
    if (!data) return <div className="h-64 flex items-center justify-center text-red-400">Error loading data</div>;

    const ChartComponent = {
        'bar': BarChart,
        'line': LineChart,
        'area': AreaChart
    }[section.chart_type] || BarChart;

    const DataComponent = {
        'bar': Bar,
        'line': Line,
        'area': Area
    }[section.chart_type] || Bar;

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{section.title}</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ChartComponent data={data.rows}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={section.x_column} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <DataComponent
                            type="monotone"
                            dataKey={section.y_column}
                            fill="#4f46e5"
                            stroke="#4f46e5"
                            name={section.y_column}
                        />
                    </ChartComponent>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
