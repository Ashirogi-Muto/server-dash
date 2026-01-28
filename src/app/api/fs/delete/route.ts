
import { NextRequest, NextResponse } from "next/server";
import { resolvePath } from "@/lib/system/fs-utils";
import fs from "fs/promises";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { path: filePath } = body;

        if (!filePath) {
            return NextResponse.json({ error: "Path required" }, { status: 400 });
        }

        const absolutePath = resolvePath(filePath);

        // Recursive delete for directories, normal for files
        await fs.rm(absolutePath, { recursive: true, force: true });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to delete" },
            { status: 500 }
        );
    }
}
