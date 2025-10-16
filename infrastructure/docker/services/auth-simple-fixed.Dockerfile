# Simple Auth Service Dockerfile for Traefik Testing
FROM node:20-alpine

# Install required tools
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package.json and server.js from the auth-simple directory
COPY infrastructure/docker/auth-simple/package.json ./
COPY infrastructure/docker/auth-simple/server.js ./

# Install dependencies
RUN npm install

# Switch to non-root user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Set working directory after user switch (critical for proper file resolution)
WORKDIR /app

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application (use relative path since we're in /app)
CMD ["node", "server.js"]