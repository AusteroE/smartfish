import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadProfileImage } from '@/lib/upload-server';

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const username = formData.get('username') as string;
        const email = formData.get('email') as string;
        const phoneNumber = formData.get('phoneNumber') as string | null;
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
            try {
                profileImage = await uploadProfileImage(profileFile);
            } catch (error: any) {
                return NextResponse.json(
                    { success: false, error: error.message || 'Failed to upload profile image' },
                    { status: 400 }
                );
            }
        }

        // Validate phone number format if provided
        if (phoneNumber && phoneNumber.trim()) {
            // Basic validation: should start with + and contain only digits after +
            const phoneRegex = /^\+[1-9]\d{1,14}$/;
            if (!phoneRegex.test(phoneNumber.trim())) {
                return NextResponse.json(
                    { success: false, error: 'Invalid phone number format. Use international format (e.g., +639123456789)' },
                    { status: 400 }
                );
            }
        }

        // Update user
        const updateData: any = {
            username,
            email,
        };

        if (phoneNumber !== null) {
            updateData.phoneNumber = phoneNumber.trim() || null;
        }

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
                phoneNumber: true,
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
                phone_number: updatedUser.phoneNumber,
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

