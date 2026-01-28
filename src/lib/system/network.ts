import fs from "fs/promises";

export interface NetworkStats {
    rx_bytes: number;
    tx_bytes: number;
}

export async function getNetworkStats(): Promise<NetworkStats> {
    try {
        const data = await fs.readFile("/proc/net/dev", "utf-8");
        const lines = data.split("\n");

        let rx_bytes = 0;
        let tx_bytes = 0;

        // Skip header lines (first 2)
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(/\s+/);
            if (parts.length < 10) continue;

            // Format:
            // Inter-|   Receive                                                |  Transmit
            //  face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
            // lo: 123 ...

            // parts[0] is interface name with colon (sometimes space before colon, but split handles spaces)
            // Actually usually: "lo:" or "eth0:"
            // Then RX bytes is index 1
            // TX bytes is index 9

            // If interface name is fused with bytes like "eth0:123", we need to handle that.
            // But typical linux output has space after colon usually or we split by colon.

            // Safer parsing: 
            // 1. Remove interface name part
            // 2. Split remainder by whitespace

            let statsParts: string[] = [];

            if (line.includes(":")) {
                const [iface, rest] = line.split(":");
                statsParts = rest.trim().split(/\s+/);
            } else {
                // Should not happen in /proc/net/dev usually
                continue;
            }

            if (statsParts.length >= 9) {
                const rx = parseInt(statsParts[0] || "0", 10);
                const tx = parseInt(statsParts[8] || "0", 10);

                if (!isNaN(rx)) rx_bytes += rx;
                if (!isNaN(tx)) tx_bytes += tx;
            }
        }

        return { rx_bytes, tx_bytes };
    } catch (error) {
        console.error("Error reading network stats:", error);
        return { rx_bytes: 0, tx_bytes: 0 };
    }
}
