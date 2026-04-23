CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, email)
);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace members" 
ON workspace_members FOR SELECT 
USING (
  workspace_id = auth.uid() OR 
  email = (auth.jwt()->>'email')
);

CREATE POLICY "Workspace owners can insert members" 
ON workspace_members FOR INSERT 
WITH CHECK (workspace_id = auth.uid());

CREATE POLICY "Workspace owners can update members" 
ON workspace_members FOR UPDATE 
USING (workspace_id = auth.uid());

CREATE POLICY "Workspace owners can delete members" 
ON workspace_members FOR DELETE 
USING (workspace_id = auth.uid());

-- Allow workspace members to read notes and folders
-- For notes:
CREATE POLICY "Workspace members can view notes"
ON notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = notes.user_id 
    AND email = (auth.jwt()->>'email')
  )
);

CREATE POLICY "Workspace editors/admins can update notes"
ON notes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = notes.user_id 
    AND email = (auth.jwt()->>'email')
    AND role IN ('editor', 'admin')
  )
);

CREATE POLICY "Workspace editors/admins can insert notes"
ON notes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = user_id 
    AND email = (auth.jwt()->>'email')
    AND role IN ('editor', 'admin')
  )
);

CREATE POLICY "Workspace admins can delete notes"
ON notes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = notes.user_id 
    AND email = (auth.jwt()->>'email')
    AND role = 'admin'
  )
);

-- For folders:
CREATE POLICY "Workspace members can view folders"
ON folders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = folders.user_id 
    AND email = (auth.jwt()->>'email')
  )
);

CREATE POLICY "Workspace editors/admins can update folders"
ON folders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = folders.user_id 
    AND email = (auth.jwt()->>'email')
    AND role IN ('editor', 'admin')
  )
);

CREATE POLICY "Workspace editors/admins can insert folders"
ON folders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = user_id 
    AND email = (auth.jwt()->>'email')
    AND role IN ('editor', 'admin')
  )
);

CREATE POLICY "Workspace admins can delete folders"
ON folders FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = folders.user_id 
    AND email = (auth.jwt()->>'email')
    AND role = 'admin'
  )
);