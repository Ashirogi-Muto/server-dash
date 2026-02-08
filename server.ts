import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
// @ts-ignore
import * as pty from "node-pty";
import * as os from "os";
import * as net from "net";
import * as cookie from "cookie";
import { verifyToken } from "./src/lib/auth";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";

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
        const port = await findAvailablePort(3002);
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

        // Authentication Middleware
        io.use(async (socket, next) => {
            try {
                const cookieHeader = socket.handshake.headers.cookie;
                if (!cookieHeader) {
                    return next(new Error("Authentication error: No cookies found"));
                }

                const parsedCookies = cookie.parse(cookieHeader);
                const token = parsedCookies.server_dash_session;

                if (!token) {
                    return next(new Error("Authentication error: No auth token found"));
                }

                const payload = await verifyToken(token);

                if (!payload) {
                    return next(new Error("Authentication error: Invalid token"));
                }

                next();
            } catch (error) {
                console.error("Socket Auth Error:", error);
                next(new Error("Authentication error"));
            }
        });

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

        server.listen(port, "0.0.0.0", () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
};

startServer();
