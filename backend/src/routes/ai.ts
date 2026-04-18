import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { AIController } from "../controllers/AIController";

export const aiRouter = Router();

// Note-specific AI routes
aiRouter.post("/notes/:id/embed", authMiddleware, AIController.embedNote);
aiRouter.get("/notes/:id/conversation", authMiddleware, AIController.getConversation);
aiRouter.post("/notes/:id/ask", authMiddleware, AIController.askNote);
aiRouter.post("/notes/:id/summary", authMiddleware, AIController.summarize);
aiRouter.post("/notes/:id/suggest-tags", authMiddleware, AIController.suggestTags);

// Library-wide AI routes
aiRouter.post("/library/search", authMiddleware, AIController.search);
aiRouter.post("/library/ask", authMiddleware, AIController.askAllNotes);
aiRouter.get("/library/conversation", authMiddleware, AIController.getGlobalConversation);

// General AI routes
aiRouter.post("/general", authMiddleware, AIController.askGeneral);
// Streaming variant for clients that expect a chunked SSE-style stream
aiRouter.post("/general/stream", authMiddleware, AIController.askGeneralStream);
// Dev route removed. Use /general/stream (authenticated) for streaming.

// Shims for old routes (handling cases where frontend might hit old paths)
aiRouter.post("/notes/ask-all", authMiddleware, AIController.askAllNotes);
aiRouter.get("/notes/ask-all/conversation", authMiddleware, AIController.getGlobalConversation);
