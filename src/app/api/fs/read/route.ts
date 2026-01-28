import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { resolvePath, getFileStats } from "@/lib/system/fs-utils";

export const dynamic = 'force-dynamic'; // Disable caching

export async function POST(req: NextRequest) {
    let fileHandle: fs.FileHandle | undefined;
    try {
        const body = await req.json();
        const { path: filePath, offset = 0, limit = 1024 * 1024 } = body; // default 1MB chunk

        if (!filePath) {
            return NextResponse.json({ error: "Path required" }, { status: 400 });
        }

        const absolutePath = resolvePath(filePath);

        // specific check for directories
        const stats = await getFileStats(absolutePath);
        if (stats && stats.type === 'dir') {
            return NextResponse.json({ error: "Cannot read directory" }, { status: 400 });
        }

        // Use low-level file operations for chunking
        fileHandle = await fs.open(absolutePath, 'r');
        const fileStats = await fileHandle.stat();

        const buffer = Buffer.alloc(Math.min(limit, fileStats.size - offset));

        if (buffer.length === 0) {
            await fileHandle.close();
            return NextResponse.json({
                content: "",
                hasMore: false,
                nextOffset: offset,
                totalSize: fileStats.size
            });
        }

        const { bytesRead } = await fileHandle.read(buffer, 0, buffer.length, offset);
        const content = buffer.toString('utf-8', 0, bytesRead);

        await fileHandle.close();

        return NextResponse.json({
            content,
            hasMore: offset + bytesRead < fileStats.size,
            nextOffset: offset + bytesRead,
            totalSize: fileStats.size
        });

    } catch (error: any) {
        if (fileHandle) await fileHandle.close();
        return NextResponse.json(
            { error: error.message || "Failed to read file" },
            { status: 500 }
        );
    }
}
