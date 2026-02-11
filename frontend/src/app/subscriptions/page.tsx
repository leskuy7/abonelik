'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import Link from 'next/link';
import { Trash2, Plus, CreditCard, Calendar, RefreshCcw, Pencil } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Subscription {
    id: number;
    name: string;
    price: number;
    currency: string;
    billingCycle: string;
    nextPaymentDate: string;
    status: string;
}

// Sadece ilk ismi al
const getFirstName = (name: string | null | undefined): string => {
    if (!name) return 'Kullanıcı';
    return name.split(' ')[0];
};

export default function SubscriptionsPage() {
    const { user, loading, logout } = useAuth();
    const { t, language } = useSettings();
    const router = useRouter();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    const fetchSubscriptions = async () => {
        try {
            const res = await api.get('/subscriptions');
            setSubscriptions(res.data);
            setError('');
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401) {
                // Token geçersiz, logout yap
                logout();
                router.push('/login');
            } else {
                setError('Abonelikler yüklenemedi');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchSubscriptions();
    }, [user]);

    const handleDelete = async (id: number) => {
        if (confirm('Bu aboneliği silmek istediğinize emin misiniz?')) {
            try {
                await api.delete(`/subscriptions/${id}`);
                setSubscriptions(subscriptions.filter(sub => sub.id !== id));
            } catch (err) {
                console.error(err);
                alert('Abonelik silinemedi');
            }
        }
    };

    const getBillingCycleText = (cycle: string) => cycle === 'MONTHLY' ? t.monthly : t.yearly;

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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-default">{t.subscriptions}</h1>
                        <p className="text-muted text-sm">{t.viewAll}</p>
                    </div>
                    <Link
                        href="/subscriptions/new"
                        className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                        <Plus size={16} />
                        {t.addNew}
                    </Link>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : subscriptions.length === 0 ? (
                    <div className="bg-card border border-default rounded-xl p-12 text-center">
                        <CreditCard className="w-12 h-12 text-muted mx-auto mb-4" />
                        <h3 className="text-default font-medium mb-2">{t.noSubscriptions}</h3>
                        <p className="text-muted text-sm mb-6">{t.newSubscriptionDesc}</p>
                        <Link
                            href="/subscriptions/new"
                            className="inline-flex items-center gap-1 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
                        >
                            <Plus size={16} />
                            {t.addSubscription}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {subscriptions.map((sub) => (
                            <div
                                key={sub.id}
                                className="bg-card border border-default p-4 rounded-xl hover:border-text-muted transition-colors group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-10 h-10 bg-default rounded-lg flex items-center justify-center border border-default">
                                        <CreditCard className="w-5 h-5 text-muted" />
                                    </div>
                                    <div className="flex gap-1">
                                        <Link
                                            href={`/subscriptions/${sub.id}`}
                                            className="p-1.5 hover:bg-purple-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 text-muted hover:text-purple-400"
                                            title={t.edit || 'Düzenle'}
                                        >
                                            <Pencil size={14} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(sub.id)}
                                            className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 text-muted hover:text-red-400"
                                            title={t.delete || 'Sil'}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-default font-medium">{sub.name}</h3>
                                <p className="text-xl font-bold text-default mt-1">
                                    {sub.price}<span className="text-sm text-muted ml-1">{sub.currency}</span>
                                </p>

                                <div className="flex items-center gap-3 text-xs mt-3 text-muted">
                                    <span className="flex items-center gap-1">
                                        <RefreshCcw size={10} />
                                        {getBillingCycleText(sub.billingCycle)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar size={10} />
                                        {new Date(sub.nextPaymentDate).toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
