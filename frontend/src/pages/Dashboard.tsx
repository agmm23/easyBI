import React, { useEffect, useState } from 'react';
import { DashboardChart } from '../components/DashboardChart';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';

export function Dashboard() {
    const { sectionId } = useParams();
    const navigate = useNavigate();
    const { sections } = useDashboard();

    // Date Range State
    const [selectedRange, setSelectedRange] = useState('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const handleRangeChange = (range: string) => {
        setSelectedRange(range);
        if (range !== 'custom') {
            setCustomStart('');
            setCustomEnd('');
        }
    };

    const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
        if (type === 'start') setCustomStart(value);
        else setCustomEnd(value);

        setSelectedRange('custom');
    };

    const calculateDateRange = (range: string) => {
        if (range === 'custom') {
            return { start: customStart, end: customEnd };
        }

        const end = new Date();
        const start = new Date();


        switch (range) {
            case 'last_week':
                start.setDate(end.getDate() - 7);
                break;
            case 'last_month':
                start.setDate(end.getDate() - 30);
                break;
            case 'last_3_months':
                start.setDate(end.getDate() - 90);
                break;
            case 'last_6_months':
                start.setDate(end.getDate() - 180);
                break;
            case 'last_year':
                start.setDate(end.getDate() - 365);
                break;
            case 'ytd':
                start.setMonth(0, 1); // Jan 1st of current year
                break;
            case 'all':
            default:
                return { start: '', end: '' };
        }

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    };

    const { start: startDate, end: endDate } = calculateDateRange(selectedRange);


    // Grouping State
    const [timeGrouping, setTimeGrouping] = useState('day');

    // Redirect to first section if no ID provided and sections exist
    useEffect(() => {
        if (!sectionId && sections.length > 0) {
            navigate(`/dashboard/${sections[0].id}`, { replace: true });
        }
    }, [sectionId, sections, navigate]);

    // Filter sections if ID is present
    const filteredSections = sectionId
        ? sections.filter(s => s.id === sectionId)
        : [];

    if (sections.length === 0) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Empty</h2>
                <p className="text-gray-500 mt-2">You haven't configured any sections yet.</p>
                <Link
                    to="/config"
                    className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Configure Dashboard
                </Link>
            </div>
        );
    }

    // If we are redirecting, render nothing or a loader
    if (!sectionId && sections.length > 0) {
        return null;
    }

    if (sectionId && filteredSections.length === 0) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-900">Group Not Found</h2>
                <p className="text-gray-500">Please select a dashboard from the sidebar.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {filteredSections[0]?.title}
                    </h2>
                    <p className="text-gray-500">
                        Dashboard View
                    </p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Group By Selector */}
                    <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Group By:</label>
                        <select
                            value={timeGrouping}
                            onChange={(e) => setTimeGrouping(e.target.value)}
                            className="text-sm font-medium text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
                        >
                            <option value="day">Day</option>
                            <option value="week">Week</option>
                            <option value="month">Month</option>
                        </select>
                    </div>

                    {/* Date Range Selector */}
                    <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Range:</label>
                        <select
                            value={selectedRange}
                            onChange={(e) => handleRangeChange(e.target.value)}
                            className="text-sm font-medium text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
                        >
                            <option value="all">All Time</option>
                            <option value="last_week">Last Week</option>
                            <option value="last_month">Last Month</option>
                            <option value="last_3_months">Last 3 Months</option>
                            <option value="last_6_months">Last 6 Months</option>
                            <option value="last_year">Last Year</option>
                            <option value="ytd">Year to Date</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>

                    {/* Custom Date Inputs */}
                    <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm animate-in fade-in duration-200">
                        <input
                            type="date"
                            value={customStart}
                            onChange={(e) => handleCustomDateChange('start', e.target.value)}
                            className="border-none focus:ring-0 text-sm text-gray-600 bg-transparent"
                            placeholder="Start Date"
                        />
                        <span className="text-gray-300">to</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={(e) => handleCustomDateChange('end', e.target.value)}
                            className="border-none focus:ring-0 text-sm text-gray-600 bg-transparent"
                            placeholder="End Date"
                        />
                        <button
                            onClick={() => handleRangeChange('all')}
                            className="text-xs text-red-500 hover:text-red-700 px-2 font-medium"
                        >
                            Clear
                        </button>
                    </div>



                </div>
            </div>

            {filteredSections.map((section) => (
                <div key={section.id} className="space-y-4">
                    <div className={`grid grid-cols-1 ${(!section.layout_columns || section.layout_columns === 2) ? 'md:grid-cols-2' : 'max-w-5xl mx-auto'} gap-6`}>
                        {section.charts && section.charts.length > 0 ? (
                            section.charts.map((chart: any) => (
                                <DashboardChart
                                    key={chart.id}
                                    chart={chart}
                                    timeGrouping={timeGrouping}
                                    startDate={startDate}
                                    endDate={endDate}
                                    className={section.layout_columns === 1 ? 'min-h-[85vh]' : ''}
                                />
                            ))
                        ) : (
                            <div className="col-span-full py-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                No charts in this group yet.
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
