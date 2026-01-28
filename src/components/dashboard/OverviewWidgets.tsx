"use client";

import { Cpu, HardDrive, Network, Zap } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    AreaChart,
    Area
} from "recharts";
import { clsx } from "clsx";

interface SystemStats {
    cpu: {
        usagePercent: number;
        user: number;
        sys: number;
        idle: number;
        total: number;
    };
    mem: {
        total: number;
        used: number;
        free: number;
        cached: number;
        swapTotal: number;
        usedPercent: number;
    };
    disks: {
        mount: string;
        used: number;
        total: number;
        usedPercent: number;
    }[];
    network: {
        rx_bytes: number;
        tx_bytes: number;
    };
}

const POLL_INTERVAL = 2000;

export function OverviewWidgets() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [rates, setRates] = useState({ rx: 0, tx: 0 });

    // Keep track of previous sample for rate calculation
    const lastSample = useRef<{ timestamp: number, rx: number, tx: number } | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/system");
                if (res.ok) {
                    const data: SystemStats = await res.json();
                    setStats(data);

                    const now = Date.now();

                    if (lastSample.current) {
                        const deltaMs = now - lastSample.current.timestamp;
                        const deltaRx = data.network.rx_bytes - lastSample.current.rx;
                        const deltaTx = data.network.tx_bytes - lastSample.current.tx;

                        // Avoid potential division by zero or negative time
                        if (deltaMs > 0) {
                            setRates({
                                rx: deltaRx * (1000 / deltaMs),
                                tx: deltaTx * (1000 / deltaMs)
                            });
                        }
                    }

                    lastSample.current = {
                        timestamp: now,
                        rx: data.network.rx_bytes,
                        tx: data.network.tx_bytes
                    };
                }
            } catch (err) {
                console.error("Failed to fetch system stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    if (loading || !stats) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-48 rounded-lg bg-white/5 border border-white/10" />
                ))}
            </div>
        );
    }

    // Derived Data
    const cpuData = [
        { name: "Used", value: stats.cpu.usagePercent, color: "#10b981" },
        { name: "Idle", value: 100 - stats.cpu.usagePercent, color: "#27272a" },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* CPU Widget */}
            <WidgetCard title="CPU Usage" icon={Cpu}>
                <div className="h-32 w-full flex items-center justify-between">
                    <div className="relative h-full aspect-square">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={cpuData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={35}
                                    outerRadius={45}
                                    startAngle={90}
                                    endAngle={-270}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {cpuData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-bold font-mono">{stats.cpu.usagePercent}%</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-zinc-400">Usage</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-zinc-800" />
                            <span className="text-zinc-400">Idle</span>
                        </div>
                    </div>
                </div>
            </WidgetCard>

            {/* RAM Widget */}
            <WidgetCard title="Memory" icon={Zap}>
                <div className="flex flex-col gap-4 py-2">
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-zinc-400">
                            <span>Used: {formatBytes(stats.mem.used)}</span>
                            <span>Total: {formatBytes(stats.mem.total)}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                            <div
                                className="h-full bg-orange-500 transition-all duration-500"
                                style={{ width: `${stats.mem.usedPercent}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-zinc-400">
                            <span>Cached: {formatBytes(stats.mem.cached)}</span>
                            <span>Free: {formatBytes(stats.mem.free)}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                            {/* Visualizing cached memory relative to total */}
                            <div
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${(stats.mem.cached / stats.mem.total) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </WidgetCard>

            {/* Disk Usage */}
            <WidgetCard title="Disk Usage" icon={HardDrive}>
                <div className="space-y-3 py-1 overflow-y-auto max-h-32 pr-1 custom-scrollbar">
                    {stats.disks.map((disk) => (
                        <div key={disk.mount} className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="font-mono text-zinc-300 truncate max-w-[80px]" title={disk.mount}>{disk.mount}</span>
                                <span className="text-zinc-500">{formatBytes(disk.used)} / {formatBytes(disk.total)}</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                                <div
                                    className={clsx("h-full transition-all duration-500", disk.usedPercent > 85 ? "bg-red-500" : "bg-zinc-500")}
                                    style={{ width: `${disk.usedPercent}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </WidgetCard>

            {/* Network Widget */}
            <WidgetCard title="Network" icon={Network}>
                <div className="grid grid-cols-2 gap-4 py-3">
                    <div className="text-center p-2 rounded bg-white/5">
                        <div className="text-xs text-zinc-500 mb-1">RX (In)</div>
                        <div className="text-lg font-mono font-bold text-emerald-400">
                            {formatBytes(rates.rx)}<span className="text-xs text-zinc-500 ml-1">/s</span>
                        </div>
                    </div>
                    <div className="text-center p-2 rounded bg-white/5">
                        <div className="text-xs text-zinc-500 mb-1">TX (Out)</div>
                        <div className="text-lg font-mono font-bold text-blue-400">
                            {formatBytes(rates.tx)}<span className="text-xs text-zinc-500 ml-1">/s</span>
                        </div>
                    </div>
                </div>
                <div className="text-center text-xs text-zinc-500 mt-2">
                    Total: {formatBytes(stats.network.rx_bytes + stats.network.tx_bytes)}
                </div>
            </WidgetCard>
        </div>
    );
}

function WidgetCard({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-4 shadow-sm backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
                <Icon className="h-4 w-4 text-zinc-500" />
            </div>
            {children}
        </div>
    );
}

function formatBytes(bytes: number, decimals = 1) {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
