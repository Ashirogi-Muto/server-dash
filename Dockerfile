# Use Debian-based image for glibc compatibility with node-pty
FROM node:18-slim

# Install build dependencies for node-pty
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (including native compilation)
RUN npm install

# Force rebuild of native modules from source
RUN npm rebuild node-pty --build-from-source

# Copy source code
COPY . .

# Build Next.js
RUN npm run build

# Expose the port
EXPOSE 3000

# Run the custom server
CMD ["npm", "run", "start"]
