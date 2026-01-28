"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Cpu,
    Files,
    Activity,
    TerminalSquare,
    Settings,
    LogOut,
    User,
    ChevronDown,
    LayoutDashboard
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

export function TopNav() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
            <div className="flex h-14 items-center justify-between px-6">
                {/* Left: Branding */}
                <div className="flex items-center gap-2 font-mono text-sm font-bold tracking-wider text-emerald-500">
                    <TerminalSquare className="h-5 w-5" />
                    <span>SERVER-DASH</span>
                </div>

                {/* Center: Navigation */}
                <nav className="flex items-center gap-1">
                    <NavGroup
                        label="Overview"
                        active={pathname === "/" || pathname === "/monitor"}
                        items={[
                            { label: "Dashboard", href: "/", icon: LayoutDashboard },
                            { label: "System Monitor", href: "/monitor", icon: Activity },
                        ]}
                    />

                    <NavGroup
                        label="Files"
                        active={pathname.startsWith("/files")}
                        items={[
                            { label: "File Manager", href: "/files", icon: Files },
                        ]}
                    />

                    <NavGroup
                        label="Control"
                        active={pathname.startsWith("/processes") || pathname.startsWith("/services") || pathname.startsWith("/terminal")}
                        items={[
                            { label: "Processes", href: "/processes", icon: Cpu },
                            { label: "Services", href: "/services", icon: Activity },
                            { label: "Terminal", href: "/terminal", icon: TerminalSquare },
                        ]}
                    />

                    <NavLink label="Logs" href="/logs" icon={TerminalSquare} active={pathname === "/logs"} />
                </nav>

                {/* Right: User Menu */}
                <div className="flex items-center gap-4">
                    <UserMenu />
                </div>
            </div>
        </header>
    );
}

function NavGroup({ label, items, active }: { label: string, items: { label: string, href: string, icon: any }[], active: boolean }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/5 rounded-md",
                    active ? "text-white bg-white/5" : "text-zinc-400 hover:text-white"
                )}
            >
                {label}
                <ChevronDown className="h-3 w-3 opacity-50" />
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full w-48 pt-1 z-50">
                    <div className="rounded-md border border-white/10 bg-zinc-900 shadow-xl p-1 grid gap-1">
                        {items.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white rounded-sm"
                                onClick={() => setIsOpen(false)}
                            >
                                <item.icon className="h-4 w-4 opacity-70" />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function NavLink({ label, href, icon: Icon, active }: { label: string, href: string, icon: any, active: boolean }) {
    return (
        <Link
            href={href}
            className={clsx(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/5 rounded-md",
                active ? "text-white bg-white/5" : "text-zinc-400 hover:text-white"
            )}
        >
            {label}
        </Link>
    );
}

function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
                <User className="h-4 w-4" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full w-48 pt-1 z-50">
                    <div className="rounded-md border border-white/10 bg-zinc-900 shadow-xl p-1 grid gap-1">
                        <div className="px-3 py-2 text-xs font-mono text-zinc-500 border-b border-white/5 mb-1">
                            admin@local
                        </div>
                        <Link
                            href="/settings"
                            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white rounded-sm"
                        >
                            <Settings className="h-4 w-4 opacity-70" />
                            Settings
                        </Link>
                        <div className="h-px bg-white/5 my-1" />
                        <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-sm text-left"
                        >
                            <LogOut className="h-4 w-4 opacity-70" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
