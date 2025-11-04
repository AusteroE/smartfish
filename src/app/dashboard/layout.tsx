'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import SettingsPanel from '@/components/SettingsPanel';
import Link from 'next/link';

interface User {
    id: number;
    username: string;
    email: string;
    profile_image: string;
    role: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Only fetch user once on mount
    useEffect(() => {
        let mounted = true;

        fetch('/api/user/me')
            .then((res) => res.json())
            .then((data) => {
                if (!mounted) return;
                if (data.success) {
                    setUser(data.user);
                } else {
                    router.push('/');
                }
            })
            .catch(() => {
                if (mounted) router.push('/');
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, []); // Empty dependency array - only run once

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
                <Link
                    href="/dashboard"
                    className={`flex items-center justify-center p-3 rounded-2xl min-w-[56px] min-h-[56px] transition-all duration-400 relative overflow-hidden ${pathname === '/dashboard' ? 'text-white' : 'text-white/50'
                        }`}
                >
                    <i className="fas fa-home text-[22px] relative z-10"></i>
                </Link>
                <Link
                    href="/dashboard/records"
                    className={`flex items-center justify-center p-3 rounded-2xl min-w-[56px] min-h-[56px] transition-all duration-400 relative overflow-hidden ${pathname === '/dashboard/records' ? 'text-white' : 'text-white/50'
                        }`}
                >
                    <i className="fas fa-table text-[22px] relative z-10"></i>
                </Link>
                <Link
                    href="/dashboard/alerts"
                    className={`flex items-center justify-center p-3 rounded-2xl min-w-[56px] min-h-[56px] transition-all duration-400 relative overflow-hidden ${pathname === '/dashboard/alerts' ? 'text-white' : 'text-white/50'
                        }`}
                >
                    <i className="fas fa-bell text-[22px] relative z-10"></i>
                </Link>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        setSettingsOpen(true);
                    }}
                    className="flex items-center justify-center p-3 rounded-2xl min-w-[56px] min-h-[56px] text-white/50 transition-all duration-400 relative overflow-hidden"
                >
                    <i className="fas fa-cog text-[22px] relative z-10"></i>
                </button>
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

