import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { verifiedMiddleware } from "../middleware/verifiedMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { DataController } from "../controllers/DataController";

export const dataRouter = Router();

dataRouter.get("/catalog", DataController.getCatalog);
dataRouter.get("/courses/:courseId", DataController.getCourseDetail);

dataRouter.post("/doctors", authMiddleware, verifiedMiddleware, DataController.createDoctor);
dataRouter.post("/courses", authMiddleware, verifiedMiddleware, DataController.createCourse);
dataRouter.put("/courses/:id", authMiddleware, adminMiddleware, DataController.updateCourse);

dataRouter.post("/courses/:courseId/resources", authMiddleware, verifiedMiddleware, DataController.createResource);
dataRouter.put("/resources/:id", authMiddleware, adminMiddleware, DataController.updateResource);
dataRouter.delete("/resources/:id", authMiddleware, adminMiddleware, DataController.deleteResource);

dataRouter.post("/courses/:courseId/doctors", authMiddleware, adminMiddleware, DataController.assignDoctor);
dataRouter.delete("/courses/:courseId/doctors/:doctorId", authMiddleware, adminMiddleware, DataController.unassignDoctor);
