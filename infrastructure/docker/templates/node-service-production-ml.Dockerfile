# Production-Ready Node.js Service Dockerfile for Vextrus ERP
# Optimized for pnpm monorepo with BuildKit cache
#
# Build arguments:
#   SERVICE_NAME: Directory name of the service (e.g., "auth", "master-data")
#   SERVICE_PORT: Port the service listens on (default: 3000)
#   NODE_VERSION: Node.js version (default: 20)
#
# Expected image size: 300-500MB (vs 2-3GB with old Dockerfiles)
# Expected build time: 90s cached, 8min cold (vs 18min)

ARG NODE_VERSION=20

# ============================================================================
# Stage 1: Base with pnpm
# ============================================================================
FROM node:${NODE_VERSION}-alpine AS base

# Install required system dependencies
RUN apk add --no-cache \
    libc6-compat \
    dumb-init \
    curl

# Enable corepack and setup pnpm
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

WORKDIR /app

# ============================================================================
# Stage 2: Dependencies installation
# ============================================================================
FROM base AS deps

ARG SERVICE_NAME

# Install build dependencies for native modules (canvas, bcrypt, gl, tensorflow)
# Canvas requires: python3-dev, cairo, pango, giflib, pixman, pangomm
# GL (WebGL) requires: libx11, libxi, libxext, mesa for headless rendering
RUN apk add --no-cache \
    python3 \
    python3-dev \
    py3-pip \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libx11-dev \
    libxi-dev \
    libxext-dev \
    mesa-dev \
    glew-dev

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy shared packages (needed for workspace resolution)
COPY shared ./shared

# Copy service package.json
COPY services/${SERVICE_NAME}/package.json ./services/${SERVICE_NAME}/

# Install dependencies with BuildKit cache
# Use frozen-lockfile to ensure reproducible builds
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ============================================================================
# Stage 3: Build stage
# ============================================================================
FROM deps AS builder

ARG SERVICE_NAME

# Copy build configuration
COPY tsconfig.base.json ./

# Copy service source code
COPY services/${SERVICE_NAME}/ ./services/${SERVICE_NAME}/

# Build the service using directory-based filter
# This handles package naming automatically
RUN pnpm --filter "./services/${SERVICE_NAME}" build

# Verify build output exists
RUN ls -la ./services/${SERVICE_NAME}/dist/

# ============================================================================
# Stage 4: Production runtime
# ============================================================================
FROM node:${NODE_VERSION}-alpine AS runtime

ARG SERVICE_NAME
ARG SERVICE_PORT=3000

# Set environment variables
ENV NODE_ENV=production \
    PORT=${SERVICE_PORT} \
    SERVICE_NAME=${SERVICE_NAME}

# Install runtime dependencies only
RUN apk add --no-cache \
    tini \
    curl

# Create non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package.json and lockfile for production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/pnpm-workspace.yaml /app/package.json /app/pnpm-lock.yaml ./
COPY --from=deps --chown=nodejs:nodejs /app/services/${SERVICE_NAME}/package.json ./services/${SERVICE_NAME}/

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/services/${SERVICE_NAME}/dist ./services/${SERVICE_NAME}/dist

# Copy shared packages (runtime dependencies)
COPY --from=deps --chown=nodejs:nodejs /app/shared ./shared

# Copy node_modules (only production dependencies needed)
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nodejs:nodejs /app/services/${SERVICE_NAME}/node_modules ./services/${SERVICE_NAME}/node_modules

# Switch to non-root user
USER nodejs

# Set working directory to service
WORKDIR /app/services/${SERVICE_NAME}

# Expose service port
EXPOSE ${SERVICE_PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get({host:'localhost',port:process.env.PORT,path:'/health/live'}, (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["tini", "--"]

# Start the application
CMD ["node", "dist/main.js"]
