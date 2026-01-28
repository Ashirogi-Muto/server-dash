import { Shell } from "@/components/layout/Shell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProcessList } from "@/components/processes/ProcessList";
import { Cpu } from "lucide-react";

export default function ProcessesPage() {
    return (
        <Shell>
            <PageHeader
                title="Processes"
                icon={Cpu}
                actions={
                    <div className="text-xs text-zinc-500">
                        Load Average: <span className="text-zinc-300">0.45 0.50 0.40</span>
                    </div>
                }
            />

            <div className="px-6 pb-8">
                <ProcessList />
            </div>
        </Shell>
    );
}
