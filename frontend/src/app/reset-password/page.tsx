'use client';

import { useState, Suspense } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

function ResetPasswordContent() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { t } = useSettings();
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    if (!token) {
        return (
            <div className="text-center p-8">
                <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-4">
                    {t.invalidToken || 'Geçersiz bağlantı.'}
                </div>
                <Link href="/login" className="text-purple-500 hover:text-purple-400">
                    {t.backToLogin || 'Girişe Dön'}
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus('error');
            setErrorMessage(t.passwordMismatch || 'Şifreler eşleşmiyor');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            await api.post('/auth/reset-password', { token, password });
            setStatus('success');
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err.response?.data?.message || 'Bir hata oluştu.');
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
                <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
                <h3 className="text-green-500 font-medium mb-2">{t.passwordResetSuccess || 'Şifreniz Sıfırlandı'}</h3>
                <p className="text-sm text-muted mb-4">{t.redirectingLogin || 'Giriş sayfasına yönlendiriliyorsunuz...'}</p>
                <Link href="/login" className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg text-sm">
                    {t.loginNow || 'Hemen Giriş Yap'}
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    <AlertCircle size={16} />
                    {errorMessage}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t.newPassword}</label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all pr-12"
                        placeholder="******"
                        minLength={6}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t.confirmPassword}</label>
                <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
                    placeholder="••••••••"
                />
            </div>

            <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {status === 'loading' ? t.processing : (t.resetPassword || 'Şifreyi Sıfırla')}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    const { t } = useSettings();

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm">
                <Link href="/login" className="inline-flex items-center text-sm text-muted hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft size={16} className="mr-2" />
                    {t.backToLogin || 'Girişe Dön'}
                </Link>

                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-purple-600/10 rounded-xl flex items-center justify-center text-purple-600 mx-auto mb-4">
                        <Lock size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">{t.resetPasswordTitle || 'Yeni Şifre Belirle'}</h1>
                    <p className="text-muted text-sm">{t.resetPasswordDesc || 'Lütfen yeni şifrenizi girin.'}</p>
                </div>

                <Suspense fallback={<div className="text-center">{t.loading || 'Yükleniyor...'}</div>}>
                    <ResetPasswordContent />
                </Suspense>
            </div>
        </div>
    );
}
