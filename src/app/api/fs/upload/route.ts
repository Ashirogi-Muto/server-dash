
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { resolvePath } from "@/lib/system/fs-utils";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const targetDir = formData.get("path") as string;

        if (!file || !targetDir) {
            return NextResponse.json({ error: "Missing file or path" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const safeDir = resolvePath(targetDir);
        const filePath = path.join(safeDir, file.name);

        await fs.writeFile(filePath, Buffer.from(buffer));

        return NextResponse.json({ success: true, path: filePath });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
