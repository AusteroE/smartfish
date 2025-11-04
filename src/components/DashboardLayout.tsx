'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Sidebar from './Sidebar';
import SettingsPanel from './SettingsPanel';
import PWAInstallPrompt from './PWAInstallPrompt';

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
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        // Determine which API endpoint to use based on the current route
        const isAdminRoute = pathname?.startsWith('/admin') || false;
        const apiEndpoint = isAdminRoute ? '/api/admin/user/me' : '/api/user/me';

        fetch(apiEndpoint, {
            credentials: 'include',
        })
            .then((res) => {
                // If unauthorized on admin route, don't redirect (AdminLayout handles it)
                if (res.status === 401 || res.status === 403) {
                    if (isAdminRoute) {
                        // AdminLayout will handle the redirect
                        setLoading(false);
                        return null;
                    }
                    // For non-admin routes, redirect to home
                    router.push('/');
                    return null;
                }
                return res.json();
            })
            .then((data) => {
                if (!data) return; // Already handled

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
                    if (!isAdminRoute) {
                        router.push('/');
                    }
                }
            })
            .catch(() => {
                if (!pathname?.startsWith('/admin')) {
                    router.push('/');
                }
            })
            .finally(() => setLoading(false));

        // Send keep-alive ping every 2 minutes to update lastSeen
        const keepAliveInterval = setInterval(() => {
            fetch('/api/user/keep-alive', {
                method: 'POST',
                credentials: 'include',
            }).catch(() => {
                // Silently fail if user is not authenticated
            });
        }, 120000); // 2 minutes

        return () => clearInterval(keepAliveInterval);
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
        <div className="min-h-screen bg-gradient-to-br from-[#0b1020] via-[#0b1020] to-[#0b1020] overflow-x-hidden">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden fixed top-4 left-4 z-[1001] w-10 h-10 flex items-center justify-center rounded-lg bg-[#121830] border border-white/8 text-[#e6e9ef] hover:bg-[#7c5cff]/20 transition-colors"
                aria-label="Open menu"
            >
                <i className="fas fa-bars text-lg"></i>
            </button>

            {/* Fixed Sidebar */}
            <Sidebar
                user={user}
                onSettingsClick={() => setSettingsOpen(true)}
                isMobileOpen={sidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
            />

            {/* Main Content */}
            <main className="flex-1 md:ml-[280px] p-4 sm:p-6 md:p-10 bg-transparent min-h-screen pb-20 md:pb-0 pt-14 md:pt-0">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Settings Panel */}
            <SettingsPanel
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                user={user}
                onUserUpdate={(updatedUser) => {
                    setUser({
                        ...updatedUser,
                        role: updatedUser.role || user.role,
                    });
                }}
            />

            {/* PWA Install Prompt */}
            <PWAInstallPrompt />

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-gradient-to-t from-white/6 to-white/2 backdrop-blur-[20px] shadow-[0_-8px_32px_rgba(0,0,0,0.4)] border-t border-white/8 flex justify-around items-center px-2 pt-3 pb-4 z-[1000] safe-area-inset-bottom">
                <Link
                    href={pathname?.startsWith('/admin') ? '/admin/dashboard' : '/dashboard'}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl min-w-[60px] min-h-[60px] transition-all duration-300 ${pathname === '/dashboard' || pathname === '/admin/dashboard' ? 'text-[#7c5cff] bg-[#7c5cff]/20' : 'text-white/50'}`}
                >
                    <i className="fas fa-home text-xl mb-1"></i>
                    <span className="text-[10px] font-medium">Home</span>
                </Link>
                {!pathname?.startsWith('/admin') && (
                    <>
                        <Link
                            href="/dashboard/records"
                            className={`flex flex-col items-center justify-center p-2 rounded-xl min-w-[60px] min-h-[60px] transition-all duration-300 ${pathname === '/dashboard/records' ? 'text-[#7c5cff] bg-[#7c5cff]/20' : 'text-white/50'}`}
                        >
                            <i className="fas fa-table text-xl mb-1"></i>
                            <span className="text-[10px] font-medium">Records</span>
                        </Link>
                        <Link
                            href="/dashboard/alerts"
                            className={`flex flex-col items-center justify-center p-2 rounded-xl min-w-[60px] min-h-[60px] transition-all duration-300 ${pathname === '/dashboard/alerts' ? 'text-[#7c5cff] bg-[#7c5cff]/20' : 'text-white/50'}`}
                        >
                            <i className="fas fa-bell text-xl mb-1"></i>
                            <span className="text-[10px] font-medium">Alerts</span>
                        </Link>
                    </>
                )}
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        setSettingsOpen(true);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl min-w-[60px] min-h-[60px] transition-all duration-300 ${settingsOpen ? 'text-[#7c5cff] bg-[#7c5cff]/20' : 'text-white/50'}`}
                >
                    <i className="fas fa-cog text-xl mb-1"></i>
                    <span className="text-[10px] font-medium">Settings</span>
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

