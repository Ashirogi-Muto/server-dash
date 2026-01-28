import { spawn, SpawnOptions } from "child_process";

interface ExecResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
}

interface SafeExecOptions extends SpawnOptions {
    timeoutMs?: number;
    logCommand?: boolean;
}

/**
 * centralized safe wrapper for child_process.spawn
 * enforcing timeouts and capturing output
 */
export async function safeExec(
    command: string,
    args: string[],
    options: SafeExecOptions = {}
): Promise<ExecResult> {
    const { timeoutMs = 5000, logCommand = true, ...spawnOpts } = options;

    if (logCommand) {
        console.log(`[EXEC] ${command} ${args.join(" ")}`);
    }

    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { ...spawnOpts });

        let stdout = "";
        let stderr = "";

        // Timeout safety
        const timeout = setTimeout(() => {
            child.kill("SIGTERM");
            reject(new Error(`Command timed out after ${timeoutMs}ms: ${command} ${args.join(" ")}`));
        }, timeoutMs);

        child.stdout?.on("data", (data) => {
            stdout += data.toString();
        });

        child.stderr?.on("data", (data) => {
            stderr += data.toString();
        });

        child.on("error", (err) => {
            clearTimeout(timeout);
            reject(err);
        });

        child.on("close", (code) => {
            clearTimeout(timeout);
            resolve({
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                exitCode: code,
            });
        });
    });
}
