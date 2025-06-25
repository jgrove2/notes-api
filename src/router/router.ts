import type { Hono } from "hono";

export function createRouter(app: Hono) {
  app.get("/health", (c) => {
    return c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });
}
