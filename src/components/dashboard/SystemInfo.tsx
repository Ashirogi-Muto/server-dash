"use client";

import { useEffect, useState } from "react";

interface SystemInfoData {
    host: {
        hostname: string;
        platform: string;
        kernel: string;
        distro: string;
        uptime: number;
    };
    loadAvg: number[];
}

export function SystemInfo() {
    const [info, setInfo] = useState<SystemInfoData | null>(null);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const res = await fetch("/api/system");
                if (res.ok) {
                    const data = await res.json();
                    setInfo(data);
                }
            } catch (err) {
                console.error("Failed to fetch system info", err);
            }
        };

        fetchInfo();
        const interval = setInterval(fetchInfo, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    // Skeleton loading state
    if (!info) {
        return (
            <div className="rounded-lg border border-white/10 bg-zinc-900/30 p-6 animate-pulse">
                <div className="h-4 w-32 bg-white/5 rounded mb-4" />
                <div className="grid gap-y-4 gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i}>
                            <div className="h-3 w-16 bg-white/5 rounded mb-2" />
                            <div className="h-4 w-24 bg-white/10 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-white/10 bg-zinc-900/30 p-6">
            <h3 className="mb-4 text-sm font-medium text-zinc-500 uppercase tracking-wider">System Information</h3>
            <div className="grid gap-y-4 gap-x-8 sm:grid-cols-2 lg:grid-cols-4 font-mono text-sm">
                <div>
                    <div className="text-zinc-500 text-xs text-nowrap">Hostname</div>
                    <div className="text-white truncate" title={info.host.hostname}>{info.host.hostname}</div>
                </div>
                <div>
                    <div className="text-zinc-500 text-xs text-nowrap">OS / Kernel</div>
                    <div className="text-white truncate" title={`${info.host.distro} / ${info.host.kernel}`}>
                        {info.host.distro}
                    </div>
                </div>
                <div>
                    <div className="text-zinc-500 text-xs text-nowrap">Uptime</div>
                    <div className="text-emerald-400">{formatUptime(info.host.uptime)}</div>
                </div>
                <div>
                    <div className="text-zinc-500 text-xs text-nowrap">Load Average</div>
                    <div className="text-white">
                        {info.loadAvg.map(n => n.toFixed(2)).join(", ")}
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatUptime(seconds: number) {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (parts.length === 0) return "0m";

    return parts.join(" ");
}
