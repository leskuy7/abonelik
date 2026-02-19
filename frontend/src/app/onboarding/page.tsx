'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useSettings } from '@/context/SettingsContext';
import { Check, ArrowRight, Wallet, Globe } from 'lucide-react';

export default function OnboardingPage() {
    const { user, login } = useAuth();
    const { t } = useSettings();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [currency, setCurrency] = useState('TRY');
    const [monthlyBudget, setMonthlyBudget] = useState('');
    const [loading, setLoading] = useState(false);

    const handleComplete = async () => {
        setLoading(true);
        try {
            const res = await api.post('/onboarding', {
                currency,
                monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : null
            });

            if (user) {
                const updatedUser = { ...user, ...res.data };
                login(updatedUser);
            }
        } catch (error) {
            console.error('Onboarding error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-xl w-full">
                <div className="flex justify-between items-center mb-12">
                    <div className="flex gap-2">
                        <div className={`h-2 w-12 rounded-full transition-colors ${step >= 1 ? 'bg-purple-600' : 'bg-border'}`}></div>
                        <div className={`h-2 w-12 rounded-full transition-colors ${step >= 2 ? 'bg-purple-600' : 'bg-border'}`}></div>
                    </div>
                    <span className="text-muted text-sm">{t.step || 'Adım'} {step}/2</span>
                </div>

                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-6">
                            <Globe className="w-8 h-8 text-purple-500" />
                        </div>
                        <h1 className="text-4xl font-bold text-foreground mb-4">{t.selectCurrency || 'Para Birimini Seç'}</h1>
                        <p className="text-muted text-lg mb-8">
                            {t.currencyDesc || 'Aboneliklerini hangi para birimiyle takip etmek istersin? Daha sonra değiştirebilirsin.'}
                        </p>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            {['TRY', 'USD', 'EUR'].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCurrency(c)}
                                    className={`p-6 rounded-xl border-2 transition-all text-center ${currency === c
                                        ? 'border-purple-600 bg-purple-600/10 text-foreground'
                                        : 'border-border bg-card text-muted hover:border-muted'
                                        }`}
                                >
                                    <span className="text-2xl font-bold block mb-1">{c}</span>
                                    <span className="text-xs opacity-60">
                                        {c === 'TRY' ? 'Türk Lirası' : c === 'USD' ? 'US Dollar' : 'Euro'}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-500 transition-colors flex items-center justify-center gap-2"
                        >
                            {t.continue || 'Devam Et'} <ArrowRight size={20} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-6">
                            <Wallet className="w-8 h-8 text-purple-500" />
                        </div>
                        <h1 className="text-4xl font-bold text-foreground mb-4">{t.budgetGoal || 'Aylık Bütçe Hedefin'}</h1>
                        <p className="text-muted text-lg mb-8">
                            {t.budgetDesc || 'Her ay aboneliklere en fazla ne kadar harcamayı planlıyorsun? (İsteğe bağlı)'}
                        </p>

                        <div className="relative mb-8">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted font-bold text-xl">
                                {currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : '€'}
                            </span>
                            <input
                                type="number"
                                value={monthlyBudget}
                                onChange={(e) => setMonthlyBudget(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-card border-2 border-border rounded-xl py-6 pl-14 pr-6 text-2xl font-bold text-foreground placeholder-muted focus:outline-none focus:border-purple-600 transition-colors"
                            />
                        </div>

                        <button
                            onClick={handleComplete}
                            disabled={loading}
                            className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (t.saving || 'Kaydediliyor...') : (t.start || 'Başla')} <Check size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
