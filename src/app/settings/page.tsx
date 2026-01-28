"use client";

import { Shell } from "@/components/layout/Shell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Settings, Shield, User, Lock, Server } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

export default function SettingsPage() {
    return (
        <Shell>
            <PageHeader
                title="Settings"
                icon={Settings}
            />

            <div className="px-6 pb-8 max-w-4xl mx-auto space-y-8">

                {/* Profile Section */}
                <SettingsSection title="Profile & Authentication" icon={User}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputGroup label="Username" defaultValue="admin" disabled />
                            <InputGroup label="Email" defaultValue="admin@local" />
                        </div>
                        <div className="pt-4 border-t border-white/5">
                            <h4 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                                <Lock className="h-4 w-4" /> Change Password
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <InputGroup label="Current Password" type="password" />
                                <InputGroup label="New Password" type="password" />
                                <InputGroup label="Confirm Password" type="password" />
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-200 rounded text-sm transition-colors">
                                    Update Password
                                </button>
                            </div>
                        </div>
                    </div>
                </SettingsSection>

                {/* Server Config */}
                <SettingsSection title="Dashboard Configuration" icon={Server}>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded bg-white/5">
                            <div>
                                <div className="text-sm font-medium text-zinc-200">Refresh Rate</div>
                                <div className="text-xs text-zinc-500">Interval for polling system stats</div>
                            </div>
                            <select className="bg-black/20 border border-white/10 rounded text-sm px-2 py-1 text-zinc-300">
                                <option>1 second</option>
                                <option>2 seconds</option>
                                <option>5 seconds</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded bg-white/5">
                            <div>
                                <div className="text-sm font-medium text-zinc-200">Dark Mode</div>
                                <div className="text-xs text-zinc-500">Force dark theme (Recommended)</div>
                            </div>
                            <ToggleSwitch defaultChecked />
                        </div>
                    </div>
                </SettingsSection>

                {/* Danger Zone */}
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6">
                    <h3 className="text-red-400 font-medium flex items-center gap-2 mb-4">
                        <Shield className="h-4 w-4" /> Danger Zone
                    </h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-zinc-300">Factory Reset Dashboard</div>
                            <div className="text-xs text-zinc-500">Resets all dashboard preferences to default</div>
                        </div>
                        <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded text-sm transition-colors">
                            Reset Defaults
                        </button>
                    </div>
                </div>

            </div>
        </Shell>
    );
}

function SettingsSection({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-medium text-zinc-200 mb-6 flex items-center gap-2">
                <Icon className="h-5 w-5 text-zinc-400" />
                {title}
            </h3>
            {children}
        </div>
    );
}

function InputGroup({ label, type = "text", defaultValue, disabled }: { label: string, type?: string, defaultValue?: string, disabled?: boolean }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</label>
            <input
                type={type}
                defaultValue={defaultValue}
                disabled={disabled}
                className="w-full rounded bg-black/20 border border-white/10 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
        </div>
    );
}

function ToggleSwitch({ defaultChecked }: { defaultChecked?: boolean }) {
    const [checked, setChecked] = useState(defaultChecked);
    return (
        <button
            onClick={() => setChecked(!checked)}
            className={clsx(
                "relative h-6 w-11 rounded-full transition-colors focus:outline-none",
                checked ? "bg-emerald-600" : "bg-zinc-700"
            )}
        >
            <span
                className={clsx(
                    "absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform",
                    checked ? "translate-x-5" : "translate-x-0"
                )}
            />
        </button>
    );
}
