
import { NextResponse } from "next/server";
import { getDiskInfo } from "@/lib/system/disk";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const disks = await getDiskInfo();
        return NextResponse.json({ disks });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
