'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Geçersiz doğrulama linki');
                return;
            }

            try {
                const res = await api.get(`/auth/verify-email?token=${token}`);
                setStatus('success');
                setMessage(res.data.message);
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Doğrulama başarısız');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-8">
            <div className="max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-3">E-posta Doğrulanıyor</h1>
                        <p className="text-slate-400">Lütfen bekleyin...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-3">E-posta Doğrulandı! 🎉</h1>
                        <p className="text-slate-400 mb-8">{message}</p>
                        <Link
                            href="/login"
                            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
                        >
                            Giriş Yap
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-3">Doğrulama Başarısız</h1>
                        <p className="text-slate-400 mb-8">{message}</p>
                        <div className="space-y-3">
                            <Link
                                href="/login"
                                className="block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
                            >
                                Giriş Sayfasına Git
                            </Link>
                            <Link
                                href="/register"
                                className="block px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Yeni Hesap Oluştur
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
