-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Add workspace_id to notes and folders
ALTER TABLE notes ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE folders ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Update workspace_members to point to workspaces
-- First, let's keep the existing workspace_members for profile-based sharing if needed,
-- but the user wants "workspaces" as separate entities.
-- Actually, let's change workspace_members.workspace_id to be a UUID that can point to either? No.
-- Let's make workspace_members point to workspaces(id).

-- To avoid breaking everything, let's create a new table team_members or similar?
-- Actually, let's just update workspace_members.
-- Existing records in workspace_members point to profile IDs.
-- We should create a "Default Workspace" for every profile and migrate them.

-- But for now, let's just ADD a column to workspace_members if it doesn't exist, 
-- or modify the existing one.
-- Let's drop the old workspace_members and recreate it better.

DROP TABLE IF EXISTS workspace_members CASCADE;

CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, email)
);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Policies for workspaces
CREATE POLICY "Users can view workspaces they are members of"
ON workspaces FOR SELECT
USING (
  owner_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = workspaces.id 
    AND email = (auth.jwt()->>'email')
  )
);

CREATE POLICY "Users can create workspaces"
ON workspaces FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update workspaces"
ON workspaces FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete workspaces"
ON workspaces FOR DELETE
USING (owner_id = auth.uid());

-- Policies for workspace_members
CREATE POLICY "Members can view other members"
ON workspace_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspaces 
    WHERE id = workspace_members.workspace_id 
    AND (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_members m 
        WHERE m.workspace_id = workspaces.id 
        AND m.email = (auth.jwt()->>'email')
    ))
  )
);

CREATE POLICY "Owners/Admins can manage members"
ON workspace_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workspaces 
    WHERE id = workspace_members.workspace_id 
    AND (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_members m 
        WHERE m.workspace_id = workspaces.id 
        AND m.email = (auth.jwt()->>'email')
        AND m.role = 'admin'
    ))
  )
);

-- Update Note Policies for Workspaces
CREATE POLICY "Workspace members can view notes"
ON notes FOR SELECT
USING (
  workspace_id IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE id = notes.workspace_id 
      AND (owner_id = auth.uid() OR EXISTS (
          SELECT 1 FROM workspace_members 
          WHERE workspace_id = notes.workspace_id 
          AND email = (auth.jwt()->>'email')
      ))
    )
  )
);

CREATE POLICY "Workspace editors can update notes"
ON notes FOR UPDATE
USING (
  workspace_id IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE id = notes.workspace_id 
      AND (owner_id = auth.uid() OR EXISTS (
          SELECT 1 FROM workspace_members 
          WHERE workspace_id = notes.workspace_id 
          AND email = (auth.jwt()->>'email')
          AND role IN ('editor', 'admin')
      ))
    )
  )
);

-- Repeat for folders
CREATE POLICY "Workspace members can view folders"
ON folders FOR SELECT
USING (
  workspace_id IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE id = folders.workspace_id 
      AND (owner_id = auth.uid() OR EXISTS (
          SELECT 1 FROM workspace_members 
          WHERE workspace_id = folders.workspace_id 
          AND email = (auth.jwt()->>'email')
      ))
    )
  )
);
