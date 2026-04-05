import type { FastifyInstance } from "fastify";

import { API_VERSION } from "../api-types.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({ ok: true, version: API_VERSION }));
}
