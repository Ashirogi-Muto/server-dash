import { safeExec } from "./exec";

export interface ProcessInfo {
    pid: number;
    user: string;
    cpu: number;
    mem: number;
    time: string;
    command: string;
}

export async function getRunningProcesses(): Promise<ProcessInfo[]> {
    // ps -eo pid,user,%cpu,%mem,time,comm --sort=-%cpu
    // We use auxww to get full command line, but parsing is trickier.
    // Let's use custom format: pid,user,pcpu,pmem,time,args
    const { stdout } = await safeExec("ps", [
        "-eo",
        "pid,user:20,pcpu,pmem,time,args",
        "--sort=-pcpu",
        "--no-headers"
    ]);

    const processes: ProcessInfo[] = [];
    const lines = stdout.split("\n");

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Split by whitespace, respecting limit? args can contain spaces.
        // PID USER %CPU %MEM TIME COMMAND...
        // We can just regex split the first 5 columns and keep the rest as command
        const parts = trimmed.split(/\s+/);
        if (parts.length < 6) continue;

        const pid = parseInt(parts[0], 10);
        const user = parts[1];
        const cpu = parseFloat(parts[2]);
        const mem = parseFloat(parts[3]);
        const time = parts[4];
        const command = parts.slice(5).join(" "); // Rejoin the rest as command

        processes.push({
            pid,
            user,
            cpu,
            mem,
            time,
            command
        });
    }

    return processes;
}

export async function killProcess(pid: number, signal: "SIGTERM" | "SIGKILL" = "SIGTERM") {
    // Only allow valid signals
    if (signal !== "SIGTERM" && signal !== "SIGKILL") {
        throw new Error("Invalid signal");
    }

    const result = await safeExec("sudo", ["-n", "/usr/bin/kill", `-${signal.replace("SIG", "")}`, pid.toString()]);
    if (result.exitCode !== 0) {
        throw new Error(result.stderr || `Failed to kill process ${pid}`);
    }
}
