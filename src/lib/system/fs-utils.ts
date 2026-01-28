import path from "path";
import fs from "fs/promises";

export const ROOT_DIR = "/";

/**
 * Validates and resolves a path to ensure it is safe.
 * In this dashboard, we technically allow root access, but we still want to normalize paths.
 */
export function resolvePath(targetPath: string): string {
    // Normalize the path
    const safePath = path.normalize(targetPath);

    // In a restricted environment, we would check if it starts with ROOT_DIR
    // For this root-level dashboard, we just return the normalized absolute path.
    // We ensure it is absolute.
    if (!path.isAbsolute(safePath)) {
        return path.join(ROOT_DIR, safePath);
    }

    return safePath;
}

export async function getFileStats(filePath: string) {
    try {
        let stats = await fs.lstat(filePath);
        let type = stats.isDirectory() ? "dir" : "file";

        if (stats.isSymbolicLink()) {
            try {
                const targetStats = await fs.stat(filePath);
                if (targetStats.isDirectory()) {
                    type = "dir";
                }
            } catch (e) {
                // Broken link, treat as file
            }
        }

        return {
            name: path.basename(filePath),
            type,
            size: formatBytes(stats.size),
            permissions: getPermissions(stats.mode),
            modTime: stats.mtime.toLocaleString(),
            rawStats: stats
        };
    } catch (err) {
        return null;
    }
}

function getPermissions(mode: number) {
    // Convert mode to rwxrwxrwx string
    return (mode & 0o400 ? 'r' : '-') +
        (mode & 0o200 ? 'w' : '-') +
        (mode & 0o100 ? 'x' : '-') +
        (mode & 0o040 ? 'r' : '-') +
        (mode & 0o020 ? 'w' : '-') +
        (mode & 0o010 ? 'x' : '-') +
        (mode & 0o004 ? 'r' : '-') +
        (mode & 0o002 ? 'w' : '-') +
        (mode & 0o001 ? 'x' : '-');
}

function formatBytes(bytes: number, decimals = 1) {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
