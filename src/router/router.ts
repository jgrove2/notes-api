import { Router } from "express";
import type { Request, Response } from "express";
import { createHealthRouter } from "./health.router.js";
import { createProfileRouter } from "./profile.router.js";

export function createRouter(): Router {
  const router = Router();

  // Health routes
  router.use("/health", createHealthRouter());

  // Profile routes
  router.use("/profiles", createProfileRouter());

  // API info endpoint
  router.get("/", (req: Request, res: Response) => {
    res.json({
      message: "Notes API - Available Endpoints",
      version: "1.0.0",
      endpoints: {
        health: {
          basic: "GET /health",
          detailed: "GET /health/detailed?detailed=true",
          migrations: "GET /health/migrations",
        },
        profiles: {
          get: "GET /profiles/:userid",
          create: "POST /profiles",
          update: "PUT /profiles/:userid",
        },
        notes: {
          list: "GET /notes",
          search: "GET /notes/search?q=query",
          get: "GET /notes/:id",
          create: "POST /notes",
          update: "PUT /notes/:id",
          delete: "DELETE /notes/:id",
        },
      },
      schemas: {
        createProfile: {
          first_name: "string (required)",
          last_name: "string (required)",
          is_active: "boolean (optional, default: true)",
        },
        updateProfile: {
          first_name: "string (optional)",
          last_name: "string (optional)",
          is_active: "boolean (optional)",
        },
        createNote: {
          file_name: "string (required)",
          user_id: "number (required)",
          file_id: "string (required)",
          total_size_bytes: "number (optional, default: 0)",
        },
        updateNote: {
          file_name: "string (optional)",
          total_size_bytes: "number (optional)",
        },
      },
    });
  });

  return router;
}
