import React, { useEffect, useState } from 'react';
import { DashboardChart } from '../components/DashboardChart';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { PlusCircle, Calendar } from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';

export function Dashboard() {
    const { sectionId } = useParams();
    const navigate = useNavigate();
    const { sections } = useDashboard();

    // Date Filter State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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

                    {/* Date Pickers */}
                    <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                        <Calendar className="w-5 h-5 text-gray-400 ml-2" />
                        <div className="flex items-center space-x-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border-none focus:ring-0 text-sm text-gray-600 bg-transparent"
                                placeholder="Start Date"
                            />
                            <span className="text-gray-300">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border-none focus:ring-0 text-sm text-gray-600 bg-transparent"
                                placeholder="End Date"
                            />
                        </div>
                        {(startDate || endDate) && (
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                className="text-xs text-red-500 hover:text-red-700 px-2 font-medium"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {filteredSections.map((section) => (
                <div key={section.id} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {section.charts && section.charts.length > 0 ? (
                            section.charts.map((chart: any) => (
                                <DashboardChart
                                    key={chart.id}
                                    chart={chart}
                                    startDate={startDate}
                                    endDate={endDate}
                                    timeGrouping={timeGrouping}
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
