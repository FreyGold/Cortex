import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/neon/client";
import { apiRequest } from "@/lib/api/client";

async function workspaceRequest<T = any>(path: string, options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error("You must be signed in to access workspaces.");
  return apiRequest<T>(`/api/workspaces${path}`, { ...options, headers: { Authorization: `Bearer ${token}` } });
}

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      return workspaceRequest("");
    },
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      return workspaceRequest("", { method: "POST", body: { name } });
    },
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: ["workspaces"] });
      await queryClient.cancelQueries({ queryKey: ["joined-workspaces"] });
      const previousWorkspaces = queryClient.getQueryData(["workspaces"]);
      const previousJoined = queryClient.getQueryData(["joined-workspaces"]);

      if (previousWorkspaces) {
        queryClient.setQueryData(["workspaces"], (old: any) => [
          {
            id: `temp-${Math.random()}`,
            name,
            created_at: new Date().toISOString(),
            is_optimistic: true,
          },
          ...(old || []),
        ]);
      }
      if (previousJoined) {
        queryClient.setQueryData(["joined-workspaces"], (old: any) => [
          {
            id: `temp-${Math.random()}`,
            name,
            avatar_url: null,
            is_optimistic: true,
          },
          ...(old || []),
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

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await workspaceRequest(`/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["workspaces"] });
      await queryClient.cancelQueries({ queryKey: ["joined-workspaces"] });
      const previousWorkspaces = queryClient.getQueryData(["workspaces"]);
      const previousJoined = queryClient.getQueryData(["joined-workspaces"]);

      if (previousWorkspaces) {
        queryClient.setQueryData(["workspaces"], (old: any) =>
          (old || []).filter((w: any) => w.id !== id),
        );
      }
      if (previousJoined) {
        queryClient.setQueryData(["joined-workspaces"], (old: any) =>
          (old || []).filter((w: any) => w.id !== id),
        );
      }

      return { previousWorkspaces, previousJoined };
    },
    onError: (err, id, context) => {
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
      return workspaceRequest(`/${encodeURIComponent(workspaceId)}/members`);
    },
    enabled: !!workspaceId,
  });
}

export function useAddWorkspaceMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workspaceId,
      email,
      role,
    }: {
      workspaceId: string;
      email: string;
      role: string;
    }) => {
      return workspaceRequest(`/${encodeURIComponent(workspaceId)}/members`, { method: "POST", body: { email, role } });
    },
    onMutate: async ({ workspaceId, email, role }) => {
      await queryClient.cancelQueries({
        queryKey: ["workspace-members", workspaceId],
      });
      const previousMembers = queryClient.getQueryData([
        "workspace-members",
        workspaceId,
      ]);

      if (previousMembers) {
        queryClient.setQueryData(
          ["workspace-members", workspaceId],
          (old: any) => [
            {
              id: `temp-${Math.random()}`,
              workspace_id: workspaceId,
              email,
              role,
              created_at: new Date().toISOString(),
              is_optimistic: true,
            },
            ...(old || []),
          ],
        );
      }

      return { previousMembers, workspaceId };
    },
    onError: (err, variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(
          ["workspace-members", context.workspaceId],
          context.previousMembers,
        );
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", variables.workspaceId],
      });
    },
  });
}

export function useDeleteWorkspaceMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await workspaceRequest(`/members/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["workspace-members"] });
      const previousMembers = queryClient.getQueriesData({
        queryKey: ["workspace-members"],
      });

      queryClient.setQueriesData(
        { queryKey: ["workspace-members"] },
        (old: any) => {
          if (!old) return old;
          return old.filter((m: any) => m.id !== id);
        },
      );

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
      await workspaceRequest(`/members/${encodeURIComponent(id)}`, { method: "PATCH", body: { role } });
    },
    onMutate: async ({ id, role }) => {
      await queryClient.cancelQueries({ queryKey: ["workspace-members"] });
      const previousMembers = queryClient.getQueriesData({
        queryKey: ["workspace-members"],
      });

      queryClient.setQueriesData(
        { queryKey: ["workspace-members"] },
        (old: any) => {
          if (!old) return old;
          return old.map((m: any) => (m.id === id ? { ...m, role } : m));
        },
      );

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
      return workspaceRequest("/joined");
    },
  });
}
