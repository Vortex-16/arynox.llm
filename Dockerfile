# BUILD STAGE 1: Frontend Client
FROM node:20-bookworm-slim AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
# Build the React/Vite app
RUN npm run build

# BUILD STAGE 2: Backend Server
FROM node:20-bookworm-slim AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
# Install build tools for native modules like bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ && \
    npm install && \
    apt-get purge -y python3 make g++ && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*
COPY server/ ./
# Build the TypeScript backend
RUN npm run build

# FINAL STAGE: Unified Production Image
FROM node:20-bookworm-slim

# Install system dependencies for ChromaDB and Sharp
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install ChromaDB via pip
RUN pip3 install --no-cache-dir chromadb --break-system-packages

WORKDIR /app

# Copy production dependencies (server only)
COPY server/package*.json ./
RUN npm install --omit=dev

# Copy server build artifacts
COPY --from=server-builder /app/server/dist ./dist

# Copy client build artifacts to 'public' directory
# The server serves static files from this folder
COPY --from=client-builder /app/client/dist ./public

# Copy the start script
COPY start.sh ./
RUN chmod +x start.sh

# Environment setup
ENV NODE_ENV=production
ENV PORT=5000
ENV CHROMA_URL=http://localhost:8000

# Expose the application port (Node backend)
# Render expects ONE exposed port, usually 5000 or 10000
EXPOSE 5000
EXPOSE 8000

# Create directories for persistence
RUN mkdir -p uploads chroma_data

# Start the unified entrypoint
ENTRYPOINT ["./start.sh"]
