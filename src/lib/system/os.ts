import fs from "fs/promises";
import os from "os";

export interface OSInfo {
    hostname: string;
    platform: string;
    kernel: string;
    distro: string;
    uptime: number;
}

export async function getOSInfo(): Promise<OSInfo> {
    let distro = "Unknown Linux";

    try {
        const osRelease = await fs.readFile("/etc/os-release", "utf-8");
        const lines = osRelease.split("\n");
        const nameLine = lines.find(l => l.startsWith("PRETTY_NAME="));
        if (nameLine) {
            distro = nameLine.split("=")[1].replace(/"/g, "");
        }
    } catch (e) {
        // Fallback or ignore
    }

    return {
        hostname: os.hostname(),
        platform: os.platform(),
        kernel: os.release(),
        distro,
        uptime: os.uptime()
    };
}
