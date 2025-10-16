# Optimized Auth Service Dockerfile for pnpm monorepo
# Handles workspace dependencies with proper build optimization

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app

# Install pnpm and required build tools
# Include python3-dev and setuptools to fix distutils issue
RUN apk add --no-cache python3 python3-dev py3-setuptools make g++ && \
    npm install -g pnpm@8

# Copy monorepo configuration files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy all package.json files for dependency resolution
COPY shared/contracts/package.json ./shared/contracts/
COPY shared/kernel/package.json ./shared/kernel/
COPY shared/utils/package.json ./shared/utils/
COPY shared/transactions/package.json ./shared/transactions/
COPY services/auth/package.json ./services/auth/

# Install dependencies with optimizations
# --ignore-scripts prevents optional native builds that might fail
# --no-optional skips optional dependencies
RUN pnpm install --ignore-scripts --no-optional || \
    pnpm install --no-frozen-lockfile --ignore-scripts --no-optional

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install build tools
RUN apk add --no-cache python3 make g++ && \
    npm install -g pnpm@8

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json ./package.json
COPY --from=dependencies /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=dependencies /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy package.json files
COPY shared/contracts/package.json ./shared/contracts/
COPY shared/kernel/package.json ./shared/kernel/
COPY shared/utils/package.json ./shared/utils/
COPY shared/transactions/package.json ./shared/transactions/
COPY services/auth/package.json ./services/auth/

# Copy source code
COPY shared/ ./shared/
COPY services/auth/ ./services/auth/

# Build shared packages (continue on error for missing build scripts)
RUN cd shared/contracts && (pnpm run build || npm run build || echo "No build needed") && \
    cd ../kernel && (pnpm run build || npm run build || echo "No build needed") && \
    cd ../utils && (pnpm run build || npm run build || echo "No build needed") && \
    cd ../transactions && (pnpm run build || npm run build || echo "No build needed")

# Build auth service
WORKDIR /app/services/auth
RUN pnpm run build || npm run build

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache dumb-init curl && \
    npm install -g pnpm@8

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Copy built shared packages (both source and dist)
COPY --from=builder /app/shared ./shared

# Copy auth service build
COPY --from=builder /app/services/auth/package.json ./services/auth/
COPY --from=builder /app/services/auth/dist ./services/auth/dist

# Install production dependencies only
RUN pnpm install --prod --ignore-scripts --no-optional || \
    pnpm install --prod --no-frozen-lockfile --ignore-scripts --no-optional

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set working directory
WORKDIR /app/services/auth

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init for signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]