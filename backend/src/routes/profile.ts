import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { ProfileController } from "../controllers/ProfileController";

export const profileRouter = Router();

profileRouter.use(authMiddleware);

profileRouter.get("/me", ProfileController.getMe);
profileRouter.post("/setup", ProfileController.setup);
profileRouter.post("/request-verification", ProfileController.requestVerification);
profileRouter.patch("/request-verification", ProfileController.requestVerification);
