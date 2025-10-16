# syntax=docker/dockerfile:1
# Optimized Dockerfile for NestJS services with better caching and error handling

# Stage 1: Base image with pnpm
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++ py3-setuptools
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
WORKDIR /app

# Copy package files first for better caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./

# Copy shared package.json files
COPY shared/kernel/package.json ./shared/kernel/
COPY shared/contracts/package.json ./shared/contracts/
COPY shared/transactions/package.json ./shared/transactions/
COPY shared/utils/package.json ./shared/utils/

# Copy service package.json
ARG SERVICE_PATH
COPY ${SERVICE_PATH}/package.json ./${SERVICE_PATH}/

# Install dependencies with better cache mounting
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline

# Stage 3: Builder
FROM base AS builder
WORKDIR /app

ARG SERVICE_NAME
ARG SERVICE_PATH

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared/kernel/node_modules ./shared/kernel/node_modules
COPY --from=deps /app/shared/contracts/node_modules ./shared/contracts/node_modules
COPY --from=deps /app/shared/transactions/node_modules ./shared/transactions/node_modules
COPY --from=deps /app/shared/utils/node_modules ./shared/utils/node_modules
COPY --from=deps /app/${SERVICE_PATH}/node_modules ./${SERVICE_PATH}/node_modules

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./

# Copy all source code
COPY shared/kernel ./shared/kernel
COPY shared/contracts ./shared/contracts
COPY shared/transactions ./shared/transactions
COPY shared/utils ./shared/utils
COPY ${SERVICE_PATH} ./${SERVICE_PATH}

# Build shared packages first (in dependency order)
RUN cd shared/kernel && npm run build && \
    cd ../contracts && npm run build && \
    cd ../transactions && npm run build && \
    cd ../utils && npm run build

# Build the service
RUN cd ${SERVICE_PATH} && npm run build

# Stage 4: Production runtime
FROM node:20-alpine AS runtime
RUN apk add --no-cache libc6-compat

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

ARG SERVICE_PATH
ARG SERVICE_PORT

# Copy only production dependencies and built code
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nodejs:nodejs /app/shared/kernel/node_modules ./shared/kernel/node_modules
COPY --from=deps --chown=nodejs:nodejs /app/shared/contracts/node_modules ./shared/contracts/node_modules
COPY --from=deps --chown=nodejs:nodejs /app/shared/transactions/node_modules ./shared/transactions/node_modules
COPY --from=deps --chown=nodejs:nodejs /app/shared/utils/node_modules ./shared/utils/node_modules
COPY --from=deps --chown=nodejs:nodejs /app/${SERVICE_PATH}/node_modules ./${SERVICE_PATH}/node_modules

# Copy built shared packages
COPY --from=builder --chown=nodejs:nodejs /app/shared/kernel/dist ./shared/kernel/dist
COPY --from=builder --chown=nodejs:nodejs /app/shared/kernel/package.json ./shared/kernel/
COPY --from=builder --chown=nodejs:nodejs /app/shared/contracts/dist ./shared/contracts/dist
COPY --from=builder --chown=nodejs:nodejs /app/shared/contracts/package.json ./shared/contracts/
COPY --from=builder --chown=nodejs:nodejs /app/shared/transactions/dist ./shared/transactions/dist
COPY --from=builder --chown=nodejs:nodejs /app/shared/transactions/package.json ./shared/transactions/
COPY --from=builder --chown=nodejs:nodejs /app/shared/utils/dist ./shared/utils/dist
COPY --from=builder --chown=nodejs:nodejs /app/shared/utils/package.json ./shared/utils/

# Copy built service
COPY --from=builder --chown=nodejs:nodejs /app/${SERVICE_PATH}/dist ./${SERVICE_PATH}/dist
COPY --from=builder --chown=nodejs:nodejs /app/${SERVICE_PATH}/package.json ./${SERVICE_PATH}/

USER nodejs

# Service port configuration
ENV APP_PORT=${SERVICE_PORT}
EXPOSE ${SERVICE_PORT}

# Set working directory to service
WORKDIR /app/${SERVICE_PATH}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + process.env.APP_PORT + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["node", "dist/main.js"]