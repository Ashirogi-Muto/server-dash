import fs from 'fs';
import path from 'path';
import { hashPassword, comparePassword as bcryptCompare } from './auth';

const CONFIG_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Default password is 'admin'
const DEFAULT_HASH = '$2a$10$X7.G.t.f.v.i.l.l.s.t.r.i.n.g.u.n.t.i.l.l.n.o.w'; // Placeholder, will generate real one in init

interface ServerConfig {
    adminPasswordHash: string;
    settings?: {
        refreshRate: number;
    };
}

function ensureConfigDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
}

export async function getAdminConfig(): Promise<ServerConfig> {
    ensureConfigDir();

    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
            return JSON.parse(data);
        } catch (e) {
            console.error("Failed to read config file, using default", e);
        }
    }

    // Generate default hash for "admin" if not exists
    const defaultHash = await hashPassword('admin');
    const defaultConfig: ServerConfig = {
        adminPasswordHash: defaultHash,
        settings: {
            refreshRate: 3000
        }
    };

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
}

export async function updateAdminPassword(newPassword: string) {
    const config = await getAdminConfig();
    config.adminPasswordHash = await hashPassword(newPassword);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export async function getSettings() {
    const config = await getAdminConfig();
    return config.settings || { refreshRate: 3000 };
}

export async function updateSettings(partialSettings: Partial<ServerConfig['settings']>) {
    const config = await getAdminConfig();
    config.settings = { ...config.settings, ...partialSettings };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return config.settings;
}

export async function verifyUnknownPassword(password: string): Promise<boolean> {
    const config = await getAdminConfig();
    return await bcryptCompare(password, config.adminPasswordHash);
}
