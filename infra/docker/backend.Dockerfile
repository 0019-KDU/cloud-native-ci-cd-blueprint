# ==============================================
# Production-Grade Backend Dockerfile
# Multi-stage build for optimized image size
# ==============================================

# Stage 1: Dependencies
# Use Alpine for smaller image size
FROM node:20-alpine AS dependencies

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install production dependencies only
# --omit=dev excludes devDependencies
# --legacy-peer-deps handles peer dependency issues
RUN npm install --omit=dev --legacy-peer-deps && \
    npm cache clean --force

# Stage 2: Build (if needed for transpilation)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY backend/package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY backend/ ./

# If you add TypeScript or build step in future, uncomment:
# RUN npm run build

# Stage 3: Production Runtime
FROM node:20-alpine AS production

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies from dependencies stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs backend/ ./

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to properly handle signals (SIGTERM, etc.)
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/index.js"]

# ==============================================
# Build Instructions:
# docker build -f infra/docker/backend.Dockerfile -t ai-incident-backend:latest .
#
# Run Instructions:
# docker run -p 3001:3001 \
#   -e DB_HOST=host.docker.internal \
#   -e DB_PORT=5432 \
#   -e DB_NAME=incident_assistant \
#   -e DB_USER=postgres \
#   -e DB_PASSWORD=your_password \
#   -e OPENAI_API_KEY=your_api_key \
#   ai-incident-backend:latest
# ==============================================