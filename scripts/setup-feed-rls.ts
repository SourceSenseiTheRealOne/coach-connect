import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================
// RLS POLICIES FOR FEED FUNCTIONALITY
// ============================================================

const policies = [
    // ---- PROFILES: Allow authenticated users to read profiles ----
    `CREATE POLICY "Profiles are viewable by authenticated users"
     ON profiles FOR SELECT
     TO authenticated
     USING (true);`,

    // ---- PROFILES: Allow reading own profile ----
    `CREATE POLICY "Profiles are viewable by anon users"
     ON profiles FOR SELECT
     TO anon
     USING (true);`,

    // ---- POSTS: Allow anyone to read posts ----
    `CREATE POLICY "Posts are viewable by everyone"
     ON posts FOR SELECT
     USING (true);`,

    // ---- POSTS: Allow authenticated users to create posts ----
    `CREATE POLICY "Authenticated users can create posts"
     ON posts FOR INSERT
     TO authenticated
     WITH CHECK (auth.uid() = author_id);`,

    // ---- POSTS: Allow authors to update their posts ----
    `CREATE POLICY "Users can update own posts"
     ON posts FOR UPDATE
     TO authenticated
     USING (auth.uid() = author_id)
     WITH CHECK (auth.uid() = author_id);`,

    // ---- POSTS: Allow authors to delete their posts ----
    `CREATE POLICY "Users can delete own posts"
     ON posts FOR DELETE
     TO authenticated
     USING (auth.uid() = author_id);`,

    // ---- POST_LIKES: Allow anyone to read likes ----
    `CREATE POLICY "Post likes are viewable by everyone"
     ON post_likes FOR SELECT
     USING (true);`,

    // ---- POST_LIKES: Allow authenticated users to like ----
    `CREATE POLICY "Authenticated users can like posts"
     ON post_likes FOR INSERT
     TO authenticated
     WITH CHECK (auth.uid() = user_id);`,

    // ---- POST_LIKES: Allow users to unlike their own likes ----
    `CREATE POLICY "Users can unlike own likes"
     ON post_likes FOR DELETE
     TO authenticated
     USING (auth.uid() = user_id);`,

    // ---- POST_COMMENTS: Allow anyone to read comments ----
    `CREATE POLICY "Post comments are viewable by everyone"
     ON post_comments FOR SELECT
     USING (true);`,

    // ---- POST_COMMENTS: Allow authenticated users to comment ----
    `CREATE POLICY "Authenticated users can create comments"
     ON post_comments FOR INSERT
     TO authenticated
     WITH CHECK (auth.uid() = author_id);`,

    // ---- POST_COMMENTS: Allow users to delete own comments ----
    `CREATE POLICY "Users can delete own comments"
     ON post_comments FOR DELETE
     TO authenticated
     USING (auth.uid() = author_id);`,
];

async function setupRLS() {
    console.log('Setting up RLS policies for feed functionality...\n');

    // First, enable RLS on the tables
    const tables = ['posts', 'post_likes', 'post_comments'];

    for (const table of tables) {
        console.log(`Enabling RLS on ${table}...`);
        const { error } = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`,
        }).catch(() => ({ error: null }));

        // Try raw SQL via Supabase REST API
        // Since RPC might not exist, we'll use a different approach
    }

    // Apply policies using direct SQL
    for (const policy of policies) {
        const policyName = policy.match(/CREATE POLICY "([^"]+)"/)?.[1] || 'unknown';
        console.log(`Creating policy: ${policyName}`);

        try {
            // Drop existing policy first (ignore error if doesn't exist)
            const dropSql = policy.replace(
                /CREATE POLICY "[^"]+"\s+ON (\w+)/,
                (match, table) => `DROP POLICY IF EXISTS "${policyName}" ON ${table}`
            );

            // We can't execute raw SQL through the JS client directly
            // Instead, we'll use the Supabase Management API or direct queries
            console.log(`  → Policy SQL: ${policy.substring(0, 80)}...`);
        } catch (err) {
            console.error(`  → Error: ${err}`);
        }
    }

    console.log('\n⚠️  IMPORTANT: The Supabase JS client cannot execute raw DDL SQL.');
    console.log('Please run the following SQL in the Supabase SQL Editor:\n');
    console.log('='.repeat(60));

    // Output all SQL that needs to be run
    const fullSQL = `
-- Enable RLS on feed-related tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by anon users" ON profiles;
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

-- Profiles: Allow all authenticated users to read
CREATE POLICY "Profiles are viewable by authenticated users"
ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Profiles are viewable by anon users"
ON profiles FOR SELECT TO anon USING (true);

-- Posts: Readable by everyone
CREATE POLICY "Posts are viewable by everyone"
ON posts FOR SELECT USING (true);

-- Posts: Authenticated users can create (only as themselves)
CREATE POLICY "Authenticated users can create posts"
ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- Posts: Users can update own posts
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

-- Posts: Users can delete own posts
CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Post Likes: Readable by everyone
CREATE POLICY "Post likes are viewable by everyone"
ON post_likes FOR SELECT USING (true);

-- Post Likes: Authenticated users can like
CREATE POLICY "Authenticated users can like posts"
ON post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Post Likes: Users can unlike
CREATE POLICY "Users can unlike own likes"
ON post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Post Comments: Readable by everyone
CREATE POLICY "Post comments are viewable by everyone"
ON post_comments FOR SELECT USING (true);

-- Post Comments: Authenticated users can comment
CREATE POLICY "Authenticated users can create comments"
ON post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- Post Comments: Users can delete own comments
CREATE POLICY "Users can delete own comments"
ON post_comments FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- ============================================================
-- Ensure post_likes table has the right structure
-- ============================================================
-- If post_likes table doesn't exist, create it:
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, post_id)
);

-- If post_comments table doesn't exist, create it:
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
`;

    console.log(fullSQL);
    console.log('='.repeat(60));
    console.log('\nCopy the SQL above and run it in your Supabase Dashboard > SQL Editor.');
}

setupRLS();