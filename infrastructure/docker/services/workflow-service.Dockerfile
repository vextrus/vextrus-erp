# Specialized Dockerfile for Workflow service with Temporal.io support
FROM node:20-slim

# Install dependencies for building
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml* ./

# Copy shared packages
COPY shared/ ./shared/

# Install pnpm
RUN npm install -g pnpm@8

# Copy services
COPY services/ ./services/

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts || pnpm install --no-frozen-lockfile

# Build the workflow service
WORKDIR /app/services/workflow
RUN pnpm run build || echo "No build script, skipping..."

# Expose port
EXPOSE 3011

# Start the service in production mode
CMD ["pnpm", "start:prod"]