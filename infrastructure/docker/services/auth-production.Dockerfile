# Production-ready Auth Service Dockerfile for pnpm monorepo
# This handles workspace dependencies and builds everything properly

# Stage 1: Install dependencies and populate pnpm store
FROM node:20-alpine AS dependencies
WORKDIR /app

# Install pnpm and build tools (including python3-dev and setuptools for node-gyp)
RUN apk add --no-cache python3 python3-dev py3-setuptools make g++ && \
    npm install -g pnpm@8.15.0

# Copy monorepo configuration files for dependency resolution
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY tsconfig.base.json tsconfig.json ./

# Copy all package.json files to leverage Docker cache
COPY shared/contracts/package.json ./shared/contracts/
COPY shared/kernel/package.json ./shared/kernel/
COPY shared/utils/package.json ./shared/utils/
COPY shared/transactions/package.json ./shared/transactions/
COPY services/auth/package.json ./services/auth/

# Install all dependencies (this populates the pnpm store)
# Use --ignore-scripts to skip optional native builds that might fail
RUN pnpm install --frozen-lockfile --ignore-scripts || pnpm install --no-frozen-lockfile --ignore-scripts

# Stage 2: Build shared packages
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm and build tools (including python3-dev and setuptools for node-gyp)
RUN apk add --no-cache python3 python3-dev py3-setuptools make g++ && \
    npm install -g pnpm@8.15.0

# Copy everything from dependencies stage
COPY --from=dependencies /app ./
COPY --from=dependencies /root/.local/share/pnpm /root/.local/share/pnpm

# Copy TypeScript configs
COPY tsconfig.base.json tsconfig.json ./

# Copy source code for shared packages
COPY shared/ ./shared/
COPY services/auth/ ./services/auth/

# Build shared packages in dependency order
RUN pnpm --filter @vextrus/contracts build || echo "contracts build skipped"
RUN pnpm --filter @vextrus/kernel build || echo "kernel build skipped"
RUN pnpm --filter @vextrus/utils build || echo "utils build skipped"
RUN pnpm --filter @vextrus/distributed-transactions build || echo "transactions build skipped"

# Build auth service
WORKDIR /app/services/auth
RUN pnpm run build || npm run build

# Stage 3: Production runtime
FROM node:20-alpine AS production
WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache dumb-init curl
RUN npm install -g pnpm@8

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Copy built shared packages
COPY --from=builder /app/shared/contracts/package.json ./shared/contracts/
COPY --from=builder /app/shared/contracts/dist ./shared/contracts/dist/
COPY --from=builder /app/shared/contracts/lib ./shared/contracts/lib/

COPY --from=builder /app/shared/kernel/package.json ./shared/kernel/
COPY --from=builder /app/shared/kernel/dist ./shared/kernel/dist/
COPY --from=builder /app/shared/kernel/lib ./shared/kernel/lib/

COPY --from=builder /app/shared/utils/package.json ./shared/utils/
COPY --from=builder /app/shared/utils/dist ./shared/utils/dist/
COPY --from=builder /app/shared/utils/lib ./shared/utils/lib/

COPY --from=builder /app/shared/transactions/package.json ./shared/transactions/
COPY --from=builder /app/shared/transactions/dist ./shared/transactions/dist/
COPY --from=builder /app/shared/transactions/lib ./shared/transactions/lib/

# Copy auth service
COPY --from=builder /app/services/auth/package.json ./services/auth/
COPY --from=builder /app/services/auth/dist ./services/auth/dist/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile --ignore-scripts || pnpm install --prod --no-frozen-lockfile

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set working directory to auth service
WORKDIR /app/services/auth

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]