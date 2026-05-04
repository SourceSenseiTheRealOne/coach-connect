import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import "dotenv/config";
import { appRouter } from "../src/server/routers";
import { createContext } from "../src/server/trpc";
import { stripeService } from "../src/server/services/stripe";
import { handleStripeWebhook } from "../src/server/webhooks/stripe";
import { errorHandler, notFoundHandler } from "../src/server/middleware/errorHandler";
import { env } from "../src/server/config/env";

const app = express();
const port = env.API_PORT;

// CORS configuration
app.use(
    cors({
        origin: [
            env.FRONTEND_URL,
            "http://localhost:8080",
            /\.railway\.app$/,  // Allow all Railway subdomains
        ],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'authorization'],
    })
);

// Health check endpoint
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Stripe webhook endpoint
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;

    try {
        const event = stripeService.constructWebhookEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
        await handleStripeWebhook(event);
        res.json({ received: true });
    } catch (err) {
        console.error('Webhook processing failed:', err);
        return res.status(400).json({ error: 'Webhook processing failed' });
    }
});

// tRPC middleware
app.use(
    "/api/trpc",
    createExpressMiddleware({
        router: appRouter,
        createContext,
    })
);

// Error handling middleware (must be after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`);
    console.log(`tRPC endpoint: http://localhost:${port}/api/trpc`);
});

export type { appRouter };