# Simple Dockerfile for NestJS services
FROM node:20-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache libc6-compat python3 make g++

# Copy everything
COPY . .

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages
RUN cd shared/kernel && npm run build && \
    cd ../contracts && npm run build && \
    cd ../transactions && npm run build && \
    cd ../utils && npm run build

# Build service (path will be provided as build arg)
ARG SERVICE_PATH
RUN cd ${SERVICE_PATH} && npm run build

# Service configuration
ARG SERVICE_PORT
ENV APP_PORT=${SERVICE_PORT}
EXPOSE ${SERVICE_PORT}

# Start from service directory
WORKDIR /app/${SERVICE_PATH}

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD node -e "require('http').get('http://localhost:' + process.env.APP_PORT + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Run the application
CMD ["node", "dist/main.js"]