"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';

const MAX_HISTORY = 60;

interface ChartDataPoint {
    time: string;
    cpu: number;
    memory: number;
    networkIn: number;
    networkOut: number;
}

export function MonitorCharts() {
    const [data, setData] = useState<ChartDataPoint[]>([]);

    useEffect(() => {
        // Fill initial buffer with empty points to maintain chart width
        const now = new Date();
        const initial: ChartDataPoint[] = [];
        for (let i = MAX_HISTORY; i > 0; i--) {
            const time = new Date(now.getTime() - i * 1000);
            initial.push({
                time: time.toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                cpu: 0, memory: 0, networkIn: 0, networkOut: 0
            });
        }
        setData(initial); // Reset

        const fetchData = async () => {
            try {
                const res = await fetch("/api/system");
                if (!res.ok) return;
                const sys = await res.json();

                setData(prev => {
                    const now = new Date();
                    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

                    const newPoint = {
                        time: timeStr,
                        cpu: sys.cpu.usagePercent,
                        memory: sys.mem.usedPercent,
                        networkIn: sys.network.rx_bytes / 1024, // KB
                        networkOut: sys.network.tx_bytes / 1024 // KB
                    };

                    const next = [...prev, newPoint];
                    if (next.length > MAX_HISTORY) next.shift();
                    return next;
                });
            } catch (err) {
                console.error("Monitor polling failed", err);
            }
        };

        const interval = setInterval(fetchData, 1000);
        return () => clearInterval(interval);
    }, []);

    const last = data[data.length - 1];

    return (
        <div className="space-y-6">
            {/* CPU Usage Chart */}
            <ChartCard title="Total CPU Usage" value={last ? `${last.cpu.toFixed(1)}%` : "..."}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={50}
                        />
                        <YAxis
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #333' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="cpu"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorCpu)"
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Memory Usage Chart */}
            <ChartCard title="Memory Usage" value={last ? `${last.memory.toFixed(1)}%` : "..."}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={50}
                        />
                        <YAxis
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #333' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="memory"
                            stroke="#f59e0b"
                            fillOpacity={1}
                            fill="url(#colorMem)"
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Network I/O Chart */}
            <ChartCard
                title="Network I/O"
                value={last ? `RX: ${last.networkIn.toFixed(1)} KB/s  TX: ${last.networkOut.toFixed(1)} KB/s` : "..."}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={50}
                        />
                        <YAxis
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #333' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="networkIn"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                            name="RX (In)"
                            isAnimationActive={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="networkOut"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={false}
                            name="TX (Out)"
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
}

function ChartCard({ title, value, children }: { title: string, value?: string, children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-4 shadow-sm backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
                {value && <span className="font-mono text-sm font-bold text-zinc-200">{value}</span>}
            </div>
            <div className="h-64 w-full">
                {children}
            </div>
        </div>
    );
}
