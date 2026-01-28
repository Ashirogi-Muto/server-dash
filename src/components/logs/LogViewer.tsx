"use client";

import { useState, useEffect, useRef } from "react";
import { Download, Eraser, Pause, Play, Search, Terminal } from "lucide-react";
import clsx from "clsx";

interface LogEntry {
    timestamp: string;
    source: string;
    message: string;
    raw: string;
}

import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function LogViewer() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [source, setSource] = useState("journal");
    const [autoScroll, setAutoScroll] = useState(true);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchLogs = async () => {
        try {
            const res = await fetch(`/api/logs?source=${source}&limit=100`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 3000);
        return () => clearInterval(interval);
    }, [source]);

    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    const handleClear = async () => {
        try {
            const res = await fetch(`/api/logs?source=${source}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || "Failed to clear logs");
            } else {
                setLogs([]); // Immediate feedback
                setTimeout(fetchLogs, 1000); // Refresh shortly after
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsConfirmOpen(false);
        }
    };

    return (
        <>
            <div className="flex flex-col h-[calc(100vh-12rem)] rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between p-2 border-b border-white/10 bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                        <SelectSource value={source} onChange={setSource} />
                        <button
                            onClick={() => setAutoScroll(!autoScroll)}
                            className={clsx(
                                "p-1.5 rounded transition-colors flex items-center gap-2 text-xs font-medium",
                                autoScroll ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                            )}
                        >
                            {autoScroll ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                            {autoScroll ? "Live" : "Paused"}
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsConfirmOpen(true)}
                            className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
                            title="Clear Logs"
                        >
                            <Eraser className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Log Area */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 font-mono text-xs md:text-sm leading-relaxed text-zinc-300 space-y-1"
                >
                    {logs.length === 0 && (
                        <div className="text-zinc-500 italic">No logs found...</div>
                    )}
                    {logs.map((log, i) => (
                        <div key={i} className="hover:bg-white/5 px-2 -mx-2 rounded">
                            <LogLine content={log.message || log.raw} />
                        </div>
                    ))}
                </div>
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                title="Clear Logs?"
                description="This will permanently delete the current logs from the server. This action cannot be undone."
                confirmLabel="Clear Logs"
                isDestructive={true}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleClear}
            />
        </>
    );
}

function LogLine({ content }: { content: string }) {
    if (!content) return null;
    // Simple syntax highlighting
    if (content.toLowerCase().includes("error") || content.toLowerCase().includes("fail")) {
        return <span className="text-red-400">{content}</span>;
    }
    if (content.toLowerCase().includes("warn")) {
        return <span className="text-orange-400">{content}</span>;
    }
    if (content.includes("[AUTH]") || content.includes("ssh")) {
        return <span className="text-purple-400">{content}</span>;
    }
    return <span>{content}</span>;
}

function SelectSource({ value, onChange }: { value: string, onChange: (v: string) => void }) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-zinc-900 border border-white/10 rounded text-xs px-2 py-1 text-zinc-300 focus:outline-none focus:border-blue-500"
        >
            <option value="journal">systemd (journalctl)</option>
            <option value="/var/log/syslog">/var/log/syslog</option>
            <option value="/var/log/auth.log">/var/log/auth.log</option>
            <option value="/var/log/nginx/access.log">nginx (access)</option>
            <option value="/var/log/nginx/error.log">nginx (error)</option>
        </select>
    );
}
