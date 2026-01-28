# Server Dashboard

A self-hosted server management dashboard built with Next.js.

## Features

- **System Monitor**: Real-time CPU, Memory, and Network usage tracking.
- **File Manager**: Browse, read, and manage files on the server.
- **Process Manager**: View and kill running processes.
- **Service Manager**: Manage system services (start/stop/restart).
- **Log Viewer**: View server logs in real-time.
- **Terminal Integration**: Execute commands directly from the dashboard.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/server-dash.git
    cd server-dash
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Build the project:
    ```bash
    npm run build
    ```

4.  Start the server:
    ```bash
    npm start
    ```

### Development

To run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Configuration

This project uses environment variables for configuration. See `.env.example` (if applicable) for details.

Currently, the server binds to port `3000` by default.

## technologies

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) (for charts)
- [Lucide React](https://lucide.dev/) (for icons)
- [socket.io](https://socket.io/) (for real-time updates)

## License

This project is licensed under the [Creative Commons Attribution 4.0 International License](LICENSE).
