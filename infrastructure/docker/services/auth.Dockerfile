# Auth Service Dockerfile for Bangladesh Construction ERP
FROM node:20-alpine AS builder

# Install pnpm and build dependencies
RUN apk add --no-cache python3 make g++
RUN npm install -g pnpm@8

WORKDIR /app

# Copy workspace configuration and lock file from root
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy service specific files
COPY services/auth/package.json ./services/auth/
COPY services/auth/tsconfig*.json ./services/auth/
COPY services/auth/nest-cli.json ./services/auth/

# Install all dependencies (pnpm will handle workspace linking)
# Use --no-frozen-lockfile for development builds to allow package.json updates
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY services/auth/src ./services/auth/src

# Build the application
WORKDIR /app/services/auth
RUN pnpm run build

# Production stage
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/services/auth/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/auth/package*.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]