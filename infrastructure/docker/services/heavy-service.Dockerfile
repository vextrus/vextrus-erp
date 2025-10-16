# Optimized Dockerfile for services with heavy dependencies (puppeteer, sharp, etc.)
# Multi-stage build with dependency caching

# Stage 1: Dependencies installer
FROM node:20-slim AS deps
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace config
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml* ./

# Install pnpm
RUN npm install -g pnpm@8

# Copy shared packages first (for better caching)
COPY shared/ ./shared/

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM deps AS builder
WORKDIR /app

# Copy service source code
ARG SERVICE_PATH
COPY services/$SERVICE_PATH ./services/$SERVICE_PATH

# Build the specific service
WORKDIR /app/services/$SERVICE_PATH
# Install service-specific dependencies if needed
RUN pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile
# Build the service
RUN pnpm run build

# Stage 3: Production base with runtime dependencies
FROM node:20-slim AS runtime-base
WORKDIR /app

# Install runtime dependencies based on service
ARG SERVICE_NAME

# For document-generator (Puppeteer dependencies)
RUN if [ "$SERVICE_NAME" = "document-generator" ]; then \
    apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s /usr/bin/chromium /usr/bin/chromium-browser; \
    fi

# For file-storage (Sharp/libvips dependencies)
RUN if [ "$SERVICE_NAME" = "file-storage" ]; then \
    apt-get update && apt-get install -y \
    libvips42 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*; \
    fi

# For import-export (file processing dependencies)
RUN if [ "$SERVICE_NAME" = "import-export" ]; then \
    apt-get update && apt-get install -y \
    libreoffice \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*; \
    fi

# Stage 4: Final production image
FROM runtime-base AS production

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml* ./

# Copy shared packages
COPY --chown=nodejs:nodejs shared/ ./shared/

# Copy service package.json
ARG SERVICE_PATH
COPY --chown=nodejs:nodejs services/$SERVICE_PATH/package.json ./services/$SERVICE_PATH/

# Install production dependencies only
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/services/$SERVICE_PATH/dist ./services/$SERVICE_PATH/dist

# Switch to non-root user
USER nodejs

# Set working directory to service
WORKDIR /app/services/$SERVICE_PATH

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/api/v1/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Expose port
EXPOSE 3000-4000

# Start command
CMD ["node", "dist/main.js"]