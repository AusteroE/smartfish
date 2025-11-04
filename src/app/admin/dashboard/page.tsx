'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

interface User {
    id: number;
    username: string;
    email: string;
    profile_image: string;
    role: string;
    email_verified: boolean;
    status: string;
    created_at: string;
}

interface UserStats {
    total: number;
    admins: number;
    users: number;
}

export default function AdminDashboardPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<UserStats>({ total: 0, admins: 0, users: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/users');
            const data = await response.json();

            if (data.success) {
                setUsers(data.users);
                setStats(data.stats);
                setError(null);
            } else {
                setError(data.error || 'Failed to fetch users');
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const getProfileImageSrc = (profileImage: string) => {
        if (profileImage?.startsWith('/')) {
            return profileImage;
        }
        if (profileImage?.startsWith('frontend/')) {
            return `/${profileImage}`;
        }
        return `/frontend/img/${profileImage || 'default profile.png'}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen">
                {/* Header */}
                <header className="text-center mb-10">
                    <Image
                        src="/smartfishcarelogo.png"
                        alt="Smart Fish Care Logo"
                        width={150}
                        height={150}
                        className="mx-auto mb-2 drop-shadow-lg"
                        priority
                    />
                    <h1 className="text-4xl font-extrabold text-[#e6e9ef] mb-2">Admin Dashboard</h1>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-2xl p-6 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg text-[#a2a8b6] mb-2">Total Users</h3>
                                <p className="text-3xl font-bold text-[#e6e9ef]">{stats.total}</p>
                            </div>
                            <div className="w-14 h-14 bg-[#7c5cff]/20 rounded-full flex items-center justify-center">
                                <i className="fas fa-users text-2xl text-[#7c5cff]"></i>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-2xl p-6 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg text-[#a2a8b6] mb-2">Admins</h3>
                                <p className="text-3xl font-bold text-[#e6e9ef]">{stats.admins}</p>
                            </div>
                            <div className="w-14 h-14 bg-[#7c5cff]/20 rounded-full flex items-center justify-center">
                                <i className="fas fa-user-shield text-2xl text-[#7c5cff]"></i>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-2xl p-6 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg text-[#a2a8b6] mb-2">Regular Users</h3>
                                <p className="text-3xl font-bold text-[#e6e9ef]">{stats.users}</p>
                            </div>
                            <div className="w-14 h-14 bg-[#7c5cff]/20 rounded-full flex items-center justify-center">
                                <i className="fas fa-user text-2xl text-[#7c5cff]"></i>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-2xl p-6 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-[#e6e9ef]">User List</h2>
                        <Link
                            href="/admin/users/create"
                            className="px-6 py-3 bg-gradient-to-r from-[#7c5cff] to-[#4cc9f0] text-white rounded-lg font-semibold hover:from-[#6b4ce6] hover:to-[#3db8d9] transition-all flex items-center gap-2"
                        >
                            <i className="fas fa-user-plus"></i>
                            Create User
                        </Link>
                    </div>

                    {loading ? (
                        <div className="text-center py-10">
                            <p className="text-[#a2a8b6]">Loading users...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10">
                            <p className="text-red-500">{error}</p>
                            <button
                                onClick={fetchUsers}
                                className="mt-4 px-4 py-2 bg-[#7c5cff] text-white rounded-lg hover:bg-[#6b4ce6] transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-[#a2a8b6]">No users found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-4 px-4 text-[#a2a8b6] font-semibold">Profile</th>
                                        <th className="text-left py-4 px-4 text-[#a2a8b6] font-semibold">Username</th>
                                        <th className="text-left py-4 px-4 text-[#a2a8b6] font-semibold">Email</th>
                                        <th className="text-left py-4 px-4 text-[#a2a8b6] font-semibold">Role</th>
                                        <th className="text-left py-4 px-4 text-[#a2a8b6] font-semibold">Status</th>
                                        <th className="text-left py-4 px-4 text-[#a2a8b6] font-semibold">Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center">
                                                    <Image
                                                        src={getProfileImageSrc(user.profile_image)}
                                                        alt={user.username}
                                                        width={40}
                                                        height={40}
                                                        className="rounded-full object-cover border-2 border-white/10"
                                                        onError={(e) => {
                                                            e.currentTarget.src = '/frontend/img/default profile.png';
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-[#e6e9ef] font-medium">{user.username}</td>
                                            <td className="py-4 px-4 text-[#a2a8b6]">{user.email}</td>
                                            <td className="py-4 px-4">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.role === 'admin'
                                                    ? 'bg-purple-500/20 text-purple-300'
                                                    : 'bg-blue-500/20 text-blue-300'
                                                    }`}>
                                                    {user.role === 'admin' ? 'Admin' : 'User'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300">
                                                    {user.status === 'active' ? 'ACTIVE' : user.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-[#a2a8b6] text-sm">
                                                {formatDate(user.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

