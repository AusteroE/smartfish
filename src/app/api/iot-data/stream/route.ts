import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

// Store the latest sensor data in memory for SSE (shared across requests)
let latestSensorData: { ph: number | null; temperature: number | null; timestamp: number } = {
    ph: null,
    temperature: null,
    timestamp: Date.now(),
};

// Function to update sensor data (called by POST endpoint)
export function updateSensorData(ph: number, temperature: number) {
    latestSensorData = {
        ph,
        temperature,
        timestamp: Date.now(),
    };
}

// Get current sensor data
export function getLatestSensorData() {
    return latestSensorData;
}

// SSE endpoint for real-time sensor data
export async function GET(request: NextRequest) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // Send initial data
            const sendData = (data: typeof latestSensorData) => {
                const message = `data: ${JSON.stringify(data)}\n\n`;
                controller.enqueue(encoder.encode(message));
            };

            // Send current data immediately
            sendData(latestSensorData);

            // Set up interval to check for updates
            let lastSentTimestamp = latestSensorData.timestamp;
            const interval = setInterval(async () => {
                try {
                    // Check if in-memory data has been updated
                    if (latestSensorData.timestamp > lastSentTimestamp) {
                        sendData(latestSensorData);
                        lastSentTimestamp = latestSensorData.timestamp;
                    } else {
                        // Fallback: Get latest from database
                        const dbData = await prisma.sensorData.findFirst({
                            orderBy: { timestamp: 'desc' },
                            select: { ph: true, temperature: true, timestamp: true },
                        });

                        if (dbData) {
                            const dbTimestamp = dbData.timestamp.getTime();
                            // Only send if data is newer or different
                            if (
                                dbTimestamp > lastSentTimestamp ||
                                (dbData.ph !== latestSensorData.ph || dbData.temperature !== latestSensorData.temperature)
                            ) {
                                const newData = {
                                    ph: dbData.ph ? Number(dbData.ph) : null,
                                    temperature: dbData.temperature ? Number(dbData.temperature) : null,
                                    timestamp: dbTimestamp,
                                };
                                latestSensorData = newData;
                                sendData(newData);
                                lastSentTimestamp = dbTimestamp;
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error in SSE stream:', error);
                }
            }, 500); // Check every 500ms for real-time updates

            // Clean up on client disconnect
            request.signal.addEventListener('abort', () => {
                clearInterval(interval);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable buffering in nginx
        },
    });
}

