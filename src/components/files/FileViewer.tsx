"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
    X, Loader2, FileCode, Save, RefreshCw,

    Search, Type, Settings, Info, ChevronRight,
    ChevronDown, ZoomIn, ZoomOut, WrapText,
    FilePlus, Hash, Pen, Replace
} from "lucide-react";
import { createPortal } from "react-dom";

interface FileViewerProps {
    path: string;
    isOpen: boolean;
    onClose: () => void;
}

interface SidebarAction {
    label: string;
    icon: any;
    onClick: () => void;
    isActive?: boolean;
}

interface SidebarGroup {
    id: string;
    label: string;
    icon: any;
    actions: SidebarAction[];
}

export function FileViewer({ path, isOpen, onClose }: FileViewerProps) {
    const [chunks, setChunks] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [offset, setOffset] = useState(0);
    const [totalSize, setTotalSize] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Line number logic
    const [chunkLines, setChunkLines] = useState<number[]>([]);

    // UI State
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["file", "edit"]));
    const [wordWrap, setWordWrap] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [showLineNumbers, setShowLineNumbers] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Search State
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [replaceQuery, setReplaceQuery] = useState("");

    // Edit Mode State
    const [draftContent, setDraftContent] = useState("");
    const [isDraftDirty, setIsDraftDirty] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Save As State
    const [showSaveAs, setShowSaveAs] = useState(false);
    const [saveAsPath, setSaveAsPath] = useState("");

    // Properties State
    const [showProperties, setShowProperties] = useState(false);
    const [propertiesData, setPropertiesData] = useState<any>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    // Calculate total lines based on mode
    const totalLines = useMemo(() => {
        if (isEditing) {
            return (draftContent.match(/\n/g) || []).length + 1;
        }
        return chunkLines.reduce((a, b) => a + b, 0) + 1;
    }, [chunkLines, isEditing, draftContent]);

    // Memoize line numbers string
    const lineNumbersString = useMemo(() => {
        return Array.from({ length: totalLines }, (_, i) => i + 1).join('\n');
    }, [totalLines]);

    const toggleGroup = (id: string) => {
        const next = new Set(expandedGroups);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedGroups(next);
    };



    const handleShowProperties = async () => {
        try {
            const res = await fetch("/api/fs/stat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path })
            });
            const data = await res.json();
            if (res.ok) {
                setPropertiesData(data);
                setShowProperties(true);
            } else {
                alert("Failed to get properties: " + data.error);
            }
        } catch (err) {
            alert("Failed to get properties");
        }
    };

    // Prepare draft content from chunks unless dirty (user edited)
    useEffect(() => {
        if (!isDraftDirty) {
            setDraftContent(chunks.join(""));
        }
    }, [chunks, isDraftDirty]);

    // Auto-resize textarea
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [draftContent, isEditing]);

    const loadFile = async (currentPath: string, currentOffset: number, reset: boolean) => {
        if (loading) return;

        if (reset) {
            abortControllerRef.current?.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/fs/read?t=${Date.now()}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                cache: 'no-store',
                body: JSON.stringify({
                    path: currentPath,
                    offset: currentOffset
                }),
                signal: controller.signal
            });
            const data = await res.json();

            if (res.ok) {
                const newLines = (data.content.match(/\n/g) || []).length;

                if (reset) {
                    setChunks([data.content]);
                    setChunkLines([newLines]);
                } else {
                    setChunks(prev => [...prev, data.content]);
                    setChunkLines(prev => [...prev, newLines]);
                }
                setOffset(data.nextOffset);
                setTotalSize(data.totalSize);
                setHasMore(data.hasMore);
            } else {
                setError(data.error || "Failed to load file");
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                return; // Ignore aborts
            }
            setError(err.message);
        } finally {
            if (abortControllerRef.current === controller) {
                setLoading(false);
                abortControllerRef.current = null;
            }
        }
    };

    const handleSave = async () => {
        console.log("handleSave called", { path, draftContentLength: draftContent.length });
        try {
            setLoading(true);
            const res = await fetch("/api/fs/write", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    path: path,
                    content: draftContent
                })
            });
            const data = await res.json();

            if (res.ok) {
                console.log("handleSave success", data);
                setIsDraftDirty(false); // Reset dirty flag to accept new content
                await loadFile(path, 0, true);
                alert("Saved successfully!");
            } else {
                console.error("handleSave error", data.error);
                alert(data.error || "Failed to save");
            }
        } catch (err: any) {
            console.error("handleSave exception", err);
            alert("Error saving: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAs = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/fs/write", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    path: saveAsPath,
                    content: draftContent
                })
            });
            const data = await res.json();

            if (res.ok) {
                alert(`Successfully saved to ${saveAsPath}`);
                setShowSaveAs(false);
            } else {
                alert(data.error || "Failed to save file");
            }
        } catch (err: any) {
            alert("Error saving: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFindNext = () => {
        if (!searchQuery) return;
        // Simple browser find implementation
        const found = (window as any).find(searchQuery, false, false, true, false, true, false);
        if (!found) {
            // Reset selection to try from top
            window.getSelection()?.removeAllRanges();
            (window as any).find(searchQuery, false, false, true, false, true, false);
        }
    };

    const handleReplace = () => {
        if (!isEditing || !searchQuery) return;
        setDraftContent(prev => {
            setIsDraftDirty(true);
            return prev.replace(searchQuery, replaceQuery);
        });
    };

    const handleReplaceAll = () => {
        if (!isEditing || !searchQuery) return;
        setDraftContent(prev => {
            setIsDraftDirty(true);
            return prev.replaceAll(searchQuery, replaceQuery);
        });
    };

    useEffect(() => {
        setMounted(true);
        return () => {
            setMounted(false);
            abortControllerRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (isOpen && path) {
            // Initial load
            setChunks([]);
            setChunkLines([]);
            setOffset(0);
            setTotalSize(0);
            setHasMore(false);
            setIsDraftDirty(false); // Reset dirty
            loadFile(path, 0, true);
        } else {
            abortControllerRef.current?.abort();
            setChunks([]);
            setChunkLines([]);
            setError(null);
            setIsDraftDirty(false);
        }
    }, [isOpen, path]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (loading || !hasMore) return;

        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 100) {
            loadFile(path, offset, false);
        }
    };

    const groups: SidebarGroup[] = [
        {
            id: "file",
            label: "File",
            icon: FileCode,
            actions: [
                { label: "Reload", icon: RefreshCw, onClick: () => loadFile(path, 0, true) },
                { label: "Save As", icon: FilePlus, onClick: () => { setSaveAsPath(path); setShowSaveAs(true); } },
                { label: "Save", icon: Save, onClick: handleSave },
                { label: "Close", icon: X, onClick: onClose },
            ]
        },
        {
            id: "edit",
            label: "Edit",
            icon: Type,
            actions: [
                { label: "Edit Mode", icon: Pen, onClick: () => setIsEditing(!isEditing), isActive: isEditing },

            ]
        },
        {
            id: "view",
            label: "View",
            icon: Settings,
            actions: [
                { label: "Word Wrap", icon: WrapText, onClick: () => setWordWrap(!wordWrap), isActive: wordWrap },
                { label: "Line Numbers", icon: Hash, onClick: () => setShowLineNumbers(!showLineNumbers), isActive: showLineNumbers },
                { label: "Zoom In", icon: ZoomIn, onClick: () => setZoom(z => Math.min(z + 0.1, 2)) },
                { label: "Zoom Out", icon: ZoomOut, onClick: () => setZoom(z => Math.max(z - 0.1, 0.5)) },
            ]
        },
        {
            id: "search",
            label: "Search",
            icon: Search,
            actions: [
                { label: "Find in File", icon: Search, onClick: () => { setShowSearch(true); setIsEditing(false); }, isActive: showSearch && !isEditing },
                { label: "Find & Replace", icon: Replace, onClick: () => { setShowSearch(true); setIsEditing(true); }, isActive: showSearch && isEditing }
            ]
        },
        {
            id: "info",
            label: "Info",
            icon: Info,
            actions: [
                { label: "Properties", icon: Info, onClick: handleShowProperties }
            ]
        }
    ];

    if (!mounted) return null;
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-6xl h-[85vh] bg-zinc-900 rounded-lg border border-white/10 shadow-2xl flex flex-row overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 flex-none bg-zinc-900 border-r border-white/10 flex flex-col">
                    <div className="p-4 border-b border-white/10 font-medium text-zinc-300">
                        Menu
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {groups.map(group => {
                            const isExpanded = expandedGroups.has(group.id);
                            return (
                                <div key={group.id} className="mb-1">
                                    <button
                                        onClick={() => toggleGroup(group.id)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                                    >
                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        <group.icon className="h-4 w-4" />
                                        {group.label}
                                    </button>
                                    {isExpanded && (
                                        <div className="ml-4 pl-4 border-l border-white/10 mt-1 space-y-1">
                                            {group.actions.map((action, i) => (
                                                <button
                                                    key={i}
                                                    onClick={action.onClick}
                                                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded text-left transition-colors ${action.isActive
                                                        ? "text-blue-400 bg-blue-400/10 font-medium"
                                                        : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                                                        }`}
                                                >
                                                    <action.icon className="h-3 w-3" />
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/50">
                        <div className="flex items-center gap-2 text-zinc-300">
                            <FileCode className="h-5 w-5 text-blue-500" />
                            <span className="font-mono text-sm">{path}</span>
                        </div>
                        <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    {showSearch && (
                        <div className="flex flex-wrap items-center gap-2 p-2 bg-zinc-900 border-b border-white/10">
                            <input
                                type="text"
                                placeholder="Find..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="px-2 py-1 bg-zinc-800 border border-white/10 rounded text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                            />
                            {isEditing && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Replace..."
                                        value={replaceQuery}
                                        onChange={e => setReplaceQuery(e.target.value)}
                                        className="px-2 py-1 bg-zinc-800 border border-white/10 rounded text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                                    />
                                    <button onClick={handleReplace} className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300">Replace</button>
                                    <button onClick={handleReplaceAll} className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300">Replace All</button>
                                </>
                            )}
                            <button onClick={handleFindNext} className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300">Find</button>
                            <button onClick={() => setShowSearch(false)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Editor/Viewer */}
                    <div
                        className="flex-1 overflow-auto p-4 flex"
                        onScroll={handleScroll}
                    >
                        {error ? (
                            <div className="flex items-center justify-center h-full text-red-500 font-mono w-full">
                                {error}
                            </div>
                        ) : (
                            <>
                                {showLineNumbers && (
                                    <pre
                                        className="text-zinc-600 text-right pr-4 mr-4 select-none border-r border-white/10 bg-[#0d1117] sticky left-0 z-10 font-mono font-inherit h-fit leading-normal"
                                        style={{ fontSize: `${zoom}rem` }}
                                    >
                                        {lineNumbersString}
                                    </pre>
                                )}

                                {isEditing ? (
                                    <textarea
                                        ref={textareaRef}
                                        value={draftContent}
                                        onChange={(e) => { setDraftContent(e.target.value); setIsDraftDirty(true); }}
                                        className="flex-1 font-mono text-zinc-300 bg-[#0d1117] p-0 border-none outline-none resize-none focus:ring-0 block overflow-hidden min-h-full leading-normal"
                                        style={{
                                            fontSize: `${zoom}rem`,
                                        }}
                                        spellCheck={false}
                                    />
                                ) : (
                                    <pre
                                        className="font-mono text-zinc-300 font-inherit pb-4 flex-1 outline-none leading-normal"
                                        style={{
                                            fontSize: `${zoom}rem`,
                                            whiteSpace: showLineNumbers ? 'pre' : (wordWrap ? 'pre-wrap' : 'pre'),
                                            wordBreak: 'break-all'
                                        }}
                                    >
                                        {chunks.map((chunk, i) => (
                                            <span key={i}>{chunk}</span>
                                        ))}
                                    </pre>
                                )}

                                {loading && (
                                    <div className="absolute bottom-10 right-10 flex items-center justify-center py-4 text-zinc-500 bg-zinc-900/80 rounded-full p-2">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Status Footer */}
                    <div className="p-2 bg-zinc-900 border-t border-white/10 text-xs text-zinc-500 flex justify-between px-4">
                        <div className="flex gap-4">
                            <span>{totalSize > 0 ? `${(offset / 1024 / 1024).toFixed(2)} / ${(totalSize / 1024 / 1024).toFixed(2)} MB` : "Loading..."}</span>
                            <span>{Math.round(zoom * 100)}%</span>
                        </div>
                        <span>{hasMore ? "Scroll for more" : "End of file"}</span>
                    </div>

                    {/* Save As Modal */}
                    {showSaveAs && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="bg-zinc-900 border border-white/20 p-6 rounded-lg w-96 shadow-xl">
                                <h3 className="text-lg font-medium text-white mb-4">Save As</h3>
                                <input
                                    type="text"
                                    value={saveAsPath}
                                    onChange={e => setSaveAsPath(e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded mb-4 text-white focus:border-blue-500 outline-none"
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setShowSaveAs(false)}
                                        className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveAs}
                                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Properties Modal */}
                    {showProperties && propertiesData && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="bg-zinc-900 border border-white/20 p-6 rounded-lg w-96 shadow-xl">
                                <h3 className="text-lg font-medium text-white mb-4">File Properties</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Name</span>
                                        <span className="text-zinc-200">{propertiesData.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Path</span>
                                        <span className="text-zinc-200 truncate ml-4" title={path}>{path}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Size</span>
                                        <span className="text-zinc-200">{propertiesData.size}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Type</span>
                                        <span className="text-zinc-200 capitalize">{propertiesData.type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Permissions</span>
                                        <span className="text-zinc-200 font-mono">{propertiesData.permissions}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Modified</span>
                                        <span className="text-zinc-200">{propertiesData.modTime}</span>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => setShowProperties(false)}
                                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
