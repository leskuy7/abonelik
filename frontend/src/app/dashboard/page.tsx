'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { CreditCard, TrendingUp, Calendar, Wallet, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

// Sadece ilk ismi al
const getFirstName = (name: string | null | undefined): string => {
    if (!name) return 'Kullanıcı';
    return name.split(' ')[0];
};

export default function Dashboard() {
    const { user, loading, logout } = useAuth();
    const { t, language } = useSettings();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            api.get('/dashboard')
                .then(res => setStats(res.data))
                .catch(err => console.error(err));
        }
    }, [user]);

    if (loading || !user) return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
            <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen w-full">
            <Navbar />

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-default">{t.welcome} {getFirstName(user.name)} 👋</h1>
                        <p className="text-muted text-sm">{t.subscriptionSummary}</p>
                    </div>
                    <Link
                        href="/subscriptions/new"
                        className="hidden sm:flex items-center gap-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors"
                    >
                        {t.addNew}
                        <ArrowUpRight size={14} />
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <div className="bg-card border border-default p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="w-4 h-4 text-purple-500" />
                            <span className="text-xs text-muted">{t.active}</span>
                        </div>
                        <p className="text-2xl font-bold text-default">{stats?.activeSubscriptions || 0}</p>
                        <p className="text-muted text-xs">{t.subscriptionsCount}</p>
                    </div>

                    <div className="bg-card border border-default p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Wallet className="w-4 h-4 text-cyan-500" />
                            <span className="text-xs text-muted">{t.monthly}</span>
                        </div>
                        <p className="text-2xl font-bold text-default">{stats?.totalMonthlyCost || '0'}<span className="text-sm text-muted">₺</span></p>
                        <p className="text-muted text-xs">{t.total}</p>
                    </div>

                    <div className="bg-card border border-default p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs text-muted">{t.yearly}</span>
                        </div>
                        <p className="text-2xl font-bold text-default">{(parseFloat(stats?.totalMonthlyCost || 0) * 12).toFixed(0)}<span className="text-sm text-muted">₺</span></p>
                        <p className="text-muted text-xs">{t.estimated}</p>
                    </div>

                    <div className="bg-card border border-default p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-amber-500" />
                            <span className="text-xs text-muted">{t.today}</span>
                        </div>
                        <p className="text-xl font-bold text-default">{new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'short' })}</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-card border border-default rounded-xl p-5">
                    <h2 className="text-sm font-medium text-default mb-3">{t.quickAccess}</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <Link href="/subscriptions/new" className="flex items-center gap-3 p-3 bg-default hover:bg-border-default/50 rounded-lg transition-colors border border-transparent hover:border-default">
                            <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                                <span>➕</span>
                            </div>
                            <div>
                                <p className="text-default text-sm font-medium">{t.addSubscription}</p>
                                <p className="text-muted text-xs">{t.newSubscriptionDesc}</p>
                            </div>
                        </Link>
                        <Link href="/subscriptions" className="flex items-center gap-3 p-3 bg-default hover:bg-border-default/50 rounded-lg transition-colors border border-transparent hover:border-default">
                            <div className="w-8 h-8 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                                <span>📋</span>
                            </div>
                            <div>
                                <p className="text-default text-sm font-medium">{t.viewSubscriptions}</p>
                                <p className="text-muted text-xs">{t.viewAll}</p>
                            </div>
                        </Link>
                        <Link href="/calendar" className="flex items-center gap-3 p-3 bg-default hover:bg-border-default/50 rounded-lg transition-colors border border-transparent hover:border-default">
                            <div className="w-8 h-8 bg-amber-600/20 rounded-lg flex items-center justify-center">
                                <span>📅</span>
                            </div>
                            <div>
                                <p className="text-default text-sm font-medium">{t.calendar}</p>
                                <p className="text-muted text-xs">{t.paymentDays}</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
