import { Router } from "express";
import { AuthController } from "../controllers/AuthController";

export const authRouter = Router();

authRouter.post("/signup", AuthController.signup);
authRouter.post("/login", AuthController.login);
authRouter.post("/refresh", AuthController.refresh);
