# Dockerfile for File Storage Service with sharp image processing support
# Build with: docker build --build-arg SERVICE_NAME=file-storage -f file-storage.Dockerfile .

# Stage 1: Base image with pnpm and build tools for sharp
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++ py3-setuptools vips-dev
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

# Stage 2: Dependencies installation
FROM base AS deps
# Copy workspace config and all package.json files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY shared/kernel/package.json ./shared/kernel/
COPY shared/contracts/package.json ./shared/contracts/
COPY shared/utils/package.json ./shared/utils/
COPY services/file-storage/package.json ./services/file-storage/

# Install production dependencies without running scripts first
RUN pnpm install --frozen-lockfile --prefer-offline --ignore-scripts

# Stage 3: Build stage
FROM base AS builder
WORKDIR /app

# Copy workspace config and TypeScript config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./

# Copy all package.json files
COPY shared/kernel/package.json ./shared/kernel/
COPY shared/contracts/package.json ./shared/contracts/
COPY shared/utils/package.json ./shared/utils/
COPY services/file-storage/package.json ./services/file-storage/

# Install all dependencies including dev, without scripts
RUN pnpm install --frozen-lockfile --ignore-scripts

# Install sharp specifically for Alpine Linux musl architecture
# Using pnpm with environment variables to specify the platform
ENV npm_config_platform=linux
ENV npm_config_arch=x64
ENV npm_config_libc=musl
RUN cd services/file-storage && \
    pnpm add sharp --force

# Copy source code
COPY shared/kernel ./shared/kernel
COPY shared/contracts ./shared/contracts
COPY shared/utils ./shared/utils
COPY services/file-storage ./services/file-storage

# Build shared packages first, then the specific service
RUN pnpm --filter @vextrus/kernel... build && \
    pnpm --filter @vextrus/contracts... build && \
    pnpm --filter @vextrus/utils... build && \
    pnpm --filter @vextrus/file-storage-service build

# Stage 4: Production runtime
FROM node:20-alpine AS runtime
ARG SERVICE_PORT=3008
ENV SERVICE_PORT=${SERVICE_PORT}

# Install runtime dependencies for sharp including C++ bindings
RUN apk add --no-cache libc6-compat vips vips-cpp vips-dev

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy node_modules from builder stage (has all dependencies including sharp)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/shared/kernel/node_modules ./shared/kernel/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/shared/contracts/node_modules ./shared/contracts/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/shared/utils/node_modules ./shared/utils/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/file-storage/node_modules ./services/file-storage/node_modules

# Copy workspace configuration for module resolution
COPY --chown=nodejs:nodejs pnpm-workspace.yaml package.json ./

# Copy ONLY built artifacts and package.json from builder
COPY --from=builder --chown=nodejs:nodejs /app/shared/kernel/package.json ./shared/kernel/
COPY --from=builder --chown=nodejs:nodejs /app/shared/kernel/dist ./shared/kernel/dist

COPY --from=builder --chown=nodejs:nodejs /app/shared/contracts/package.json ./shared/contracts/
COPY --from=builder --chown=nodejs:nodejs /app/shared/contracts/dist ./shared/contracts/dist

COPY --from=builder --chown=nodejs:nodejs /app/shared/utils/package.json ./shared/utils/
COPY --from=builder --chown=nodejs:nodejs /app/shared/utils/dist ./shared/utils/dist

COPY --from=builder --chown=nodejs:nodejs /app/services/file-storage/package.json ./services/file-storage/
COPY --from=builder --chown=nodejs:nodejs /app/services/file-storage/dist ./services/file-storage/dist

USER nodejs
WORKDIR /app/services/file-storage

EXPOSE ${SERVICE_PORT}

# Health check with proper exit code
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${SERVICE_PORT}/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["node", "dist/main.js"]