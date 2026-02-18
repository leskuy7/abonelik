'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const [error, setError] = useState('');

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');
            const errorParam = searchParams.get('error');

            if (errorParam) {
                console.error('[Auth Callback] Error from URL:', errorParam);
                router.push(`/login?error=${errorParam}`);
                return;
            }

            if (!token) {
                console.error('[Auth Callback] No token in URL');
                router.push('/login?error=missing_params');
                return;
            }

            try {
                console.log('[Auth Callback] Token received, fetching user profile...');
                // Store token first so api interceptor can use it
                localStorage.setItem('token', token);

                // Fetch full user profile from backend
                const response = await api.get('/users/profile');
                const user = response.data;
                console.log('[Auth Callback] User profile fetched:', user.email);

                login(token, user);
            } catch (err: any) {
                console.error('[Auth Callback] Error fetching profile:', err.response?.status, err.response?.data || err.message);
                localStorage.removeItem('token');
                setError('Giriş işlemi başarısız oldu. Lütfen tekrar deneyin.');
                setTimeout(() => {
                    router.push('/login?error=auth_callback_failed');
                }, 2000);
            }
        };

        handleCallback();
    }, [searchParams, login, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="text-center">
                {error ? (
                    <>
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">❌</span>
                        </div>
                        <p className="text-lg text-red-400">{error}</p>
                        <p className="text-sm text-muted mt-2">Giriş sayfasına yönlendiriliyorsunuz...</p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-lg text-muted">Giriş yapılıyor...</p>
                    </>
                )}
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>}>
            <AuthCallbackContent />
        </Suspense>
    );
}
