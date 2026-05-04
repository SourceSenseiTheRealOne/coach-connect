-- ============================================================
-- Improve RPC Functions with Better Error Handling
-- Adds existence checks and proper error handling
-- ============================================================

-- Drop existing RPC functions
DROP FUNCTION IF EXISTS increment_exercise_likes(UUID);
DROP FUNCTION IF EXISTS decrement_exercise_likes(UUID);
DROP FUNCTION IF EXISTS increment_exercise_views(UUID);
DROP FUNCTION IF EXISTS increment_post_likes(UUID);
DROP FUNCTION IF EXISTS decrement_post_likes(UUID);
DROP FUNCTION IF EXISTS increment_post_comments(UUID);

-- Improved increment_exercise_likes with existence check
CREATE OR REPLACE FUNCTION increment_exercise_likes(exercise_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE exercises 
    SET likes_count = likes_count + 1 
    WHERE id = exercise_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Exercise with id % not found', exercise_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Improved decrement_exercise_likes with existence check and floor at 0
CREATE OR REPLACE FUNCTION decrement_exercise_likes(exercise_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE exercises 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = exercise_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Exercise with id % not found', exercise_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Improved increment_exercise_views with existence check
CREATE OR REPLACE FUNCTION increment_exercise_views(exercise_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE exercises 
    SET views_count = views_count + 1 
    WHERE id = exercise_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Exercise with id % not found', exercise_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Improved increment_post_likes with existence check
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE posts 
    SET likes_count = likes_count + 1 
    WHERE id = post_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Post with id % not found', post_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Improved decrement_post_likes with existence check and floor at 0
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE posts 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = post_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Post with id % not found', post_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Improved increment_post_comments with existence check
CREATE OR REPLACE FUNCTION increment_post_comments(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE posts 
    SET comments_count = comments_count + 1 
    WHERE id = post_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Post with id % not found', post_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
