export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getCpuUsage, getLoadAverage } from "@/lib/system/cpu";
import { getMemInfo } from "@/lib/system/mem";
import { getDiskInfo } from "@/lib/system/disk";
import { getNetworkStats } from "@/lib/system/network";
import { getOSInfo } from "@/lib/system/os";
import os from "os";

export async function GET() {
    try {
        const [cpu, mem, disks, host] = await Promise.all([
            getCpuUsage(),
            getMemInfo(),
            getDiskInfo(),
            getOSInfo()
        ]);

        const loadAvg = getLoadAverage();
        // Network stats
        const network = await getNetworkStats();

        return NextResponse.json({
            cpu,
            mem,
            disks,
            loadAvg,
            host,
            network
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
