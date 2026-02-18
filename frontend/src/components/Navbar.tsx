'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { CreditCard, CalendarDays, LogOut, Menu, X, Shield, User, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { t } = useSettings();
    const pathname = usePathname();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const links = [
        { href: '/subscriptions', label: t.subscriptions, icon: CreditCard },
        { href: '/calendar', label: t.calendar, icon: CalendarDays },
    ];

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

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
                                const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
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
                        {/* Admin Badge */}
                        {user?.isAdmin && (
                            <Link
                                href="/admin"
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${pathname === '/admin'
                                        ? 'bg-red-500/15 text-red-400'
                                        : 'text-red-500/70 hover:text-red-400 hover:bg-red-500/10'
                                    }`}
                                title="Admin Panel"
                            >
                                <Shield size={14} />
                                <span className="hidden sm:inline">Admin</span>
                            </Link>
                        )}

                        {/* User Profile Dropdown */}
                        <div className="relative hidden md:block" ref={profileRef}>
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${profileOpen || pathname === '/profile'
                                        ? 'bg-purple-600/10 text-purple-400'
                                        : 'text-muted hover:text-foreground hover:bg-input'
                                    }`}
                            >
                                <div className="w-7 h-7 bg-purple-600/20 border border-purple-500/30 rounded-full flex items-center justify-center">
                                    <span className="text-purple-400 text-xs font-bold">{userInitial}</span>
                                </div>
                                <span className="max-w-[120px] truncate font-medium">{user?.name || 'Kullanıcı'}</span>
                                <ChevronDown size={14} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    {/* User Info Header */}
                                    <div className="px-4 py-3 border-b border-border">
                                        <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                                        <p className="text-xs text-muted truncate">{user?.email}</p>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-1">
                                        <Link
                                            href="/profile"
                                            onClick={() => setProfileOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-foreground hover:bg-input transition-colors"
                                        >
                                            <User size={15} />
                                            {t.settings}
                                        </Link>
                                        <button
                                            onClick={() => { setProfileOpen(false); handleLogout(); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <LogOut size={15} />
                                            {t.logout}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Hamburger */}
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
                        {/* User Info */}
                        <div className="flex items-center gap-3 px-3 py-3 mb-1">
                            <div className="w-9 h-9 bg-purple-600/20 border border-purple-500/30 rounded-full flex items-center justify-center">
                                <span className="text-purple-400 text-sm font-bold">{userInitial}</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{user?.name || 'Kullanıcı'}</p>
                                <p className="text-xs text-muted truncate">{user?.email}</p>
                            </div>
                        </div>

                        <div className="h-px bg-border mx-3 mb-2"></div>

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

                        <Link
                            href="/profile"
                            onClick={() => setMenuOpen(false)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${pathname === '/profile'
                                    ? 'bg-purple-600/10 text-purple-400'
                                    : 'text-muted hover:text-foreground hover:bg-input'
                                }`}
                        >
                            <User size={16} />
                            {t.settings}
                        </Link>

                        {user?.isAdmin && (
                            <Link
                                href="/admin"
                                onClick={() => setMenuOpen(false)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${pathname === '/admin'
                                        ? 'bg-red-500/15 text-red-400'
                                        : 'text-red-500/70 hover:text-red-400'
                                    }`}
                            >
                                <Shield size={16} />
                                Admin Panel
                            </Link>
                        )}

                        <div className="h-px bg-border mx-3 my-1"></div>

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
