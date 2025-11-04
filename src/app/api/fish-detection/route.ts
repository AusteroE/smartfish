import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const userId = await verifyAuth(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { length, width, category, confidence } = body;

        if (!length || !width || !category) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields: length, width, category' },
                { status: 400 }
            );
        }

        // Validate category
        const validCategories = ['Small', 'Medium', 'Large'];
        if (!validCategories.includes(category)) {
            return NextResponse.json(
                { success: false, message: 'Invalid category. Must be Small, Medium, or Large' },
                { status: 400 }
            );
        }

        // Save detection to database
        const detection = await prisma.fishDetection.create({
            data: {
                userId: userId,
                detectedLength: parseFloat(length.toString()),
                detectedWidth: parseFloat(width.toString()),
                sizeCategory: category,
                confidenceScore: confidence ? parseFloat(confidence.toString()) : null,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Detection recorded successfully',
            data: detection,
        });
    } catch (error: any) {
        console.error('Fish detection error:', error);
        return NextResponse.json(
            { success: false, message: 'Error recording detection: ' + error.message },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const userId = await verifyAuth(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const category = searchParams.get('category');

        const where: any = { userId: userId };
        if (category) {
            where.sizeCategory = category;
        }

        const detections = await prisma.fishDetection.findMany({
            where,
            orderBy: { detectionTimestamp: 'desc' },
            take: limit,
        });

        return NextResponse.json({
            success: true,
            count: detections.length,
            data: detections,
        });
    } catch (error: any) {
        console.error('Get detections error:', error);
        return NextResponse.json(
            { success: false, message: 'Error fetching detections: ' + error.message },
            { status: 500 }
        );
    }
}

