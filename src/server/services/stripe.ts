/**
 * Stripe Service Module
 * Centralized Stripe client and configuration
 */

import Stripe from 'stripe';
import { env } from '../config/env';

// Price IDs from your Stripe account
export const PRICE_IDS = {
    PRO_SERVICE: 'price_1TRZLgHWoHwKWIEOGA0VcMdu', // €9.99/month
    CLUB_LICENSE: 'price_1TRZLhHWoHwKWIEOx71Pf3Wk', // €29.99/month
} as const;

// Subscription tier mapping
export const TIER_MAPPING: Record<string, string> = {
    [PRICE_IDS.PRO_SERVICE]: 'pro_service',
    [PRICE_IDS.CLUB_LICENSE]: 'club_license',
};

// Initialize Stripe singleton
let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe {
    if (!stripeInstance) {
        stripeInstance = new Stripe(env.STRIPE_SECRET_KEY);
    }

    return stripeInstance;
}

// Helper functions for common Stripe operations
export const stripeService = {
    // Get subscription plans
    getPlans: async () => {
        const stripe = getStripeClient();
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
    },

    // Create checkout session
    createCheckoutSession: async (params: {
        customerId?: string;
        email: string;
        userId: string;
        priceId: string;
        successUrl: string;
        cancelUrl: string;
    }) => {
        const stripe = getStripeClient();
        const { customerId, email, userId, priceId, successUrl, cancelUrl } = params;

        let finalCustomerId = customerId;

        if (!finalCustomerId) {
            const customer = await stripe.customers.create({
                email,
                metadata: { userId },
            });
            finalCustomerId = customer.id;
        }

        const session = await stripe.checkout.sessions.create({
            customer: finalCustomerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                userId,
                priceId,
                tier: TIER_MAPPING[priceId],
            },
        });

        return session;
    },

    // Cancel subscription at period end
    cancelSubscription: async (subscriptionId: string) => {
        const stripe = getStripeClient();
        return await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
    },

    // Retrieve subscription
    getSubscription: async (subscriptionId: string) => {
        const stripe = getStripeClient();
        return await stripe.subscriptions.retrieve(subscriptionId);
    },

    // Verify webhook signature
    constructWebhookEvent: (payload: string | Buffer, signature: string, secret: string) => {
        const stripe = getStripeClient();
        return stripe.webhooks.constructEvent(payload, signature, secret);
    },
};
