import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import "dotenv/config";
import { appRouter } from "../src/server/routers";
import { createContext } from "../src/server/trpc";

const app = express();
const port = process.env.API_PORT || 3001;

// CORS configuration
app.use(
    cors({
        origin: [
            process.env.FRONTEND_URL || "http://localhost:8080",
            "http://localhost:8080",
            /\.railway\.app$/,  // Allow all Railway subdomains
        ],
        credentials: true,
    })
);

// Health check endpoint
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// tRPC middleware
app.use(
    "/api/trpc",
    createExpressMiddleware({
        router: appRouter,
        createContext,
    })
);

app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`);
    console.log(`tRPC endpoint: http://localhost:${port}/api/trpc`);
});

export type { appRouter };