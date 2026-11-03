import { Router } from "express";
import { WorkspaceController } from "../controllers/WorkspaceController";
import { authMiddleware } from "../middleware/authMiddleware";

export const workspacesRouter = Router();
workspacesRouter.use(authMiddleware);
workspacesRouter.get("/", WorkspaceController.list);
workspacesRouter.post("/", WorkspaceController.create);
workspacesRouter.get("/joined", WorkspaceController.joined);
workspacesRouter.delete("/members/:id", WorkspaceController.removeMember);
workspacesRouter.patch("/members/:id", WorkspaceController.updateMemberRole);
workspacesRouter.get("/:id/members", WorkspaceController.members);
workspacesRouter.post("/:id/members", WorkspaceController.addMember);
workspacesRouter.delete("/:id", WorkspaceController.remove);
