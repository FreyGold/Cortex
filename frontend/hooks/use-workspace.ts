import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useWorkspaceMembers() {
  return useQuery({
    queryKey: ["workspace-members"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const workspace_id = session?.user.id;

      if (!workspace_id) throw new Error("No session");

      const { data, error } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", workspace_id)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data;
    },
  });
}

export function useAddWorkspaceMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const workspace_id = session?.user.id;
      
      const { data, error } = await supabase
        .from("workspace_members")
        .insert({ workspace_id, email, role })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members"] });
    },
  });
}

export function useDeleteWorkspaceMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members"] });
    },
  });
}

export function useUpdateWorkspaceMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("workspace_members")
        .update({ role })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members"] });
    },
  });
}

export function useJoinedWorkspaces() {
  return useQuery({
    queryKey: ["joined-workspaces"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return [];

      const { data, error } = await supabase
        .from("workspace_members")
        .select("workspace_id, profiles!workspace_members_workspace_id_fkey(name, avatar_url)")
        .eq("email", user.email);
        
      if (error) throw error;
      return data.map((item: any) => ({
        id: item.workspace_id,
        name: item.profiles.name,
        avatar_url: item.profiles.avatar_url,
      }));
    },
  });
}