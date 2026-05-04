-- ============================================================
-- Performance Optimizations: Composite and Partial Indexes
-- ============================================================

-- Composite index for messages (conversation_id, created_at DESC)
-- This optimizes the common query pattern: get messages for a conversation ordered by date
DROP INDEX IF EXISTS idx_messages_conversation_created_at;
CREATE INDEX idx_messages_conversation_created_at 
ON messages(conversation_id, created_at DESC);

-- Partial index for active job listings
-- This optimizes queries that filter by is_active = true (the common case)
DROP INDEX IF EXISTS idx_job_listings_active;
CREATE INDEX idx_job_listings_active 
ON job_listings(created_at DESC) 
WHERE is_active = true;

-- GIN index for tactic_boards JSONB columns
-- This improves performance when querying/filtering JSONB data
DROP INDEX IF EXISTS idx_tactic_boards_board_data;
CREATE INDEX idx_tactic_boards_board_data 
ON tactic_boards USING GIN (board_data);

DROP INDEX IF EXISTS idx_tactic_boards_animation_data;
CREATE INDEX idx_tactic_boards_animation_data 
ON tactic_boards USING GIN (animation_data);

-- Composite index for conversation_participants (user_id, last_read_at DESC)
-- Optimizes fetching user's conversations with unread status
DROP INDEX IF EXISTS idx_conversation_participants_user_last_read;
CREATE INDEX idx_conversation_participants_user_last_read 
ON conversation_participants(user_id, last_read_at DESC);

-- Composite index for posts (author_id, created_at DESC)
-- Optimizes fetching user's own posts
DROP INDEX IF EXISTS idx_posts_author_created;
CREATE INDEX idx_posts_author_created 
ON posts(author_id, created_at DESC);

-- Composite index for exercise_likes (exercise_id, created_at DESC)
-- Optimizes fetching likes for an exercise
DROP INDEX IF EXISTS idx_exercise_likes_exercise_created;
CREATE INDEX idx_exercise_likes_exercise_created 
ON exercise_likes(exercise_id, created_at DESC);

-- Composite index for post_likes (post_id, created_at DESC)
-- Optimizes fetching likes for a post
DROP INDEX IF EXISTS idx_post_likes_post_created;
CREATE INDEX idx_post_likes_post_created 
ON post_likes(post_id, created_at DESC);

-- Partial index for subscriptions with active status
-- Optimizes fetching active subscriptions
DROP INDEX IF EXISTS idx_subscriptions_active;
CREATE INDEX idx_subscriptions_active 
ON subscriptions(user_id, current_period_end DESC) 
WHERE status = 'active';
