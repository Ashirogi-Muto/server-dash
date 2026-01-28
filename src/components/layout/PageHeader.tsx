import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
    title: string;
    icon?: LucideIcon;
    actions?: React.ReactNode;
}

export function PageHeader({ title, icon: Icon, actions }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-6 py-4 backdrop-blur-sm mb-6">
            <div className="flex items-center gap-3">
                {Icon && <Icon className="h-5 w-5 text-zinc-400" />}
                <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
                    {title}
                </h1>
            </div>
            <div className="flex items-center gap-3">{actions}</div>
        </div>
    );
}
