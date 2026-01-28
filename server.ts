
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import * as pty from "node-pty";
import * as os from "os";
import * as net from "net";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";

async function findAvailablePort(startPort: number): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                resolve(findAvailablePort(startPort + 1));
            } else {
                reject(err);
            }
        });
        server.listen(startPort, () => {
            server.close(() => resolve(startPort));
        });
    });
}

const startServer = async () => {
    try {
        const port = await findAvailablePort(3000);
        console.log(`> Found available port: ${port}`);

        const app = next({ dev, hostname, port });
        const handle = app.getRequestHandler();

        await app.prepare();

        const server = createServer(async (req, res) => {
            try {
                const parsedUrl = parse(req.url!, true);
                await handle(req, res, parsedUrl);
            } catch (err) {
                console.error("Error occurred handling", req.url, err);
                res.statusCode = 500;
                res.end("internal server error");
            }
        });

        // Initialize Socket.IO
        const io = new Server(server);

        io.on("connection", (socket) => {
            console.log("Client connected to terminal socket");

            // Spawn shell
            const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
            const ptyProcess = pty.spawn(shell, [], {
                name: 'xterm-color',
                cols: 80,
                rows: 30,
                cwd: process.env.HOME,
                env: process.env as any
            });

            // Pipe PTY -> Socket
            ptyProcess.onData((data) => {
                socket.emit("output", data);
            });

            // Pipe Socket -> PTY
            socket.on("input", (data) => {
                ptyProcess.write(data);
            });

            socket.on("resize", ({ cols, rows }) => {
                ptyProcess.resize(cols, rows);
            });

            socket.on("disconnect", () => {
                console.log("Client disconnected, killing pty");
                ptyProcess.kill();
            });
        });

        server.listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
};

startServer();
