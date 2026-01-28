"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface ContextMenuItem {
    label: string;
    icon?: any;
    onClick: () => void;
    danger?: boolean;
}

export interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };

        // Use a slight delay to avoid catching the same click that opened the menu
        const timeoutId = setTimeout(() => {
            document.addEventListener("click", handleClickOutside);
        }, 10);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener("click", handleClickOutside);
        };
    }, [onClose]);

    if (!mounted) return null;

    const handleItemClick = (item: ContextMenuItem) => {
        console.log("ContextMenu item clicked:", item.label);
        // Execute the action
        item.onClick();
        // Close the menu after action
        onClose();
    };

    return createPortal(
        <div
            ref={ref}
            className="fixed z-[9999] w-48 rounded-md border border-white/10 bg-zinc-900 shadow-xl overflow-hidden py-1"
            style={{ top: y, left: x }}
            onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
        >
            {items.map((item, i) => (
                <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleItemClick(item);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left cursor-pointer
                        ${item.danger
                            ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            : "text-zinc-300 hover:bg-white/10 hover:text-white"
                        }`}
                >
                    {item.icon && <item.icon className="h-4 w-4 opacity-70" />}
                    {item.label}
                </button>
            ))}
        </div>,
        document.body
    );
}
