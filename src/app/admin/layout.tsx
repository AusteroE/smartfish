'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

interface User {
    id: number;
    username: string;
    email: string;
    profile_image: string;
    role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/user/me')
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    if (data.user.role !== 'admin') {
                        // Non-admin users should not access admin routes
                        router.push('/dashboard');
                        return;
                    }
                    setUser(data.user);
                } else {
                    router.push('/');
                }
            })
            .catch(() => router.push('/'))
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-[#e6e9ef]">Loading...</p>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return null;
    }

    return <DashboardLayout>{children}</DashboardLayout>;
}

