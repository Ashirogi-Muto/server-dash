export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { resolvePath, getFileStats } from "@/lib/system/fs-utils";

export async function POST(req: NextRequest) {
    try {
        const { path: targetPath } = await req.json();
        const absolutePath = resolvePath(targetPath || "/");

        const entries = await fs.readdir(absolutePath);

        // Process in parallel
        const files = await Promise.all(
            entries.map(async (entry) => {
                return getFileStats(path.join(absolutePath, entry));
            })
        );

        // Filter out nulls (access denied or deleted during read)
        const validFiles = files.filter(f => f !== null);

        // Sort: Dirs first, then files
        validFiles.sort((a, b) => {
            if (a!.type === b!.type) return a!.name.localeCompare(b!.name);
            return a!.type === "dir" ? -1 : 1;
        });

        return NextResponse.json({
            path: absolutePath,
            files: validFiles
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
