# Section 3 — Presentation Script
# Collaborative Note-taking with Rich Text Editing
**Estimated time:** 12–14 minutes

---

## SLIDE 1 — Title
**Title:** The Notes System — Your Academic Workspace  
**Subtitle:** Rich text, AI-enhanced, collaborative note-taking built for students

**Speaker notes:**  
"The notes system is the heart of Cortex. Everything else in the platform supports it or is enriched by it. I will walk you through what makes our notes system fundamentally different from a Google Doc or a plain text editor, and explain how every component — from the editor to the database — works together."

---

## SLIDE 2 — The Problem with Plain Text Notes
**Title:** Why Google Docs is Not Enough

**Bullets:**
- No structured organization (folders, tags, smart filtering)
- No automatic AI summary or tag suggestions
- Cannot search by meaning — only exact keywords
- Cannot embed in a Pomodoro workflow or link to course resources
- No built-in sharing with permission levels (viewer vs editor)
- Markdown is great — but students want a visual editor

**Speaker notes:**  
"Let me be direct: Google Docs is a powerful general-purpose tool but it is not designed for structured academic note-taking. There is no folder hierarchy for your subjects, no tagging system, no AI that reads your notes and answers questions about them, and no connection to your university's course catalog. Cortex's notes system was designed from scratch with these specific student needs in mind."

---

## SLIDE 3 — The Plate.js Editor — What Students Get
**Title:** A Professional-Grade Rich Text Editor

**Visual (screenshot or description of editor UI)**

**Bullets:**
- Slash commands (`/heading`, `/code`, `/table`, `/image`) — insert anything
- Markdown shortcuts: type `**bold**` and it becomes **bold** instantly
- Tables with merge cells, code blocks with syntax highlighting
- Image and file upload directly in the note
- Drag and drop to reorder blocks
- `/ai` command — ask AI to write, edit, or explain within the note

**Speaker notes:**  
"The editor is built on Plate.js, which sits on top of Slate.js — one of the most powerful and extensible editor frameworks for React. Every capability you see is a plugin. Type `/` in the editor and a menu appears with every block type you can insert: headings, lists, tables, code blocks, images, even an AI command. Type `##` followed by a space and it instantly becomes a heading — markdown shortcuts work automatically.

The editor feels like a combination of Notion's flexibility and a professional writing tool. It was designed so that students who prefer keyboard-first workflows can stay in the editor without ever touching the mouse."

---

## SLIDE 4 — The AI Command in the Editor
**Title:** `/ai` — Your Writing Assistant Lives in the Editor

**Bullets:**
- Select any text → press `Ctrl+J` or type `/ai`
- Options appear: Generate, Edit, Comment, Explain
- Type your prompt: "Summarize this in simpler terms"
- AI streams the response directly into the document in real-time
- Supports multiple AI providers: OpenAI, Gemini, Anthropic, Groq

**Speaker notes:**  
"The AI command is the most exciting editor feature. Imagine you are studying CPU scheduling algorithms. You write a rough description of Round Robin. You select it, press Ctrl+J, and type 'Make this clearer with an analogy.' The AI reads your selected text, your overall note context, and streams an improved version directly into your document. No copy-paste, no switching tabs — the AI is integrated into the writing experience itself.

The system also supports generating new content: type `/ai` then 'Write a comparison table of Round Robin vs FCFS scheduling' and a complete table appears in your note. This is powered by the Vercel AI SDK with streaming, so you watch it appear word by word."

---

## SLIDE 5 — How the Auto-Save Works
**Title:** Never Lose a Word — Intelligent Auto-Save

**Visual (state diagram):**
```
User types → "Saving..." indicator → 1.5 second pause → API call → "Saved 3s ago"
```

**Bullets:**
- Every keystroke marks the note as "dirty" (unsaved)
- Debounce timer of 1.5 seconds — waits for the user to pause
- Then sends the updated content to the backend
- Shows "Saving..." → "Saved X seconds ago" in the header
- On page close/refresh: browser warns "unsaved changes" if still dirty

**Speaker notes:**  
"The auto-save system is invisible to users — it just works. Every time you type, a 1.5-second countdown begins. If you keep typing, it resets. When you pause for 1.5 seconds, the current content is sent to the backend. You see 'Saving...' briefly, then 'Saved 3 seconds ago.' This is called a debounced save, and it prevents sending hundreds of API calls per minute while someone is actively writing.

