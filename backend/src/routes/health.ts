import { Router } from "express";
import { HealthController } from "../controllers/HealthController";

export const healthRouter = Router();

healthRouter.get("/health", HealthController.check);
