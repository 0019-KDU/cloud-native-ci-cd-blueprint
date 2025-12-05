# ==============================================
# Production-Grade Frontend Dockerfile
# Multi-stage build with Nginx for serving static files
# ==============================================

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

# Stage 2: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY frontend/ ./

# Build the application
# This creates optimized production build in /app/dist
RUN npm run build

# Stage 3: Production Runtime with Nginx
FROM nginx:1.25-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom nginx configuration
COPY infra/docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx user and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html

# Create nginx.pid file location with proper permissions
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# ==============================================
# Build Instructions:
# docker build -f infra/docker/frontend.Dockerfile -t ai-incident-frontend:latest .
#
# Run Instructions:
# docker run -p 8080:8080 ai-incident-frontend:latest
#
# With custom API URL:
# docker run -p 8080:8080 \
#   -e VITE_API_URL=https://api.yourdomain.com \
#   ai-incident-frontend:latest
# ==============================================