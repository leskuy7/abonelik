'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const SELDA_EMAIL = 'karaaslanselda84@gmail.com';

// Check if current user is Selda
export function useIsSelda() {
    const { user } = useAuth();
    return user?.email === SELDA_EMAIL;
}

// Green floating hearts animation that plays on login
export function GreenHeartsAnimation() {
    const [hearts, setHearts] = useState<Array<{ id: number; x: number; delay: number; size: number; duration: number; opacity: number }>>([]);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const generated = Array.from({ length: 35 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 3,
            size: 16 + Math.random() * 28,
            duration: 3 + Math.random() * 4,
            opacity: 0.4 + Math.random() * 0.6,
        }));
        setHearts(generated);

        // Remove animation after 7 seconds
        const timer = setTimeout(() => setVisible(false), 7000);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
            {hearts.map(heart => (
                <div
                    key={heart.id}
                    className="absolute animate-float-heart"
                    style={{
                        left: `${heart.x}%`,
                        bottom: '-50px',
                        fontSize: `${heart.size}px`,
                        animationDelay: `${heart.delay}s`,
                        animationDuration: `${heart.duration}s`,
                        opacity: heart.opacity,
                    }}
                >
                    💚
                </div>
            ))}

            {/* Center message */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
                    <div className="text-6xl mb-4">💚</div>
                    <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
                        Hoş geldin Selda 💚
                    </h2>
                    <p className="text-lg text-white/80 drop-shadow-md">
                        Bu uygulama senin için özel ✨
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes float-heart {
                    0% {
                        transform: translateY(0) rotate(0deg) scale(0);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                        transform: translateY(-10vh) rotate(15deg) scale(1);
                    }
                    50% {
                        transform: translateY(-50vh) rotate(-10deg) scale(1.1);
                    }
                    90% {
                        opacity: 0.8;
                    }
                    100% {
                        transform: translateY(-110vh) rotate(25deg) scale(0.8);
                        opacity: 0;
                    }
                }
                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(30px) scale(0.9);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .animate-float-heart {
                    animation: float-heart ease-out forwards;
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out;
                }
            `}</style>
        </div>
    );
}

// Romantic theme wrapper for dashboard
export function SeldaDashboardOverlay() {
    return (
        <>
            {/* Subtle green glow background effect */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-400/3 rounded-full blur-3xl"></div>
            </div>

            {/* Floating decorative particles */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute text-green-500/20 animate-pulse"
                        style={{
                            left: `${10 + (i * 12)}%`,
                            top: `${15 + (i % 3) * 30}%`,
                            animationDelay: `${i * 0.5}s`,
                            animationDuration: `${3 + (i % 3)}s`,
                            fontSize: `${10 + (i % 4) * 4}px`,
                        }}
                    >
                        💚
                    </div>
                ))}
            </div>
        </>
    );
}

// Special welcome banner for Selda on dashboard
export function SeldaWelcomeBanner() {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    return (
        <div className="relative mb-6 p-5 rounded-2xl overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(16,185,129,0.1) 50%, rgba(52,211,153,0.15) 100%)',
                border: '1px solid rgba(34,197,94,0.2)',
            }}
        >
            <button
                onClick={() => setDismissed(true)}
                className="absolute top-3 right-3 text-green-500/50 hover:text-green-400 text-sm transition-colors"
            >
                ✕
            </button>
            <div className="flex items-center gap-4">
                <div className="text-4xl">💚</div>
                <div>
                    <h3 className="text-lg font-bold text-green-400 mb-1">
                        Seni seviyorum Selda 💚
                    </h3>
                    <p className="text-sm text-green-300/70">
                        Bu uygulama senin için her zaman özel olacak. Gizli sayfanı keşfettin mi? 🔮
                    </p>
                </div>
            </div>
        </div>
    );
}
