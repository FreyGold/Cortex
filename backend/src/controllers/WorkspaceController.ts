import type { Request, Response } from "express";
import { WorkspaceRepository } from "../repositories/WorkspaceRepository";
import { WorkspaceService } from "../services/WorkspaceService";
import { errorStatus } from "../lib/error-status";

function service(req: Request) { return new WorkspaceService(new WorkspaceRepository(req.user!.accessToken)); }
async function respond(res: Response, operation: () => Promise<unknown>, status = 200) {
  try {
    const result = await operation();
    return res.status(status).json(result ?? {});
  } catch (error) {
    const message = error && typeof error === "object" && "message" in error && typeof error.message === "string"
      ? error.message : "Workspace operation failed.";
    const invalid = ["Workspace name is required.", "Email is required.", "Invalid workspace role."].includes(message);
    return res.status(invalid ? 400 : errorStatus(error)).json({ error: message });
  }
}
export class WorkspaceController {
  static list(req: Request, res: Response) { return respond(res, () => service(req).list()); }
  static joined(req: Request, res: Response) { return respond(res, () => service(req).joined(req.user!.email)); }
  static create(req: Request, res: Response) { return respond(res, async () => service(req).create(req.user!.id, req.body?.name), 201); }
  static remove(req: Request, res: Response) { return respond(res, () => service(req).remove(req.params.id as string)); }
  static members(req: Request, res: Response) { return respond(res, () => service(req).members(req.params.id as string)); }
  static addMember(req: Request, res: Response) { return respond(res, async () => service(req).addMember(req.params.id as string, req.body?.email, req.body?.role), 201); }
  static removeMember(req: Request, res: Response) { return respond(res, () => service(req).removeMember(req.params.id as string)); }
  static updateMemberRole(req: Request, res: Response) { return respond(res, async () => service(req).updateMemberRole(req.params.id as string, req.body?.role)); }
}
