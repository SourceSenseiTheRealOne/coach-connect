-- ============================================================
-- Feed functionality: Tables, Indexes, and RLS Policies
-- Run this in Supabase SQL Editor if not already applied
-- ============================================================

-- Ensure post_likes table exists
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, post_id)
);

-- Ensure post_comments table exists
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author_id ON post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- ============================================================
-- Enable RLS
-- ============================================================
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Drop existing policies (safe to re-run)
-- ============================================================
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Post likes are viewable by everyone" ON post_likes;
DROP POLICY IF EXISTS "Authenticated users can like posts" ON post_likes;
DROP POLICY IF EXISTS "Users can unlike own likes" ON post_likes;
DROP POLICY IF EXISTS "Post comments are viewable by everyone" ON post_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON post_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON post_comments;

-- ============================================================
-- Posts policies
-- ============================================================
CREATE POLICY "Posts are viewable by everyone"
ON posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts"
ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- ============================================================
-- Post Likes policies
-- ============================================================
CREATE POLICY "Post likes are viewable by everyone"
ON post_likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like posts"
ON post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own likes"
ON post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Post Comments policies
-- ============================================================
CREATE POLICY "Post comments are viewable by everyone"
ON post_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments"
ON post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
ON post_comments FOR DELETE TO authenticated USING (auth.uid() = author_id);