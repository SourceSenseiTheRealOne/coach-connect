-- ============================================================
-- Exercise functionality: exercise_likes table, indexes, and RLS
-- ============================================================

-- Create exercise_likes table
CREATE TABLE IF NOT EXISTS exercise_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, exercise_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercise_likes_exercise_id ON exercise_likes(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_likes_user_id ON exercise_likes(user_id);

-- ============================================================
-- Enable RLS on exercises (if not already)
-- ============================================================
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_likes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Drop existing policies (safe to re-run)
-- ============================================================
DROP POLICY IF EXISTS "Exercises are viewable by everyone" ON exercises;
DROP POLICY IF EXISTS "Authenticated users can create exercises" ON exercises;
DROP POLICY IF EXISTS "Users can update own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can delete own exercises" ON exercises;
DROP POLICY IF EXISTS "Exercise likes are viewable by everyone" ON exercise_likes;
DROP POLICY IF EXISTS "Authenticated users can like exercises" ON exercise_likes;
DROP POLICY IF EXISTS "Users can unlike own exercise likes" ON exercise_likes;

-- ============================================================
-- Exercises policies
-- ============================================================
CREATE POLICY "Exercises are viewable by everyone"
ON exercises FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create exercises"
ON exercises FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own exercises"
ON exercises FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own exercises"
ON exercises FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- ============================================================
-- Exercise Likes policies
-- ============================================================
CREATE POLICY "Exercise likes are viewable by everyone"
ON exercise_likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like exercises"
ON exercise_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own exercise likes"
ON exercise_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- RPC functions for atomic counter updates
-- ============================================================
CREATE OR REPLACE FUNCTION increment_exercise_likes(exercise_id UUID)
RETURNS void AS $$
UPDATE exercises SET likes_count = likes_count + 1 WHERE id = exercise_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_exercise_likes(exercise_id UUID)
RETURNS void AS $$
UPDATE exercises SET likes_count = GREATEST(0, likes_count - 1) WHERE id = exercise_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_exercise_views(exercise_id UUID)
RETURNS void AS $$
UPDATE exercises SET views_count = views_count + 1 WHERE id = exercise_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Also create RPC functions for posts (if not already exist)
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS void AS $$
UPDATE posts SET likes_count = likes_count + 1 WHERE id = post_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS void AS $$
UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = post_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_post_comments(post_id UUID)
RETURNS void AS $$
UPDATE posts SET comments_count = comments_count + 1 WHERE id = post_id;
$$ LANGUAGE sql SECURITY DEFINER;