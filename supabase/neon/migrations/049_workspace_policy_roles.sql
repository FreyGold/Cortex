SET search_path = public, extensions;

-- Workspace policies call authenticated identity helpers. Do not evaluate
-- them for anonymous requests such as published-note reads.
ALTER POLICY "Users can view workspaces they are members of"
  ON public.workspaces TO authenticated;
ALTER POLICY "Members can view other members"
  ON public.workspace_members TO authenticated;
ALTER POLICY "Owners/Admins can manage members"
  ON public.workspace_members TO authenticated;
ALTER POLICY "Workspace members can view notes"
  ON public.notes TO authenticated;
ALTER POLICY "Workspace editors can update notes"
  ON public.notes TO authenticated;
ALTER POLICY "Workspace editors can insert notes"
  ON public.notes TO authenticated;
ALTER POLICY "Workspace admins can delete notes"
  ON public.notes TO authenticated;
ALTER POLICY "Workspace members can view folders"
  ON public.folders TO authenticated;
ALTER POLICY "Workspace editors can update folders"
  ON public.folders TO authenticated;
ALTER POLICY "Workspace editors can insert folders"
  ON public.folders TO authenticated;
ALTER POLICY "Workspace admins can delete folders"
  ON public.folders TO authenticated;
