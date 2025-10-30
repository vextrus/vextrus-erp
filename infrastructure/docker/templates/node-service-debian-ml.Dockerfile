# Multi-stage Dockerfile for Node.js services with heavy ML/AI dependencies
# Debian-based for better C++ stdlib and TensorFlow compatibility
# Use for: Finance service (TensorFlow, canvas, OCR, NLP)

ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-bullseye-slim AS base

# Install base dependencies
RUN apt-get update && apt-get install -y \
    dumb-init \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Enable corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

WORKDIR /app

# ============================================
# Dependencies Stage
# ============================================
FROM base AS deps

ARG SERVICE_NAME

# Install build dependencies for ML/AI native modules
# TensorFlow: python3, build-essential, pkg-config
# Canvas: libcairo2-dev, libpango1.0-dev, libjpeg-dev, libgif-dev, librsvg2-dev
# GL/WebGL: libxi-dev, libglu1-mesa-dev, libglew-dev
# Sharp: libvips-dev
# General: python3-dev, make, g++, git
RUN apt-get update && apt-get install -y \
    python3 \
    python3-dev \
    python3-pip \
    build-essential \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libxi-dev \
    libglu1-mesa-dev \
    libglew-dev \
    libvips-dev \
    git \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/bin/python

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy shared packages (needed for workspace resolution)
COPY shared/ ./shared/

# Copy service-specific package.json
COPY services/${SERVICE_NAME}/package.json ./services/${SERVICE_NAME}/package.json

# Install dependencies with BuildKit cache mount
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter "./services/${SERVICE_NAME}"

# ============================================
# Shared Packages Builder Stage
# ============================================
FROM base AS shared-builder

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy shared infrastructure package
COPY shared/infrastructure ./shared/infrastructure

# Install dependencies for shared infrastructure
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter "./shared/infrastructure"

# Build shared infrastructure
WORKDIR /app/shared/infrastructure
RUN pnpm run build

# ============================================
# Builder Stage
# ============================================
FROM base AS builder

ARG SERVICE_NAME

# Copy built shared packages (not source)
COPY --from=shared-builder /app/shared/infrastructure/dist ./shared/infrastructure/dist
COPY --from=shared-builder /app/shared/infrastructure/package.json ./shared/infrastructure/package.json

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/${SERVICE_NAME}/node_modules ./services/${SERVICE_NAME}/node_modules

# Copy workspace files
COPY pnpm-workspace.yaml package.json ./

# Copy service source
COPY services/${SERVICE_NAME} ./services/${SERVICE_NAME}

# Build the service
WORKDIR /app/services/${SERVICE_NAME}
RUN pnpm run build

# ============================================
# Runtime Stage
# ============================================
FROM node:${NODE_VERSION}-bullseye-slim AS runtime

ARG SERVICE_NAME
ARG SERVICE_PORT=3000

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    tini \
    curl \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    libxi6 \
    libglu1-mesa \
    libglew2.1 \
    libvips42 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs

WORKDIR /app

# Copy workspace files
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/shared ./shared

# Copy workspace node_modules
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy service-specific files
COPY --from=builder --chown=nodejs:nodejs /app/services/${SERVICE_NAME}/dist ./services/${SERVICE_NAME}/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/${SERVICE_NAME}/node_modules ./services/${SERVICE_NAME}/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/${SERVICE_NAME}/package.json ./services/${SERVICE_NAME}/package.json

# Switch to service working directory
WORKDIR /app/services/${SERVICE_NAME}

# Switch to non-root user
USER nodejs

# Expose service port
EXPOSE ${SERVICE_PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Use tini as init system
ENTRYPOINT ["/usr/bin/tini", "--"]

# Start the service
CMD ["node", "dist/src/main.js"]
