import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
    BookOpen,
    Menu,
    MessageSquareMore,
    LogOut,
    Settings,
    User,
    X,
    Newspaper,
    Sparkles,
} from 'lucide-react';
import NotificationBell from './NotificationBell';

function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    let navItems = [];

    if (user?.role === 'admin') {
        navItems = [{ name: 'Admin Dashboard', path: '/admin', icon: Settings }];
    } else {
        navItems = [
            { name: 'Feed', path: '/', icon: Newspaper },
            { name: 'Chat', path: '/chat', icon: MessageSquareMore },
            { name: 'Interviews', path: '/interviews', icon: Sparkles },
            { name: 'Resources', path: '/resources', icon: BookOpen },
            { name: 'Profile', path: '/profile', icon: User },
        ];
    }

    const linkClass = (isActive) =>
        `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${isActive
            ? 'bg-slate-100 text-slate-950 ring-1 ring-slate-200'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
        }`;

    return (
        <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                <Link to="/" className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-base font-bold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]">
                        U
                    </div>
                    <div className="min-w-0">
                        <div className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">UNI-CONNECT</div>
                        <div className="hidden text-xs text-slate-400 sm:block">Student social and career network</div>
                    </div>
                </Link>

                <div className="hidden items-center gap-2 xl:flex">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link key={item.name} to={item.path} className={linkClass(isActive)}>
                                <Icon size={17} />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                <div className="hidden items-center gap-3 md:flex">
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                        <NotificationBell />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                    >
                        <LogOut size={17} />
                        Logout
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setMobileOpen((current) => !current)}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {mobileOpen && (
                <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
                    <div className="flex flex-col gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    onClick={() => setMobileOpen(false)}
                                    className={linkClass(isActive)}
                                >
                                    <Icon size={17} />
                                    {item.name}
                                </Link>
                            );
                        })}

                        <div className="mt-2 flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2">
                            <span className="text-sm font-medium text-slate-600">Notifications</span>
                            <NotificationBell />
                        </div>

                        <button
                            onClick={handleLogout}
                            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                            <LogOut size={17} />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;
