-- ============================================================
-- Optimize RLS Policies with Security Definer Functions
-- Replaces subquery-based policies with efficient functions
-- ============================================================

-- Function to check if user owns a season plan
CREATE OR REPLACE FUNCTION user_owns_season_plan(user_id UUID, plan_id UUID)
RETURNS BOOLEAN AS $$
SELECT EXISTS (
    SELECT 1 FROM season_plans 
    WHERE id = plan_id AND owner_id = user_id
);
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user can access a training session (via season plan ownership)
CREATE OR REPLACE FUNCTION user_can_access_training_session(user_id UUID, session_id UUID)
RETURNS BOOLEAN AS $$
SELECT EXISTS (
    SELECT 1 FROM training_sessions ts
    JOIN season_plans sp ON ts.plan_id = sp.id
    WHERE ts.id = session_id AND sp.owner_id = user_id
);
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user can access a session exercise (via season plan ownership)
CREATE OR REPLACE FUNCTION user_can_access_session_exercise(user_id UUID, session_exercise_id UUID)
RETURNS BOOLEAN AS $$
SELECT EXISTS (
    SELECT 1 FROM session_exercises se
    JOIN training_sessions ts ON se.session_id = ts.id
    JOIN season_plans sp ON ts.plan_id = sp.id
    WHERE se.id = session_exercise_id AND sp.owner_id = user_id
);
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is admin of a club
CREATE OR REPLACE FUNCTION user_is_club_admin(user_id UUID, club_id UUID)
RETURNS BOOLEAN AS $$
SELECT EXISTS (
    SELECT 1 FROM club_members 
    WHERE club_id = club_id AND user_id = user_id AND role = 'admin'
);
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- Drop existing policies
-- ============================================================
DROP POLICY IF EXISTS "Users can view sessions in their plans" ON training_sessions;
DROP POLICY IF EXISTS "Users can create sessions in their plans" ON training_sessions;
DROP POLICY IF EXISTS "Users can update sessions in their plans" ON training_sessions;
DROP POLICY IF EXISTS "Users can delete sessions in their plans" ON training_sessions;

DROP POLICY IF EXISTS "Users can view exercises in their sessions" ON session_exercises;
DROP POLICY IF EXISTS "Users can add exercises to their sessions" ON session_exercises;
DROP POLICY IF EXISTS "Users can remove exercises from their sessions" ON session_exercises;

DROP POLICY IF EXISTS "Club owners can update their job listings" ON job_listings;
DROP POLICY IF EXISTS "Club owners can delete their job listings" ON job_listings;
DROP POLICY IF EXISTS "Club owners can view applications for their listings" ON job_applications;
DROP POLICY IF EXISTS "Club owners can update application status" ON job_applications;

-- ============================================================
-- Create optimized policies using security definer functions
-- ============================================================

-- Training Sessions policies (optimized)
CREATE POLICY "Users can view sessions in their plans"
ON training_sessions FOR SELECT TO authenticated
USING (user_can_access_training_session(auth.uid(), id));

CREATE POLICY "Users can create sessions in their plans"
ON training_sessions FOR INSERT TO authenticated
WITH CHECK (user_can_access_training_session(auth.uid(), plan_id));

CREATE POLICY "Users can update sessions in their plans"
ON training_sessions FOR UPDATE TO authenticated
USING (user_can_access_training_session(auth.uid(), id));

CREATE POLICY "Users can delete sessions in their plans"
ON training_sessions FOR DELETE TO authenticated
USING (user_can_access_training_session(auth.uid(), id));

-- Session Exercises policies (optimized)
CREATE POLICY "Users can view exercises in their sessions"
ON session_exercises FOR SELECT TO authenticated
USING (user_can_access_session_exercise(auth.uid(), id));

CREATE POLICY "Users can add exercises to their sessions"
ON session_exercises FOR INSERT TO authenticated
WITH CHECK (user_can_access_session_exercise(auth.uid(), session_id));

CREATE POLICY "Users can remove exercises from their sessions"
ON session_exercises FOR DELETE TO authenticated
USING (user_can_access_session_exercise(auth.uid(), id));

-- Job Listings policies (optimized)
CREATE POLICY "Club owners can update their job listings"
ON job_listings FOR UPDATE TO authenticated
USING (user_is_club_admin(auth.uid(), club_id));

CREATE POLICY "Club owners can delete their job listings"
ON job_listings FOR DELETE TO authenticated
USING (user_is_club_admin(auth.uid(), club_id));

-- Job Applications policies (optimized)
CREATE POLICY "Club owners can view applications for their listings"
ON job_applications FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM job_listings jl
        WHERE jl.id = job_applications.listing_id
        AND user_is_club_admin(auth.uid(), jl.club_id)
    )
);

CREATE POLICY "Club owners can update application status"
ON job_applications FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM job_listings jl
        WHERE jl.id = job_applications.listing_id
        AND user_is_club_admin(auth.uid(), jl.club_id)
    )
);
