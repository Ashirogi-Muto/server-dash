export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getSystemLogs, getFileLogs, clearSystemLogs, clearFileLogs } from "@/lib/system/logs";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const source = searchParams.get("source") || "journal";
        const limit = parseInt(searchParams.get("limit") || "100", 10);

        let logs;
        if (source === "journal") {
            logs = await getSystemLogs(limit);
        } else {
            logs = await getFileLogs(source, limit);
        }

        return NextResponse.json({ logs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const source = searchParams.get("source") || "journal";

        if (source === "journal") {
            await clearSystemLogs();
        } else {
            await clearFileLogs(source);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
