import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import Stripe from "stripe";

import { authHeader } from "../auth.js";

export async function billingRoutes(
  app: FastifyInstance,
  opts: { publicBase: string }
): Promise<void> {
  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

  // v1 billing
  app.post("/v1/billing/checkout", async (req: FastifyRequest, reply: FastifyReply) => {
    if (process.env.ENABLE_STRIPE_BILLING !== "true") {
      return reply.code(404).send({ error: "Billing is not enabled" });
    }
    if (!stripe || !process.env.STRIPE_PRICE_PRO) {
      return reply.code(503).send({ error: "Stripe not configured" });
    }
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    const base = opts.publicBase.replace(/\/$/, "");
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: process.env.STRIPE_PRICE_PRO, quantity: 1 }],
        success_url: `${base}/health?checkout=success`,
        cancel_url: `${base}/health?checkout=cancel`,
        client_reference_id: payload.sub,
      });
      if (!session.url) {
        return reply.code(502).send({ error: "Stripe did not return a checkout URL" });
      }
      return { url: session.url };
    } catch (err) {
      req.log.error(err);
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "checkout failed";
      return reply.code(400).send({ error: msg });
    }
  });

  // Legacy alias
  app.post("/api/billing/checkout", async (req, reply) => {
    if (process.env.ENABLE_STRIPE_BILLING !== "true") {
      return reply.code(404).send({ error: "Billing is not enabled" });
    }
    if (!stripe || !process.env.STRIPE_PRICE_PRO) {
      return reply.code(503).send({ error: "Stripe not configured" });
    }
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    const base = opts.publicBase.replace(/\/$/, "");
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: process.env.STRIPE_PRICE_PRO, quantity: 1 }],
        success_url: `${base}/health?checkout=success`,
        cancel_url: `${base}/health?checkout=cancel`,
        client_reference_id: payload.sub,
      });
      if (!session.url) return reply.code(502).send({ error: "Stripe did not return a checkout URL" });
      return { url: session.url };
    } catch (err) {
      req.log.error(err);
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "checkout failed";
      return reply.code(400).send({ error: msg });
    }
  });
}
