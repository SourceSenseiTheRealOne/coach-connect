-- ============================================================
-- Messaging functionality: Tables, Indexes, and RLS Policies
-- ============================================================

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- ============================================================
-- Enable RLS
-- ============================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Drop existing policies (safe to re-run)
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Participants can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view their own participations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can create participations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update own participation read status" ON conversation_participants;
DROP POLICY IF EXISTS "Participants can view messages" ON messages;
DROP POLICY IF EXISTS "Participants can send messages" ON messages;

-- ============================================================
-- Conversations policies
-- ============================================================
CREATE POLICY "Users can view their own conversations"
    ON conversations FOR SELECT USING (
        id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
    );

CREATE POLICY "Participants can create conversations"
    ON conversations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Participants can update conversations"
    ON conversations FOR UPDATE TO authenticated USING (
        id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
    );

-- ============================================================
-- Conversation Participants policies
-- ============================================================
CREATE POLICY "Users can view their own participations"
    ON conversation_participants FOR SELECT USING (
        user_id = auth.uid() OR
        conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create participations"
    ON conversation_participants FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update own participation read status"
    ON conversation_participants FOR UPDATE TO authenticated USING (
        user_id = auth.uid()
    );

-- ============================================================
-- Messages policies
-- ============================================================
CREATE POLICY "Participants can view messages"
    ON messages FOR SELECT USING (
        conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
    );

CREATE POLICY "Participants can send messages"
    ON messages FOR INSERT TO authenticated WITH CHECK (
        sender_id = auth.uid() AND
        conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
    );

-- ============================================================
-- Function to auto-update conversation updated_at on new message
-- ============================================================
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_insert ON messages;
CREATE TRIGGER on_message_insert
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();