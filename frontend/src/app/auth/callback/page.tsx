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
            const userParam = searchParams.get('user');
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
                // Store token first
                localStorage.setItem('token', token);

                let userData;

                // Try to get user data from URL params first (faster, no extra API call)
                if (userParam) {
                    try {
                        userData = JSON.parse(decodeURIComponent(userParam));
                        console.log('[Auth Callback] User data from URL:', userData.email);
                    } catch (e) {
                        console.error('[Auth Callback] Failed to parse user from URL, fetching from API');
                    }
                }

                // Fallback: fetch from API if user data not in URL
                if (!userData) {
                    console.log('[Auth Callback] Fetching user profile from API...');
                    const response = await api.get('/users/profile');
                    userData = response.data;
                    console.log('[Auth Callback] User profile fetched:', userData.email);
                }

                login(token, userData);
            } catch (err: any) {
                console.error('[Auth Callback] Error:', err.response?.status, err.response?.data || err.message);
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
