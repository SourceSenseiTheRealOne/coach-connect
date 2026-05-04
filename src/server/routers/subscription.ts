import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { getSupabaseServerClient } from '../../lib/supabase-server';
import { z } from 'zod';
import { stripeService, PRICE_IDS } from '../services/stripe';
import { env } from '../config/env';

export const subscriptionRouter = router({
    // Get available subscription plans
    getPlans: publicProcedure.query(async () => {
        return await stripeService.getPlans();
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

            const frontendUrl = env.FRONTEND_URL;

            const session = await stripeService.createCheckoutSession({
                customerId: existingSubscription?.stripe_customer_id,
                email: ctx.user.email,
                userId: ctx.user.id,
                priceId,
                successUrl: `${frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${frontendUrl}/subscription/canceled`,
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
                await stripeService.cancelSubscription(subscription.stripe_subscription_id);
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
            publishableKey: env.STRIPE_PUBLISHABLE_KEY,
        };
    }),
});
