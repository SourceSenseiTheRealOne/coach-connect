# Build stage for frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Vite env vars needed at build time (inlined into client bundle)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Promote ARGs to ENV so Vite can read them during `npm run build`
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source and build frontend
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built frontend assets
COPY --from=builder /app/dist ./dist

# Copy package files
COPY package*.json ./

# Install only production deps (includes serve + tsx already declared)
RUN npm ci --omit=dev && npm cache clean --force

# Copy server files and source code needed by the server
COPY server ./server
COPY src/server ./src/server
COPY src/lib ./src/lib
COPY src/shared ./src/shared

# Startup script: API + static frontend, graceful shutdown
RUN printf '%s\n' \
    '#!/bin/sh' \
    'set -e' \
    'echo "Starting API server on port 3001..."' \
    'node --import tsx server/index.ts &' \
    'API_PID=$!' \
    'echo "Starting frontend static server on port 8080..."' \
    'npx serve -s dist -l 8080 &' \
    'FRONTEND_PID=$!' \
    'trap "kill $API_PID $FRONTEND_PID 2>/dev/null; wait" SIGINT SIGTERM' \
    'wait -n $API_PID $FRONTEND_PID' \
    'EXIT_CODE=$?' \
    'kill $API_PID $FRONTEND_PID 2>/dev/null || true' \
    'exit $EXIT_CODE' \
    > /app/start.sh && chmod +x /app/start.sh

# Expose both ports
EXPOSE 8080 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["/app/start.sh"]
