# syntax=docker/dockerfile:1
# Optimized Dockerfile for NestJS auth service with pnpm workspaces
# Build with: DOCKER_BUILDKIT=1 docker build -f auth-optimized-v2.Dockerfile .

# Stage 1: Base image with pnpm
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++ py3-setuptools
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

# Stage 2: Dependencies installation
FROM base AS deps
# Copy workspace config and all package.json files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY shared/kernel/package.json ./shared/kernel/
COPY shared/contracts/package.json ./shared/contracts/
COPY shared/utils/package.json ./shared/utils/
COPY services/auth/package.json ./services/auth/

# Install production dependencies with cache mount
# Note: Not using --prod flag as it breaks workspace dependencies
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline

# Stage 3: Build stage
FROM base AS builder
WORKDIR /app

# Copy workspace config and TypeScript config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./

# Copy all package.json files
COPY shared/kernel/package.json ./shared/kernel/
COPY shared/contracts/package.json ./shared/contracts/
COPY shared/utils/package.json ./shared/utils/
COPY services/auth/package.json ./services/auth/

# Install all dependencies including dev
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source code
COPY shared/kernel ./shared/kernel
COPY shared/contracts ./shared/contracts
COPY shared/utils ./shared/utils
COPY services/auth ./services/auth

# Build shared packages first, then auth service
RUN pnpm --filter @vextrus/kernel... build && \
    pnpm --filter @vextrus/contracts... build && \
    pnpm --filter @vextrus/utils... build && \
    pnpm --filter @vextrus/auth-service build

# Stage 4: Production runtime
FROM node:20-alpine AS runtime
RUN apk add --no-cache libc6-compat
# pnpm not needed in runtime - we only run node

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production-only node_modules from deps stage (single source of truth)
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy workspace configuration for module resolution
COPY --chown=nodejs:nodejs pnpm-workspace.yaml package.json ./

# Copy ONLY built artifacts and package.json from builder (NO node_modules)
COPY --from=builder --chown=nodejs:nodejs /app/shared/kernel/package.json ./shared/kernel/
COPY --from=builder --chown=nodejs:nodejs /app/shared/kernel/dist ./shared/kernel/dist

COPY --from=builder --chown=nodejs:nodejs /app/shared/contracts/package.json ./shared/contracts/
COPY --from=builder --chown=nodejs:nodejs /app/shared/contracts/dist ./shared/contracts/dist

COPY --from=builder --chown=nodejs:nodejs /app/shared/utils/package.json ./shared/utils/
COPY --from=builder --chown=nodejs:nodejs /app/shared/utils/dist ./shared/utils/dist

COPY --from=builder --chown=nodejs:nodejs /app/services/auth/package.json ./services/auth/
COPY --from=builder --chown=nodejs:nodejs /app/services/auth/dist ./services/auth/dist

USER nodejs
WORKDIR /app/services/auth

EXPOSE 3001

# Health check with proper exit code
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/auth/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["node", "dist/main.js"]