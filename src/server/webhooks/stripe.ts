/**
 * Stripe Webhook Handler Module
 * Handles all Stripe webhook events
 */

import Stripe from 'stripe';
import { getSupabaseServerClient } from '../../lib/supabase-server';
import { stripeService } from '../services/stripe';

export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
        case 'checkout.session.completed': {
            await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
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

        await supabase.from('subscriptions').insert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            status: 'active',
            subscription_tier: tier,
            current_period_start: new Date(subscriptionItem.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscriptionItem.current_period_end * 1000).toISOString(),
        });

        console.log(`Subscription created for user ${userId}`);
    } catch (error) {
        console.error('Error handling checkout.session.completed:', error);
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
