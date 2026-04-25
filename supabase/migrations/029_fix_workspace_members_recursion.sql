-- 1. Create a unified SECURITY DEFINER function for role checks
CREATE OR REPLACE FUNCTION public.has_workspace_role(ws_id UUID, required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = ws_id 
    AND email = (select auth.jwt()->>'email') 
    AND role = ANY(required_roles)
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_workspace_role(UUID, TEXT[]) TO authenticated;

-- 2. Drop all conflicting old policies from 022 to avoid multiple evaluations
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can insert members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can update members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can delete members" ON workspace_members;

DROP POLICY IF EXISTS "Workspace editors/admins can update notes" ON notes;
DROP POLICY IF EXISTS "Workspace editors/admins can insert notes" ON notes;
DROP POLICY IF EXISTS "Workspace admins can delete notes" ON notes;

DROP POLICY IF EXISTS "Workspace editors/admins can update folders" ON folders;
DROP POLICY IF EXISTS "Workspace editors/admins can insert folders" ON folders;
DROP POLICY IF EXISTS "Workspace admins can delete folders" ON folders;


-- 3. Fix workspace_members recursion by using the new SECURITY DEFINER functions
DROP POLICY IF EXISTS "Members can view other members" ON workspace_members;
CREATE POLICY "Members can view other members"
ON workspace_members FOR SELECT
USING (
  email = (select auth.jwt()->>'email') OR
  public.is_workspace_owner_v2(workspace_id) OR
  public.is_workspace_member_v2(workspace_id)
);

DROP POLICY IF EXISTS "Owners/Admins can manage members" ON workspace_members;
CREATE POLICY "Owners/Admins can manage members"
ON workspace_members FOR ALL
USING (
  public.is_workspace_owner_v2(workspace_id) OR
  public.has_workspace_role(workspace_id, ARRAY['admin'])
);


-- 4. Fix notes policies to use SECURITY DEFINER functions
DROP POLICY IF EXISTS "Workspace members can view notes" ON notes;
CREATE POLICY "Workspace members can view notes"
ON notes FOR SELECT
USING (
  workspace_id IS NOT NULL AND (
    public.is_workspace_owner_v2(workspace_id) OR
    public.is_workspace_member_v2(workspace_id)
  )
);

DROP POLICY IF EXISTS "Workspace editors can update notes" ON notes;
CREATE POLICY "Workspace editors can update notes"
ON notes FOR UPDATE
USING (
  workspace_id IS NOT NULL AND (
    public.is_workspace_owner_v2(workspace_id) OR
    public.has_workspace_role(workspace_id, ARRAY['editor', 'admin'])
  )
);

DROP POLICY IF EXISTS "Workspace editors can insert notes" ON notes;
CREATE POLICY "Workspace editors can insert notes"
ON notes FOR INSERT
WITH CHECK (
  workspace_id IS NOT NULL AND (
    public.is_workspace_owner_v2(workspace_id) OR
    public.has_workspace_role(workspace_id, ARRAY['editor', 'admin'])
  )
);

DROP POLICY IF EXISTS "Workspace admins can delete notes" ON notes;
CREATE POLICY "Workspace admins can delete notes"
ON notes FOR DELETE
USING (
  workspace_id IS NOT NULL AND (
    public.is_workspace_owner_v2(workspace_id) OR
    public.has_workspace_role(workspace_id, ARRAY['admin'])
  )
);


-- 5. Fix folders policies to use SECURITY DEFINER functions
DROP POLICY IF EXISTS "Workspace members can view folders" ON folders;
CREATE POLICY "Workspace members can view folders"
ON folders FOR SELECT
USING (
  workspace_id IS NOT NULL AND (
    public.is_workspace_owner_v2(workspace_id) OR
    public.is_workspace_member_v2(workspace_id)
  )
);

DROP POLICY IF EXISTS "Workspace editors can update folders" ON folders;
CREATE POLICY "Workspace editors can update folders"
ON folders FOR UPDATE
USING (
  workspace_id IS NOT NULL AND (
    public.is_workspace_owner_v2(workspace_id) OR
    public.has_workspace_role(workspace_id, ARRAY['editor', 'admin'])
  )
);

DROP POLICY IF EXISTS "Workspace editors can insert folders" ON folders;
CREATE POLICY "Workspace editors can insert folders"
ON folders FOR INSERT
WITH CHECK (
  workspace_id IS NOT NULL AND (
    public.is_workspace_owner_v2(workspace_id) OR
    public.has_workspace_role(workspace_id, ARRAY['editor', 'admin'])
  )
);

DROP POLICY IF EXISTS "Workspace admins can delete folders" ON folders;
CREATE POLICY "Workspace admins can delete folders"
ON folders FOR DELETE
USING (
  workspace_id IS NOT NULL AND (
    public.is_workspace_owner_v2(workspace_id) OR
    public.has_workspace_role(workspace_id, ARRAY['admin'])
  )
);
