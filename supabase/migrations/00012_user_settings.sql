-- ============================================================
-- User settings: per-user preferences for dashboard settings
-- ============================================================

CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    new_messages BOOLEAN NOT NULL DEFAULT true,
    exercise_likes BOOLEAN NOT NULL DEFAULT true,
    new_followers BOOLEAN NOT NULL DEFAULT true,
    job_opportunities BOOLEAN NOT NULL DEFAULT true,
    platform_updates BOOLEAN NOT NULL DEFAULT false,
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fr', 'es', 'pt', 'de')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can create own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;

CREATE POLICY "Users can view own settings"
ON user_settings FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own settings"
ON user_settings FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own settings"
ON user_settings FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own settings"
ON user_settings FOR DELETE TO authenticated
USING ((select auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_settings_updated_at ON user_settings;
CREATE TRIGGER trigger_update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();
