-- ============================================================
-- Planner functionality: Tables, Indexes, and RLS Policies
-- ============================================================

-- Season Plans
CREATE TABLE IF NOT EXISTS season_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    age_group TEXT NOT NULL,
    season_start DATE NOT NULL,
    season_end DATE NOT NULL,
    plan_type TEXT NOT NULL DEFAULT 'full_season',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Training Sessions
CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id UUID REFERENCES season_plans(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    scheduled_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Session Exercises (link exercises to training sessions)
CREATE TABLE IF NOT EXISTS session_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(session_id, exercise_id)
);

-- ============================================================
-- Create indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_season_plans_owner_id ON season_plans(owner_id);
CREATE INDEX IF NOT EXISTS idx_season_plans_club_id ON season_plans(club_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_plan_id ON training_sessions(plan_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_scheduled_date ON training_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session_id ON session_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_session_exercises_exercise_id ON session_exercises(exercise_id);

-- ============================================================
-- Enable RLS
-- ============================================================
ALTER TABLE season_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Drop existing policies (safe to re-run)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own season plans" ON season_plans;
DROP POLICY IF EXISTS "Users can create season plans" ON season_plans;
DROP POLICY IF EXISTS "Users can update own season plans" ON season_plans;
DROP POLICY IF EXISTS "Users can delete own season plans" ON season_plans;
DROP POLICY IF EXISTS "Users can view sessions in their plans" ON training_sessions;
DROP POLICY IF EXISTS "Users can create sessions in their plans" ON training_sessions;
DROP POLICY IF EXISTS "Users can update sessions in their plans" ON training_sessions;
DROP POLICY IF EXISTS "Users can delete sessions in their plans" ON training_sessions;
DROP POLICY IF EXISTS "Users can view exercises in their sessions" ON session_exercises;
DROP POLICY IF EXISTS "Users can add exercises to their sessions" ON session_exercises;
DROP POLICY IF EXISTS "Users can remove exercises from their sessions" ON session_exercises;

-- ============================================================
-- Season Plans policies
-- ============================================================
CREATE POLICY "Users can view own season plans"
ON season_plans FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create season plans"
ON season_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own season plans"
ON season_plans FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own season plans"
ON season_plans FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- ============================================================
-- Training Sessions policies
-- ============================================================
CREATE POLICY "Users can view sessions in their plans"
ON training_sessions FOR SELECT USING (
    plan_id IN (SELECT id FROM season_plans WHERE owner_id = auth.uid())
);

CREATE POLICY "Users can create sessions in their plans"
ON training_sessions FOR INSERT TO authenticated WITH CHECK (
    plan_id IN (SELECT id FROM season_plans WHERE owner_id = auth.uid())
);

CREATE POLICY "Users can update sessions in their plans"
ON training_sessions FOR UPDATE TO authenticated USING (
    plan_id IN (SELECT id FROM season_plans WHERE owner_id = auth.uid())
);

CREATE POLICY "Users can delete sessions in their plans"
ON training_sessions FOR DELETE TO authenticated USING (
    plan_id IN (SELECT id FROM season_plans WHERE owner_id = auth.uid())
);

-- ============================================================
-- Session Exercises policies
-- ============================================================
CREATE POLICY "Users can view exercises in their sessions"
ON session_exercises FOR SELECT USING (
    session_id IN (
        SELECT ts.id FROM training_sessions ts
        JOIN season_plans sp ON ts.plan_id = sp.id
        WHERE sp.owner_id = auth.uid()
    )
);

CREATE POLICY "Users can add exercises to their sessions"
ON session_exercises FOR INSERT TO authenticated WITH CHECK (
    session_id IN (
        SELECT ts.id FROM training_sessions ts
        JOIN season_plans sp ON ts.plan_id = sp.id
        WHERE sp.owner_id = auth.uid()
    )
);

CREATE POLICY "Users can remove exercises from their sessions"
ON session_exercises FOR DELETE TO authenticated USING (
    session_id IN (
        SELECT ts.id FROM training_sessions ts
        JOIN season_plans sp ON ts.plan_id = sp.id
        WHERE sp.owner_id = auth.uid()
    )
);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_season_plans_updated_at ON season_plans;
CREATE TRIGGER update_season_plans_updated_at
    BEFORE UPDATE ON season_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();