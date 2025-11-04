import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        // Fetch user statistics
        const totalUsers = await prisma.user.count();
        const adminCount = await prisma.user.count({ where: { role: 'admin' } });
        const regularUserCount = await prisma.user.count({ where: { role: 'user' } });

        // Fetch all users
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                profileImage: true,
                role: true,
                emailVerified: true,
                createdAt: true,
            },
            orderBy: {
                id: 'desc',
            },
        });

        return NextResponse.json({
            success: true,
            stats: {
                total: totalUsers,
                admins: adminCount,
                users: regularUserCount,
            },
            users: users.map(user => ({
                id: user.id,
                username: user.username,
                email: user.email,
                profile_image: user.profileImage,
                role: user.role,
                email_verified: user.emailVerified,
                created_at: user.createdAt,
                status: 'active', // Default status for compatibility
            })),
        });
    } catch (error: any) {
        console.error('Admin users fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

