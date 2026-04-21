import { NoteRepository } from "../repositories/NoteRepository";

export class NoteService {
  constructor(private repo: NoteRepository) {}

  async getDashboard(userId: string) {
    const [notes, sharedNotes, folders, tags] = await Promise.all([
      this.repo.getDashboardNotes(userId),
      this.repo.getSharedNotes(userId),
      this.repo.getFolders(userId),
      this.repo.getTags(userId),
    ]);
    return { notes, sharedNotes, folders, tags };
  }

  async getNoteDetail(userId: string, noteId: string) {
    const [note, folders, tags, noteTagsRaw] = await Promise.all([
      this.repo.getNoteDetail(userId, noteId),
      this.repo.getFolders(userId),
      this.repo.getTags(userId),
      this.repo.getNoteTags(noteId),
    ]);

    if (!note) {
      throw new Error("Note not found.");
    }

    const noteTags = noteTagsRaw.map((item: any) => ({
      tag_id: item.tag_id,
      tags: Array.isArray(item.tags) ? (item.tags[0] ?? null) : item.tags,
    }));

    return { note, folders, tags, noteTags };
  }

  async createNote(userId: string, title: string, folderId: string | null) {
    return this.repo.createNote(userId, title, folderId);
  }

  async updateNote(userId: string, noteId: string, updatePayload: Record<string, unknown>) {
    await this.repo.updateNote(userId, noteId, updatePayload);
  }

  async createFolder(userId: string, name: string) {
    await this.repo.createFolder(userId, name);
  }

  async updateFolder(userId: string, folderId: string, updatePayload: Record<string, unknown>) {
    await this.repo.updateFolder(userId, folderId, updatePayload);
  }

  async createTag(userId: string, name: string) {
    await this.repo.createTag(userId, name);
  }

  async updateNoteTags(noteId: string, tagIds: string[]) {
    await this.repo.deleteNoteTags(noteId);
    if (tagIds.length > 0) {
      const rows = tagIds.map(tagId => ({ note_id: noteId, tag_id: tagId }));
      await this.repo.insertNoteTags(rows);
    }
  }

  async getNoteShares(noteId: string) {
    return this.repo.getNoteShares(noteId);
  }

  async createNoteShare(payload: Record<string, unknown>) {
    return this.repo.createNoteShare(payload);
  }

  async deleteNoteShare(noteId: string, shareId: string) {
    await this.repo.deleteNoteShare(noteId, shareId);
  }

  async getPublicNote(noteId: string) {
    return this.repo.getPublicNoteDetail(noteId);
  }

  async getNoteByShareToken(shareToken: string) {
    return this.repo.getNoteByShareToken(shareToken);
  }

  async getArchived(userId: string) {
    return this.repo.getArchivedNotes(userId);
  }

  async archiveNote(userId: string, noteId: string) {
    await this.repo.archiveNote(userId, noteId);
  }

  async replicateNote(userId: string, title: string, content: any, contentText: string) {
    const note = await this.repo.createNote(userId, title, null);
    await this.repo.updateNote(userId, note.id, {
      content,
      content_text: contentText,
    });
    return note;
  }

  async createResourceFromNote(courseId: string, userId: string, noteId: string, titleEn: string) {
    return this.repo.createResourceFromNote(courseId, userId, noteId, titleEn);
  }
}

