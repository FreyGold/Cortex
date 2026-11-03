-- 1. RLS Policy Performance (wrap auth.uid() and auth.jwt() in subqueries)

-- Replace main notes owner policy to avoid per-row execution of auth.uid()
DROP POLICY IF EXISTS "notes_owner_all" ON public.notes;
CREATE POLICY "notes_owner_all" ON public.notes
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Also update notes_crud_own if it still exists (fallback)
DROP POLICY IF EXISTS "notes_crud_own" ON public.notes;
CREATE POLICY "notes_crud_own" ON public.notes
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Folders CRUD policy
DROP POLICY IF EXISTS "folders_crud_own" ON public.folders;
CREATE POLICY "folders_crud_own" ON public.folders
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Profiles read self
DROP POLICY IF EXISTS "profiles_read_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_read_self_or_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );

-- Profiles update self
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  )
  WITH CHECK (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );


-- 2. Missing Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_course_doctors_doctor_id ON public.course_doctors(doctor_id);
CREATE INDEX IF NOT EXISTS idx_course_doctors_academic_year_id ON public.course_doctors(academic_year_id);
-- Note: course_doctors.course_id should also be indexed
CREATE INDEX IF NOT EXISTS idx_course_doctors_course_id ON public.course_doctors(course_id);

CREATE INDEX IF NOT EXISTS idx_resources_academic_year_id ON public.resources(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_resources_doctor_id ON public.resources(doctor_id);

CREATE INDEX IF NOT EXISTS idx_course_notes_course_id ON public.course_notes(course_id);
CREATE INDEX IF NOT EXISTS idx_course_notes_shared_by ON public.course_notes(shared_by);

CREATE INDEX IF NOT EXISTS idx_note_versions_note_id ON public.note_versions(note_id);
CREATE INDEX IF NOT EXISTS idx_note_versions_created_by ON public.note_versions(created_by);

CREATE INDEX IF NOT EXISTS idx_profiles_verified_by ON public.profiles(verified_by);


-- 3. Security Definer Parameter Optimization
-- Create optimized functions that evaluate auth.uid() and auth.jwt() once internally
CREATE OR REPLACE FUNCTION public.is_workspace_owner_v2(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspaces WHERE id = ws_id AND owner_id = (select auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_member_v2(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members WHERE workspace_id = ws_id AND email = (select auth.jwt()->>'email')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_workspace_owner_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member_v2(UUID) TO authenticated;

-- Update Workspaces Policies
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON workspaces;
CREATE POLICY "Users can view workspaces they are members of"
ON workspaces FOR SELECT
USING (
  owner_id = (select auth.uid()) OR 
  public.is_workspace_member_v2(id)
);

-- Update Workspace Members Policies
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
  EXISTS (
    SELECT 1 FROM workspace_members m 
    WHERE m.workspace_id = workspace_members.workspace_id 
    AND m.email = (select auth.jwt()->>'email')
    AND m.role = 'admin'
  )
);

-- Update Notes Policies for Workspaces
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
    EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_id = notes.workspace_id 
        AND email = (select auth.jwt()->>'email')
        AND role IN ('editor', 'admin')
    )
  )
);

-- Update Folders Policies for Workspaces
DROP POLICY IF EXISTS "Workspace members can view folders" ON folders;
CREATE POLICY "Workspace members can view folders"
ON folders FOR SELECT
USING (
  workspace_id IS NOT NULL AND (
    public.is_workspace_owner_v2(workspace_id) OR
    public.is_workspace_member_v2(workspace_id)
  )
);


-- 4. Reverse Lookup Indexing
CREATE INDEX IF NOT EXISTS idx_note_links_target_id ON public.note_links(target_note_id);


-- 5. Unconstrained Text Fields
ALTER TABLE public.embedding_jobs
  ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'));