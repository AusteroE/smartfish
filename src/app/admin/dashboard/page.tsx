'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { getProfileImageUrl } from '@/lib/upload';

interface User {
    id: number;
    username: string;
    email: string;
    profile_image: string;
    role: string;
    email_verified: boolean;
    status: string;
    is_online?: boolean;
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
        fetchUsers(true); // Show loading on initial fetch
        // Poll for online status every 30 seconds
        const interval = setInterval(() => {
            fetchUsers(false); // Don't show loading on polling updates
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchUsers = async (showLoading = false) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            const response = await fetch('/api/admin/users', {
                credentials: 'include',
            });
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
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    const getProfileImageSrc = (profileImage: string) => {
        return getProfileImageUrl(profileImage);
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
            <div className="min-h-screen w-full">
                {/* Header */}
                <header className="text-center mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#e6e9ef] mb-2">Admin Dashboard</h1>
                    <p className="text-sm sm:text-base text-[#a2a8b6]">Manage users and monitor system activity</p>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-xl p-5 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm text-[#a2a8b6] mb-1">Total Users</h3>
                                <p className="text-2xl font-bold text-[#e6e9ef]">{stats.total}</p>
                            </div>
                            <div className="w-12 h-12 bg-[#7c5cff]/20 rounded-full flex items-center justify-center">
                                <i className="fas fa-users text-xl text-[#7c5cff]"></i>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-xl p-5 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm text-[#a2a8b6] mb-1">Admins</h3>
                                <p className="text-2xl font-bold text-[#e6e9ef]">{stats.admins}</p>
                            </div>
                            <div className="w-12 h-12 bg-[#7c5cff]/20 rounded-full flex items-center justify-center">
                                <i className="fas fa-user-shield text-xl text-[#7c5cff]"></i>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-xl p-5 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm text-[#a2a8b6] mb-1">Regular Users</h3>
                                <p className="text-2xl font-bold text-[#e6e9ef]">{stats.users}</p>
                            </div>
                            <div className="w-12 h-12 bg-[#7c5cff]/20 rounded-full flex items-center justify-center">
                                <i className="fas fa-user text-xl text-[#7c5cff]"></i>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-xl p-5 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)] w-full max-w-6xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-4">
                        <h2 className="text-xl font-bold text-[#e6e9ef]">User List</h2>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Link
                                href="/admin/admins/create"
                                className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-user-shield text-xs"></i>
                                Create Admin
                            </Link>
                            <Link
                                href="/admin/users/create"
                                className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-[#7c5cff] to-[#4cc9f0] text-white rounded-lg text-sm font-semibold hover:from-[#6b4ce6] hover:to-[#3db8d9] transition-all flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-user-plus text-xs"></i>
                                Create User
                            </Link>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-10">
                            <i className="fas fa-spinner fa-spin text-2xl text-[#7c5cff] mb-3"></i>
                            <p className="text-[#a2a8b6]">Loading users...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10">
                            <i className="fas fa-exclamation-circle text-2xl text-red-500 mb-3"></i>
                            <p className="text-red-400 mb-4">{error}</p>
                            <button
                                onClick={() => fetchUsers(true)}
                                className="px-4 py-2 bg-[#7c5cff] text-white rounded-lg hover:bg-[#6b4ce6] transition-colors text-sm"
                            >
                                <i className="fas fa-redo mr-2"></i>Retry
                            </button>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-10">
                            <i className="fas fa-users text-3xl text-[#a2a8b6] mb-3"></i>
                            <p className="text-[#a2a8b6]">No users found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-3 text-sm text-[#a2a8b6] font-semibold">Profile</th>
                                        <th className="text-left py-3 px-3 text-sm text-[#a2a8b6] font-semibold">Username</th>
                                        <th className="text-left py-3 px-3 text-sm text-[#a2a8b6] font-semibold">Email</th>
                                        <th className="text-left py-3 px-3 text-sm text-[#a2a8b6] font-semibold">Role</th>
                                        <th className="text-left py-3 px-3 text-sm text-[#a2a8b6] font-semibold">Status</th>
                                        <th className="text-left py-3 px-3 text-sm text-[#a2a8b6] font-semibold">Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-3 px-3">
                                                <div className="flex items-center">
                                                    <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0">
                                                        <Image
                                                            src={getProfileImageSrc(user.profile_image)}
                                                            alt={user.username}
                                                            width={36}
                                                            height={36}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.src = '/frontend/img/default profile.png';
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-sm text-[#e6e9ef] font-medium">{user.username}</td>
                                            <td className="py-3 px-3 text-sm text-[#a2a8b6]">{user.email}</td>
                                            <td className="py-3 px-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                                    ? 'bg-purple-500/20 text-purple-300'
                                                    : 'bg-blue-500/20 text-blue-300'
                                                    }`}>
                                                    {user.role === 'admin' ? 'Admin' : 'User'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_online
                                                    ? 'bg-green-500/20 text-green-300'
                                                    : 'bg-gray-500/20 text-gray-300'
                                                    }`}>
                                                    {user.is_online ? 'ONLINE' : 'OFFLINE'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-sm text-[#a2a8b6]">
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