The note content is stored as structured JSON — not raw HTML. This means it can be perfectly reconstructed, searched, and processed by AI without any parsing ambiguity."

---

## SLIDE 6 — Note Organization: Folders, Tags, Search
**Title:** Find Any Note in Seconds

**Bullets:**
- **Folders:** Hierarchical (Semester 1 → Computer Science → OS Notes)
- **Tags:** Color-coded labels (Algorithms, Urgent, To Review)
- **Search:** Full-text search across title and content
- **Tag filter:** Click a tag to show only tagged notes (instant, client-side)
- **Views:** Grid view (cards) or List view (compact)
- **Calendar:** See notes on the date they were created

**Speaker notes:**  
"Organization in Cortex mirrors how students actually think. Folders for hierarchical course structure — same as how you'd organize physical notebooks. Tags for cross-cutting concerns — you might tag 10 notes across different subjects as 'Urgent' before an exam. Search is full-text, meaning it searches both the note title and the note body. Click any tag in the filter bar and the view instantly narrows to only notes with that tag — no loading, no server call, because the full list is already cached locally.

The calendar view is a beautiful way to see your study activity. Each day with notes shows a dot; click it to see what you wrote that day."

---

## SLIDE 7 — Collaboration: Sharing Notes
**Title:** Study Together — Sharing with Permission Levels

**Bullets:**
- Share any note with another Cortex user
- Two roles: **Viewer** (read-only) or **Editor** (full edit access)
- Shared notes appear in recipient's "Shared with me" section
- Owner can revoke access at any time
- Use case: study group where one person writes, others contribute

**Speaker notes:**  
"Sharing in Cortex is designed for the reality of study groups. One student writes detailed notes on a topic; they share it with their study group as Editors, so everyone can contribute. Or a professor creates a structured note template and shares it as View-only with students who must follow it without modifying it.

The sharing model is enforced at both the application level and the database level. Even if an application bug existed, the database would still reject any query that tries to access a note that has not been explicitly shared with the requesting user."

---

## SLIDE 8 — Public Notes & Community Knowledge
**Title:** Publish → Share with Everyone

**Bullets:**
- Any note can be toggled to "Published"
- Published notes are accessible to anyone at `/notes/public/:id`
- Community feed at `/notes/public` shows all published notes
- No account required to read a published note
- Ideal for: summary notes, study guides, open textbooks

**Speaker notes:**  
"The public notes feature enables a community knowledge layer on top of personal notes. A student who has mastered a topic can publish their notes as a resource for others. Someone searching for help on operating systems can find a well-written published note without even creating an account. This turns Cortex into a peer-to-peer academic resource platform, not just a personal tool."

---

## SLIDE 9 — Demo Script
**Title:** Demo Walkthrough

**Steps:**
1. Open `/notes` — show the grid with real notes, tag filter buttons
2. Toggle to list view
3. Type in search box — show real-time filtering
4. Click on an existing note — show the editor with content
5. Type a new paragraph — watch "Saving..." appear and resolve
6. Type `/` — show the slash command menu
7. Insert a table (or show an existing table)
8. Select text, press Ctrl+J — demonstrate the AI edit command
9. Open the sidebar — show tags, sharing, summary, AI tools
10. Navigate to archive — show archived notes

---

## SLIDE 10 — Q&A Preparation

**Q: What happens to notes if the internet connection is lost?**  
A: The current version requires a connection to save. Plate.js maintains the in-memory document state, so you can keep typing while offline. When connection is restored, the next keystroke triggers the save. We plan to add offline support with localStorage as a future enhancement.

**Q: Can two people edit the same note at the same time?**  
A: Currently, shared notes support collaboration where both users can edit, but not simultaneously in real-time. The last save wins. Real-time collaborative editing (operational transforms or CRDTs) is a planned future enhancement using Supabase Realtime.

**Q: How large can a note be?**  
A: The JSONB column has no practical size limit in PostgreSQL. We have tested notes with thousands of paragraphs, images, and tables without issues.

**Q: How does the AI know my note content?**  
A: The note's `content_text` (plain text extraction from the Slate JSON) is stored in the database. When AI tools are triggered, this text is sent to the AI model as context. The Plate.js editor extracts this text automatically every time the content changes.

**Q: Can I export notes to PDF or Word?**  
A: The current version supports copying content. Export to PDF and Word is a planned feature using the `@udecode/plate-serializer-docx` and browser print-to-PDF functionality.
