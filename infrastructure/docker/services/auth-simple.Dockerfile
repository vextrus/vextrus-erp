# Simple Auth Service Dockerfile for Traefik Testing
FROM node:20-alpine

# Install required tools
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Create a simple package.json for basic auth service
RUN echo '{ \
  "name": "auth-simple", \
  "version": "1.0.0", \
  "main": "server.js", \
  "dependencies": { \
    "express": "^4.18.2", \
    "cors": "^2.8.5", \
    "helmet": "^7.1.0", \
    "morgan": "^1.10.0" \
  } \
}' > package.json

# Install dependencies
RUN npm install

# Create simple auth server
RUN echo 'const express = require("express"); \
const cors = require("cors"); \
const helmet = require("helmet"); \
const morgan = require("morgan"); \
\
const app = express(); \
const PORT = process.env.PORT || 3001; \
\
// Middleware \
app.use(helmet()); \
app.use(cors()); \
app.use(morgan("combined")); \
app.use(express.json()); \
\
// Health check endpoints \
app.get("/health", (req, res) => { \
  res.status(200).json({ \
    status: "healthy", \
    service: "auth-service", \
    timestamp: new Date().toISOString(), \
    uptime: process.uptime(), \
    headers: req.headers \
  }); \
}); \
\
app.get("/health/ready", (req, res) => { \
  res.status(200).json({ status: "ready" }); \
}); \
\
app.get("/health/live", (req, res) => { \
  res.status(200).json({ status: "alive" }); \
}); \
\
// Auth endpoints for testing \
app.post("/api/auth/login", (req, res) => { \
  const { username, password } = req.body; \
  \
  // Log tenant headers for testing \
  console.log("Tenant headers:", { \
    "x-tenant-id": req.headers["x-tenant-id"], \
    "x-project-id": req.headers["x-project-id"], \
    "x-site-id": req.headers["x-site-id"] \
  }); \
  \
  if (username === "admin" && password === "admin") { \
    res.json({ \
      token: "fake-jwt-token", \
      user: { id: 1, username: "admin" }, \
      tenant: req.headers["x-tenant-id"] || "default" \
    }); \
  } else { \
    res.status(401).json({ error: "Invalid credentials" }); \
  } \
}); \
\
app.get("/api/auth/profile", (req, res) => { \
  res.json({ \
    user: { id: 1, username: "admin" }, \
    tenant: req.headers["x-tenant-id"] || "default", \
    project: req.headers["x-project-id"] || null, \
    site: req.headers["x-site-id"] || null \
  }); \
}); \
\
// Default route \
app.get("/", (req, res) => { \
  res.json({ \
    service: "Vextrus Auth Service", \
    version: "1.0.0", \
    status: "running" \
  }); \
}); \
\
// Error handling \
app.use((err, req, res, next) => { \
  console.error(err.stack); \
  res.status(500).json({ error: "Internal server error" }); \
}); \
\
// Start server \
app.listen(PORT, "0.0.0.0", () => { \
  console.log(`Auth service listening on port ${PORT}`); \
  console.log(`Health check: http://localhost:${PORT}/health`); \
}); \
' > server.js

# Switch to non-root user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]