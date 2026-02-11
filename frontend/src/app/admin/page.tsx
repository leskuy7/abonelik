'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Trash2, Shield, ShieldOff, CheckCircle, XCircle, LogOut, ArrowLeft, RefreshCw } from 'lucide-react';

interface User {
    id: number;
    email: string;
    name: string | null;
    isEmailVerified: boolean;
    isAdmin: boolean;
    createdAt: string;
    _count: {
        subscriptions: number;
    };
}

interface Stats {
    totalUsers: number;
    verifiedUsers: number;
    unverifiedUsers: number;
    totalSubscriptions: number;
}

export default function AdminPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const fetchData = async () => {
        try {
            const [usersRes, statsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/stats')
            ]);
            setUsers(usersRes.data);
            setStats(statsRes.data);
            setError('');
        } catch (err: any) {
            if (err.response?.status === 403) {
                router.push('/dashboard');
            } else {
                setError('Veriler yüklenemedi');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const handleDelete = async (id: number, email: string) => {
        if (confirm(`${email} kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
            try {
                await api.delete(`/admin/users/${id}`);
                setUsers(users.filter(u => u.id !== id));
                fetchData();
            } catch (err: any) {
                alert(err.response?.data?.message || 'Silinemedi');
            }
        }
    };

    const handleToggleAdmin = async (id: number) => {
        try {
            const res = await api.patch(`/admin/users/${id}/admin`);
            setUsers(users.map(u => u.id === id ? { ...u, isAdmin: res.data.isAdmin } : u));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Güncellenemedi');
        }
    };

    const handleVerify = async (id: number) => {
        try {
            await api.patch(`/admin/users/${id}/verify`);
            setUsers(users.map(u => u.id === id ? { ...u, isEmailVerified: true } : u));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Doğrulanamadı');
        }
    };

    if (loading || !user) return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
            <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-background">
            {/* Navbar */}
            <nav className="bg-card border-b border-border sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex justify-between h-14">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="flex items-center gap-2 text-muted hover:text-foreground">
                                <ArrowLeft size={16} />
                            </Link>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                                    <Shield size={16} className="text-white" />
                                </div>
                                <span className="font-bold text-foreground">Admin Panel</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchData}
                                className="text-muted hover:text-foreground p-2 rounded-lg transition-colors"
                                title="Yenile"
                            >
                                <RefreshCw size={16} />
                            </button>
                            <button onClick={logout} className="text-muted hover:text-red-400 p-2 rounded-lg transition-colors">
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 py-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
                        {error}
                    </div>
                )}

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        <div className="bg-card border border-border p-4 rounded-xl">
                            <p className="text-muted text-xs mb-1">Toplam Kullanıcı</p>
                            <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                        </div>
                        <div className="bg-card border border-border p-4 rounded-xl">
                            <p className="text-muted text-xs mb-1">Doğrulanmış</p>
                            <p className="text-2xl font-bold text-green-500">{stats.verifiedUsers}</p>
                        </div>
                        <div className="bg-card border border-border p-4 rounded-xl">
                            <p className="text-muted text-xs mb-1">Doğrulanmamış</p>
                            <p className="text-2xl font-bold text-amber-500">{stats.unverifiedUsers}</p>
                        </div>
                        <div className="bg-card border border-border p-4 rounded-xl">
                            <p className="text-muted text-xs mb-1">Toplam Abonelik</p>
                            <p className="text-2xl font-bold text-purple-500">{stats.totalSubscriptions}</p>
                        </div>
                    </div>
                )}

                {/* Users Table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center gap-2">
                        <Users size={18} className="text-muted" />
                        <h2 className="text-foreground font-medium">Kullanıcılar</h2>
                        <span className="text-muted text-sm">({users.length})</span>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border text-muted text-xs">
                                        <th className="text-left p-3 font-medium">Kullanıcı</th>
                                        <th className="text-left p-3 font-medium">Durum</th>
                                        <th className="text-left p-3 font-medium">Abonelik</th>
                                        <th className="text-left p-3 font-medium">Kayıt</th>
                                        <th className="text-right p-3 font-medium">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id} className="border-b border-border/50 hover:bg-input/30">
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    {u.isAdmin && (
                                                        <Shield size={14} className="text-red-500" />
                                                    )}
                                                    <div>
                                                        <p className="text-foreground text-sm">{u.name || 'İsimsiz'}</p>
                                                        <p className="text-muted text-xs">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                {u.isEmailVerified ? (
                                                    <span className="inline-flex items-center gap-1 text-green-500 text-xs">
                                                        <CheckCircle size={12} /> Doğrulanmış
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-amber-500 text-xs">
                                                        <XCircle size={12} /> Bekliyor
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-muted text-sm">{u._count.subscriptions}</td>
                                            <td className="p-3 text-muted text-xs">
                                                {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    {!u.isEmailVerified && (
                                                        <button
                                                            onClick={() => handleVerify(u.id)}
                                                            className="p-1.5 hover:bg-green-500/10 rounded-lg text-muted hover:text-green-400 transition-colors"
                                                            title="E-postayı Doğrula"
                                                        >
                                                            <CheckCircle size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleToggleAdmin(u.id)}
                                                        className={`p-1.5 rounded-lg transition-colors ${u.isAdmin
                                                            ? 'hover:bg-amber-500/10 text-red-500 hover:text-amber-400'
                                                            : 'hover:bg-purple-500/10 text-muted hover:text-purple-400'
                                                            }`}
                                                        title={u.isAdmin ? 'Admin Yetkisini Kaldır' : 'Admin Yap'}
                                                    >
                                                        {u.isAdmin ? <ShieldOff size={14} /> : <Shield size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(u.id, u.email)}
                                                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-muted hover:text-red-400 transition-colors"
                                                        title="Kullanıcıyı Sil"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
