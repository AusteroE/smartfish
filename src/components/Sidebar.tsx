'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface User {
    id: number;
    username: string;
    email: string;
    profile_image: string;
    role: string;
}

interface SidebarProps {
    user: User;
    onSettingsClick: () => void;
}

export default function Sidebar({ user, onSettingsClick }: SidebarProps) {
    const pathname = usePathname();

    const isAdmin = user.role === 'admin';

    const navItems = isAdmin
        ? [
            { href: '/admin/dashboard', icon: 'fa-home', label: 'Dashboard' },
            { href: '/admin/users/create', icon: 'fa-user-plus', label: 'Create User' },
            { href: '/dashboard', icon: 'fa-chart-line', label: 'User Dashboard' },
            { href: '/dashboard/records', icon: 'fa-table', label: 'Records' },
            { href: '/dashboard/alerts', icon: 'fa-bell', label: 'Alerts' },
        ]
        : [
            { href: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
            { href: '/dashboard/records', icon: 'fa-table', label: 'Records' },
            { href: '/dashboard/alerts', icon: 'fa-bell', label: 'Alerts' },
        ];

    const getProfileImageSrc = () => {
        if (user.profile_image?.startsWith('/')) {
            return user.profile_image;
        }
        if (user.profile_image?.startsWith('frontend/')) {
            return `/${user.profile_image}`;
        }
        return `/frontend/img/${user.profile_image || 'default profile.png'}`;
    };

    return (
        <aside className="fixed top-0 left-0 h-screen w-[280px] bg-[#121830] border-r border-white/8 overflow-y-auto z-[1000] px-5 py-8">
            {/* Sidebar Header */}
            <div className="mb-10">
                <div className="flex justify-center mb-5">
                    <Image
                        src={getProfileImageSrc()}
                        alt="Profile Picture"
                        width={100}
                        height={100}
                        className="rounded-full object-cover border-[3px] border-white/10"
                        onError={(e) => {
                            e.currentTarget.src = '/frontend/img/default profile.png';
                        }}
                    />
                </div>
                <h2 className="text-xl font-bold text-center text-[#e6e9ef]">
                    Welcome, <span className="text-[#7c5cff]">{user.username}</span>
                </h2>
            </div>

            {/* Navigation */}
            <nav>
                <ul className="space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center px-[18px] py-[14px] rounded-xl transition-all duration-300 font-medium ${isActive
                                        ? 'bg-[#7c5cff]/25 border border-[#7c5cff]/45 text-white'
                                        : 'text-[#e6e9ef] hover:bg-[#7c5cff]/20 hover:border hover:border-[#7c5cff]/35'
                                        }`}
                                >
                                    <i className={`fas ${item.icon} mr-3 w-5 text-lg`}></i>
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                    <li>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onSettingsClick();
                            }}
                            className="flex items-center px-[18px] py-[14px] rounded-xl transition-all duration-300 font-medium text-[#e6e9ef] hover:bg-[#7c5cff]/20 hover:border hover:border-[#7c5cff]/35"
                        >
                            <i className="fas fa-cog mr-3 w-5 text-lg"></i>
                            Settings
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
    );
}

