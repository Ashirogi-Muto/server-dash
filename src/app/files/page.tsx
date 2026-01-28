import { Shell } from "@/components/layout/Shell";
import { PageHeader } from "@/components/layout/PageHeader";
import { FileBrowser } from "@/components/files/FileBrowser";
import { Files } from "lucide-react";

export default function FileManagerPage() {
    return (
        <Shell>
            <PageHeader
                title="File Manager"
                icon={Files}
                actions={
                    <div className="text-xs text-zinc-500">
                        <span className="font-mono">/var/log</span> (Free: 24GB)
                    </div>
                }
            />

            <div className="px-6 pb-8">
                <FileBrowser />
            </div>
        </Shell>
    );
}
