'use client';

import { useState } from 'react';
import { useSettings } from '@/providers/SettingsProvider';
import { Moon, Sun, Clock, Lock, ShieldCheck, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';

export default function SettingsPage() {
    const { theme, setTheme, refreshRate, setRefreshRate } = useSettings();
    const [activeTab, setActiveTab] = useState<'appearance' | 'security'>('appearance');

    return (
        <Shell>
            <PageHeader title="Settings" icon={Settings} />

            <div className="p-6 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar Navigation */}
                    <div className="w-full md:w-64 flex flex-col gap-2">
                        <button
                            onClick={() => setActiveTab('appearance')}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                activeTab === 'appearance'
                                    ? "bg-blue-600/10 text-blue-400 border border-blue-600/20"
                                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <Sun className="h-4 w-4" />
                            Appearance & System
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                activeTab === 'security'
                                    ? "bg-blue-600/10 text-blue-400 border border-blue-600/20"
                                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Security
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-6 min-h-[400px]">
                        {activeTab === 'appearance' && (
                            <div className="space-y-8">
                                {/* Theme Section */}
                                <div>
                                    <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                                        <Moon className="h-5 w-5 text-zinc-400" />
                                        Theme Preference
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4 max-w-sm">
                                        <button
                                            onClick={() => setTheme('dark')}
                                            className={clsx(
                                                "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
                                                theme === 'dark'
                                                    ? "bg-zinc-950 border-blue-500 ring-1 ring-blue-500"
                                                    : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700"
                                            )}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700" />
                                            <span className="text-sm font-medium text-zinc-300">Dark Mode</span>
                                        </button>
                                        <button
                                            onClick={() => setTheme('light')}
                                            className={clsx(
                                                "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
                                                theme === 'light'
                                                    ? "bg-white border-blue-500 ring-1 ring-blue-500"
                                                    : "bg-white/5 border-zinc-800 hover:border-zinc-700"
                                            )}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-zinc-200 border border-zinc-300" />
                                            <span className="text-sm font-medium text-zinc-300">Light Mode</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="h-px bg-zinc-800" />

                                {/* Refresh Rate Section */}
                                <div>
                                    <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-zinc-400" />
                                        Dashboard Refresh Rate
                                    </h2>
                                    <p className="text-sm text-zinc-400 mb-4">
                                        Control how often the system metrics are updated. Lower values provide more real-time data but consume more resources.
                                    </p>

                                    <div className="space-y-4 max-w-md">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-400">Update Interval</span>
                                            <span className="text-blue-400 font-mono font-bold">{refreshRate / 1000}s</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1000"
                                            max="10000"
                                            step="1000"
                                            value={refreshRate}
                                            onChange={(e) => setRefreshRate(parseInt(e.target.value))}
                                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        />
                                        <div className="flex justify-between text-xs text-zinc-500">
                                            <span>1s (Fast)</span>
                                            <span>5s (Normal)</span>
                                            <span>10s (Slow)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && <ChangePasswordForm />}
                    </div>
                </div>
            </div>
        </Shell>
    );
}

function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 4) {
            setError('New password must be at least 4 characters');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage('Password updated successfully');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setError(data.error || 'Failed to update password');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-zinc-400" />
                Change Password
            </h2>

            <form onSubmit={handleSubmit} className="max-w-md">
                {message && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded mb-4 text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full p-2 rounded bg-gray-950 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-2 rounded bg-gray-950 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-2 rounded bg-gray-950 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded font-medium transition-colors w-full"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
}
