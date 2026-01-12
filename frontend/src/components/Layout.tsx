import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, Sparkles, LogOut, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useDashboard } from '../contexts/DashboardContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
    const location = useLocation();
    const { sections } = useDashboard();
    const { t } = useLanguage();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { href: '/ai', label: t('nav.aiAnalyst'), icon: Sparkles },
        { href: '/config', label: t('nav.configuration'), icon: Settings },
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
                            {t('nav.dashboards')}
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
                                <p className="px-3 py-2 text-xs text-gray-400 italic">{t('nav.noGroups')}</p>
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

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center mb-4 px-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 mr-3">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.username || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        {t('nav.logout') || 'Log Out'}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
