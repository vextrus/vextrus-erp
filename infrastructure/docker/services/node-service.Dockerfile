# syntax=docker/dockerfile:1
# Generic Dockerfile for all supporting services using pnpm deploy

# Stage 1: Base image with pnpm
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++ py3-setuptools
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

# Stage 2: Dependencies and build
FROM base AS builder
WORKDIR /app

# Build arguments for service configuration
ARG SERVICE_NAME
ARG SERVICE_PATH
ARG SERVICE_PORT

# Copy workspace config and all package files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY shared/kernel/package.json ./shared/kernel/
COPY shared/contracts/package.json ./shared/contracts/
COPY shared/utils/package.json ./shared/utils/
COPY ${SERVICE_PATH}/package.json ./${SERVICE_PATH}/

# Install ALL dependencies with cache mount
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source code
COPY shared/kernel ./shared/kernel
COPY shared/contracts ./shared/contracts
COPY shared/utils ./shared/utils
COPY ${SERVICE_PATH} ./${SERVICE_PATH}

# Build all packages in dependency order
RUN pnpm --filter @vextrus/kernel build && \
    pnpm --filter @vextrus/contracts build && \
    pnpm --filter @vextrus/utils build && \
    pnpm --filter ${SERVICE_NAME} build

# Stage 3: Deploy preparation
FROM base AS deploy
WORKDIR /app

# Copy everything from builder
COPY --from=builder /app ./

# Use pnpm deploy to create production deployment without symlinks
ARG SERVICE_NAME
ARG SERVICE_PATH
RUN pnpm deploy --filter=${SERVICE_NAME} --prod /app/deploy/service

# Stage 4: Production runtime
FROM node:20-alpine AS runtime
RUN apk add --no-cache libc6-compat

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy the deployed package with its node_modules containing .pnpm directory
COPY --from=deploy --chown=nodejs:nodejs /app/deploy/service ./

USER nodejs

# Service port configuration
ARG SERVICE_PORT
EXPOSE ${SERVICE_PORT}

# Health check with configurable port
ENV APP_PORT=${SERVICE_PORT}
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + process.env.APP_PORT + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["node", "dist/main.js"]