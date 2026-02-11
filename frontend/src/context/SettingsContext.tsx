'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { translations, Language } from '@/lib/translations';

type Theme = 'dark' | 'light';

interface SettingsContextType {
    language: Language;
    theme: Theme;
    setLanguage: (lang: Language) => void;
    setTheme: (theme: Theme) => void;
    t: typeof translations.tr;
}

const SettingsContext = createContext<SettingsContextType>({
    language: 'tr',
    theme: 'dark',
    setLanguage: () => { },
    setTheme: () => { },
    t: translations.tr,
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [language, setLanguage] = useState<Language>('tr');
    const [theme, setTheme] = useState<Theme>('dark');

    // Load from local storage on mount
    useEffect(() => {
        const storedLang = localStorage.getItem('language') as Language;
        const storedTheme = localStorage.getItem('theme') as Theme;

        if (storedLang) setLanguage(storedLang);
        if (storedTheme) setTheme(storedTheme);
    }, []);

    // Sync with user preference from backend
    useEffect(() => {
        if (user) {
            if (user.language && (user.language === 'tr' || user.language === 'en')) {
                setLanguage(user.language);
                localStorage.setItem('language', user.language);
            }
            if (user.theme && (user.theme === 'dark' || user.theme === 'light')) {
                setTheme(user.theme);
                localStorage.setItem('theme', user.theme);
            }
        }
    }, [user]);

    // Apply theme to body
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('dark', 'light');
        root.classList.add(theme);
    }, [theme]);

    const changeLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
    };

    const changeTheme = (thm: Theme) => {
        setTheme(thm);
        localStorage.setItem('theme', thm);
    };

    const t = translations[language];

    return (
        <SettingsContext.Provider value={{ language, theme, setLanguage: changeLanguage, setTheme: changeTheme, t }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
