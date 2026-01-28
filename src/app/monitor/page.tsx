import { Shell } from "@/components/layout/Shell";
import { PageHeader } from "@/components/layout/PageHeader";
import { MonitorCharts } from "@/components/monitor/MonitorCharts";
import { Activity, Pause, Play } from "lucide-react";

export default function SystemMonitorPage() {
    return (
        <Shell>
            <PageHeader
                title="System Monitor"
                icon={Activity}
                actions={
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-mono hidden sm:inline-block">Updating live (1s)</span>
                        <button className="flex items-center gap-2 rounded bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white">
                            <Pause className="h-3.5 w-3.5" />
                            Pause
                        </button>
                    </div>
                }
            />

            <div className="space-y-6 px-6 pb-8">
                <MonitorCharts />
            </div>
        </Shell>
    );
}
