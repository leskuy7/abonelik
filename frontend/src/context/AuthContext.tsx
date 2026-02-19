'use client';

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../lib/api';
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    email: string;
    name?: string;
    isAdmin?: boolean;
    onboardingComplete?: boolean;
    currency?: string;
    monthlyBudget?: number;
    language?: string;
    theme?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: () => { },
    logout: () => { },
    updateUser: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const response = await api.get('/users/profile');
                setUser(response.data);
            } catch {
                setUser(null);
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = useCallback((userData: User) => {
        setUser(userData);

        if (!userData.onboardingComplete) {
            router.push('/onboarding');
        } else {
            router.push('/dashboard');
        }
    }, [router]);

    const updateUser = useCallback((userData: User) => {
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        api.post('/auth/logout').catch(() => null);
        sessionStorage.clear();
        setUser(null);
        router.push('/login');
    }, [router]);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
