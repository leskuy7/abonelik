'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

const SELDA_EMAIL = 'karaaslanselda84@gmail.com';

const loveReasons = [
    "Gülüşün güneş gibi ☀️",
    "Yanındayken her şey güzel 🌸",
    "Seninle her an bir macera 🌍",
    "Kalbim seninle atıyor 💚",
    "Sen benim en güzel şansımsın 🍀",
    "Gözlerindeki ışık yolumu aydınlatıyor ✨",
    "Seninle saatler dakikalar gibi geçiyor ⏳",
    "Her gün seni daha çok seviyorum 💫",
    "Sen benim hayatımın anlamısın 🌹",
    "Dünyanın en tatlı insanısın 🧁",
];

export default function SecretLovePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
    const [showMessage, setShowMessage] = useState(false);
    const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

    useEffect(() => {
        if (!loading && (!user || user.email !== SELDA_EMAIL)) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    // Random sparkle effect on mouse move
    const handleMouseMove = (e: React.MouseEvent) => {
        if (Math.random() > 0.85) {
            const sparkle = {
                id: Date.now(),
                x: e.clientX,
                y: e.clientY,
                size: 8 + Math.random() * 16,
            };
            setSparkles(prev => [...prev.slice(-15), sparkle]);
            setTimeout(() => {
                setSparkles(prev => prev.filter(s => s.id !== sparkle.id));
            }, 1000);
        }
    };

    const revealCard = (index: number) => {
        setRevealedCards(prev => {
            const next = new Set(prev);
            next.add(index);
            if (next.size === loveReasons.length) {
                setTimeout(() => setShowMessage(true), 500);
            }
            return next;
        });
    };

    if (loading || !user || user.email !== SELDA_EMAIL) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen w-full relative"
            onMouseMove={handleMouseMove}
            style={{
                background: 'linear-gradient(180deg, #0a0f0a 0%, #0d1a0d 50%, #0a150a 100%)',
            }}
        >
            <Navbar />

            {/* Sparkles following cursor */}
            {sparkles.map(s => (
                <div
                    key={s.id}
                    className="fixed pointer-events-none z-50 animate-ping"
                    style={{
                        left: s.x - s.size / 2,
                        top: s.y - s.size / 2,
                        fontSize: s.size,
                    }}
                >
                    ✨
                </div>
            ))}

            {/* Background glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-green-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-emerald-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-10 relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="text-6xl mb-4 animate-bounce" style={{ animationDuration: '2s' }}>💚</div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-3"
                        style={{
                            background: 'linear-gradient(135deg, #22c55e, #10b981, #34d399)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Selda&apos;ya Özel
                    </h1>
                    <p className="text-green-300/60 text-lg">
                        Kartlara tıklayarak seni sevme nedenlerimi keşfet 💚
                    </p>
                </div>

                {/* Love Reason Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
                    {loveReasons.map((reason, i) => (
                        <button
                            key={i}
                            onClick={() => revealCard(i)}
                            className={`relative aspect-square rounded-2xl transition-all duration-700 transform ${revealedCards.has(i)
                                    ? 'rotate-0 scale-100'
                                    : 'hover:scale-105 hover:-rotate-2 cursor-pointer'
                                }`}
                            style={{
                                perspective: '1000px',
                            }}
                            disabled={revealedCards.has(i)}
                        >
                            {/* Card Front (unrevealed) */}
                            <div
                                className={`absolute inset-0 rounded-2xl flex items-center justify-center transition-all duration-500 ${revealedCards.has(i) ? 'opacity-0 scale-75' : 'opacity-100'
                                    }`}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.1))',
                                    border: '1px solid rgba(34,197,94,0.3)',
                                    boxShadow: '0 0 20px rgba(34,197,94,0.1)',
                                }}
                            >
                                <span className="text-3xl">🔮</span>
                            </div>

                            {/* Card Back (revealed) */}
                            <div
                                className={`absolute inset-0 rounded-2xl flex items-center justify-center p-3 transition-all duration-500 ${revealedCards.has(i) ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
                                    }`}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(16,185,129,0.15))',
                                    border: '1px solid rgba(34,197,94,0.4)',
                                    boxShadow: '0 0 30px rgba(34,197,94,0.2)',
                                }}
                            >
                                <p className="text-sm text-green-200 text-center font-medium leading-snug">{reason}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Progress */}
                <div className="text-center mb-8">
                    <p className="text-green-400/60 text-sm mb-2">
                        {revealedCards.size} / {loveReasons.length} keşfedildi
                    </p>
                    <div className="w-48 h-1.5 bg-green-900/30 rounded-full mx-auto overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700"
                            style={{ width: `${(revealedCards.size / loveReasons.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Final Message - appears when all cards revealed */}
                {showMessage && (
                    <div className="text-center py-8 animate-fade-in">
                        <div className="max-w-lg mx-auto p-8 rounded-3xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(16,185,129,0.1) 100%)',
                                border: '1px solid rgba(34,197,94,0.3)',
                                boxShadow: '0 0 50px rgba(34,197,94,0.15)',
                            }}
                        >
                            <div className="text-5xl mb-4">💚✨💚</div>
                            <h2 className="text-2xl font-bold text-green-400 mb-3">
                                Seni Çok Seviyorum, Selda!
                            </h2>
                            <p className="text-green-300/70 leading-relaxed">
                                Bu uygulama ne kadar güzel olursa olsun, seninle geçirdiğim her anın yanında hiçbir şey. Sen benim hayatımın en güzel sürprizi, en değerli aboneliğimsin. Ve bu aboneliğin süresi: sonsuza kadar. 💚♾️
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.8s ease-out;
                }
            `}</style>
        </div>
    );
}
