-- ============================================================
-- Paid community actions: forum schema/RLS and paid job inserts
-- ============================================================

CREATE TABLE IF NOT EXISTS public.forum_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.forum_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.forum_categories(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    views_count INTEGER NOT NULL DEFAULT 0,
    replies_count INTEGER NOT NULL DEFAULT 0,
    last_reply_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.forum_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID REFERENCES public.forum_threads(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_forum_threads_category_id
    ON public.forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author_id
    ON public.forum_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_created_at
    ON public.forum_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_replies_thread_id
    ON public.forum_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author_id
    ON public.forum_replies(author_id);

ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Forum categories are viewable" ON public.forum_categories;
DROP POLICY IF EXISTS "Paid users can create forum categories" ON public.forum_categories;
DROP POLICY IF EXISTS "Forum threads are viewable" ON public.forum_threads;
DROP POLICY IF EXISTS "Paid users can create forum threads" ON public.forum_threads;
DROP POLICY IF EXISTS "Users can update own forum threads" ON public.forum_threads;
DROP POLICY IF EXISTS "Users can delete own forum threads" ON public.forum_threads;
DROP POLICY IF EXISTS "Forum replies are viewable" ON public.forum_replies;
DROP POLICY IF EXISTS "Authenticated users can create forum replies" ON public.forum_replies;
DROP POLICY IF EXISTS "Users can update own forum replies" ON public.forum_replies;
DROP POLICY IF EXISTS "Users can delete own forum replies" ON public.forum_replies;

CREATE POLICY "Forum categories are viewable"
    ON public.forum_categories FOR SELECT
    USING (true);

CREATE POLICY "Paid users can create forum categories"
    ON public.forum_categories FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND subscription_tier::text IN ('premium_coach', 'pro_service', 'club_license')
        )
    );

CREATE POLICY "Forum threads are viewable"
    ON public.forum_threads FOR SELECT
    USING (true);

CREATE POLICY "Paid users can create forum threads"
    ON public.forum_threads FOR INSERT
    TO authenticated
    WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND subscription_tier::text IN ('premium_coach', 'pro_service', 'club_license')
        )
    );

CREATE POLICY "Users can update own forum threads"
    ON public.forum_threads FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can delete own forum threads"
    ON public.forum_threads FOR DELETE
    TO authenticated
    USING (author_id = auth.uid());

CREATE POLICY "Forum replies are viewable"
    ON public.forum_replies FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create forum replies"
    ON public.forum_replies FOR INSERT
    TO authenticated
    WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.forum_threads
            WHERE id = thread_id
              AND is_locked = false
        )
    );

CREATE POLICY "Users can update own forum replies"
    ON public.forum_replies FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can delete own forum replies"
    ON public.forum_replies FOR DELETE
    TO authenticated
    USING (author_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_forum_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.forum_threads
        SET replies_count = replies_count + 1,
            last_reply_at = NEW.created_at
        WHERE id = NEW.thread_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.forum_threads
        SET replies_count = GREATEST(replies_count - 1, 0),
            last_reply_at = (
                SELECT MAX(created_at)
                FROM public.forum_replies
                WHERE thread_id = OLD.thread_id
            )
        WHERE id = OLD.thread_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_forum_reply_count ON public.forum_replies;
CREATE TRIGGER trigger_forum_reply_count
    AFTER INSERT OR DELETE ON public.forum_replies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_forum_thread_reply_count();

-- ============================================================
-- Direct Supabase policy hardening for job listings
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can create job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Paid users can create job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Owners can update their job listings" ON public.job_listings;

CREATE POLICY "Paid users can create job listings"
    ON public.job_listings FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND subscription_tier::text IN ('premium_coach', 'pro_service', 'club_license')
        )
        AND (
            created_by_id = auth.uid()
            OR (
                club_id IS NOT NULL
                AND club_id IN (
                    SELECT club_id
                    FROM public.club_members
                    WHERE user_id = auth.uid()
                      AND role = 'admin'
                )
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
                SELECT club_id
                FROM public.club_members
                WHERE user_id = auth.uid()
                  AND role = 'admin'
            )
        )
    )
    WITH CHECK (
        created_by_id = auth.uid()
        OR (
            club_id IS NOT NULL
            AND club_id IN (
                SELECT club_id
                FROM public.club_members
                WHERE user_id = auth.uid()
                  AND role = 'admin'
            )
        )
    );
