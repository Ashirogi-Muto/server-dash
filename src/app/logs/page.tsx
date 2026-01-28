import { Shell } from "@/components/layout/Shell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LogViewer } from "@/components/logs/LogViewer";
import { TerminalSquare } from "lucide-react";

export default function LogsPage() {
    return (
        <Shell>
            <PageHeader
                title="System Logs"
                icon={TerminalSquare}
            />

            <div className="px-6 pb-8">
                <LogViewer />
            </div>
        </Shell>
    );
}
