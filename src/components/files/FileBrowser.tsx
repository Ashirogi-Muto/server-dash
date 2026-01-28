"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
    Folder,
    FileText,
    FileCode,
    ChevronDown,
    Download,
    Trash2,
    Upload,
    FileImage,
    FileArchive,
    Copy,
    Eye,
    Pin
} from "lucide-react";
import clsx from "clsx";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { FileViewer } from "./FileViewer";
import { FileTree } from "./FileTree";

// Types
type FileType = "dir" | "file";
interface FileNode {
    name: string;
    type: FileType;
    size?: string;
    permissions: string;
    modTime: string;
    children?: FileNode[];
}

interface ContextMenuState {
    x: number;
    y: number;
    file: FileNode;
}

export function FileBrowser() {
    const [currentPath, setCurrentPath] = useState("/");
    const [files, setFiles] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<string[]>(["/"]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pinnedPaths, setPinnedPaths] = useState<string[]>(["/"]);
    const [viewerPath, setViewerPath] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Load pins on mount
    useEffect(() => {
        const saved = localStorage.getItem("server-dash-pins");
        if (saved) {
            try {
                setPinnedPaths(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse pins", e);
            }
        }
    }, []);

    // Save pins on change
    useEffect(() => {
        localStorage.setItem("server-dash-pins", JSON.stringify(pinnedPaths));
    }, [pinnedPaths]);

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setContextMenu(null);
            }
        };

        if (contextMenu) {
            // Add a small delay to avoid the menu closing immediately
            const timer = setTimeout(() => {
                document.addEventListener("click", handleClick);
                document.addEventListener("keydown", handleKeyDown);
            }, 50);

            return () => {
                clearTimeout(timer);
                document.removeEventListener("click", handleClick);
                document.removeEventListener("keydown", handleKeyDown);
            };
        }
    }, [contextMenu]);

    const handlePin = (path: string) => {
        if (!pinnedPaths.includes(path)) {
            setPinnedPaths((prev) => [...prev, path]);
        }
    };

    const handleUnpin = (path: string) => {
        setPinnedPaths((prev) => prev.filter((p) => p !== path));
    };

    const handleUploadTrigger = () => {
        fileInputRef.current?.click();
    };

    const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", currentPath);

        try {
            const res = await fetch("/api/fs/upload", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                loadPath(currentPath);
            } else {
                alert("Upload failed");
            }
        } catch (err) {
            console.error(err);
            alert("Upload error");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    useEffect(() => {
        loadPath(currentPath);
    }, [currentPath]);

    async function loadPath(path: string) {
        setLoading(true);
        try {
            const res = await fetch("/api/fs/list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path }),
            });
            if (res.ok) {
                const data = await res.json();
                setFiles(data.files || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleNavigate = (path: string) => {
        setCurrentPath(path);
        setHistory((prev) => [...prev, path]);
    };

    const handleUp = () => {
        const parts = currentPath.split("/").filter(Boolean);
        parts.pop();
        const parent = "/" + parts.join("/");
        setCurrentPath(parent || "/");
    };

    // Get file path helper
    const getFilePath = (file: FileNode) => {
        return currentPath === "/" ? `/${file.name}` : `${currentPath}/${file.name}`;
    };

    // ========== ACTION HANDLERS ==========

    const handleOpen = () => {
        if (!contextMenu) return;
        const file = contextMenu.file;
        const filePath = getFilePath(file);
        setContextMenu(null);

        if (file.type === "dir") {
            handleNavigate(filePath);
        } else {
            setViewerPath(filePath);
        }
    };

    const handleCopyPath = () => {
        if (!contextMenu) return;
        const filePath = getFilePath(contextMenu.file);
        setContextMenu(null);

        // Fallback clipboard method
        const textArea = document.createElement("textarea");
        textArea.value = filePath;
        textArea.style.cssText = "position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;boxShadow:none;background:transparent";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const success = document.execCommand("copy");
            if (success) {
                window.alert("Path copied: " + filePath);
            } else {
                window.prompt("Copy this path:", filePath);
            }
        } catch (err) {
            window.prompt("Copy this path:", filePath);
        }

        document.body.removeChild(textArea);
    };

    const handleDownload = () => {
        if (!contextMenu) return;
        const filePath = getFilePath(contextMenu.file);
        setContextMenu(null);

        if (contextMenu.file.type !== "dir") {
            const link = document.createElement("a");
            link.href = `/api/fs/download?path=${encodeURIComponent(filePath)}`;
            link.download = filePath.split("/").pop() || "file";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleDelete = async () => {
        if (!contextMenu) return;
        const file = contextMenu.file;
        const filePath = getFilePath(file);
        setContextMenu(null);

        // Skip confirmation for now - it may be blocked in preview environment
        // TODO: Add custom modal confirmation later

        try {
            const res = await fetch("/api/fs/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: filePath }),
            });

            if (res.ok) {
                window.alert("Deleted: " + filePath);
                loadPath(currentPath);
            } else {
                const data = await res.json();
                window.alert("Delete failed: " + (data.error || "Unknown error"));
            }
        } catch (err: any) {
            window.alert("Error: " + err.message);
        }
    };

    const handlePinToSidebar = () => {
        if (!contextMenu) return;
        const filePath = getFilePath(contextMenu.file);
        setContextMenu(null);
        handlePin(filePath);
    };

    const handleContextMenu = (e: React.MouseEvent, file: FileNode) => {
        e.preventDefault();
        e.stopPropagation();
        // Use pageX/pageY for proper positioning with scroll
        setContextMenu({ x: e.pageX, y: e.pageY, file });
    };

    const handleDoubleClick = (file: FileNode) => {
        const filePath = getFilePath(file);
        if (file.type === "dir") {
            handleNavigate(filePath);
        } else {
            setViewerPath(filePath);
        }
    };

    return (
        <div className="flex h-[calc(100vh-12rem)] rounded-lg border border-white/10 bg-zinc-900/50 backdrop-blur-sm overflow-hidden relative">
            {/* Sidebar Tree */}
            <div className="w-64 border-r border-white/10 bg-zinc-900/30 p-2 overflow-y-auto hidden md:block">
                <FileTree
                    currentPath={currentPath}
                    onNavigate={handleNavigate}
                    pinnedPaths={pinnedPaths}
                    onUnpin={handleUnpin}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b border-white/10 p-3 bg-zinc-900/30">
                    <div className="flex items-center gap-2 text-sm font-mono text-zinc-400 overflow-hidden">
                        <button onClick={handleUp} className="hover:text-white mr-2" disabled={currentPath === "/"}>
                            <ChevronDown className="h-4 w-4 rotate-90" />
                        </button>
                        <span>{currentPath}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={onFileSelect} />
                        <button
                            onClick={handleUploadTrigger}
                            disabled={uploading}
                            className={clsx(
                                "p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors",
                                uploading && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Upload className={clsx("h-4 w-4", uploading && "animate-pulse")} />
                        </button>
                    </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-zinc-500">Loading...</div>
                    ) : (
                        <FileGrid
                            files={files}
                            onDoubleClick={handleDoubleClick}
                            onContextMenu={handleContextMenu}
                        />
                    )}
                </ScrollArea>

                {/* File Viewer */}
                <FileViewer isOpen={!!viewerPath} path={viewerPath || ""} onClose={() => setViewerPath(null)} />
            </div>

            {/* Context Menu via Portal for correct positioning */}
            {contextMenu && typeof document !== 'undefined' && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-[99999] w-48 rounded-md border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden py-1"
                    style={{
                        top: contextMenu.y,
                        left: contextMenu.x,
                        pointerEvents: 'auto'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {/* Open */}
                    <button
                        type="button"
                        onClick={handleOpen}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white text-left cursor-pointer"
                    >
                        {contextMenu.file.type === "dir" ? <Folder className="h-4 w-4 opacity-70" /> : <Eye className="h-4 w-4 opacity-70" />}
                        Open
                    </button>

                    {/* Download (files only) */}
                    {contextMenu.file.type !== "dir" && (
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white text-left cursor-pointer"
                        >
                            <Download className="h-4 w-4 opacity-70" />
                            Download
                        </button>
                    )}

                    {/* Copy Path */}
                    <button
                        type="button"
                        onClick={handleCopyPath}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white text-left cursor-pointer"
                    >
                        <Copy className="h-4 w-4 opacity-70" />
                        Copy Path
                    </button>

                    {/* Pin to Sidebar (dirs only) */}
                    {contextMenu.file.type === "dir" && !pinnedPaths.includes(getFilePath(contextMenu.file)) && (
                        <button
                            type="button"
                            onClick={handlePinToSidebar}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white text-left cursor-pointer"
                        >
                            <Pin className="h-4 w-4 opacity-70" />
                            Pin to Sidebar
                        </button>
                    )}

                    {/* Delete */}
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 text-left cursor-pointer"
                    >
                        <Trash2 className="h-4 w-4 opacity-70" />
                        Delete
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
}

function FileGrid({
    files,
    onDoubleClick,
    onContextMenu,
}: {
    files: FileNode[];
    onDoubleClick: (f: FileNode) => void;
    onContextMenu: (e: React.MouseEvent, f: FileNode) => void;
}) {
    if (files.length === 0) {
        return <div className="text-center text-zinc-500 mt-10">Empty directory</div>;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {files.map((file) => (
                <div
                    key={file.name}
                    onDoubleClick={() => onDoubleClick(file)}
                    onContextMenu={(e) => onContextMenu(e, file)}
                    className="group relative flex flex-col items-center justify-center p-4 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all text-center cursor-pointer select-none"
                >
                    {getFileIcon(file.name, file.type)}
                    <span className="mt-2 text-sm text-zinc-300 truncate w-full" title={file.name}>
                        {file.name}
                    </span>
                    <div className="text-xs text-zinc-500 mt-0.5">{file.type === "dir" ? "" : file.size}</div>
                </div>
            ))}
        </div>
    );
}

function getFileIcon(name: string, type: FileType) {
    if (type === "dir") return <Folder className="h-10 w-10 text-blue-500" />;
    if (name.endsWith(".yml") || name.endsWith(".json") || name.endsWith(".js") || name.endsWith(".ts") || name.endsWith(".tsx"))
        return <FileCode className="h-10 w-10 text-yellow-500" />;
    if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".svg"))
        return <FileImage className="h-10 w-10 text-purple-500" />;
    if (name.endsWith(".zip") || name.endsWith(".tar") || name.endsWith(".gz"))
        return <FileArchive className="h-10 w-10 text-red-500" />;
    return <FileText className="h-10 w-10 text-zinc-500" />;
}
