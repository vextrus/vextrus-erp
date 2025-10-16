# Simple Dockerfile using npm instead of pnpm
FROM node:20-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files first
COPY package.json package-lock.json* ./
COPY shared/kernel/package.json ./shared/kernel/
COPY shared/contracts/package.json ./shared/contracts/
COPY shared/transactions/package.json ./shared/transactions/
COPY shared/utils/package.json ./shared/utils/

# Copy service package.json
ARG SERVICE_PATH
COPY ${SERVICE_PATH}/package.json ./${SERVICE_PATH}/

# Copy all source code
COPY . .

# Install dependencies using npm
RUN npm ci --prefer-offline --no-audit --no-fund || npm install

# Build shared packages
RUN cd shared/kernel && npm run build && \
    cd ../contracts && npm run build && \
    cd ../transactions && npm run build && \
    cd ../utils && npm run build

# Build service
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