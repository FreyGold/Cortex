import { getSupabaseUserClient } from "../lib/supabase-admin";

export class WorkspaceRepository {
  constructor(private accessToken: string) {}
  private client() { return getSupabaseUserClient(this.accessToken); }

  async list() {
    const { data, error } = await this.client().from("workspaces").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }
  async create(ownerId: string, name: string) {
    const { data, error } = await this.client().from("workspaces").insert({ name, owner_id: ownerId }).select().single();
    if (error) throw error;
    return data;
  }
  async remove(id: string) {
    const { data, error } = await this.client().from("workspaces").delete().eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Workspace not found or access denied.");
  }
  async members(workspaceId: string) {
    const { data, error } = await this.client().from("workspace_members").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }
  async addMember(workspaceId: string, email: string, role: string) {
    const { data, error } = await this.client().from("workspace_members").insert({ workspace_id: workspaceId, email, role }).select().single();
    if (error) throw error;
    return data;
  }
  async removeMember(id: string) {
    const { data, error } = await this.client().from("workspace_members").delete().eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Workspace member not found or access denied.");
  }
  async updateMemberRole(id: string, role: string) {
    const { data, error } = await this.client().from("workspace_members").update({ role }).eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Workspace member not found or access denied.");
  }
  async joined(email: string) {
    const { data, error } = await this.client().from("workspace_members").select("workspace_id, workspaces(name, avatar_url)").eq("email", email);
    if (error) throw error;
    return (data ?? []).filter((item: any) => item.workspaces).map((item: any) => ({ id: item.workspace_id, name: item.workspaces.name, avatar_url: item.workspaces.avatar_url }));
  }
}
