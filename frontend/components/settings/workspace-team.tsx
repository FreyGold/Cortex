"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspaceMembers, useAddWorkspaceMember, useDeleteWorkspaceMember, useUpdateWorkspaceMemberRole, useWorkspaces, useCreateWorkspace } from "@/hooks/use-workspace";
import { Trash2, Shield, Users, Mail, Plus } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function WorkspaceTeam() {
  const { data: workspaces, isLoading: isLoadingWorkspaces } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();
  
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  const { data: members, isLoading: isLoadingMembers } = useWorkspaceMembers(selectedWorkspaceId || "");
  const addMember = useAddWorkspaceMember();
  // ... delete and update hooks also need workspaceId for invalidation if we want to be strict,
  // but let's just use them as is for now if they work by ID.
  const deleteMember = useDeleteWorkspaceMember();
  const updateRole = useUpdateWorkspaceMemberRole();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      const ws = await createWorkspace.mutateAsync(newWorkspaceName.trim());
      setNewWorkspaceName("");
      setSelectedWorkspaceId(ws.id);
      toast.success("Workspace created");
    } catch (error: any) {
      toast.error("Failed to create workspace");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedWorkspaceId) return;

    try {
      await addMember.mutateAsync({ workspaceId: selectedWorkspaceId, email, role });
      setEmail("");
      setRole("viewer");
      toast.success("Team member invited successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to invite team member");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await deleteMember.mutateAsync(id);
      toast.success("Team member removed");
    } catch (error: any) {
      toast.error("Failed to remove member");
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await updateRole.mutateAsync({ id, role: newRole });
      toast.success("Role updated");
    } catch (error: any) {
      toast.error("Failed to update role");
    }
  };

  const selectedWorkspace = workspaces?.find(w => w.id === selectedWorkspaceId);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Plus className="size-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Create New Workspace</span>
        </div>
        <form onSubmit={handleCreateWorkspace} className="flex items-center gap-3">
            <Input 
              placeholder="Workspace Name (e.g. Study Group)" 
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              required 
            />
            <Button type="submit" disabled={createWorkspace.isPending}>
              {createWorkspace.isPending ? "Creating..." : "Create"}
            </Button>
        </form>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Users className="size-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Select Workspace to Manage</span>
        </div>
        <Select value={selectedWorkspaceId || ""} onValueChange={setSelectedWorkspaceId}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a workspace..." />
            </SelectTrigger>
            <SelectContent>
                {workspaces?.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

      {selectedWorkspaceId && (
        <>
          <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Users className="size-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Invite to {selectedWorkspace?.name}</span>
            </div>
            
            <form onSubmit={handleInvite} className="flex items-center gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="Email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required 
                />
              </div>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={addMember.isPending}>
                {addMember.isPending ? "Inviting..." : "Invite"}
              </Button>
            </form>
          </div>

          <div className="rounded-xl border border-border/60 bg-card">
            <div className="p-4 border-b border-border/60 flex items-center gap-2 text-primary bg-muted/20 rounded-t-xl">
              <Shield className="size-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Team Members</span>
            </div>
            <div className="p-0">
              {isLoadingMembers ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : members && members.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                      <div>
                        <p className="font-medium text-sm">{member.email}</p>
                        <p className="text-xs text-muted-foreground">Joined {new Date(member.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select 
                          value={member.role} 
                          onValueChange={(val) => handleRoleChange(member.id, val)}
                          disabled={updateRole.isPending}
                        >
                          <SelectTrigger className="w-[110px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(member.id)}
                          disabled={deleteMember.isPending}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm italic">
                  No team members yet. Invite someone to collaborate.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}