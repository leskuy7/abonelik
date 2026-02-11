'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useSettings } from '@/context/SettingsContext';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface Subscription {
    id: number;
    name: string;
    price: number;
    currency: string;
    nextPaymentDate: string;
    startDate: string;
    billingCycle: string;
}

export default function CalendarPage() {
    const { t, language } = useSettings();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubscriptions = async () => {
            try {
                const res = await api.get('/subscriptions');
                setSubscriptions(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscriptions();
    }, []);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        // 0 = Sunday, 1 = Monday, etc.
        // We want Monday to be 0 or handled correctly. 
        // Standard JS getDay(): 0=Sun, 1=Mon...6=Sat
        // Let's stick to standard Sunday start for simplicity or convert to Monday start if preferred for TR context.
        // TR context usually starts Monday.
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Convert to Mon=0...Sun=6
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const today = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    // Generate calendar grid
    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    const getSubscriptionsForDay = (day: number) => {
        // Calculate dynamic payment dates for subscriptions based on billing cycle
        // This is a simplified view. Ideally backend handles projection of recurring dates.
        // For now, we show the static 'nextPaymentDate' and maybe 'startDate' if it matches?
        // Actually, user wants to see "Payment Dates". 
        // If a sub is Monthly, it should appear on that day every month.
        return subscriptions.filter(sub => {
            const date = new Date(sub.nextPaymentDate);
            // Check if day matches irrespective of month/year for recurring? 
            // Or strictly check nextPaymentDate. 
            // Better to check day of month logic for recurring.

            const subDay = date.getDate();

            // Logic for monthly: if billingCycle is MONTHLY, it repeats on subDay. 
            // Logic for yearly: must match month and day.
            if (sub.billingCycle === 'MONTHLY') {
                return subDay === day; // Simple recurrence
            } else if (sub.billingCycle === 'YEARLY') {
                return subDay === day && date.getMonth() === currentMonth;
            }
            return subDay === day && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
    };

    return (
        <div className="min-h-screen bg-default text-default">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-default">{t.calendar}</h1>
                    <div className="flex items-center gap-4 bg-card p-2 rounded-lg border border-default">
                        <button onClick={prevMonth} className="p-2 hover:bg-input rounded-lg transition-colors text-default">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="font-semibold w-32 text-center select-none text-default">
                            {currentDate.toLocaleString(language === 'en' ? 'en-US' : 'tr-TR', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={nextMonth} className="p-2 hover:bg-input rounded-lg transition-colors text-default">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-purple-600" size={40} />
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-px bg-default rounded-xl overflow-hidden border border-default">
                        {/* Header */}
                        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                            <div key={day} className="bg-card p-4 text-center text-sm font-medium text-muted">
                                {day}
                            </div>
                        ))}

                        {/* Days */}
                        {days.map((day, index) => {
                            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                            const daySubs = day ? getSubscriptionsForDay(day) : [];

                            return (
                                <div
                                    key={index}
                                    className={`bg-default min-h-[120px] p-2 transition-colors hover:bg-card/50 ${!day ? 'bg-card/30' : ''}`}
                                >
                                    {day && (
                                        <>
                                            <div className={`text-sm font-medium mb-2 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-purple-600 text-white' : 'text-muted'}`}>
                                                {day}
                                            </div>
                                            <div className="space-y-1">
                                                {daySubs.map(sub => (
                                                    <div
                                                        key={sub.id}
                                                        className="text-xs p-1.5 rounded bg-purple-600/10 border border-purple-600/20 text-purple-500 truncate"
                                                        title={`${sub.name} - ${sub.price} ${sub.currency}`}
                                                    >
                                                        <span className="font-semibold">{sub.name}</span>
                                                        <span className="opacity-75 ml-1">{sub.price}{sub.currency === 'TRY' ? '₺' : sub.currency === 'USD' ? '$' : '€'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
