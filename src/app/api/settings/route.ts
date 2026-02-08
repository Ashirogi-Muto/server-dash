import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/config';

export async function GET() {
    try {
        const settings = await getSettings();
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate inputs
        if (body.refreshRate) {
            const rate = parseInt(body.refreshRate);
            if (isNaN(rate) || rate < 1000 || rate > 60000) {
                return NextResponse.json({ error: 'Invalid refresh rate (1000-60000ms)' }, { status: 400 });
            }
        }

        // Only allow updating specific fields
        const updateData: any = {};
        if (body.refreshRate) updateData.refreshRate = body.refreshRate;

        const newSettings = await updateSettings(updateData);
        return NextResponse.json(newSettings);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
