-- ============================================================
-- Tactic Boards: table, indexes, and RLS
-- ============================================================

-- Create tactic_boards table
CREATE TABLE IF NOT EXISTS tactic_boards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    board_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    animation_data JSONB,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tactic_boards_owner_id ON tactic_boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_tactic_boards_updated_at ON tactic_boards(updated_at DESC);

-- Enable RLS
ALTER TABLE tactic_boards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe to re-run)
DROP POLICY IF EXISTS "Tactic boards are viewable by owner" ON tactic_boards;
DROP POLICY IF EXISTS "Authenticated users can create tactic boards" ON tactic_boards;
DROP POLICY IF EXISTS "Users can update own tactic boards" ON tactic_boards;
DROP POLICY IF EXISTS "Users can delete own tactic boards" ON tactic_boards;

-- Policies
CREATE POLICY "Tactic boards are viewable by owner"
ON tactic_boards FOR SELECT TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create tactic boards"
ON tactic_boards FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own tactic boards"
ON tactic_boards FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own tactic boards"
ON tactic_boards FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_tactic_boards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tactic_boards_updated_at ON tactic_boards;
CREATE TRIGGER trigger_update_tactic_boards_updated_at
    BEFORE UPDATE ON tactic_boards
    FOR EACH ROW
    EXECUTE FUNCTION update_tactic_boards_updated_at();