"use client";

import { useEffect, useState } from "react";
import { BadgeAlert, MoreHorizontal, Search, Trash2, Filter, X } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ScrollArea } from "@/components/ui/ScrollArea";
import clsx from "clsx";

interface Process {
    pid: number;
    user: string;
    cpu: number;
    mem: number;
    time: string;
    command: string;
}

interface FilterState {
    user: string;
    minCpu: string;
    minMem: string;
}

export function ProcessList() {
    const [processes, setProcesses] = useState<Process[]>([]);
    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(false);

    // Sorting
    const [sortConfig, setSortConfig] = useState<{ key: keyof Process | null, direction: 'asc' | 'desc' }>({ key: 'cpu', direction: 'desc' });

    // Advanced Filtering
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterState>({ user: "", minCpu: "", minMem: "" });
    const [tempFilters, setTempFilters] = useState<FilterState>({ user: "", minCpu: "", minMem: "" });

    // Kill Modal State
    const [killTarget, setKillTarget] = useState<Process | null>(null);

    // Derived unique users for filter dropdown
    const uniqueUsers = Array.from(new Set(processes.map(p => p.user))).sort();

    const fetchProcesses = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/processes");
            if (res.ok) {
                const data = await res.json();
                setProcesses(data.processes);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleKill = async () => {
        if (!killTarget) return;
        try {
            const res = await fetch("/api/processes", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pid: killTarget.pid, signal: "SIGTERM" })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to kill process");
            }

            fetchProcesses(); // Refresh
            setKillTarget(null);
        } catch (err: any) {
            alert(err.message);
            setKillTarget(null); // Close modal anyway? Or keep it? Let's close it so they can try again or see the error.
        }
    };

    const handleSort = (key: keyof Process) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            setSortConfig({ key: null, direction: 'asc' });
            return;
        }
        setSortConfig({ key, direction });
    };

    const handleFilterOpen = () => {
        if (!isFilterOpen) {
            setTempFilters({ ...activeFilters });
        }
        setIsFilterOpen(!isFilterOpen);
    };

    const handleFilterSave = () => {
        setActiveFilters({ ...tempFilters });
        setIsFilterOpen(false);
    };

    const handleFilterReset = () => {
        const reset = { user: "", minCpu: "", minMem: "" };
        setTempFilters(reset);
        setActiveFilters(reset);
        setIsFilterOpen(false);
    };

    const setTemp = (key: keyof FilterState, val: string) => setTempFilters(prev => ({ ...prev, [key]: val }));

    useEffect(() => {
        fetchProcesses();
        const interval = setInterval(fetchProcesses, 5000); // 5s refresh
        return () => clearInterval(interval);
    }, []);

    const filtered = processes.filter(p => {
        // Text Search
        const matchesSearch =
            p.command.toLowerCase().includes(filter.toLowerCase()) ||
            p.user.includes(filter) ||
            p.pid.toString().includes(filter);

        if (!matchesSearch) return false;

        // Advanced Filters
        if (activeFilters.user && p.user !== activeFilters.user) return false;
        if (activeFilters.minCpu && p.cpu < parseFloat(activeFilters.minCpu)) return false;
        if (activeFilters.minMem && p.mem < parseFloat(activeFilters.minMem)) return false;

        return true;
    });

    const sorted = [...filtered].sort((a, b) => {
        if (!sortConfig.key) return 0;

        const key = sortConfig.key;
        const valA = a[key];
        const valB = b[key];

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const hasActiveFilters = activeFilters.user || activeFilters.minCpu || activeFilters.minMem;

    return (
        <div className="rounded-lg border border-white/10 bg-zinc-900/50 overflow-hidden backdrop-blur-sm min-h-[400px] flex flex-col">
            <ConfirmModal
                isOpen={!!killTarget}
                title={`Kill CPU Process ${killTarget?.pid}?`}
                description={`Are you sure you want to terminate "${killTarget?.command}"? This could cause system instability.`}
                confirmLabel="Kill Process"
                isDestructive
                onClose={() => setKillTarget(null)}
                onConfirm={handleKill}
            />

            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/30">
                <div className="flex items-center gap-2 w-full max-w-md relative z-20">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search processes..."
                            className="w-full rounded-md border border-white/10 bg-black/20 py-2 pl-9 pr-4 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-blue-500/50 focus:outline-none"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    {/* Filter Button */}
                    <div className="relative">
                        <button
                            onClick={handleFilterOpen}
                            className={clsx(
                                "p-2 rounded-md border transition-colors",
                                isFilterOpen || hasActiveFilters ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-black/20 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                            )}
                            title="Filter Options"
                        >
                            <Filter className="h-4 w-4" />
                        </button>

                        {/* Filter Dropdown */}
                        {isFilterOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 rounded-lg border border-white/10 bg-zinc-900 shadow-xl p-4 z-50">
                                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Filters</span>
                                    <button onClick={() => setIsFilterOpen(false)}><X className="h-3 w-3 text-zinc-500 hover:text-white" /></button>
                                </div>

                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500 block">User</label>
                                        <select
                                            value={tempFilters.user}
                                            onChange={(e) => setTemp("user", e.target.value)}
                                            className="w-full bg-zinc-800 border border-white/10 rounded px-2 py-1.5 text-sm text-zinc-300 focus:border-blue-500 focus:outline-none appearance-none"
                                        >
                                            <option value="" className="bg-zinc-800 text-zinc-300">All Users</option>
                                            {uniqueUsers.map(u => <option key={u} value={u} className="bg-zinc-800 text-zinc-300">{u}</option>)}
                                        </select>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="space-y-1 flex-1">
                                            <label className="text-xs text-zinc-500 block">Min CPU %</label>
                                            <input
                                                type="number"
                                                value={tempFilters.minCpu}
                                                onChange={(e) => setTemp("minCpu", e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm text-zinc-300 focus:border-blue-500 focus:outline-none"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <label className="text-xs text-zinc-500 block">Min Mem %</label>
                                            <input
                                                type="number"
                                                value={tempFilters.minMem}
                                                onChange={(e) => setTemp("minMem", e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm text-zinc-300 focus:border-blue-500 focus:outline-none"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <button
                                            onClick={handleFilterReset}
                                            className="text-xs text-zinc-500 hover:text-zinc-300"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={handleFilterSave}
                                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded transition-colors"
                                        >
                                            Save Filters
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">
                        Total: <span className="text-zinc-300">{processes.length}</span>
                    </span>
                    <span className="text-xs text-zinc-500 border-l border-white/10 pl-2 ml-2">
                        Showing: <span className="text-zinc-300">{filtered.length}</span>
                    </span>
                </div>
            </div>

            {/* Table */}
            <ScrollArea className="flex-1 w-full" orientation="both">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-xs uppercase text-zinc-500 sticky top-0 bg-zinc-900/90 backdrop-blur z-10">
                        <tr>
                            <SortHeader label="PID" sortKey="pid" currentSort={sortConfig} onSort={handleSort} />
                            <SortHeader label="User" sortKey="user" currentSort={sortConfig} onSort={handleSort} />
                            <SortHeader label="%CPU" sortKey="cpu" currentSort={sortConfig} onSort={handleSort} />
                            <SortHeader label="%MEM" sortKey="mem" currentSort={sortConfig} onSort={handleSort} />
                            <SortHeader label="Time" sortKey="time" currentSort={sortConfig} onSort={handleSort} />
                            <SortHeader label="Command" sortKey="command" currentSort={sortConfig} onSort={handleSort} className="w-full" />
                            <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sorted.map((proc) => (
                            <tr key={proc.pid} className="hover:bg-white/5 transition-colors group">
                                <td className="px-4 py-3 font-mono text-zinc-400">{proc.pid}</td>
                                <td className="px-4 py-3 text-zinc-300">{proc.user}</td>
                                <td className={clsx("px-4 py-3 font-mono", proc.cpu > 10 ? "text-orange-400 font-bold" : "text-zinc-400")}>
                                    {proc.cpu.toFixed(1)}
                                </td>
                                <td className={clsx("px-4 py-3 font-mono", proc.mem > 10 ? "text-blue-400 font-bold" : "text-zinc-400")}>
                                    {proc.mem.toFixed(1)}
                                </td>
                                <td className="px-4 py-3 font-mono text-zinc-500">{proc.time}</td>
                                <td className="px-4 py-3 font-mono text-zinc-200 break-all max-w-md">
                                    {proc.command}
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => setKillTarget(proc)}
                                        className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </ScrollArea>
        </div>
    );
}

function SortHeader({ label, sortKey, currentSort, onSort, className }: {
    label: string,
    sortKey: keyof Process,
    currentSort: { key: keyof Process | null, direction: 'asc' | 'desc' },
    onSort: (key: keyof Process) => void,
    className?: string
}) {
    const isSorted = currentSort.key === sortKey;
    const direction = currentSort.direction;

    return (
        <th
            className={clsx("px-4 py-3 font-medium cursor-pointer hover:text-zinc-300 user-select-none", className)}
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center gap-1">
                {label}
                <div className="flex flex-col">
                    {isSorted && direction === 'asc' && <span className="text-[10px] leading-none">▲</span>}
                    {isSorted && direction === 'desc' && <span className="text-[10px] leading-none">▼</span>}
                    {!isSorted && <span className="text-[10px] leading-none opacity-20">▼</span>}
                </div>
            </div>
        </th>
    );
}
