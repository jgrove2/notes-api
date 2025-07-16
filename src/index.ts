import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import { createRouter } from "./router/router.js";
import { migrationService } from "./service/migrations.js";
import { DATABASE_URL, PORT } from "./util/environment.js";

// Initialize database and run migrations
async function initializeDatabase() {
  try {
    console.log("🔄 Initializing database...");
    await migrationService.runMigrations();
    console.log("✅ Database initialization complete");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

const app: Express = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/", createRouter());

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Notes API Server",
    version: "1.0.0",
    framework: "Express.js",
    validation: "Zod",
    database: "Neon PostgreSQL",
    endpoints: {
      health: "/api/health",
      healthDetailed: "/api/health/detailed?detailed=true",
    },
    features: [
      "TypeScript with strict mode",
      "Express.js server",
      "Zod validation middleware",
      "Neon database integration with generics",
      "Health check endpoints",
      "Error handling middleware",
      "CORS support",
      "Request logging",
    ],
  });
});

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", error);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

// Start server
async function startServer() {
  if (process.env.NODE_ENV !== "test") {
    // Initialize database first
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Database connected: ${DATABASE_URL ? "Yes" : "No"}`);
    });
  } else {
    // For tests, just run migrations
    await initializeDatabase();
  }
}

// Start the application
startServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});

export default app;
