"use client";

import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { io, Socket } from "socket.io-client";
import "xterm/css/xterm.css";
import clsx from "clsx";

interface TerminalProps {
    className?: string;
}

export default function Terminal({ className }: TerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const termRef = useRef<XTerm | null>(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        // Initialize Socket.IO
        const socket = io();
        socketRef.current = socket;

        // Initialize xterm.js
        const term = new XTerm({
            cursorBlink: true,
            theme: {
                background: '#09090b', // zinc-950
                foreground: '#f4f4f5', // zinc-100
                cursor: '#ffffff',
                selectionBackground: 'rgba(255, 255, 255, 0.2)',
                black: '#000000',
                red: '#ef4444',
                green: '#22c55e',
                yellow: '#eab308',
                blue: '#3b82f6',
                magenta: '#d946ef',
                cyan: '#06b6d4',
                white: '#ffffff',
                brightBlack: '#71717a',
                brightRed: '#f87171',
                brightGreen: '#4ade80',
                brightYellow: '#facc15',
                brightBlue: '#60a5fa',
                brightMagenta: '#e879f9',
                brightCyan: '#22d3ee',
                brightWhite: '#ffffff',
            },
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: 14,
            allowProposedApi: true
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        termRef.current = term;

        // Safe fit function
        const fitTerminal = () => {
            if (!terminalRef.current || !termRef.current) return;
            // Check if element is visible (offsetParent is null if hidden)
            if (terminalRef.current.offsetParent === null) return;

            try {
                fitAddon.fit();
                if (term.cols > 0 && term.rows > 0) {
                    socket.emit("resize", { cols: term.cols, rows: term.rows });
                }
            } catch (e) {
                // Suppress expected errors during initialization/hiding
            }
        };

        // Initialize xterm only when we have dimensions
        let isOpened = false;
        const resizeObserver = new ResizeObserver(() => {
            if (!terminalRef.current) return;

            // Only open if we have size
            if (!isOpened && terminalRef.current.clientWidth > 0 && terminalRef.current.clientHeight > 0) {
                term.open(terminalRef.current);
                isOpened = true;
                fitTerminal();
            } else if (isOpened) {
                // Debounce resize
                requestAnimationFrame(() => fitTerminal());
            }
        });

        resizeObserver.observe(terminalRef.current);

        // Handle Socket Events
        socket.on("connect", () => {
            term.write("\r\n\x1b[32mConnected to server shell...\x1b[0m\r\n");
            // Only fit/resize if already opened
            if (isOpened) fitTerminal();
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
            term.write(`\r\n\x1b[31mConnection Error: ${err.message}\x1b[0m\r\n`);
        });

        socket.on("output", (data) => {
            term.write(data);
        });

        socket.on("disconnect", () => {
            term.write("\r\n\x1b[31mDisconnected from server.\x1b[0m\r\n");
        });

        // Handle Terminal Input
        term.onData((data) => {
            socket.emit("input", data);
        });

        // Window resize fallback
        window.addEventListener("resize", fitTerminal);

        return () => {
            socket.disconnect();
            term.dispose();
            resizeObserver.disconnect();
            window.removeEventListener("resize", fitTerminal);
        };
    }, []);

    return (
        <div
            className={clsx("h-full w-full overflow-hidden rounded-lg bg-zinc-950 p-2 border border-white/10 shadow-inner", className)}
            ref={terminalRef}
        />
    );
}
