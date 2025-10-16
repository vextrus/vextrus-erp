# Final working Dockerfile with proper workspace setup
FROM node:20-alpine

WORKDIR /app

# Install build tools and pnpm
RUN apk add --no-cache libc6-compat python3 make g++ && \
    npm install -g pnpm@9.14.2

# Copy all files
COPY . .

# Install all dependencies using pnpm (handles workspaces properly)
RUN pnpm install --frozen-lockfile --prefer-offline || pnpm install

# Build shared packages in order
RUN pnpm --filter @vextrus/kernel build && \
    pnpm --filter @vextrus/contracts build && \
    pnpm --filter @vextrus/distributed-transactions build && \
    pnpm --filter @vextrus/utils build

# Build service
ARG SERVICE_NAME
RUN pnpm --filter ${SERVICE_NAME} build

# Service configuration
ARG SERVICE_PATH
ARG SERVICE_PORT
ENV APP_PORT=${SERVICE_PORT}
EXPOSE ${SERVICE_PORT}

WORKDIR /app/${SERVICE_PATH}

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD node -e "require('http').get('http://localhost:' + process.env.APP_PORT + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Run the application
CMD ["node", "dist/main.js"]