import { TopNav } from "./TopNav";

export function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen flex-col bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30 selection:text-emerald-200">
            <TopNav />
            <main className="flex-1 min-h-0 overflow-y-auto container mx-auto max-w-7xl p-6 animate-in fade-in duration-500">
                {children}
            </main>
        </div>
    );
}
