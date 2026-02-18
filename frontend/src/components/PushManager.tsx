'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import api from '@/lib/api';
import { useSettings } from '@/context/SettingsContext';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function PushManager() {
    const { t } = useSettings();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Register service worker explicitly
            navigator.serviceWorker.register('/sw.js')
                .then(reg => {
                    console.log('Service Worker registered:', reg);
                    setRegistration(reg);
                    return reg.pushManager.getSubscription();
                })
                .then(sub => {
                    if (sub) setIsSubscribed(true);
                })
                .catch(err => console.error('Service Worker registration failed:', err));
        }
    }, []);

    const subscribe = async () => {
        if (!registration) {
            alert(t.serviceWorkerError || 'Servis çalışanı hazır değil. Lütfen sayfayı yenileyin.');
            return;
        }

        if (!VAPID_PUBLIC_KEY) {
            alert(t.vapidMissing || 'Bildirim anahtarı (VAPID Key) eksik. Lütfen site yöneticisine bildirin.');
            console.error('VAPID_PUBLIC_KEY is missing in environment variables');
            return;
        }

        try {
            setLoading(true);
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // Send to backend
            await api.post('/notifications/subscribe', sub);
            setIsSubscribed(true);
            alert(t.notificationsEnabled || 'Bildirimler başarıyla açıldı!');
        } catch (error: any) {
            console.error('Subscription error:', error);

            if (error.name === 'NotAllowedError') {
                alert(t.notificationPermissionDenied || 'Bildirim izni reddedildi. Tarayıcı ayarlarından izin verin.');
            } else {
                alert((t.notificationError || 'Bildirim hatası: ') + (error.message || 'Bilinmeyen hata'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-purple-600/10 rounded-xl flex items-center justify-center text-purple-400">
                    <Bell size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground">{t.notificationSettings}</h3>
                    <p className="text-sm text-muted">{t.notificationDesc}</p>
                </div>
            </div>

            {isSubscribed ? (
                <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-3 rounded-xl border border-green-400/20">
                    <Bell size={18} />
                    <span className="font-medium">{t.notificationsOn}</span>
                </div>
            ) : (
                <button
                    onClick={subscribe}
                    disabled={loading}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl transition-colors font-medium disabled:opacity-50"
                >
                    {loading ? (t.processing || 'İşleniyor...') : (t.enableNotifications || 'Bildirimleri Aç')}
                    <Bell size={18} />
                </button>
            )}
        </div>
    );
}
