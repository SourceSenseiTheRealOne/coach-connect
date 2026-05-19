-- ============================================================
-- Marketplace purchases: seller payout profiles and order ledger
-- ============================================================

CREATE TABLE IF NOT EXISTS public.seller_payout_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_holder_name TEXT NOT NULL,
    payout_method TEXT NOT NULL DEFAULT 'iban' CHECK (payout_method IN ('iban', 'bank_transfer')),
    country TEXT NOT NULL DEFAULT 'PT',
    currency TEXT NOT NULL DEFAULT 'EUR',
    bank_reference TEXT NOT NULL,
    bank_reference_last4 TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.marketplace_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'canceled')),
    gross_amount_cents INTEGER NOT NULL CHECK (gross_amount_cents >= 0),
    platform_fee_cents INTEGER NOT NULL CHECK (platform_fee_cents >= 0),
    seller_net_cents INTEGER NOT NULL CHECK (seller_net_cents >= 0),
    currency TEXT NOT NULL DEFAULT 'EUR',
    stripe_checkout_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    paid_at TIMESTAMPTZ,
    payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
    payout_due_at TIMESTAMPTZ,
    payout_processed_at TIMESTAMPTZ,
    payout_reference TEXT,
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_seller_payout_profiles_user_id
ON public.seller_payout_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_listing_id
ON public.marketplace_orders(listing_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer_id
ON public.marketplace_orders(buyer_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller_id
ON public.marketplace_orders(seller_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status
ON public.marketplace_orders(status);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_payout_status
ON public.marketplace_orders(payout_status);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_checkout_session
ON public.marketplace_orders(stripe_checkout_session_id);

ALTER TABLE public.seller_payout_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payout profile" ON public.seller_payout_profiles;
DROP POLICY IF EXISTS "Users can create own payout profile" ON public.seller_payout_profiles;
DROP POLICY IF EXISTS "Users can update own payout profile" ON public.seller_payout_profiles;
DROP POLICY IF EXISTS "Admins can view payout profiles" ON public.seller_payout_profiles;
DROP POLICY IF EXISTS "Users can view own marketplace orders" ON public.marketplace_orders;
DROP POLICY IF EXISTS "Admins can view marketplace orders" ON public.marketplace_orders;
DROP POLICY IF EXISTS "Admins can update marketplace orders" ON public.marketplace_orders;

CREATE POLICY "Users can view own payout profile"
ON public.seller_payout_profiles FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own payout profile"
ON public.seller_payout_profiles FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own payout profile"
ON public.seller_payout_profiles FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Admins can view payout profiles"
ON public.seller_payout_profiles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (select auth.uid())
          AND user_type = 'admin'
    )
);

CREATE POLICY "Users can view own marketplace orders"
ON public.marketplace_orders FOR SELECT
TO authenticated
USING ((select auth.uid()) = buyer_id OR (select auth.uid()) = seller_id);

CREATE POLICY "Admins can view marketplace orders"
ON public.marketplace_orders FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (select auth.uid())
          AND user_type = 'admin'
    )
);

CREATE POLICY "Admins can update marketplace orders"
ON public.marketplace_orders FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (select auth.uid())
          AND user_type = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (select auth.uid())
          AND user_type = 'admin'
    )
);

CREATE OR REPLACE FUNCTION public.update_marketplace_purchase_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_seller_payout_profiles_updated_at ON public.seller_payout_profiles;
CREATE TRIGGER trigger_update_seller_payout_profiles_updated_at
    BEFORE UPDATE ON public.seller_payout_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_marketplace_purchase_updated_at();

DROP TRIGGER IF EXISTS trigger_update_marketplace_orders_updated_at ON public.marketplace_orders;
CREATE TRIGGER trigger_update_marketplace_orders_updated_at
    BEFORE UPDATE ON public.marketplace_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_marketplace_purchase_updated_at();
