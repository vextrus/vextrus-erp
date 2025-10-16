# Fast Dockerfile using npm workspaces
FROM node:20-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat python3 make g++

# Copy all files
COPY . .

# Install all dependencies at once using npm workspaces
RUN npm install --workspaces --include-workspace-root

# Build all packages at once
RUN npm run build:shared && npm run build:services

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