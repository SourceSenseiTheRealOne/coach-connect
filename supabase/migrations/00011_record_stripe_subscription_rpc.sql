-- ============================================================
-- Stripe subscription webhook helper
-- ============================================================
-- The production database uses the subscription_tier enum type for
-- subscriptions.subscription_tier. PostgREST inserts from JSON can treat
-- incoming values as text, so the webhook uses this RPC to cast explicitly.

CREATE OR REPLACE FUNCTION update_profile_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's profile subscription tier based on their active subscription.
    -- Cast explicitly because some deployed databases use the subscription_tier enum
    -- on profiles/subscriptions while JSON/RPC input arrives as text.
    IF NEW.status = 'active' THEN
        UPDATE profiles
        SET subscription_tier = NEW.subscription_tier::public.subscription_tier
        WHERE id = NEW.user_id;
    ELSIF NEW.status = 'canceled' OR NEW.status = 'incomplete_expired' THEN
        IF NOT EXISTS (
            SELECT 1 FROM subscriptions
            WHERE user_id = NEW.user_id
            AND status = 'active'
            AND id != NEW.id
        ) THEN
            UPDATE profiles
            SET subscription_tier = 'free'::public.subscription_tier
            WHERE id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS public.record_stripe_subscription(
    UUID,
    TEXT,
    TEXT,
    TEXT,
    TEXT,
    TEXT,
    TIMESTAMPTZ,
    TIMESTAMPTZ,
    BOOLEAN
);

CREATE OR REPLACE FUNCTION public.record_stripe_subscription(
    p_user_id UUID,
    p_stripe_customer_id TEXT,
    p_stripe_subscription_id TEXT,
    p_stripe_price_id TEXT,
    p_status TEXT,
    p_subscription_tier TEXT,
    p_current_period_start TIMESTAMPTZ,
    p_current_period_end TIMESTAMPTZ,
    p_cancel_at_period_end BOOLEAN DEFAULT false
)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subscription public.subscriptions;
BEGIN
    INSERT INTO public.subscriptions (
        user_id,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        status,
        subscription_tier,
        current_period_start,
        current_period_end,
        cancel_at_period_end
    )
    VALUES (
        p_user_id,
        p_stripe_customer_id,
        p_stripe_subscription_id,
        p_stripe_price_id,
        p_status,
        p_subscription_tier::public.subscription_tier,
        p_current_period_start,
        p_current_period_end,
        p_cancel_at_period_end
    )
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        stripe_price_id = EXCLUDED.stripe_price_id,
        status = EXCLUDED.status,
        subscription_tier = EXCLUDED.subscription_tier,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        cancel_at_period_end = EXCLUDED.cancel_at_period_end
    RETURNING * INTO v_subscription;

    RETURN v_subscription;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_stripe_subscription(
    UUID,
    TEXT,
    TEXT,
    TEXT,
    TEXT,
    TEXT,
    TIMESTAMPTZ,
    TIMESTAMPTZ,
    BOOLEAN
) TO service_role;
