'use client';

import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function BackendWakeUp() {
    useEffect(() => {
        // Render free tier goes to sleep after 15min of inactivity.
        // Wake it up silently as soon as the frontend loads.
        const wakeUp = async () => {
            try {
                await fetch(`${API_URL}/health`, { method: 'GET', mode: 'cors' });
                console.log('[WakeUp] Backend is awake');
            } catch {
                console.log('[WakeUp] Backend is waking up...');
            }
        };

        wakeUp();

        // Keep alive: ping every 13 minutes to prevent sleeping
        const interval = setInterval(wakeUp, 13 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return null; // invisible component
}
