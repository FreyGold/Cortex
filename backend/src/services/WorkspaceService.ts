import { WorkspaceRepository } from "../repositories/WorkspaceRepository";

export class WorkspaceService {
  constructor(private repository: WorkspaceRepository) {}
  list() { return this.repository.list(); }
  joined(email: string | null) { return email ? this.repository.joined(email) : Promise.resolve([]); }
  members(id: string) { return this.repository.members(id); }
  remove(id: string) { return this.repository.remove(id); }
  removeMember(id: string) { return this.repository.removeMember(id); }
  create(ownerId: string, name: unknown) {
    if (typeof name !== "string" || !name.trim()) throw new Error("Workspace name is required.");
    return this.repository.create(ownerId, name.trim());
  }
  addMember(workspaceId: string, email: unknown, role: unknown) {
    if (typeof email !== "string" || !email.trim()) throw new Error("Email is required.");
    return this.repository.addMember(workspaceId, email.trim().toLowerCase(), this.role(role));
  }
  updateMemberRole(id: string, role: unknown) { return this.repository.updateMemberRole(id, this.role(role)); }
  private role(value: unknown) {
    if (value !== "viewer" && value !== "editor" && value !== "admin") throw new Error("Invalid workspace role.");
    return value;
  }
}
