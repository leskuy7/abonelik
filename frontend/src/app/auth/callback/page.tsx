'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');

            if (!token) {
                router.push('/login?error=missing_params');
                return;
            }

            try {
                // Store token first so api interceptor can use it
                localStorage.setItem('token', token);

                // Fetch full user profile from backend (instead of parsing from URL)
                const response = await api.get('/users/profile');
                const user = response.data;

                login(token, user);
            } catch (error) {
                console.error('Auth callback error:', error);
                localStorage.removeItem('token');
                router.push('/login?error=auth_callback_failed');
            }
        };

        handleCallback();
    }, [searchParams, login, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg text-muted">Giriş yapılıyor...</p>
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
