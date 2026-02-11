'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const userStr = searchParams.get('user');

        if (token && userStr) {
            try {
                const user = JSON.parse(decodeURIComponent(userStr));
                login(token, user);
            } catch (error) {
                console.error('Auth callback error:', error);
                router.push('/login?error=auth_callback_failed');
            }
        } else {
            router.push('/login?error=missing_params');
        }
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
