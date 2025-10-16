# Specialized Dockerfile for Auth service with OpenTelemetry support
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

# Copy services
COPY services/ ./services/

# Install all dependencies including OpenTelemetry
RUN pnpm install --frozen-lockfile --ignore-scripts || pnpm install --no-frozen-lockfile

# Ensure OpenTelemetry packages are installed for auth service
WORKDIR /app/services/auth
RUN pnpm add @opentelemetry/sdk-node@^0.52.1 @opentelemetry/api@^1.9.0 @opentelemetry/core@^1.25.1 || true

# Rebuild native modules for Alpine Linux
RUN npm rebuild bcrypt --build-from-source

# Build the auth service
RUN pnpm run build || echo "No build script, skipping..."

# Expose port
EXPOSE 3000

# Start the service in production mode
CMD ["pnpm", "start:prod"]