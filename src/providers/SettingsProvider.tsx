'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface SettingsContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    refreshRate: number;
    setRefreshRate: (rate: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [refreshRate, setRefreshRateState] = useState<number>(3000); // Default 3s
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load Theme from localStorage on mount (Client-side only)
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) setThemeState(savedTheme);

        // Load Settings (Refresh Rate) from API
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.refreshRate) setRefreshRateState(data.refreshRate);
                }
            } catch (err) {
                console.error("Failed to load settings", err);
            }
        };
        fetchSettings();

        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem('theme', theme);

        // Apply theme to HTML element
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme, mounted]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const setRefreshRate = (rate: number) => {
        setRefreshRateState(rate);

        // Persist to backend without blocking UI
        fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshRate: rate }),
        }).catch(err => console.error("Failed to save settings", err));
    };

    return (
        <SettingsContext.Provider value={{ theme, setTheme, refreshRate, setRefreshRate }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
