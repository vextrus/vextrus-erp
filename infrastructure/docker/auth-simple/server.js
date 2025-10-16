const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());

// Health check endpoints
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "auth-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    headers: req.headers
  });
});

// Health endpoint for Traefik routing (matches API pattern)
app.get("/api/auth/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "auth-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    headers: req.headers
  });
});

app.get("/health/ready", (req, res) => {
  res.status(200).json({ status: "ready" });
});

app.get("/health/live", (req, res) => {
  res.status(200).json({ status: "alive" });
});

// Auth endpoints for testing
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  
  // Log tenant headers for testing
  console.log("Tenant headers:", {
    "x-tenant-id": req.headers["x-tenant-id"],
    "x-project-id": req.headers["x-project-id"],
    "x-site-id": req.headers["x-site-id"]
  });
  
  if (username === "admin" && password === "admin") {
    res.json({
      token: "fake-jwt-token",
      user: { id: 1, username: "admin" },
      tenant: req.headers["x-tenant-id"] || "default"
    });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get("/api/auth/profile", (req, res) => {
  res.json({
    user: { id: 1, username: "admin" },
    tenant: req.headers["x-tenant-id"] || "default",
    project: req.headers["x-project-id"] || null,
    site: req.headers["x-site-id"] || null
  });
});

// Default route
app.get("/", (req, res) => {
  res.json({
    service: "Vextrus Auth Service",
    version: "1.0.0",
    status: "running"
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Auth service listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});