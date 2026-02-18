'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const [error, setError] = useState('');

    const processedRef = React.useRef(false);

    useEffect(() => {
        // Prevent double-execution in StrictMode
        if (processedRef.current) return;
        processedRef.current = true;

        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            router.replace(`/login?error=${errorParam}`);
            return;
        }

        if (!token) {
            router.replace('/login?error=missing_params');
            return;
        }

        // Parse user data synchronously — no need for async/await here
        let userData = null;
        if (userParam) {
            try {
                userData = JSON.parse(decodeURIComponent(userParam));
            } catch (e) {
                // If parse fails, we'll fetch from API
            }
        }

        if (userData) {
            // Fast path: user data is in URL, login immediately
            login(token, userData);
        } else {
            // Slow path: fetch user data from API
            localStorage.setItem('token', token);
            api.get('/users/profile')
                .then((response) => {
                    login(token, response.data);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    setError('Giriş işlemi başarısız oldu. Lütfen tekrar deneyin.');
                    setTimeout(() => {
                        router.replace('/login?error=auth_callback_failed');
                    }, 2000);
                });
        }
    }, []); // Empty dependency — run once on mount

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
