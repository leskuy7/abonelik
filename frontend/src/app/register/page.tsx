'use client';

import { useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle, AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const { t } = useSettings();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/register', formData);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Kayıt başarısız');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const res = await api.get('/auth/google');
            window.location.href = res.data.url;
        } catch (err: any) {
            setError('Google ile giriş şu an kullanılamıyor');
        }
    };

    // Success state - email sent
    if (success) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-background p-8">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-8 h-8 text-purple-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-default mb-3">{t.checkEmail}</h1>
                    <p className="text-muted mb-6">
                        <span className="text-default font-medium">{formData.email}</span> {t.checkEmailDesc}
                    </p>

                    <div className="bg-default border border-default rounded-lg p-4 mb-6 text-left">
                        <p className="text-sm text-muted mb-2">📨 {t.emailNotReceived}</p>
                        <ul className="text-sm text-muted list-disc list-inside space-y-1">
                            <li>{t.checkSpam}</li>
                            <li>{t.checkEmailTypo}</li>
                            <li>{t.waitFewMinutes}</li>
                        </ul>
                    </div>

                    <Link
                        href="/login"
                        className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
                    >
                        {t.goToLogin}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex bg-default">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-card flex-col justify-between p-12 border-r border-default">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-xl">💳</span>
                        </div>
                        <span className="text-xl font-bold text-default">SubTrack</span>
                    </div>
                </div>

                <div>
                    <h1 className="text-4xl font-bold text-default mb-4">
                        {t.registerTitle}<br />
                        <span className="text-purple-500">{t.registerTitleHighlight}</span>
                    </h1>
                    <p className="text-muted text-lg mb-8">
                        {t.registerSubtitle}
                    </p>

                    <div className="space-y-4">
                        {[t.featureUnlimited, t.featureReminders, t.featureAnalytics].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                    <CheckCircle size={14} />
                                </div>
                                <span className="text-default">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted">
                    <span>© 2026 SubTrack</span>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-default">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-xl">💳</span>
                        </div>
                        <span className="text-xl font-bold text-default">SubTrack</span>
                    </div>

                    <h2 className="text-2xl font-bold text-default mb-2">{t.registerWelcome}</h2>
                    <p className="text-muted mb-8">{t.registerDesc}</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {success ? (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-6 rounded-lg text-center">
                            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t.checkEmail}</h3>
                            <p className="text-muted mb-4">
                                {t.checkEmailDesc} <strong>{formData.email}</strong>
                            </p>
                            <div className="h-px bg-default w-full my-4"></div>
                            <p className="text-sm text-muted">
                                {t.spamCheck}
                            </p>
                            <Link href="/login" className="block mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors">
                                {t.goToLogin}
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Google Register Button */}
                            <button
                                onClick={handleGoogleLogin}
                                className="w-full flex items-center justify-center gap-3 py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-lg font-medium transition-colors mb-6 border border-gray-200"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {t.registerWithGoogle}
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex-1 h-px bg-default"></div>
                                <span className="text-muted text-sm">{t.or}</span>
                                <div className="flex-1 h-px bg-default"></div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-muted mb-2">{t.userNameLabel}</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-input border border-default rounded-lg text-default placeholder-muted focus:outline-none focus:border-purple-600 transition-colors"
                                        placeholder={t.userNamePlaceholder}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-muted mb-2">{t.emailLabel}</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-input border border-default rounded-lg text-default placeholder-muted focus:outline-none focus:border-purple-600 transition-colors"
                                        placeholder={t.emailPlaceholderLogin}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-muted mb-2">{t.passwordLabel}</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-3 pr-12 bg-input border border-default rounded-lg text-default placeholder-muted focus:outline-none focus:border-purple-600 transition-colors"
                                            placeholder={t.passwordPlaceholder}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="text-xs text-muted py-2">
                                    {t.termsText}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {loading ? t.processing : t.registerLink}
                                </button>
                            </form>

                            <p className="text-center text-sm text-muted mt-8">
                                {t.alreadyHaveAccount}{' '}
                                <Link href="/login" className="text-purple-500 hover:text-purple-400">
                                    {t.loginLink}
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
