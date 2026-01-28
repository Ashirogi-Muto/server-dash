import fs from "fs";
import path from "path";

const AUDIT_LOG_PATH = path.join(process.cwd(), "audit.log");

export function logAudit(action: string, target: string, ip: string, success: boolean = true) {
    const timestamp = new Date().toISOString();
    const status = success ? "SUCCESS" : "FAILURE";
    const line = `[${timestamp}] [${ip}] [${action}] [${target}] [${status}]\n`;

    // Append synchronously to ensure write (async could be lost on crash)
    // For high volume, async stream is better, but this is critical audit.
    try {
        fs.appendFileSync(AUDIT_LOG_PATH, line);
    } catch (err) {
        console.error("Failed to write audit log:", err);
    }
}
