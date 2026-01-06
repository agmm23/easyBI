import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useDashboard } from '../contexts/DashboardContext';

export function Layout() {
    const location = useLocation();
    const { sections } = useDashboard();

    const navItems = [
        { href: '/ai', label: 'AI Analyst', icon: Sparkles },
        { href: '/config', label: 'Configuration', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">SimpleBI</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {/* Dashboards Group */}
                    <div className="space-y-1">
                        <div className="px-3 py-2 text-sm font-semibold text-gray-900 flex items-center">
                            <LayoutDashboard className="w-5 h-5 mr-3 text-gray-500" />
                            Dashboards
                        </div>

                        <div className="pl-4 space-y-1 border-l-2 border-gray-100 ml-4">
                            {sections.length > 0 ? sections.map((section) => (
                                <Link
                                    key={section.id}
                                    to={`/dashboard/${section.id}`}
                                    className={cn(
                                        "flex items-center px-3 py-2 rounded-lg text-sm transition-colors",
                                        location.pathname === `/dashboard/${section.id}`
                                            ? "text-indigo-600 bg-indigo-50 font-medium"
                                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                    )}
                                >
                                    {section.title}
                                </Link>
                            )) : (
                                <p className="px-3 py-2 text-xs text-gray-400 italic">No groups yet</p>
                            )}
                        </div>
                    </div>

                    {/* Other Nav Items */}
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <Icon className="w-5 h-5 mr-3" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
