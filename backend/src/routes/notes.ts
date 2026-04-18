import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { NoteController } from "../controllers/NoteController";
import { AIController } from "../controllers/AIController";

export const notesRouter = Router();

notesRouter.use(authMiddleware);

notesRouter.get("/dashboard", NoteController.getDashboard);
notesRouter.post("/", NoteController.createNote);

// Shim for old research path
notesRouter.get("/ask-all/conversation", AIController.getGlobalConversation);

notesRouter.post("/folders", NoteController.createFolder);
notesRouter.put("/folders/:id", NoteController.updateFolder);
notesRouter.post("/tags", NoteController.createTag);

notesRouter.get("/:id", NoteController.getNoteDetail);
notesRouter.put("/:id", NoteController.updateNote);
notesRouter.post("/:id/tags", NoteController.updateNoteTags);

notesRouter.get("/:id/shares", NoteController.getNoteShares);
notesRouter.post("/:id/shares", NoteController.createNoteShare);
notesRouter.delete("/:id/shares/:shareId", NoteController.deleteNoteShare);
