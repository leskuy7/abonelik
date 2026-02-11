'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
import { ArrowLeft, Save, Trash2, Calendar, CreditCard, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';

export default function EditSubscriptionPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const { t } = useSettings();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        currency: 'TRY',
        billingCycle: 'MONTHLY',
        startDate: ''
    });

    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                const res = await api.get(`/subscriptions`); // currently fetching all, ideally backend has get-one
                // Since backend doesn't have get-one yet effectively, we filter from all or we should add get-one. 
                // For now, let's filter from list to avoid backend change overhead if list is small. 
                // Wait, checking routes/subscriptions.js... I only see GET / (all). 
                // Efficient fix: Add GET /:id to backend or filter here. 
                // Filter here is faster for now.
                const sub = res.data.find((s: any) => s.id === parseInt(id as string));

                if (sub) {
                    setFormData({
                        name: sub.name,
                        price: sub.price.toString(),
                        currency: sub.currency,
                        billingCycle: sub.billingCycle,
                        startDate: new Date(sub.startDate).toISOString().split('T')[0]
                    });
                } else {
                    setError('Abonelik bulunamadı.');
                }
            } catch (err) {
                setError('Veriler yüklenirken hata oluştu.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchSubscription();
        }
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await api.put(`/subscriptions/${id}`, {
                ...formData,
                price: parseFloat(formData.price)
            });
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Güncelleme başarısız.');
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (confirm('Bu aboneliği silmek istediğinize emin misiniz?')) {
            try {
                await api.delete(`/subscriptions/${id}`);
                router.push('/dashboard');
            } catch (err: any) {
                alert('Silme işlemi başarısız.');
            }
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
    );

    if (error && !formData.name) return (
        <div className="min-h-screen bg-background text-foreground p-4">
            <Navbar />
            <div className="max-w-2xl mx-auto mt-10 text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <Link href="/dashboard" className="text-purple-400 hover:text-purple-300">Daşboard'a Dön</Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-default text-default">
            <Navbar />

            <main className="max-w-2xl mx-auto px-4 py-8">
                <Link href="/dashboard" className="inline-flex items-center text-muted hover:text-default mb-6 transition-colors">
                    <ArrowLeft size={20} className="mr-2" />
                    {t.backToDashboard}
                </Link>

                <div className="bg-card rounded-xl border border-default p-6 md:p-8">
                    <div className="flex justify-between items-start mb-6">
                        <h1 className="text-2xl font-bold text-default">{t.editSubscription}</h1>
                        <button
                            onClick={handleDelete}
                            type="button"
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded-lg transition-colors"
                            title={t.deleteSubscription}
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-muted mb-2">{t.subNameLabel}</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                                    <CreditCard size={18} />
                                </span>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-input border border-default rounded-lg py-3 pl-10 pr-4 text-default focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all placeholder:text-muted"
                                    placeholder={t.subNamePlaceholder}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted mb-2">{t.priceLabel}</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                                        <DollarSign size={18} />
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-input border border-default rounded-lg py-3 pl-10 pr-4 text-default focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all placeholder:text-muted"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted mb-2">{t.currency}</label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full bg-input border border-default rounded-lg py-3 px-4 text-default focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="TRY">TRY (₺)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted mb-2">{t.startDateLabel}</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                                        <Calendar size={18} />
                                    </span>
                                    <input
                                        type="date"
                                        required
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full bg-input border border-default rounded-lg py-3 pl-10 pr-4 text-default focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted mb-2">{t.billingCycleLabel}</label>
                                <select
                                    value={formData.billingCycle}
                                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                                    className="w-full bg-input border border-default rounded-lg py-3 px-4 text-default focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="MONTHLY">{t.monthly}</option>
                                    <option value="YEARLY">{t.yearly}</option>
                                    <option value="WEEKLY">{t.weekly || 'Haftalık'}</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 px-6 py-3 bg-input hover:bg-card border border-default text-default rounded-lg font-medium transition-colors"
                            >
                                {t.cancel}
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={20} />
                                {submitting ? t.processing : t.save}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
