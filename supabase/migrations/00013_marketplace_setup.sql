-- ============================================================
-- Marketplace: tables, indexes, and RLS policies
-- ============================================================

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    service_type TEXT NOT NULL CHECK (
        service_type IN (
            'private_training',
            'video_analysis',
            'consulting',
            'scouting',
            'event_organizing',
            'equipment',
            'other'
        )
    ),
    price_cents INTEGER CHECK (price_cents IS NULL OR price_cents >= 0),
    price_type TEXT CHECK (
        price_type IS NULL OR price_type IN (
            'fixed',
            'hourly',
            'per_session',
            'contact'
        )
    ),
    currency TEXT NOT NULL DEFAULT 'EUR',
    images TEXT[] NOT NULL DEFAULT '{}',
    service_area TEXT,
    is_remote BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    views_count INTEGER NOT NULL DEFAULT 0 CHECK (views_count >= 0),
    stripe_price_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.marketplace_listings
    ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS service_type TEXT,
    ADD COLUMN IF NOT EXISTS price_cents INTEGER,
    ADD COLUMN IF NOT EXISTS price_type TEXT,
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
    ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS service_area TEXT,
    ADD COLUMN IF NOT EXISTS is_remote BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.marketplace_reviews
    ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS rating INTEGER,
    ADD COLUMN IF NOT EXISTS comment TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller_id
ON public.marketplace_listings(seller_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_active_created
ON public.marketplace_listings(is_active, is_featured DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_service_type
ON public.marketplace_listings(service_type);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_service_area
ON public.marketplace_listings(service_area);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_remote
ON public.marketplace_listings(is_remote);

CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_listing_id
ON public.marketplace_reviews(listing_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_reviewer_id
ON public.marketplace_reviews(reviewer_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_reviews_listing_reviewer_unique
ON public.marketplace_reviews(listing_id, reviewer_id);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active marketplace listings are viewable" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users can view own marketplace listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Pro sellers can create marketplace listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users can update own marketplace listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users can delete own marketplace listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Marketplace reviews are viewable" ON public.marketplace_reviews;
DROP POLICY IF EXISTS "Authenticated users can review marketplace listings" ON public.marketplace_reviews;
DROP POLICY IF EXISTS "Users can update own marketplace reviews" ON public.marketplace_reviews;
DROP POLICY IF EXISTS "Users can delete own marketplace reviews" ON public.marketplace_reviews;

CREATE POLICY "Active marketplace listings are viewable"
ON public.marketplace_listings FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Users can view own marketplace listings"
ON public.marketplace_listings FOR SELECT
TO authenticated
USING ((select auth.uid()) = seller_id);

CREATE POLICY "Pro sellers can create marketplace listings"
ON public.marketplace_listings FOR INSERT
TO authenticated
WITH CHECK (
    (select auth.uid()) = seller_id
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (select auth.uid())
          AND subscription_tier::text IN ('pro_service', 'club_license')
    )
);

CREATE POLICY "Users can update own marketplace listings"
ON public.marketplace_listings FOR UPDATE
TO authenticated
USING ((select auth.uid()) = seller_id)
WITH CHECK ((select auth.uid()) = seller_id);

CREATE POLICY "Users can delete own marketplace listings"
ON public.marketplace_listings FOR DELETE
TO authenticated
USING ((select auth.uid()) = seller_id);

CREATE POLICY "Marketplace reviews are viewable"
ON public.marketplace_reviews FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can review marketplace listings"
ON public.marketplace_reviews FOR INSERT
TO authenticated
WITH CHECK (
    (select auth.uid()) = reviewer_id
    AND EXISTS (
        SELECT 1
        FROM public.marketplace_listings ml
        WHERE ml.id = listing_id
          AND ml.is_active = true
          AND ml.seller_id <> (select auth.uid())
    )
);

CREATE POLICY "Users can update own marketplace reviews"
ON public.marketplace_reviews FOR UPDATE
TO authenticated
USING ((select auth.uid()) = reviewer_id)
WITH CHECK ((select auth.uid()) = reviewer_id);

CREATE POLICY "Users can delete own marketplace reviews"
ON public.marketplace_reviews FOR DELETE
TO authenticated
USING ((select auth.uid()) = reviewer_id);

CREATE OR REPLACE FUNCTION public.update_marketplace_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_marketplace_listings_updated_at ON public.marketplace_listings;
CREATE TRIGGER trigger_update_marketplace_listings_updated_at
    BEFORE UPDATE ON public.marketplace_listings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_marketplace_listings_updated_at();
