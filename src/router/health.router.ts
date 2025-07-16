import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { validateQuery } from "../middleware/validation.js";
import { db } from "../service/database.js";
import { migrationService } from "../service/migrations.js";

export function createHealthRouter(): Router {
  const router = Router();

  // Basic health check endpoint
  router.get("/", async (req: Request, res: Response) => {
    try {
      const dbHealthy = await db.healthCheck();

      res.json({
        status: dbHealthy ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        service: "notes-api",
        version: "1.0.0",
        database: dbHealthy ? "connected" : "disconnected",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        timestamp: new Date().toISOString(),
        service: "notes-api",
        version: "1.0.0",
        database: "error",
        error: "Health check failed",
      });
    }
  });

  // Health check with optional detailed info
  const healthQuerySchema = z.object({
    detailed: z
      .string()
      .optional()
      .transform((val) => val === "true"),
  });

  router.get(
    "/detailed",
    validateQuery(healthQuerySchema),
    async (req: Request, res: Response) => {
      try {
        const query = req.query as any;
        const { detailed } = query as { detailed?: boolean };

        const dbHealthy = await db.healthCheck();

        const response: any = {
          status: dbHealthy ? "ok" : "degraded",
          timestamp: new Date().toISOString(),
          service: "notes-api",
          version: "1.0.0",
          database: dbHealthy ? "connected" : "disconnected",
        };

        if (detailed) {
          response.uptime = process.uptime();
          response.memory = process.memoryUsage();
          response.environment = process.env.NODE_ENV || "development";
          response.nodeVersion = process.version;
          response.platform = process.platform;
        }

        res.json(response);
      } catch (error) {
        res.status(500).json({
          status: "error",
          timestamp: new Date().toISOString(),
          service: "notes-api",
          version: "1.0.0",
          error: "Detailed health check failed",
        });
      }
    }
  );

  // Migration status endpoint
  router.get("/migrations", async (req: Request, res: Response) => {
    try {
      const status = await migrationService.getMigrationStatus();
      res.json({
        status: "ok",
        migrations: status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        error: "Failed to get migration status",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return router;
}
