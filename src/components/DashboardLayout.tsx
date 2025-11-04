'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import SettingsPanel from './SettingsPanel';

interface User {
    id: number;
    username: string;
    email: string;
    profile_image: string;
    role: string;
}

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);

    useEffect(() => {
        // Determine which API endpoint to use based on the current route
        const isAdminRoute = pathname?.startsWith('/admin') || false;
        const apiEndpoint = isAdminRoute ? '/api/admin/user/me' : '/api/user/me';

        fetch(apiEndpoint)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setUser(data.user);
                    // If user is admin but on regular dashboard, or vice versa, handle appropriately
                    if (isAdminRoute && data.user.role !== 'admin') {
                        router.push('/dashboard');
                    } else if (!isAdminRoute && data.user.role === 'admin' && pathname === '/dashboard') {
                        // Allow admins to access regular dashboard too
                        // Just don't redirect
                    }
                } else {
                    router.push('/');
                }
            })
            .catch(() => router.push('/'))
            .finally(() => setLoading(false));
    }, [router, pathname]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-[#e6e9ef]">Loading...</p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-[#0b1020] via-[#0b1020] to-[#0b1020]">
            {/* Fixed Sidebar */}
            <Sidebar user={user} onSettingsClick={() => setSettingsOpen(true)} />

            {/* Main Content */}
            <main className="flex-1 ml-[280px] p-10 bg-transparent min-h-screen">
                {children}
            </main>

            {/* Settings Panel */}
            <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} user={user} />

            {/* Mobile Bottom Navigation */}
            <nav className="hidden md:hidden fixed bottom-0 left-0 w-full bg-gradient-to-t from-white/6 to-white/2 backdrop-blur-[20px] shadow-[0_-8px_32px_rgba(0,0,0,0.4)] border-t border-white/8 justify-around items-center px-5 pt-4 pb-5 z-[1000]">
                <a href="/dashboard" className="flex items-center justify-center p-3 rounded-2xl min-w-[56px] min-h-[56px] text-white/50 transition-all duration-400 relative overflow-hidden">
                    <i className="fas fa-home text-[22px] relative z-10"></i>
                </a>
                <a href="/dashboard/records" className="flex items-center justify-center p-3 rounded-2xl min-w-[56px] min-h-[56px] text-white transition-all duration-400 relative overflow-hidden">
                    <i className="fas fa-table text-[22px] relative z-10"></i>
                </a>
                <a href="/dashboard/alerts" className="flex items-center justify-center p-3 rounded-2xl min-w-[56px] min-h-[56px] text-white/50 transition-all duration-400 relative overflow-hidden">
                    <i className="fas fa-bell text-[22px] relative z-10"></i>
                </a>
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        setSettingsOpen(true);
                    }}
                    className="flex items-center justify-center p-3 rounded-2xl min-w-[56px] min-h-[56px] text-white/50 transition-all duration-400 relative overflow-hidden"
                >
                    <i className="fas fa-cog text-[22px] relative z-10"></i>
                </a>
            </nav>

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');

        body {
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: radial-gradient(1200px 600px at 20% -10%, rgba(124, 92, 255, 0.18), transparent),
                     radial-gradient(900px 500px at 100% 10%, rgba(76, 201, 240, 0.15), transparent),
                     #0b1020 !important;
          color: #e6e9ef !important;
        }

        @media (max-width: 768px) {
          main {
            margin-left: 0 !important;
            padding: 20px !important;
          }
        }
      `}</style>
        </div>
    );
}

