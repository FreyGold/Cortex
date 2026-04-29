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
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: ["workspaces"] });
      await queryClient.cancelQueries({ queryKey: ["joined-workspaces"] });
      const previousWorkspaces = queryClient.getQueryData(["workspaces"]);
      const previousJoined = queryClient.getQueryData(["joined-workspaces"]);

      if (previousWorkspaces) {
        queryClient.setQueryData(["workspaces"], (old: any) => [
          { id: `temp-${Math.random()}`, name, created_at: new Date().toISOString(), is_optimistic: true },
          ...(old || [])
        ]);
      }
      if (previousJoined) {
        queryClient.setQueryData(["joined-workspaces"], (old: any) => [
          { id: `temp-${Math.random()}`, name, avatar_url: null, is_optimistic: true },
          ...(old || [])
        ]);
      }

      return { previousWorkspaces, previousJoined };
    },
    onError: (err, name, context) => {
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(["workspaces"], context.previousWorkspaces);
      }
      if (context?.previousJoined) {
        queryClient.setQueryData(["joined-workspaces"], context.previousJoined);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["joined-workspaces"] });
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
    onMutate: async ({ workspaceId, email, role }) => {
      await queryClient.cancelQueries({ queryKey: ["workspace-members", workspaceId] });
      const previousMembers = queryClient.getQueryData(["workspace-members", workspaceId]);

      if (previousMembers) {
        queryClient.setQueryData(["workspace-members", workspaceId], (old: any) => [
          { id: `temp-${Math.random()}`, workspace_id: workspaceId, email, role, created_at: new Date().toISOString(), is_optimistic: true },
          ...(old || [])
        ]);
      }

      return { previousMembers, workspaceId };
    },
    onError: (err, variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(["workspace-members", context.workspaceId], context.previousMembers);
      }
    },
    onSettled: (_, __, variables) => {
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["workspace-members"] });
      const previousMembers = queryClient.getQueriesData({ queryKey: ["workspace-members"] });

      queryClient.setQueriesData({ queryKey: ["workspace-members"] }, (old: any) => {
        if (!old) return old;
        return old.filter((m: any) => m.id !== id);
      });

      return { previousMembers };
    },
    onError: (err, id, context) => {
      if (context?.previousMembers) {
        context.previousMembers.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
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
    onMutate: async ({ id, role }) => {
      await queryClient.cancelQueries({ queryKey: ["workspace-members"] });
      const previousMembers = queryClient.getQueriesData({ queryKey: ["workspace-members"] });

      queryClient.setQueriesData({ queryKey: ["workspace-members"] }, (old: any) => {
        if (!old) return old;
        return old.map((m: any) => m.id === id ? { ...m, role } : m);
      });

      return { previousMembers };
    },
    onError: (err, variables, context) => {
      if (context?.previousMembers) {
        context.previousMembers.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
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