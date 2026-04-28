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

# Copy package files for production deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Install tsx for running TypeScript server
RUN npm install tsx

# Copy server files and source code needed by the server
COPY server ./server
COPY src/server ./src/server
COPY src/lib ./src/lib
COPY src/shared ./src/shared

# Create startup script directly in Dockerfile
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start API server in background' >> /app/start.sh && \
    echo 'echo "Starting API server on port 3001..."' >> /app/start.sh && \
    echo 'node --import tsx server/index.ts &' >> /app/start.sh && \
    echo 'API_PID=$!' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Wait for API to be ready' >> /app/start.sh && \
    echo 'sleep 3' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Install and start frontend static server' >> /app/start.sh && \
    echo 'echo "Starting frontend server on port 8080..."' >> /app/start.sh && \
    echo 'npm install -g serve' >> /app/start.sh && \
    echo 'serve -s dist -l 8080 &' >> /app/start.sh && \
    echo 'FRONTEND_PID=$!' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Handle shutdown gracefully' >> /app/start.sh && \
    echo 'trap "kill $API_PID $FRONTEND_PID; exit" SIGINT SIGTERM' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Keep container running' >> /app/start.sh && \
    echo 'wait' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose both ports
EXPOSE 8080 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["/app/start.sh"]