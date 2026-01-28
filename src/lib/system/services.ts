import { safeExec } from "./exec";

export interface ServiceUnit {
    unit: string;
    load: string;
    active: string;
    sub: string;
    description: string;
}

export async function getServices(): Promise<ServiceUnit[]> {
    // systemctl list-units --type=service --all --no-pager --no-legend --output=json
    const { stdout } = await safeExec("systemctl", [
        "list-units",
        "--type=service",
        "--all",
        "--no-pager",
        "--no-legend",
        "--output=json"
    ]);

    try {
        const data = JSON.parse(stdout);
        if (Array.isArray(data)) {
            return data.map((u: any) => ({
                unit: u.unit,
                load: u.load,
                active: u.active,
                sub: u.sub,
                description: u.description
            }));
        }
    } catch (e) {
        // Fallback or error? If we asked for JSON and got garbage, it's an error on this modern server.
        // But let's log it.
        console.warn("Failed to parse systemctl json", e);
    }

    return [];
}

export async function controlService(unit: string, action: "start" | "stop" | "restart" | "enable" | "disable") {
    // Validate unit name for safety (alphanumeric, dots, dashes, @)
    if (!/^[a-zA-Z0-9.\-@_]+$/.test(unit)) {
        throw new Error("Invalid service name");
    }

    const result = await safeExec("sudo", ["-n", "/usr/bin/systemctl", action, unit]);
    if (result.exitCode !== 0) {
        throw new Error(result.stderr || `Failed to ${action} ${unit}`);
    }
}
