import fs from "fs/promises";

interface MemInfo {
    total: number;
    free: number;
    available: number;
    buffers: number;
    cached: number;
    swapTotal: number;
    swapFree: number;
    used: number;
    usedPercent: number;
}

export async function getMemInfo(): Promise<MemInfo> {
    const content = await fs.readFile("/proc/meminfo", "utf-8");

    const parse = (key: string) => {
        const match = content.match(new RegExp(`${key}:\\s+(\\d+)`));
        return match ? parseInt(match[1], 10) * 1024 : 0; // Convert kB to Bytes
    };

    const total = parse("MemTotal");
    const free = parse("MemFree");
    const available = parse("MemAvailable");
    const buffers = parse("Buffers");
    const cached = parse("Cached");
    const swapTotal = parse("SwapTotal");
    const swapFree = parse("SwapFree");

    const used = total - available; // More accurate for Linux
    const usedPercent = total > 0 ? (used / total) * 100 : 0;

    return {
        total,
        free,
        available,
        buffers,
        cached,
        swapTotal,
        swapFree,
        used,
        usedPercent: Math.round(usedPercent * 10) / 10
    };
}
