import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateVerificationToken, generateOTP, sendVerificationEmail } from '@/lib/email';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication
        const currentUser = await getAuthUser();

        if (!currentUser) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user is admin
        if (currentUser.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Forbidden - Admin access required' },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const username = formData.get('username') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const role = (formData.get('role') as string) || 'user';
        const skipEmailVerification = formData.get('skipEmailVerification') === 'true';
        const profileFile = formData.get('profile') as File | null;

        if (!username || !email || !password) {
            return NextResponse.json(
                { success: false, error: 'Username, email, and password are required' },
                { status: 400 }
            );
        }

        // Validate role
        if (role !== 'admin' && role !== 'user') {
            return NextResponse.json(
                { success: false, error: 'Invalid role. Must be "admin" or "user"' },
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

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Email already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Handle profile image upload
        let profileImage = 'frontend/img/default profile.png';
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

        // Generate verification token and OTP (even if skipping verification, we'll store them)
        const verificationToken = generateVerificationToken();
        const otpCode = generateOTP();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                profileImage,
                role: role as 'admin' | 'user',
                verificationToken,
                verificationExpires,
                otpCode,
                otpExpires,
                emailVerified: skipEmailVerification, // If admin skips verification, mark as verified
            },
        });

        // Send verification email only if not skipped
        if (!skipEmailVerification) {
            const emailSent = await sendVerificationEmail(email, username, verificationToken, otpCode);

            if (emailSent) {
                // Log verification attempt
                await prisma.emailVerificationLog.create({
                    data: {
                        userId: user.id,
                        email,
                        verificationType: 'signup',
                        token: verificationToken,
                        otpCode,
                        expiresAt: verificationExpires,
                    },
                });
            }
        } else {
            // Log that admin created the account without email verification
            await prisma.emailVerificationLog.create({
                data: {
                    userId: user.id,
                    email,
                    verificationType: 'signup',
                    token: verificationToken,
                    otpCode: null,
                    expiresAt: verificationExpires,
                    used: true, // Mark as used since admin created it
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: skipEmailVerification
                ? 'Account created successfully. Email verification skipped.'
                : 'Account created successfully. Verification email sent.',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error: any) {
        console.error('Admin create user error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

