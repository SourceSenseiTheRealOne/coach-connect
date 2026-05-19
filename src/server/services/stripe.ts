/**
 * Stripe Service Module
 * Centralized Stripe client and configuration
 */

import Stripe from 'stripe';
import { env } from '../config/env';
import {
    getTierForPriceId,
    isSupportedPaidPriceId,
    PRICE_IDS,
} from '../../shared/subscription-plans';

export { PRICE_IDS };

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
    // Get platform balance for admin marketplace payout review
    getBalance: async () => {
        const stripe = getStripeClient();
        return await stripe.balance.retrieve();
    },

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
                isSupportedPaidPriceId(price.id)
        );

        return subscriptionPrices.map((price) => {
            const tier = getTierForPriceId(price.id);

            if (!tier) {
                throw new Error(`Unsupported Stripe price ID: ${price.id}`);
            }

            return {
                id: price.id,
                amount: price.unit_amount ? price.unit_amount / 100 : 0,
                currency: price.currency,
                interval: price.recurring?.interval,
                tier,
                productName: (price.product as Stripe.Product).name,
            };
        });
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
        const tier = getTierForPriceId(priceId);

        if (!tier) {
            throw new Error(`Unsupported Stripe price ID: ${priceId}`);
        }

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
                tier,
            },
        });

        return session;
    },

    // Create one-time marketplace checkout session
    createMarketplaceCheckoutSession: async (params: {
        orderId: string;
        listingId: string;
        buyerId: string;
        sellerId: string;
        buyerEmail: string;
        listingTitle: string;
        amountCents: number;
        currency: string;
        successUrl: string;
        cancelUrl: string;
    }) => {
        const stripe = getStripeClient();

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            customer_email: params.buyerEmail,
            line_items: [
                {
                    price_data: {
                        currency: params.currency.toLowerCase(),
                        product_data: {
                            name: params.listingTitle,
                        },
                        unit_amount: params.amountCents,
                    },
                    quantity: 1,
                },
            ],
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            metadata: {
                type: 'marketplace_order',
                orderId: params.orderId,
                listingId: params.listingId,
                buyerId: params.buyerId,
                sellerId: params.sellerId,
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

    // Create billing portal session
    createBillingPortalSession: async (params: {
        customerId: string;
        returnUrl: string;
    }) => {
        const stripe = getStripeClient();
        return await stripe.billingPortal.sessions.create({
            customer: params.customerId,
            return_url: params.returnUrl,
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
