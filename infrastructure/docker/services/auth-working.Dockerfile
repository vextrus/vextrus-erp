# Working NestJS Auth Service - Simplified approach
FROM node:20 AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Copy everything (simple but works)
COPY . .

# Install dependencies with no optional packages to avoid build errors
RUN pnpm install --no-optional --ignore-scripts

# Build shared packages
RUN pnpm --filter @vextrus/kernel build && \
    pnpm --filter @vextrus/contracts build && \
    pnpm --filter @vextrus/utils build && \
    pnpm --filter @vextrus/distributed-transactions build

# Build auth service
RUN pnpm --filter @vextrus/auth-service build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache dumb-init curl && \
    npm install -g pnpm@8.15.0

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder /app ./

# Remove dev dependencies
RUN pnpm prune --prod

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set working directory
WORKDIR /app/services/auth

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/v1/health || exit 1

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]