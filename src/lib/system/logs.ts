import { safeExec } from "./exec";
import fs from "fs/promises";
import { resolvePath } from "./fs-utils";

export interface LogEntry {
    timestamp: string;
    source: string;
    message: string;
    raw: string;
}

export async function getSystemLogs(limit = 100): Promise<LogEntry[]> {
    // journalctl -n 100 --output=short-iso --no-pager
    const { stdout } = await safeExec("journalctl", [
        `-n ${limit}`,
        "--output=short-iso",
        "--no-pager",
        "--reverse" // Newest first
    ]);

    return stdout.split("\n").filter(Boolean).map(line => ({
        timestamp: line.split(" ")[0] || "",
        source: "systemd",
        message: line.split(" ").slice(3).join(" "),
        raw: line
    }));
}

export async function getFileLogs(path: string, limit = 100): Promise<LogEntry[]> {
    const absolutePath = resolvePath(path);
    try {
        // Read last N lines (this is inefficient for huge files, but safe for MVP with small limit)
        // A better approach for huge files is tail -n
        const { stdout } = await safeExec("tail", [`-n ${limit}`, absolutePath]);

        return stdout.split("\n").filter(Boolean).reverse().map(line => ({
            timestamp: "", // File logs might not have standard timestamp
            source: path,
            message: line,
            raw: line
        }));
    } catch (e) {
        return [{ timestamp: "", source: "error", message: `Failed to read log file: ${path}`, raw: "" }];
    }
}

export async function clearSystemLogs() {
    await safeExec("sudo", ["-n", "/usr/bin/journalctl", "--rotate"]);
    await safeExec("sudo", ["-n", "/usr/bin/journalctl", "--vacuum-time=1s"]);
}

export async function clearFileLogs(pathStr: string) {
    const absolutePath = resolvePath(pathStr);
    await safeExec("sudo", ["-n", "/usr/bin/truncate", "-s", "0", absolutePath]);
}
