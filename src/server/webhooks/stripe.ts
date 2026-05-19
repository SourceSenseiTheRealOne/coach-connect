/**
 * Stripe Webhook Handler Module
 * Handles all Stripe webhook events
 */

import Stripe from 'stripe';
import { getSupabaseServerClient } from '../../lib/supabase-server';
import { stripeService } from '../services/stripe';
import { marketplaceOrders } from '../db';

export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
        case 'checkout.session.completed': {
            await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
            break;
        }

        case 'checkout.session.expired': {
            await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
            break;
        }

        case 'customer.subscription.updated': {
            await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
            break;
        }

        case 'customer.subscription.deleted': {
            await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
            break;
        }

        case 'invoice.payment_succeeded': {
            await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
            break;
        }

        case 'invoice.payment_failed': {
            await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    if (session.metadata?.type === 'marketplace_order') {
        await handleMarketplaceCheckoutSessionCompleted(session);
        return;
    }

    const supabase = getSupabaseServerClient();
    const userId = session.metadata?.userId;
    const priceId = session.metadata?.priceId;
    const tier = session.metadata?.tier;

    if (!userId || !priceId || !tier || !session.subscription) {
        console.error('Missing required metadata in checkout session');
        return;
    }

    try {
        const subscription = await stripeService.getSubscription(session.subscription as string);
        const subscriptionItem = subscription.items.data[0];

        if (!subscriptionItem) {
            console.error(`Subscription ${subscription.id} has no items`);
            return;
        }

        const subscriptionPayload = {
            p_user_id: userId,
            p_stripe_customer_id: session.customer as string,
            p_stripe_subscription_id: subscription.id,
            p_stripe_price_id: priceId,
            p_status: subscription.status,
            p_subscription_tier: tier,
            p_current_period_start: new Date(subscriptionItem.current_period_start * 1000).toISOString(),
            p_current_period_end: new Date(subscriptionItem.current_period_end * 1000).toISOString(),
            p_cancel_at_period_end: subscription.cancel_at_period_end,
        };

        const { error: rpcError } = await supabase.rpc(
            'record_stripe_subscription',
            subscriptionPayload,
        );

        if (rpcError) {
            // Fallback keeps older databases usable, while still surfacing insert
            // failures that used to be silently ignored.
            if (rpcError.code !== 'PGRST202') {
                throw rpcError;
            }

            const { error: insertError } = await supabase.from('subscriptions').insert({
                user_id: userId,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: subscription.id,
                stripe_price_id: priceId,
                status: subscription.status,
                subscription_tier: tier,
                current_period_start: subscriptionPayload.p_current_period_start,
                current_period_end: subscriptionPayload.p_current_period_end,
                cancel_at_period_end: subscription.cancel_at_period_end,
            });

            if (insertError) {
                throw insertError;
            }
        }

        console.log(`Subscription created for user ${userId}`);
    } catch (error) {
        console.error('Error handling checkout.session.completed:', error);
        throw error;
    }
}

async function handleMarketplaceCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const orderId = session.metadata?.orderId;
    if (!orderId) {
        console.error('Missing marketplace order metadata in checkout session');
        return;
    }

    try {
        const paidAt = new Date();
        const payoutDueAt = new Date(paidAt);
        payoutDueAt.setDate(payoutDueAt.getDate() + 7);

        const order = await marketplaceOrders.update(orderId, {
            status: 'paid',
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id ?? null,
            paid_at: paidAt.toISOString(),
            payout_status: 'processing',
            payout_due_at: payoutDueAt.toISOString(),
        });

        if (!order) {
            console.error(`Marketplace order ${orderId} not found`);
            return;
        }

        console.log(`Marketplace order ${orderId} paid; payout due by ${payoutDueAt.toISOString()}`);
    } catch (error) {
        console.error('Error handling marketplace checkout.session.completed:', error);
        throw error;
    }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session): Promise<void> {
    if (session.metadata?.type !== 'marketplace_order') {
        return;
    }

    const orderId = session.metadata?.orderId;
    if (!orderId) return;

    try {
        await marketplaceOrders.update(orderId, {
            status: 'canceled',
            stripe_checkout_session_id: session.id,
        });
        console.log(`Marketplace order ${orderId} canceled after checkout expiration`);
    } catch (error) {
        console.error('Error handling checkout.session.expired:', error);
        throw error;
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const supabase = getSupabaseServerClient();

    try {
        const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('stripe_subscription_id', subscription.id)
            .single();

        if (!existingSub) {
            console.error(`Subscription ${subscription.id} not found in database`);
            return;
        }

        const subscriptionItem = subscription.items.data[0];
        if (!subscriptionItem) {
            console.error(`Subscription ${subscription.id} has no items`);
            return;
        }

        await supabase.from('subscriptions').update({
            status: subscription.status,
            current_period_start: new Date(subscriptionItem.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscriptionItem.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
        }).eq('id', existingSub.id);

        console.log(`Subscription ${subscription.id} updated`);
    } catch (error) {
        console.error('Error handling customer.subscription.updated:', error);
        throw error;
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const supabase = getSupabaseServerClient();

    try {
        await supabase.from('subscriptions').update({
            status: 'canceled',
        }).eq('stripe_subscription_id', subscription.id);

        console.log(`Subscription ${subscription.id} canceled`);
    } catch (error) {
        console.error('Error handling customer.subscription.deleted:', error);
        throw error;
    }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const supabase = getSupabaseServerClient();

    // @ts-expect-error - subscription property exists in API but not in TypeScript types
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) {
        return;
    }

    try {
        const subscription = await stripeService.getSubscription(subscriptionId);
        const subscriptionItem = subscription.items.data[0];

        if (!subscriptionItem) {
            console.error(`Subscription ${subscription.id} has no items`);
            return;
        }

        await supabase.from('subscriptions').update({
            status: subscription.status,
            current_period_start: new Date(subscriptionItem.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscriptionItem.current_period_end * 1000).toISOString(),
        }).eq('stripe_subscription_id', subscription.id);

        console.log(`Payment succeeded for subscription ${subscription.id}`);
    } catch (error) {
        console.error('Error handling invoice.payment_succeeded:', error);
        throw error;
    }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const supabase = getSupabaseServerClient();

    // @ts-expect-error - subscription property exists in API but not in TypeScript types
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) {
        return;
    }

    try {
        await supabase.from('subscriptions').update({
            status: 'past_due',
        }).eq('stripe_subscription_id', subscriptionId);

        console.log(`Payment failed for subscription ${subscriptionId}`);
    } catch (error) {
        console.error('Error handling invoice.payment_failed:', error);
        throw error;
    }
}
