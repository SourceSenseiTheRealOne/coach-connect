-- ============================================================
-- Open job creation to any paid tier (not just clubs).
-- Track the user who posted the listing so applicants can
-- contact them directly via messaging.
-- ============================================================

ALTER TABLE public.job_listings
    ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_job_listings_created_by_id
    ON public.job_listings(created_by_id);

-- club_id is already nullable via the original CREATE TABLE (no NOT NULL),
-- but we make it explicit for clarity.
ALTER TABLE public.job_listings
    ALTER COLUMN club_id DROP NOT NULL;

-- ============================================================
-- Re-create insert / update / delete policies so individual
-- creators (any authenticated user) can manage their own posts.
-- The original policies only allowed club admins.
-- ============================================================

DROP POLICY IF EXISTS "Club owners can create job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Authenticated users can create job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Club owners can update their job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Owners can update their job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Club owners can delete their job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Owners can delete their job listings" ON public.job_listings;

CREATE POLICY "Authenticated users can create job listings"
    ON public.job_listings FOR INSERT
    TO authenticated
    WITH CHECK (
        created_by_id = auth.uid()
        OR (
            club_id IS NOT NULL
            AND club_id IN (
                SELECT club_id FROM public.club_members
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Owners can update their job listings"
    ON public.job_listings FOR UPDATE
    TO authenticated
    USING (
        created_by_id = auth.uid()
        OR (
            club_id IS NOT NULL
            AND club_id IN (
                SELECT club_id FROM public.club_members
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Owners can delete their job listings"
    ON public.job_listings FOR DELETE
    TO authenticated
    USING (
        created_by_id = auth.uid()
        OR (
            club_id IS NOT NULL
            AND club_id IN (
                SELECT club_id FROM public.club_members
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Allow the listing's individual creator to view applications too.
DROP POLICY IF EXISTS "Listing creators can view applications" ON public.job_applications;
CREATE POLICY "Listing creators can view applications"
    ON public.job_applications FOR SELECT
    TO authenticated
    USING (
        listing_id IN (
            SELECT id FROM public.job_listings
            WHERE created_by_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Listing creators can update application status" ON public.job_applications;
CREATE POLICY "Listing creators can update application status"
    ON public.job_applications FOR UPDATE
    TO authenticated
    USING (
        listing_id IN (
            SELECT id FROM public.job_listings
            WHERE created_by_id = auth.uid()
        )
    );
