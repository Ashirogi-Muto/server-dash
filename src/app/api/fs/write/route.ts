
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { resolvePath } from "@/lib/system/fs-utils";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { path: filePath, content } = body;

        if (!filePath || typeof content !== 'string') {
            return NextResponse.json(
                { error: "Path and content are required" },
                { status: 400 }
            );
        }

        const absolutePath = resolvePath(filePath);
        await fs.writeFile(absolutePath, content, "utf-8");

        // get new stats
        const stats = await fs.stat(absolutePath);

        return NextResponse.json({
            success: true,
            size: stats.size
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to write file" },
            { status: 500 }
        );
    }
}
