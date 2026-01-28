"use client";

import { useEffect, useState } from "react";
import { Activity, Play, Power, RotateCw, Square, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

interface Service {
    unit: string;
    description: string;
    active: string;
    sub: string;
    load: string;
}

interface NotificationState {
    type: 'pending' | 'success' | 'error';
    message: string;
}

export function ServiceList() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState<Record<string, NotificationState>>({});

    const fetchServices = async () => {
        try {
            const res = await fetch("/api/services");
            if (res.ok) {
                const data = await res.json();
                setServices(data.services);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAction = async (unit: string, action: string) => {
        const actionGerund = action === 'stop' ? 'Stopping' : action + 'ing';
        const actionPast = action === 'stop' ? 'stopped' : action + 'ed';

        setNotifications(prev => ({
            ...prev,
            [unit]: { type: 'pending', message: `${actionGerund} service...` }
        }));

        try {
            const res = await fetch("/api/services", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ unit, action })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Action failed");
            }

            setNotifications(prev => ({
                ...prev,
                [unit]: { type: 'success', message: `Service ${actionPast} successfully` }
            }));

            // Refresh list
            setTimeout(fetchServices, 1500);

            // Clear success message
            setTimeout(() => {
                setNotifications(prev => {
                    const next = { ...prev };
                    delete next[unit];
                    return next;
                });
            }, 4000);

        } catch (err: any) {
            setNotifications(prev => ({
                ...prev,
                [unit]: { type: 'error', message: err.message }
            }));

            // Clear error message
            setTimeout(() => {
                setNotifications(prev => {
                    const next = { ...prev };
                    delete next[unit];
                    return next;
                });
            }, 5000);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    return (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {services.map((svc) => (
                <div key={svc.unit} className="relative flex flex-col gap-3 rounded-lg border border-white/10 bg-zinc-900/50 p-4 transition-colors hover:border-white/20 overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-mono font-bold text-zinc-200 truncate max-w-[200px]" title={svc.unit}>{svc.unit}</h3>
                                <StatusBadge active={svc.active} sub={svc.sub} />
                            </div>
                            <p className="mt-1 text-sm text-zinc-500 line-clamp-1">{svc.description}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                        <div className="text-xs text-zinc-500 font-mono">
                            {svc.load} • {svc.sub}
                        </div>
                        <div className="flex items-center gap-1">
                            <ServiceActionBtn
                                icon={Play}
                                label="Start"
                                disabled={svc.active === 'active'}
                                onClick={() => handleAction(svc.unit, 'start')}
                            />
                            <ServiceActionBtn
                                icon={RotateCw}
                                label="Restart"
                                onClick={() => handleAction(svc.unit, 'restart')}
                            />
                            <ServiceActionBtn
                                icon={Square}
                                label="Stop"
                                disabled={svc.active === 'inactive'}
                                onClick={() => handleAction(svc.unit, 'stop')}
                            />
                        </div>
                    </div>

                    {/* Notification Overlay */}
                    {notifications[svc.unit] && (
                        <div className={clsx(
                            "absolute inset-0 flex items-center justify-center gap-2 p-4 text-sm font-medium backdrop-blur-md transition-all",
                            notifications[svc.unit].type === 'pending' && "bg-zinc-900/80 text-zinc-300",
                            notifications[svc.unit].type === 'success' && "bg-emerald-900/80 text-emerald-200",
                            notifications[svc.unit].type === 'error' && "bg-red-900/80 text-red-200"
                        )}>
                            {notifications[svc.unit].type === 'pending' && <Loader2 className="h-4 w-4 animate-spin" />}
                            {notifications[svc.unit].type === 'success' && <CheckCircle2 className="h-4 w-4" />}
                            {notifications[svc.unit].type === 'error' && <AlertCircle className="h-4 w-4" />}
                            <span>{notifications[svc.unit].message}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function StatusBadge({ active, sub }: { active: string, sub: string }) {
    const isRunning = active === 'active' && sub === 'running';
    const isFailed = active === 'failed' || sub === 'failed';

    return (
        <span className={clsx(
            "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            isRunning && "bg-emerald-500/10 text-emerald-400",
            isFailed && "bg-red-500/10 text-red-400",
            !isRunning && !isFailed && "bg-zinc-500/10 text-zinc-400",
        )}>
            {active}
        </span>
    );
}

function ServiceActionBtn({ icon: Icon, label, disabled, onClick }: { icon: any, label: string, disabled?: boolean, onClick: () => void }) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className="p-1.5 rounded text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
            title={label}
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}
