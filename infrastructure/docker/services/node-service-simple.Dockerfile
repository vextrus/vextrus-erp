# Simple Node.js service Dockerfile for Vextrus ERP
FROM node:20-alpine

# Install dependencies for building
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml* ./

# Copy shared packages
COPY shared/ ./shared/

# Install pnpm
RUN npm install -g pnpm@8

# Copy service based on build argument
ARG SERVICE_NAME
ARG SERVICE_PATH

# Map service names to paths
RUN if [ "$SERVICE_NAME" = "@vextrus/workflow-service" ]; then SERVICE_DIR="workflow"; \
    elif [ "$SERVICE_NAME" = "@vextrus/master-data" ]; then SERVICE_DIR="master-data"; \
    elif [ "$SERVICE_NAME" = "@vextrus/rules-engine-service" ]; then SERVICE_DIR="rules-engine"; \
    elif [ "$SERVICE_NAME" = "@vextrus/api-gateway" ]; then SERVICE_DIR="api-gateway"; \
    elif [ "$SERVICE_NAME" = "@vextrus/auth-service" ]; then SERVICE_DIR="auth"; \
    elif [ "$SERVICE_NAME" = "@vextrus/audit-service" ]; then SERVICE_DIR="audit"; \
    elif [ "$SERVICE_NAME" = "@vextrus/file-storage-service" ]; then SERVICE_DIR="file-storage"; \
    elif [ "$SERVICE_NAME" = "@vextrus/import-export-service" ]; then SERVICE_DIR="import-export"; \
    elif [ "$SERVICE_NAME" = "@vextrus/notification-service" ]; then SERVICE_DIR="notification"; \
    elif [ "$SERVICE_NAME" = "@vextrus/document-generator-service" ]; then SERVICE_DIR="document-generator"; \
    elif [ "$SERVICE_NAME" = "@vextrus/scheduler-service" ]; then SERVICE_DIR="scheduler"; \
    elif [ "$SERVICE_NAME" = "@vextrus/configuration-service" ]; then SERVICE_DIR="configuration"; \
    elif [ "$SERVICE_NAME" = "@vextrus/organization-service" ]; then SERVICE_DIR="organization"; \
    else SERVICE_DIR="unknown"; fi && \
    echo "SERVICE_DIR=$SERVICE_DIR" > /tmp/service_dir

# Copy the specific service
COPY services/ ./services/

# Skip heavy downloads for document-generator, import-export, and file-storage services
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true

# Install dependencies with cache mount for faster builds
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    --mount=type=cache,target=/root/.cache \
    pnpm install --frozen-lockfile --ignore-scripts || pnpm install --no-frozen-lockfile --ignore-scripts

# Build the service
RUN . /tmp/service_dir && \
    if [ -d "services/$SERVICE_DIR" ]; then \
        cd services/$SERVICE_DIR && \
        pnpm run build || echo "No build script, skipping..."; \
    fi

# Set working directory to service
RUN . /tmp/service_dir && \
    if [ -d "services/$SERVICE_DIR" ]; then \
        echo "WORKDIR /app/services/$SERVICE_DIR" > /tmp/workdir; \
    fi

# Use the service directory
RUN . /tmp/service_dir && cd /app/services/$SERVICE_DIR

# Expose common ports
EXPOSE 3000-4000

# Start the service in production mode
RUN . /tmp/service_dir && echo "cd /app/services/$SERVICE_DIR && pnpm start" > /app/start.sh && chmod +x /app/start.sh
CMD ["/bin/sh", "/app/start.sh"]