import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
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

// Trust proxy (Railway/Render/Heroku) so rate-limit reads real client IP
app.set("trust proxy", 1);

// CORS configuration
app.use(
    cors({
        origin: [
            env.FRONTEND_URL,
            "http://localhost:8080",
            "http://localhost:8081",
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

// Stripe webhook endpoint (no rate limit - Stripe needs reliable delivery)
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

// Rate limiters
// General tRPC limit: prevents abuse while allowing normal use
const trpcLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 120, // 120 requests/min/IP
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});

// Strict limit on auth path to slow credential-stuffing / signup spam
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 20, // 20 auth attempts/15min/IP
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true, // only count failures + signups
    message: { error: 'Too many authentication attempts, please try again later.' },
});

// Apply strict limiter to tRPC auth procedures (login, signup, resetPassword, oauth)
// tRPC URL pattern: /api/trpc/auth.login, /api/trpc/auth.signup, etc.
app.use('/api/trpc/auth.', authLimiter);
app.use('/api/trpc', trpcLimiter);

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
