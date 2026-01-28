"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

import { createPortal } from "react-dom";

export function ConfirmModal({
    isOpen,
    title,
    description,
    confirmLabel = "Confirm",
    isDestructive = false,
    onClose,
    onConfirm,
}: ConfirmModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setTimeout(() => setIsVisible(false), 200);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!mounted) return null;
    if (!isOpen && !isVisible) return null;

    return createPortal(
        <div className={clsx("fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200", isOpen ? "opacity-100" : "opacity-0")}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={clsx(
                "relative w-full max-w-md overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-2xl ring-1 ring-white/10 p-6 transform transition-all duration-200",
                isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
            )}>
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex items-start gap-4">
                    <div className={clsx("rounded-full p-2 shrink-0", isDestructive ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500")}>
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
                        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                            {description}
                        </p>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onConfirm}
                                className={clsx(
                                    "px-4 py-2 rounded text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900",
                                    isDestructive
                                        ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                                        : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                                )}
                            >
                                {confirmLabel}
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
