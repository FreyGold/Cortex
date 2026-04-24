import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { data, error } = await supabase
        .from("workspaces")
        .insert({ name, owner_id: user.id })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useAddWorkspaceMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, email, role }: { workspaceId: string; email: string; role: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("workspace_members")
        .insert({ workspace_id: workspaceId, email, role })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", variables.workspaceId] });
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
        .select("workspace_id, workspaces(name, avatar_url)")
        .eq("email", user.email);
        
      if (error) throw error;
      return data.map((item: any) => ({
        id: item.workspace_id,
        name: item.workspaces.name,
        avatar_url: item.workspaces.avatar_url,
      }));
    },
  });
}