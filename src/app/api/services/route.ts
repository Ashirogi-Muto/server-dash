export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServices, controlService } from "@/lib/system/services";

export async function GET() {
    try {
        const services = await getServices();
        return NextResponse.json({ services });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { unit, action } = await req.json();

        if (!unit || !action) {
            return NextResponse.json({ error: "Missing unit or action" }, { status: 400 });
        }

        await controlService(unit, action);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
