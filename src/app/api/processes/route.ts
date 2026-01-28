export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getRunningProcesses, killProcess } from "@/lib/system/processes";

export async function GET() {
    try {
        const processes = await getRunningProcesses();
        return NextResponse.json({ processes });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { pid, signal } = await req.json();

        if (!pid || typeof pid !== "number") {
            return NextResponse.json({ error: "Invalid PID" }, { status: 400 });
        }

        await killProcess(pid, signal || "SIGTERM");
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
