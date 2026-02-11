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
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, user: User) => void;
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
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (token && savedUser) {
                // Optionally verify token with backend here
                setUser(JSON.parse(savedUser));
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = useCallback((token: string, userData: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        if (!userData.onboardingComplete) {
            router.push('/onboarding');
        } else {
            router.push('/dashboard');
        }
    }, [router]);

    const updateUser = useCallback((userData: User) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
