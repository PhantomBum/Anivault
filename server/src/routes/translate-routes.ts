import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

import { authHeader } from "../auth.js";
import { ensureProGrantForUserId } from "../pro-grant.js";

export async function translateRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/translate", async (req: FastifyRequest, reply: FastifyReply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    ensureProGrantForUserId(payload.sub);
    const key = process.env.DEEPL_API_KEY;
    if (!key) return reply.code(503).send({ error: "Server translation not configured" });
    const body = (req.body as Record<string, unknown>) || {};
    const { text, targetLang } = body;
    if (!text || !targetLang) return reply.code(400).send({ error: "text and targetLang required" });
    const res = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: { Authorization: `DeepL-Auth-Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: [String(text)],
        target_lang: String(targetLang).toUpperCase().slice(0, 2),
      }),
    });
    if (!res.ok) return reply.code(502).send({ error: "translation provider error" });
    const data = (await res.json()) as { translations?: Array<{ text: string }> };
    const out = data.translations?.[0]?.text ?? text;
    return { text: out };
  });

  // Legacy alias
  app.post("/api/translate", async (req, reply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    ensureProGrantForUserId(payload.sub);
    const key = process.env.DEEPL_API_KEY;
    if (!key) return reply.code(503).send({ error: "Server translation not configured" });
    const body = (req.body as Record<string, unknown>) || {};
    if (!body.text || !body.targetLang) return reply.code(400).send({ error: "text and targetLang required" });
    const res = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: { Authorization: `DeepL-Auth-Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: [String(body.text)],
        target_lang: String(body.targetLang).toUpperCase().slice(0, 2),
      }),
    });
    if (!res.ok) return reply.code(502).send({ error: "translation provider error" });
    const data = (await res.json()) as { translations?: Array<{ text: string }> };
    return { text: data.translations?.[0]?.text ?? body.text };
  });
}
