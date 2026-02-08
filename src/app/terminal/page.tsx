import NextDynamic from 'next/dynamic';
import { Terminal as TerminalIcon } from "lucide-react";
import { Shell } from "@/components/layout/Shell";

const Terminal = NextDynamic(() => import("@/components/terminal/Terminal"), { ssr: false });

// Prevent static generation - this page uses server-side terminal
export const dynamic = 'force-dynamic';
export default function TerminalPage() {
    return (
        <Shell>
            <div className="flex h-full flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                        <TerminalIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Terminal</h1>
                        <p className="text-sm text-zinc-400">Direct shell access to the server</p>
                    </div>
                </div>

                <div className="flex-1 min-h-0 bg-zinc-900 rounded-xl border border-white/10 shadow-2xl overflow-hidden">
                    <Terminal className="h-full w-full" />
                </div>
            </div>
        </Shell>
    );
}
