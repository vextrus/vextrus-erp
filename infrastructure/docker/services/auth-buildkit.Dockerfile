# syntax=docker/dockerfile:1
# Enable BuildKit for better caching and performance
# Build with: DOCKER_BUILDKIT=1 docker build -f auth-buildkit.Dockerfile .

# Stage 1: Base image with pnpm
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++ py3-setuptools
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Stage 2: Pruned workspace (extract only what auth service needs)
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo prune @vextrus/auth --docker

# Stage 3: Install dependencies with cache
FROM base AS deps
# Copy pruned workspace
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies with cache mount for pnpm store
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm fetch --prod

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod --prefer-offline

# Stage 4: Build the application
FROM base AS builder
# Copy pruned workspace
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install all dependencies (including dev)
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm fetch

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline

# Copy source code
COPY --from=pruner /app/out/full/ .

# Build workspace packages first, then auth service
RUN pnpm --filter @vextrus/kernel build && \
    pnpm --filter @vextrus/contracts build && \
    pnpm --filter @vextrus/utils build && \
    pnpm --filter @vextrus/auth build

# Stage 5: Production runtime
FROM node:20-alpine AS runtime
RUN apk add --no-cache libc6-compat && \
    corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nodejs:nodejs /app/services/auth/node_modules ./services/auth/node_modules
COPY --from=deps --chown=nodejs:nodejs /app/shared ./shared

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/services/auth/dist ./services/auth/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/auth/package.json ./services/auth/package.json
COPY --from=builder --chown=nodejs:nodejs /app/shared/*/dist ./shared/

# Copy workspace configuration
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

USER nodejs
WORKDIR /app/services/auth

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/auth/health', (r) => {if(r.statusCode !== 200) throw new Error();})"

# Start the application
CMD ["node", "dist/main.js"]