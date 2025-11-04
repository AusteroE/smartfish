import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const username = formData.get('username') as string;
        const email = formData.get('email') as string;
        const profileFile = formData.get('profile') as File | null;

        if (!username || !email) {
            return NextResponse.json(
                { success: false, error: 'Username and email are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Check if email already exists (for another user)
        const existingUser = await prisma.user.findFirst({
            where: {
                email,
                NOT: { id: user.userId },
            },
            select: { id: true },
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Email already exists' },
                { status: 400 }
            );
        }

        // Handle profile image upload
        let profileImage: string | undefined = undefined;
        if (profileFile && profileFile.size > 0) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(profileFile.type)) {
                return NextResponse.json(
                    { success: false, error: 'Invalid file type. Only JPEG, PNG, and GIF are allowed.' },
                    { status: 400 }
                );
            }

            if (profileFile.size > 10 * 1024 * 1024) {
                return NextResponse.json(
                    { success: false, error: 'File size is too large. Maximum allowed size is 10MB.' },
                    { status: 400 }
                );
            }

            // Generate unique filename
            const timestamp = Date.now();
            const extension = profileFile.name.split('.').pop();
            const filename = `profile_${timestamp}.${extension}`;

            profileImage = `uploads/profile_images/${filename}`;

            // Save file
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profile_images');
            await fs.mkdir(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, filename);
            const bytes = await profileFile.arrayBuffer();
            await fs.writeFile(filePath, Buffer.from(bytes));
        }

        // Update user
        const updateData: any = {
            username,
            email,
        };

        if (profileImage) {
            updateData.profileImage = profileImage;
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
                profileImage: true,
                role: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                profile_image: updatedUser.profileImage,
                role: updatedUser.role,
            },
        });
    } catch (error: any) {
        console.error('Profile update error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

