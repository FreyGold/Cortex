import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { AdminController } from "../controllers/AdminController";

export const adminRouter = Router();

adminRouter.use(authMiddleware, adminMiddleware);

adminRouter.get("/users", AdminController.getUsers);
adminRouter.post("/verify-user", AdminController.verifyUser);
adminRouter.post("/universities", AdminController.createUniversity);
adminRouter.post("/colleges", AdminController.createCollege);
adminRouter.post("/majors", AdminController.createMajor);
adminRouter.post("/courses", AdminController.createCourse);
adminRouter.post("/seed", AdminController.seed);
