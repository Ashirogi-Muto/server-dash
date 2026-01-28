"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, HardDrive, Folder, File, Loader2, Pen, X } from "lucide-react";
import clsx from "clsx";

// Types
interface FileNode {
    name: string;
    type: "dir" | "file";
    path?: string; // We might need to construct this
}

interface FileTreeProps {
    onNavigate: (path: string) => void;
    currentPath: string;
    pinnedPaths: string[];
    onUnpin: (path: string) => void;
}

export function FileTree({ onNavigate, currentPath, pinnedPaths, onUnpin }: FileTreeProps) {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="text-sm font-mono text-zinc-300">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-500 mb-2 px-2 uppercase tracking-wider group">
                <span>DRIVES</span>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={clsx(
                        "p-1 rounded hover:bg-white/10 transition-colors",
                        isEditing ? "text-white bg-white/10" : "text-zinc-600 hover:text-zinc-400"
                    )}
                    title="Edit Pinned Folders"
                >
                    <Pen className="h-3 w-3" />
                </button>
            </div>

            <div className="space-y-0.5">
                {pinnedPaths.map(path => (
                    <div key={path} className="relative flex items-center group/item">
                        {isEditing && (
                            <button
                                onClick={() => onUnpin(path)}
                                className="absolute left-0 z-10 p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded"
                                title="Unpin"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                        <div className={clsx("flex-1 overflow-hidden", isEditing && "pl-6 opacity-70 pointer-events-none")}>
                            <FileTreeNode
                                name={path === "/" ? "Root (/)" : path.split("/").pop() || path}
                                path={path}
                                type="dir"
                                isRoot={true}
                                onNavigate={onNavigate}
                                activePath={currentPath}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {pinnedPaths.length === 0 && (
                <div className="px-2 py-4 text-xs text-zinc-600 italic text-center border border-dashed border-white/5 rounded mx-2">
                    No pinned folders.<br />Right-click a folder to pin.
                </div>
            )}
        </div>
    );
}

interface TreeNodeProps {
    name: string;
    path: string;
    type: "dir" | "file";
    isRoot?: boolean;
    onNavigate: (path: string) => void;
    activePath: string;
}

function FileTreeNode({ name, path, type, isRoot, onNavigate, activePath }: TreeNodeProps) {
    const [expanded, setExpanded] = useState(false);
    const [children, setChildren] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const handleExpandChain = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (expanded) {
            setExpanded(false);
            return;
        }

        setExpanded(true);
        if (!loaded) {
            setLoading(true);
            try {
                const res = await fetch("/api/fs/list", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setChildren(data.files || []);
                    setLoaded(true);
                }
            } catch (err) {
                console.error("Failed to load tree node", err);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onNavigate(path);
    };

    // Construct full path for children
    // If current path is "/", child is "/name".
    // If current path is "/foo", child is "/foo/name".
    const getChildPath = (childName: string) => {
        if (path === "/") return `/${childName}`;
        return `${path}/${childName}`;
    };

    return (
        <div className="select-none">
            <div
                className={clsx(
                    "flex items-center gap-1 py-1 px-1 rounded cursor-pointer transition-colors hover:bg-white/5",
                    activePath === path && "bg-blue-500/20 text-blue-300"
                )}
                onClick={handleClick}
            >
                {/* Expander */}
                <button
                    onClick={handleExpandChain}
                    className={clsx(
                        "p-0.5 rounded hover:bg-white/10 text-zinc-500 hover:text-white",
                        (type !== "dir" && !isRoot) && "invisible pointer-events-none"
                    )}
                >
                    {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : expanded ? (
                        <ChevronDown className="h-3 w-3" />
                    ) : (
                        <ChevronRight className="h-3 w-3" />
                    )}
                </button>

                {/* Icon */}
                {isRoot ? (
                    <HardDrive className="h-4 w-4 text-zinc-400" />
                ) : type === "dir" ? (
                    <Folder className="h-4 w-4 text-blue-400" />
                ) : (
                    <File className="h-4 w-4 text-zinc-500" />
                )}

                {/* Name */}
                <span className="truncate">{name}</span>
            </div>

            {/* Children */}
            {expanded && (
                <div className="pl-3.5 border-l border-white/5 ml-2.5">
                    {children.length === 0 && loaded ? (
                        <div className="pl-2 py-1 text-xs text-zinc-600 italic">Empty</div>
                    ) : (
                        children.map(child => (
                            <FileTreeNode
                                key={child.name}
                                name={child.name}
                                path={getChildPath(child.name)}
                                type={child.type}
                                onNavigate={onNavigate}
                                activePath={activePath}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
