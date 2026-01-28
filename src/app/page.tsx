import { Shell } from "@/components/layout/Shell";
import { PageHeader } from "@/components/layout/PageHeader";
import { OverviewWidgets } from "@/components/dashboard/OverviewWidgets";
import { SystemInfo } from "@/components/dashboard/SystemInfo";
import { LayoutDashboard, RefreshCcw } from "lucide-react";

export default function Home() {
  return (
    <Shell>
      <PageHeader
        title="Dashboard"
        icon={LayoutDashboard}
        actions={
          <button className="flex items-center gap-2 rounded bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white">
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </button>
        }
      />

      <div className="space-y-6 px-6 pb-8">
        <OverviewWidgets />

        {/* System Info Section */}
        <SystemInfo />
      </div>
    </Shell>
  );
}
