# Stripe Subscription Integration Setup Guide

This guide will help you set up and test Stripe subscriptions in test mode using dev/dummy money.

## Prerequisites

- Stripe account (already created: `acct_1OQFY4HWoHwKWIEO`)
- Existing products configured:
  - Pro Service: €9.99/month (price_1TRZLgHWoHwKWIEOGA0VcMdu)
  - Club License: €29.99/month (price_1TRZLhHWoHwKWIEOx71Pf3Wk)

## Step 1: Get Stripe API Keys

1. Go to your Stripe Dashboard: https://dashboard.stripe.com/acct_1OQFY4HWoHwKWIEO/apikeys
2. Make sure you're in **Test mode** (toggle in the top-left corner)
3. Copy the **Publishable key** (starts with `pk_test_`)
4. Reveal and copy the **Secret key** (starts with `sk_test_`)

## Step 2: Configure Webhook

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL: `https://your-domain.com/webhook/stripe`
   - For local testing, use: `http://localhost:3001/webhook/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Webhook signing secret** (starts with `whsec_`)

## Step 3: Set Environment Variables

Create a `.env` file in the project root (or update existing one):

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe (Test Mode)
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Server
API_PORT=3001
FRONTEND_URL=http://localhost:8080
```

## Step 4: Run Database Migration

Apply the subscriptions table migration to your Supabase database:

```bash
# Run the migration in Supabase SQL Editor
# Or use the Supabase CLI:
supabase db push
```

The migration file is located at: `supabase/migrations/00006_subscriptions_setup.sql`

## Step 5: Test the Integration

### Start the Development Servers

```bash
# Terminal 1: Start backend server
npm run dev:server

# Terminal 2: Start frontend
npm run dev
```

### Test Subscription Flow

1. Navigate to http://localhost:8080/pricing
2. Click on **"Go Premium"** (Pro Service - €9.99/month) or **"Get License"** (Club License - €29.99/month)
3. You'll be redirected to Stripe Checkout
4. Use test card number: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/34)
   - Any CVC (e.g., 123)
   - Any postal code (e.g., 12345)
5. Complete the payment
6. You'll be redirected to `/subscription/success`
7. Check your database - a new subscription record should be created in the `subscriptions` table
8. Your profile's `subscription_tier` should be updated to `pro_service` or `club_license`

### Test Card Numbers

Use these Stripe test cards to simulate different scenarios:

- **Successful payment**: `4242 4242 4242 4242`
- **Requires authentication**: `4000 0025 0000 3155`
- **Card declined (insufficient funds)**: `4000 0000 0000 9995`
- **Card declined (generic decline)**: `4000 0000 0000 0002`

For more test scenarios, visit: https://stripe.com/docs/testing

## Step 6: Verify Webhook Processing

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. You should see events being received after checkout
4. Check the server logs for webhook processing messages

## Step 7: Test Subscription Management

### Cancel Subscription

1. Navigate to `/dashboard/settings` (you'll need to implement this UI)
2. Or use the tRPC mutation directly:
```typescript
trpc.subscription.cancelSubscription.mutate()
```

### Check Subscription Status

```typescript
const subscription = await trpc.subscription.getUserSubscription.query();
```

## Architecture Overview

### Backend Components

1. **Subscription Router** (`src/server/routers/subscription.ts`)
   - `getPlans`: Fetch available subscription plans
   - `createCheckoutSession`: Create Stripe checkout session
   - `getUserSubscription`: Get user's active subscription
   - `cancelSubscription`: Cancel subscription
   - `getPublishableKey`: Get Stripe publishable key

2. **Webhook Handler** (`server/index.ts`)
   - Handles Stripe webhook events
   - Updates subscription status in database
   - Syncs with Stripe subscription lifecycle

### Database Schema

**subscriptions table:**
- `user_id`: Link to profiles table
- `stripe_customer_id`: Stripe customer ID
- `stripe_subscription_id`: Stripe subscription ID
- `stripe_price_id`: Price ID subscribed to
- `status`: Subscription status (active, canceled, past_due)
- `subscription_tier`: Tier (pro_service, club_license)
- `current_period_start`: Current billing period start
- `current_period_end`: Current billing period end
- `cancel_at_period_end`: Whether to cancel at period end

### Frontend Components

1. **PricingPage**: Updated with Stripe checkout integration
2. **SubscriptionSuccessPage**: Success page after checkout
3. **SubscriptionCanceledPage**: Cancellation page

## Troubleshooting

### Webhook Signature Verification Failed

- Ensure `STRIPE_WEBHOOK_SECRET` is correctly set in `.env`
- Check that the webhook endpoint URL matches exactly
- Verify the webhook is receiving events in Stripe Dashboard

### Checkout Redirects to Login

- Ensure user is authenticated before starting checkout
- The subscription router requires authentication

### Subscription Not Created After Payment

- Check server logs for webhook processing errors
- Verify webhook events are being received in Stripe Dashboard
- Ensure database migration was applied correctly

### CORS Errors

- Ensure `FRONTEND_URL` in `.env` matches your frontend URL
- Check CORS configuration in `server/index.ts`

## Going Live

When ready to go live:

1. Switch to **Live mode** in Stripe Dashboard
2. Use live API keys (pk_live_, sk_live_)
3. Update webhook endpoint to production URL
4. Update environment variables with live keys
5. Test with real payments (small amounts first)

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Testing Guide: https://stripe.com/docs/testing
- Your Stripe Dashboard: https://dashboard.stripe.com/acct_1OQFY4HWoHwKWIEO
