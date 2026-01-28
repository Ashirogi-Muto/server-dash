export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { resolvePath } from "@/lib/system/fs-utils";
import { ReadableOptions } from "stream";

// Helper to convert node stream to web stream
function nodeStreamToIterator(stream: fs.ReadStream) {
    return new ReadableStream({
        start(controller) {
            stream.on("data", (chunk) => controller.enqueue(chunk));
            stream.on("end", () => controller.close());
            stream.on("error", (err) => controller.error(err));
        },
    });
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const targetPath = searchParams.get("path");

        if (!targetPath) {
            return NextResponse.json({ error: "Path required" }, { status: 400 });
        }

        const absolutePath = resolvePath(targetPath);

        // Check if exists and is file
        const stats = fs.statSync(absolutePath);
        if (!stats.isFile()) {
            return NextResponse.json({ error: "Not a file" }, { status: 400 });
        }

        const stream = fs.createReadStream(absolutePath);

        // Return stream response
        return new NextResponse(nodeStreamToIterator(stream) as any, {
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${absolutePath.split('/').pop()}"`,
                "Content-Length": stats.size.toString(),
            },
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
