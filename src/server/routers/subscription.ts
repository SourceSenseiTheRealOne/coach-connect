import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import Stripe from 'stripe';
import { getSupabaseServerClient } from '../../lib/supabase-server';
import { z } from 'zod';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-04-22.dahlia',
});

// Price IDs from your Stripe account
const PRICE_IDS = {
    PRO_SERVICE: 'price_1TRZLgHWoHwKWIEOGA0VcMdu', // €9.99/month
    CLUB_LICENSE: 'price_1TRZLhHWoHwKWIEOx71Pf3Wk', // €29.99/month
};

// Subscription tier mapping
const TIER_MAPPING: Record<string, string> = {
    [PRICE_IDS.PRO_SERVICE]: 'pro_service',
    [PRICE_IDS.CLUB_LICENSE]: 'club_license',
};

export const subscriptionRouter = router({
    // Get available subscription plans
    getPlans: publicProcedure.query(async () => {
        const prices = await stripe.prices.list({
            active: true,
            expand: ['data.product'],
        });

        // Filter to only our subscription prices
        const subscriptionPrices = prices.data.filter(
            (price) => price.type === 'recurring' &&
                (price.id === PRICE_IDS.PRO_SERVICE || price.id === PRICE_IDS.CLUB_LICENSE)
        );

        return subscriptionPrices.map((price) => ({
            id: price.id,
            amount: price.unit_amount ? price.unit_amount / 100 : 0,
            currency: price.currency,
            interval: price.recurring?.interval,
            tier: TIER_MAPPING[price.id],
            productName: (price.product as Stripe.Product).name,
        }));
    }),

    // Create checkout session
    createCheckoutSession: protectedProcedure
        .input(z.object({
            priceId: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const supabase = getSupabaseServerClient();
            const { priceId } = input;

            // Validate price ID
            if (!Object.values(PRICE_IDS).includes(priceId)) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid price ID',
                });
            }

            // Check if user already has an active subscription
            const { data: existingSubscription } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', ctx.user.id)
                .eq('status', 'active')
                .single();

            let customerId: string;

            if (existingSubscription?.stripe_customer_id) {
                customerId = existingSubscription.stripe_customer_id;
            } else {
                // Create or get Stripe customer
                const customer = await stripe.customers.create({
                    email: ctx.user.email,
                    metadata: {
                        userId: ctx.user.id,
                    },
                });
                customerId = customer.id;
            }

            // Create checkout session
            const session = await stripe.checkout.sessions.create({
                customer: customerId,
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                success_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/subscription/canceled`,
                metadata: {
                    userId: ctx.user.id,
                    priceId: priceId,
                    tier: TIER_MAPPING[priceId],
                },
            });

            return { sessionId: session.id, url: session.url };
        }),

    // Get user's subscription
    getUserSubscription: protectedProcedure
        .query(async ({ ctx }) => {
            const supabase = getSupabaseServerClient();

            const { data: subscription, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', ctx.user.id)
                .eq('status', 'active')
                .single();

            if (error || !subscription) {
                return null;
            }

            return subscription;
        }),

    // Cancel subscription
    cancelSubscription: protectedProcedure
        .mutation(async ({ ctx }) => {
            const supabase = getSupabaseServerClient();

            // Get active subscription
            const { data: subscription, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', ctx.user.id)
                .eq('status', 'active')
                .single();

            if (error || !subscription) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'No active subscription found',
                });
            }

            // Cancel subscription at period end
            if (subscription.stripe_subscription_id) {
                await stripe.subscriptions.update(subscription.stripe_subscription_id, {
                    cancel_at_period_end: true,
                });
            }

            // Update database
            await supabase
                .from('subscriptions')
                .update({ cancel_at_period_end: true })
                .eq('id', subscription.id);

            return { success: true };
        }),

    // Get Stripe publishable key
    getPublishableKey: publicProcedure.query(() => {
        return {
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        };
    }),
});
