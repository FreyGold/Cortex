-- Fix infinite recursion in workspace policies

-- 1. Create helper functions with SECURITY DEFINER to break recursion
CREATE OR REPLACE FUNCTION public.is_workspace_owner(ws_id UUID, u_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspaces WHERE id = ws_id AND owner_id = u_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID, u_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members WHERE workspace_id = ws_id AND email = u_email
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_workspace_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID, TEXT) TO authenticated;

-- 2. Update Workspaces Policies
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON workspaces;
CREATE POLICY "Users can view workspaces they are members of"
ON workspaces FOR SELECT
USING (
  owner_id = auth.uid() OR 
  public.is_workspace_member(id, auth.jwt()->>'email')
);

-- 3. Update Workspace Members Policies
DROP POLICY IF EXISTS "Members can view other members" ON workspace_members;
CREATE POLICY "Members can view other members"
ON workspace_members FOR SELECT
USING (
  email = (auth.jwt()->>'email') OR
  public.is_workspace_owner(workspace_id, auth.uid()) OR
  public.is_workspace_member(workspace_id, auth.jwt()->>'email')
);

DROP POLICY IF EXISTS "Owners/Admins can manage members" ON workspace_members;
CREATE POLICY "Owners/Admins can manage members"
ON workspace_members FOR ALL
USING (
  public.is_workspace_owner(workspace_id, auth.uid()) OR
  EXISTS (
    SELECT 1 FROM workspace_members m 
    WHERE m.workspace_id = workspace_members.workspace_id 
    AND m.email = (auth.jwt()->>'email')
    AND m.role = 'admin'
  )
);

-- 4. Update Notes Policies
DROP POLICY IF EXISTS "Workspace members can view notes" ON notes;
CREATE POLICY "Workspace members can view notes"
ON notes FOR SELECT
USING (
  workspace_id IS NOT NULL AND (
    public.is_workspace_owner(workspace_id, auth.uid()) OR
    public.is_workspace_member(workspace_id, auth.jwt()->>'email')
  )
);

DROP POLICY IF EXISTS "Workspace editors can update notes" ON notes;
CREATE POLICY "Workspace editors can update notes"
ON notes FOR UPDATE
USING (
  workspace_id IS NOT NULL AND (
    public.is_workspace_owner(workspace_id, auth.uid()) OR
    EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_id = notes.workspace_id 
        AND email = (auth.jwt()->>'email')
        AND role IN ('editor', 'admin')
    )
  )
);

-- 5. Update Folders Policies
DROP POLICY IF EXISTS "Workspace members can view folders" ON folders;
CREATE POLICY "Workspace members can view folders"
ON folders FOR SELECT
USING (
  workspace_id IS NOT NULL AND (
    public.is_workspace_owner(workspace_id, auth.uid()) OR
    public.is_workspace_member(workspace_id, auth.jwt()->>'email')
  )
);
