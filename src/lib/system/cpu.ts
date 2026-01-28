import fs from "fs/promises";
import os from "os";

interface CpuUsage {
    total: number;
    user: number;
    nice: number;
    sys: number;
    idle: number;
    irq: number;
    usagePercent: number;
}

let lastCpuInfo: { user: number; nice: number; sys: number; idle: number; irq: number; total: number } | null = null;

export async function getCpuUsage(): Promise<CpuUsage> {
    // Use os.cpus() for cross-platform fallback, but on Linux /proc/stat is often preferred for aggregate
    // For simplicity and reliability in Node, os.cpus() is actually quite good
    const cpus = os.cpus();

    let user = 0;
    let nice = 0;
    let sys = 0;
    let idle = 0;
    let irq = 0;

    for (const cpu of cpus) {
        user += cpu.times.user;
        nice += cpu.times.nice;
        sys += cpu.times.sys;
        idle += cpu.times.idle;
        irq += cpu.times.irq;
    }

    const total = user + nice + sys + idle + irq;

    let usagePercent = 0;

    if (lastCpuInfo) {
        const deltaTotal = total - lastCpuInfo.total;
        const deltaIdle = idle - lastCpuInfo.idle;

        if (deltaTotal > 0) {
            usagePercent = ((deltaTotal - deltaIdle) / deltaTotal) * 100;
        }
    }

    // Update last state
    lastCpuInfo = { user, nice, sys, idle, irq, total };

    return {
        total,
        user,
        nice,
        sys,
        idle,
        irq,
        usagePercent: Math.round(usagePercent * 10) / 10
    };
}

export function getLoadAverage(): number[] {
    return os.loadavg();
}
