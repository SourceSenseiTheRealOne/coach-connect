-- ============================================================
-- Subscriptions: table, indexes, and RLS Policies
-- ============================================================

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    subscription_tier TEXT NOT NULL, -- 'pro_service' or 'club_license'
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ============================================================
-- Enable RLS
-- ============================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Drop existing policies (safe to re-run)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can create subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;

-- ============================================================
-- Subscriptions policies
-- ============================================================
CREATE POLICY "Users can view own subscriptions"
ON subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create subscriptions"
ON subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
ON subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trigger_update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================================
-- Function to update user subscription tier in profiles
-- ============================================================
CREATE OR REPLACE FUNCTION update_profile_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's profile subscription tier based on their active subscription
    IF NEW.status = 'active' THEN
        UPDATE profiles 
        SET subscription_tier = NEW.subscription_tier 
        WHERE id = NEW.user_id;
    ELSIF NEW.status = 'canceled' OR NEW.status = 'incomplete_expired' THEN
        -- Check if user has any other active subscriptions
        IF NOT EXISTS (
            SELECT 1 FROM subscriptions 
            WHERE user_id = NEW.user_id 
            AND status = 'active' 
            AND id != NEW.id
        ) THEN
            UPDATE profiles 
            SET subscription_tier = 'free' 
            WHERE id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_subscription_tier ON subscriptions;
CREATE TRIGGER trigger_update_profile_subscription_tier
    AFTER INSERT OR UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_subscription_tier();
