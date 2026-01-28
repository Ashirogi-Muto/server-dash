
import { NextRequest, NextResponse } from "next/server";
import { resolvePath, getFileStats } from "@/lib/system/fs-utils";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { path: filePath } = body;

        if (!filePath) {
            return NextResponse.json({ error: "Path required" }, { status: 400 });
        }

        const absolutePath = resolvePath(filePath);
        const stats = await getFileStats(absolutePath);

        if (!stats) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        return NextResponse.json(stats);

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to get file stats" },
            { status: 500 }
        );
    }
}
