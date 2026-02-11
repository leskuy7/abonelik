'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { LayoutDashboard, CreditCard, CalendarDays, Settings, LogOut, Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { t } = useSettings();
    const pathname = usePathname();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const links = [
        { href: '/dashboard', label: t.dashboard, icon: LayoutDashboard },
        { href: '/subscriptions', label: t.subscriptions, icon: CreditCard },
        { href: '/calendar', label: t.calendar, icon: CalendarDays },
        { href: '/profile', label: t.settings, icon: Settings },
    ];

    return (
        <nav className="bg-card border-b border-border sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between h-14">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm">💳</span>
                            </div>
                            <span className="font-bold text-foreground hidden sm:block">SubTrack</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-1">
                            {links.map(link => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                            ? 'bg-purple-600/10 text-purple-400'
                                            : 'text-muted hover:text-foreground hover:bg-input'
                                            }`}
                                    >
                                        <link.icon size={16} />
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {user?.isAdmin && (
                            <Link
                                href="/admin"
                                className="text-red-500 hover:text-red-400 p-2 rounded-lg transition-colors"
                                title="Admin Panel"
                            >
                                <Shield size={16} />
                            </Link>
                        )}
                        <button
                            onClick={handleLogout}
                            className="hidden md:flex items-center gap-2 text-muted hover:text-red-400 px-3 py-2 rounded-lg text-sm transition-colors"
                        >
                            <LogOut size={16} />
                            {t.logout}
                        </button>

                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="md:hidden p-2 text-muted hover:text-foreground"
                        >
                            {menuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="md:hidden border-t border-border py-2">
                        {links.map(link => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMenuOpen(false)}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                                        ? 'bg-purple-600/10 text-purple-400'
                                        : 'text-muted hover:text-foreground hover:bg-input'
                                        }`}
                                >
                                    <link.icon size={16} />
                                    {link.label}
                                </Link>
                            );
                        })}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-red-400 hover:bg-input rounded-lg text-sm transition-colors"
                        >
                            <LogOut size={16} />
                            {t.logout}
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
