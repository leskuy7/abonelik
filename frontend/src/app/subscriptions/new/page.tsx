'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function NewSubscriptionPage() {
    const { user, loading, logout } = useAuth();
    const { t } = useSettings();
    const router = useRouter();

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState('TRY');
    const [billingCycle, setBillingCycle] = useState('MONTHLY');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/subscriptions', {
                name,
                price: parseFloat(price),
                currency,
                billingCycle,
                startDate
            });
            router.push('/subscriptions');
        } catch (err) {
            console.error(err);
            alert('Abonelik eklenemedi');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !user) return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
            <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const popularServices = [
        { name: 'Netflix', emoji: '🎬' },
        { name: 'Spotify', emoji: '🎵' },
        { name: 'YouTube', emoji: '📺' },
        { name: 'Amazon', emoji: '📦' },
        { name: 'Disney+', emoji: '✨' },
        { name: 'Apple', emoji: '🍎' },
    ];

    return (
        <div className="min-h-screen w-full">
            <Navbar />

            {/* Content */}
            <div className="max-w-lg mx-auto px-4 py-6">
                <Link href="/subscriptions" className="inline-flex items-center gap-1 text-muted hover:text-default mb-4 text-sm transition-colors">
                    <ArrowLeft size={16} />
                    {t.cancel}
                </Link>

                <div className="bg-card border border-default p-6 rounded-xl">
                    <h1 className="text-lg font-bold text-default mb-1">{t.addSubscription}</h1>
                    <p className="text-muted text-sm mb-6">{t.newSubscriptionDesc}</p>

                    <div className="mb-5">
                        <p className="text-xs text-muted mb-2">{t.quickAccess}</p>
                        <div className="flex flex-wrap gap-2">
                            {popularServices.map(service => (
                                <button
                                    key={service.name}
                                    type="button"
                                    onClick={() => setName(service.name)}
                                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${name === service.name
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-input text-muted hover:text-default border border-default'
                                        }`}
                                >
                                    {service.emoji} {service.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-muted mb-1">{t.subNameLabel}</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2.5 bg-input border border-default rounded-lg text-default placeholder-muted focus:outline-none focus:border-purple-600 text-sm"
                                required
                                placeholder={t.subNamePlaceholder || "Netflix"}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm text-muted mb-1">{t.priceLabel}</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-input border border-default rounded-lg text-default placeholder-muted focus:outline-none focus:border-purple-600 text-sm"
                                    required
                                    step="0.01"
                                    placeholder="99.99"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-muted mb-1">{t.currency}</label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-input border border-default rounded-lg text-default focus:outline-none focus:border-purple-600 text-sm"
                                >
                                    <option value="TRY">🇹🇷 TRY</option>
                                    <option value="USD">🇺🇸 USD</option>
                                    <option value="EUR">🇪🇺 EUR</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-muted mb-1">{t.billingCycleLabel}</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setBillingCycle('MONTHLY')}
                                    className={`p-3 rounded-lg border text-sm transition-colors ${billingCycle === 'MONTHLY'
                                        ? 'border-purple-600 bg-purple-600/10 text-purple-400'
                                        : 'border-default text-muted hover:border-text-muted'
                                        }`}
                                >
                                    📅 {t.monthly}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBillingCycle('YEARLY')}
                                    className={`p-3 rounded-lg border text-sm transition-colors ${billingCycle === 'YEARLY'
                                        ? 'border-purple-600 bg-purple-600/10 text-purple-400'
                                        : 'border-default text-muted hover:border-text-muted'
                                        }`}
                                >
                                    🗓️ {t.yearly}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-muted mb-1">{t.startDateLabel}</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2.5 bg-input border border-default rounded-lg text-default focus:outline-none focus:border-purple-600 text-sm"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                        >
                            <Save size={16} />
                            {isSubmitting ? t.processing : t.create}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
