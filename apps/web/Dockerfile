# Vextrus ERP - Web Frontend Dockerfile
# Multi-stage build for Next.js 14 production deployment in pnpm monorepo
# Optimized for minimal image size and maximum performance

# ==============================================
# Stage 1: Dependencies
# ==============================================
FROM node:20-alpine AS deps

# Install libc6-compat for Alpine compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Copy monorepo configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace package.json files (required for pnpm workspace)
COPY apps/web/package.json ./apps/web/package.json
COPY shared/*/package.json ./shared/

# Install dependencies with pnpm workspace
# TODO: Update pnpm-lock.yaml and use --frozen-lockfile for production
RUN pnpm install --no-frozen-lockfile --filter=web...

# ==============================================
# Stage 2: Builder
# ==============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Copy monorepo configuration first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all source files from build context
COPY apps ./apps
COPY shared ./shared

# Copy node_modules from deps stage (both root and workspace-specific)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the web application using pnpm filter (run from root)
RUN pnpm --filter=web build

# ==============================================
# Stage 3: Runner (Production)
# ==============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy necessary files from builder (standalone output)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Switch to non-root user
USER nextjs

# Expose port 3000
EXPOSE 3000

# Set environment variable for port
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the Next.js application
CMD ["node", "apps/web/server.js"]
