import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import Stripe from "stripe";

import { db } from "../db.js";

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  if (!stripe || !webhookSecret) return;

  app.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (_req: FastifyRequest, body: Buffer, done: (err: Error | null, result?: unknown) => void) => {
      done(null, body);
    }
  );

  app.post("/v1/webhooks/stripe", async (req: FastifyRequest, reply: FastifyReply) => {
    const sig = req.headers["stripe-signature"];
    if (!sig || typeof sig !== "string") {
      return reply.code(400).send({ error: "Missing stripe-signature header" });
    }

    let event: Stripe.Event;
    try {
      event = stripe!.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
    } catch (err) {
      req.log.warn({ err }, "Webhook signature verification failed");
      return reply.code(400).send({ error: "Invalid signature" });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        if (userId) {
          db.prepare("UPDATE users SET plan = 'pro' WHERE id = ?").run(userId);
          req.log.info({ userId }, "Pro plan granted via checkout");
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const metadata = sub.metadata;
        const userId = metadata?.userId;
        if (userId) {
          db.prepare("UPDATE users SET plan = 'free' WHERE id = ?").run(userId);
          req.log.info({ userId }, "Pro plan revoked via subscription deletion");
        }
        break;
      }
      default:
        req.log.debug({ type: event.type }, "Unhandled webhook event type");
    }

    return { received: true };
  });
}
