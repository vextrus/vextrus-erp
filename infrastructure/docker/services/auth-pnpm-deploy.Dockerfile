# syntax=docker/dockerfile:1
# Production-ready Dockerfile using pnpm deploy for proper dependency resolution
# This solves the symlink issue with OpenTelemetry and other dependencies

# Stage 1: Base image with pnpm
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++ py3-setuptools
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

# Stage 2: Dependencies and build
FROM base AS builder
WORKDIR /app

# Copy workspace config and all package files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY shared/kernel/package.json ./shared/kernel/
COPY shared/contracts/package.json ./shared/contracts/
COPY shared/utils/package.json ./shared/utils/
COPY services/auth/package.json ./services/auth/

# Install ALL dependencies (including dev) with cache mount
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source code
COPY shared/kernel ./shared/kernel
COPY shared/contracts ./shared/contracts
COPY shared/utils ./shared/utils
COPY services/auth ./services/auth

# Build all packages in dependency order
RUN pnpm --filter @vextrus/kernel build && \
    pnpm --filter @vextrus/contracts build && \
    pnpm --filter @vextrus/utils build && \
    pnpm --filter @vextrus/auth-service build

# Stage 3: Deploy preparation
FROM base AS deploy
WORKDIR /app

# Copy everything from builder
COPY --from=builder /app ./

# Use pnpm deploy to create production deployment without symlinks
# This creates a standalone package with all dependencies properly resolved
RUN pnpm deploy --filter=@vextrus/auth-service --prod /app/deploy/auth

# Stage 4: Production runtime
FROM node:20-alpine AS runtime
RUN apk add --no-cache libc6-compat

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy the deployed package with its node_modules containing .pnpm directory
# pnpm deploy creates node_modules/.pnpm with actual packages
COPY --from=deploy --chown=nodejs:nodejs /app/deploy/auth ./

# The deployed package with .pnpm directory includes:
# - node_modules with symlinks to .pnpm
# - .pnpm directory with actual packages
# - Built dist files
# - Package.json files

USER nodejs

EXPOSE 3001

# Health check with proper exit code
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/auth/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application - the deployed package structure puts everything in place
CMD ["node", "dist/main.js"]