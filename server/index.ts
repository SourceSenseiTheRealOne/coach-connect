import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import "dotenv/config";
import { appRouter } from "../src/server/routers";
import { createContext } from "../src/server/trpc";
import Stripe from "stripe";
import { getSupabaseServerClient } from "../src/lib/supabase-server";

const app = express();
const port = process.env.API_PORT || 3001;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-04-22.dahlia',
});

// CORS configuration
app.use(
    cors({
        origin: [
            process.env.FRONTEND_URL || "http://localhost:8080",
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
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET is not configured');
        return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).json({ error: 'Invalid signature' });
    }

    const supabase = getSupabaseServerClient();

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;
                const priceId = session.metadata?.priceId;
                const tier = session.metadata?.tier;

                if (userId && priceId && tier && session.subscription) {
                    // Create subscription record
                    const subscription = await stripe.subscriptions.retrieve(session.subscription as string) as Stripe.Subscription;

                    await supabase.from('subscriptions').insert({
                        user_id: userId,
                        stripe_customer_id: session.customer as string,
                        stripe_subscription_id: subscription.id,
                        stripe_price_id: priceId,
                        status: 'active',
                        subscription_tier: tier,
                        current_period_start: new Date(subscription.items.data[0].current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
                    });

                    console.log(`Subscription created for user ${userId}`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const { data: existingSub } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('stripe_subscription_id', subscription.id)
                    .single();

                if (existingSub) {
                    await supabase.from('subscriptions').update({
                        status: subscription.status,
                        current_period_start: new Date(subscription.items.data[0].current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
                        cancel_at_period_end: subscription.cancel_at_period_end,
                    }).eq('id', existingSub.id);

                    console.log(`Subscription ${subscription.id} updated`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await supabase.from('subscriptions').update({
                    status: 'canceled',
                }).eq('stripe_subscription_id', subscription.id);

                console.log(`Subscription ${subscription.id} canceled`);
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                if (invoice.parent?.subscription_details?.subscription) {
                    const subscription = await stripe.subscriptions.retrieve(invoice.parent.subscription_details.subscription as string) as Stripe.Subscription;
                    await supabase.from('subscriptions').update({
                        status: subscription.status,
                        current_period_start: new Date(subscription.items.data[0].current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
                    }).eq('stripe_subscription_id', subscription.id);

                    console.log(`Payment succeeded for subscription ${subscription.id}`);
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                if (invoice.parent?.subscription_details?.subscription) {
                    await supabase.from('subscriptions').update({
                        status: 'past_due',
                    }).eq('stripe_subscription_id', invoice.parent.subscription_details.subscription as string);

                    console.log(`Payment failed for subscription ${invoice.parent.subscription_details.subscription}`);
                }
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
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

app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`);
    console.log(`tRPC endpoint: http://localhost:${port}/api/trpc`);
});

export type { appRouter };