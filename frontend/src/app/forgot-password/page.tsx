'use client';

import { useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const { t } = useSettings();
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            await api.post('/auth/forgot-password', { email });
            setStatus('success');
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err.response?.data?.message || 'Bir hata oluştu.');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm">
                <Link href="/login" className="inline-flex items-center text-sm text-muted hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft size={16} className="mr-2" />
                    {t.backToLogin || 'Girişe Dön'}
                </Link>

                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-purple-600/10 rounded-xl flex items-center justify-center text-purple-600 mx-auto mb-4">
                        <Mail size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">{t.forgotPassword || 'Şifremi Unuttum'}</h1>
                    <p className="text-muted text-sm">{t.forgotPasswordDesc || 'E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.'}</p>
                </div>

                {status === 'success' ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
                        <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
                        <h3 className="text-green-500 font-medium mb-2">{t.emailSent || 'E-posta Gönderildi'}</h3>
                        <p className="text-sm text-muted">{t.checkEmailReset || 'Lütfen e-posta kutunuzu kontrol edin.'}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {status === 'error' && (
                            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                <AlertCircle size={16} />
                                {errorMessage}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">{t.emailLabel}</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
                                placeholder="ornek@email.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {status === 'loading' ? t.processing : (t.sendResetLink || 'Sıfırlama Bağlantısı Gönder')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
