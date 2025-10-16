# Working Dockerfile with proper dependency installation
FROM node:20-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat python3 make g++

# Copy all files
COPY . .

# Install root dependencies
RUN npm install

# Install and build shared packages
WORKDIR /app/shared/kernel
RUN npm install && npm run build

WORKDIR /app/shared/contracts  
RUN npm install && npm run build

WORKDIR /app/shared/transactions
RUN npm install && npm run build

WORKDIR /app/shared/utils
RUN npm install && npm run build

# Build service
ARG SERVICE_PATH
WORKDIR /app/${SERVICE_PATH}
RUN npm install && npm run build

# Service configuration
ARG SERVICE_PORT
ENV APP_PORT=${SERVICE_PORT}
EXPOSE ${SERVICE_PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD node -e "require('http').get('http://localhost:' + process.env.APP_PORT + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Run the application
CMD ["node", "dist/main.js"]