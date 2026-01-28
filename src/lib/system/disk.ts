import { safeExec } from "./exec";

export interface DiskInfo {
    mount: string;
    total: number; // bytes
    used: number;
    available: number;
    usedPercent: number;
    fs: string;
}

export async function getDiskInfo(): Promise<DiskInfo[]> {
    // df -B1 --output=target,size,used,avail,pcent,source
    const { stdout } = await safeExec("df", ["-B1", "--output=target,size,used,avail,pcent,source"]);

    const lines = stdout.split("\n").slice(1);
    const disks: DiskInfo[] = [];

    for (const line of lines) {
        if (!line.trim()) continue;

        // Split by whitespace
        const parts = line.split(/\s+/);
        if (parts.length < 6) continue;

        const mount = parts[0];
        const total = parseInt(parts[1], 10);
        const used = parseInt(parts[2], 10);
        const available = parseInt(parts[3], 10);
        const pcentRaw = parts[4]; // includes %
        const fs = parts[5];

        // Filter out common pseudo-filesystems unless critical
        if (mount.startsWith("/run") || mount.startsWith("/sys") || mount.startsWith("/dev") || mount.startsWith("/snap")) {
            if (mount !== "/") continue;
        }

        disks.push({
            mount,
            total,
            used,
            available,
            usedPercent: parseFloat(pcentRaw.replace("%", "")),
            fs
        });
    }

    return disks;
}
