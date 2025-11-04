import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateSensorData } from './stream/route';

export async function GET(request: NextRequest) {
    try {
        const latestData = await prisma.sensorData.findFirst({
            orderBy: {
                timestamp: 'desc',
            },
            select: {
                ph: true,
                temperature: true,
            },
        });

        const response: any = {
            status: latestData ? 'success' : 'fetched',
            message: latestData ? 'Fetched latest data' : 'No data in database yet.',
            data: {
                ph: latestData?.ph ? Number(latestData.ph) : null,
                temperature: latestData?.temperature ? Number(latestData.temperature) : null,
            },
        };

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('IoT data fetch error:', error);
        return NextResponse.json(
            {
                status: 'error',
                message: 'Server error occurred',
                data: { ph: null, temperature: null },
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Handle both JSON and form-encoded data
        const contentType = request.headers.get('content-type') || '';
        let body: any;

        if (contentType.includes('application/json')) {
            body = await request.json();
        } else {
            // Handle form-encoded data
            const formData = await request.formData();
            body = {
                ph_value: formData.get('ph_value'),
                temperature: formData.get('temperature'),
            };
        }

        const phValue = parseFloat(body.ph_value);
        const temperature = parseFloat(body.temperature);

        if (isNaN(phValue) || isNaN(temperature)) {
            return NextResponse.json(
                { status: 'error', message: 'Invalid ph or temperature values' },
                { status: 400 }
            );
        }

        // Clear previous data first (optional - depends on your requirements)
        // await prisma.sensorData.deleteMany({});

        // Insert new data (Prisma handles Decimal conversion)
        await prisma.sensorData.create({
            data: {
                ph: phValue,
                temperature: temperature,
            },
        });

        // Update SSE stream with latest data
        updateSensorData(phValue, temperature);

        return NextResponse.json({
            status: 'success',
            message: 'Data inserted successfully',
            data: {
                ph: phValue,
                temperature: temperature,
            },
        });
    } catch (error: any) {
        console.error('IoT data insert error:', error);
        return NextResponse.json(
            { status: 'error', message: 'Server error occurred' },
            { status: 500 }
        );
    }
}
