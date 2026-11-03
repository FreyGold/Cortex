CREATE TABLE IF NOT EXISTS note_conversations (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (note_id, user_id)
);

CREATE TABLE IF NOT EXISTS global_conversations (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE note_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_conversations ENABLE ROW LEVEL SECURITY;

-- Policies for note_conversations
CREATE POLICY "Users can view their own note conversations"
  ON note_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own note conversations"
  ON note_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own note conversations"
  ON note_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for global_conversations
CREATE POLICY "Users can view their own global conversations"
  ON global_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own global conversations"
  ON global_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own global conversations"
  ON global_conversations FOR UPDATE
  USING (auth.uid() = user_id);
