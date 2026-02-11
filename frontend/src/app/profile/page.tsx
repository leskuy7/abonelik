'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useSettings } from '@/context/SettingsContext';
import Navbar from '@/components/Navbar';
import { User, Lock, Trash2, Save, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PushManager from '@/components/PushManager';

export default function ProfilePage() {
    const { user, login, logout, updateUser } = useAuth();
    const { t, language, setLanguage, theme, setTheme } = useSettings();
    const router = useRouter();

    // Form states
    const [name, setName] = useState('');
    const [currency, setCurrency] = useState('TRY');
    const [monthlyBudget, setMonthlyBudget] = useState('');

    // Password states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI states
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setCurrency(user.currency || 'TRY');
            setMonthlyBudget(user.monthlyBudget ? user.monthlyBudget.toString() : '');
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const res = await api.put('/users/profile', {
                name,
                currency,
                monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : null,
                language,
                theme
            });

            // Update local user context
            const token = localStorage.getItem('token');
            if (token && user) {
                const updatedUser = { ...user, ...res.data };
                updateUser(updatedUser);
            }

            setMessage({ type: 'success', text: t.profileUpdated || 'Profil başarıyla güncellendi.' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || t.updateFailed || 'Güncelleme başarısız.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: t.passwordMismatch || 'Yeni şifreler eşleşmiyor.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            await api.put('/users/change-password', {
                currentPassword,
                newPassword
            });
            setMessage({ type: 'success', text: t.passwordChanged || 'Şifre başarıyla değiştirildi.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || t.passwordChangeFailed || 'Şifre değiştirilemedi.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (confirm(t.deleteConfirm || 'Hesabınızı ve tüm verilerinizi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
            try {
                await api.delete('/users');
                logout();
            } catch (err: any) {
                alert(t.deleteFailed || 'Hesap silinemedi: ' + (err.response?.data?.message || 'Bilinmeyen hata'));
            }
        }
    };

    return (
        <div className="min-h-screen">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">{t.settings}</h1>
                <p className="text-muted mb-8">{t.settingsDesc}</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'general' ? 'bg-purple-600/10 text-purple-400 border border-purple-600/20' : 'text-muted hover:bg-input hover:text-foreground'
                                }`}
                        >
                            <User size={18} />
                            {t.general}
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'security' ? 'bg-purple-600/10 text-purple-400 border border-purple-600/20' : 'text-muted hover:bg-input hover:text-foreground'
                                }`}
                        >
                            <Lock size={18} />
                            {t.security}
                        </button>
                    </div>

                    {/* Content */}
                    <div className="md:col-span-3">
                        {message && (
                            <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                {message.type === 'success' ? <div className="w-2 h-2 rounded-full bg-green-400"></div> : <AlertTriangle size={18} />}
                                {message.text}
                            </div>
                        )}

                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div className="bg-card rounded-xl p-6 border border-border">
                                    <h2 className="text-xl font-bold text-foreground mb-6">{t.profileInfo}</h2>
                                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                                        <div>
                                            <label className="block text-sm text-muted mb-2">{t.email}</label>
                                            <input
                                                type="email"
                                                value={user?.email || ''}
                                                disabled
                                                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-muted cursor-not-allowed"
                                            />
                                            <p className="text-xs text-muted mt-1">{t.emailPlaceholder}</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-muted mb-2">{t.userNameLabel}</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm text-muted mb-2">{t.currency}</label>
                                                <select
                                                    value={currency}
                                                    onChange={(e) => setCurrency(e.target.value)}
                                                    className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
                                                >
                                                    <option value="TRY">TRY (₺)</option>
                                                    <option value="USD">USD ($)</option>
                                                    <option value="EUR">EUR (€)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-muted mb-2">{t.monthlyBudget}</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                                                        {currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : '€'}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={monthlyBudget}
                                                        onChange={(e) => setMonthlyBudget(e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm text-muted mb-2">{t.language}</label>
                                                <select
                                                    value={language}
                                                    onChange={(e) => setLanguage(e.target.value as any)}
                                                    className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
                                                >
                                                    <option value="tr">🇹🇷 Türkçe</option>
                                                    <option value="en">🇬🇧 English</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-muted mb-2">{t.theme}</label>
                                                <select
                                                    value={theme}
                                                    onChange={(e) => setTheme(e.target.value as any)}
                                                    className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
                                                >
                                                    <option value="dark">🌑 {t.dark}</option>
                                                    <option value="light">☀️ {t.light}</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <Save size={18} />
                                                {loading ? t.saving : t.saveChanges}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                                <PushManager />
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div className="bg-card rounded-xl p-6 border border-border">
                                    <h2 className="text-xl font-bold text-foreground mb-6">{t.changePassword}</h2>
                                    <form onSubmit={handleChangePassword} className="space-y-6">
                                        <div>
                                            <label className="block text-sm text-muted mb-2">{t.currentPassword}</label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-purple-600"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm text-muted mb-2">{t.newPassword}</label>
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-purple-600"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-muted mb-2">{t.confirmPassword}</label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-purple-600"
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="px-6 py-3 bg-card hover:bg-input border border-border text-foreground rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <Lock size={18} />
                                                {loading ? t.processing : t.updatePassword}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="bg-red-500/5 rounded-xl p-6 border border-red-500/20">
                                    <h2 className="text-xl font-bold text-red-500 mb-4">{t.dangerZone}</h2>
                                    <p className="text-muted mb-6">{t.dangerWarning}</p>
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 size={18} />
                                        {t.deleteAccount}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
