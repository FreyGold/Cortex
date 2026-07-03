# Section 1 — Presentation Script
# System Architecture, Technology Decisions & Project Vision
**Presenter:** Ahmed Tawfik — Team Leader & System Architect  
**Estimated time:** 14–16 minutes  
**Tone:** Confident, collaborative, professional, visionary

---

> **Before you step up:**  
> You led the architectural design and engineering of this project. While presenting the system, emphasize the collaborative effort of the team, showing how your architectural guidance empowered everyone to build a cohesive, integrated workspace.

---

## SLIDE 1 — Title Slide
**Title:** Cortex — A Bilingual AI-Powered Academic Workspace  
**Subtitle:** Architecture, Vision & Engineering Decisions  
**Your name:** Ahmed Tawfik — Team Leader & System Architect

**Speaker notes:**  
"My name is Ahmed Tawfik. I am the team leader and system architect for Cortex. Together with my team, we designed and built Cortex from the ground up as a unified academic platform.

Today, I will present the core architecture, product vision, and technology decisions that tie this entire platform together. Following my presentation, my teammates will walk you through the deep technical details of the subsystems we built."

*(Pause. Then:)*  
"Let me start with the problem we set out to solve."

---

## SLIDE 2 — The Problem: Five Apps, Zero Integration
**Title:** The Egyptian University Student's Reality

**Visual:** Five disconnected app icons with arrows going nowhere between them:
```
[Google Docs]   [WhatsApp]   [Random Pomodoro App]   [Phone Calendar]   [ChatGPT]
     ↕               ↕                ↕                      ↕                ↕
  (nothing)       (nothing)        (nothing)             (nothing)         (nothing)
```

**Bullets:**
- Notes in Google Docs — no structure, no AI, not connected to your courses
- Course materials in a WhatsApp group — unsearchable, expires, no organization
- Habits on a phone app that knows nothing about your academic life
- ChatGPT that answers from the internet, not from what YOU studied
- No tool designed for Arabic-speaking university students in Egypt

**Speaker notes:**  
"Every Egyptian university student is living this reality. Your lecture notes are in Google Docs. Your course PDFs come through a WhatsApp group that nobody can find things in after a month. Your study timer is a separate phone app. Your AI assistant is ChatGPT, which has never read a single one of your notes.

These five tools share nothing. They cannot work together. You switch between them constantly, losing context every time.

As university students, we lived this exact frustration. And instead of looking for a better app, our team set out to build a unified workspace that replaces all five."

**Timing:** 1.5 minutes  
**Transition:** "Let me show you the product we created."

---

## SLIDE 3 — What Is Cortex? — The Five Systems
**Title:** One Platform. Five Integrated Systems.

**Visual (five tiles in a grid, each with icon + title + one-line description):**
```
📝 COLLABORATIVE NOTES       📚 RESOURCE REGISTRY
Rich text, AI-enhanced,      University catalog — every course,
organized, shareable         resource, and doctor in one place

📅 DAILY JOURNAL & CALENDAR  🍅 POMODORO + HABITS + SOCIAL
Per-day rich-text workspace  Focus timer, habit streaks,
with tasks and highlights    friend leaderboard

                🤖 AI LIBRARY ASSISTANT
         Answers your questions from YOUR notes
              using semantic vector search
```

**Speaker notes:**  
"Cortex has five integrated systems. Not five features — five complete systems, each of which could be a standalone application.

The notes system is a full rich-text workspace with an AI assistant, not a text file.  
The resource registry is a structured university catalog, not a shared drive.  
The daily journal is a calendar-based reflective workspace with tasks, not a to-do list.  
The Pomodoro system includes habits, a social leaderboard, and study groups — not just a timer.  
And tying everything together: the AI Library Assistant, which can answer questions from what the student has actually written in their notes and daily logs.

And there are two more I haven't mentioned yet."

**Timing:** 2 minutes  
**Transition:** "Cortex doesn't just live in a browser tab."

---

## SLIDE 4 — Beyond the Browser: Two Extensions
**Title:** The Chrome Extension + The GNOME Extension

**Visual (side by side):**
```
🌐 CHROME EXTENSION              🐧 GNOME EXTENSION — Tamatem
(Manifest V3)                    (tamatem@frey.dev, GNOME Shell 48–50)

[🍅 Timer] [🚫 Blocker]          ┌────────────────────────────────┐
[👥 Social] [History]            │ 🍅 OS Algorithms — 19:44  [■] │  ← in top bar
                                 └────────────────────────────────┘
• Timer runs in background       • Timer in Linux system tray
• Blocks sites at HTTP level     • Blocks sites at OS level
• Syncs sessions to backend      • Syncs sessions to same backend
• Same JWT as web app            • Same JWT as web app
```

**Bullets:**
- **Chrome Extension** — Pomodoro timer that runs even with the tab closed, site blocker during focus, syncs sessions to the leaderboard
- **GNOME Extension (Tamatem)** — Persistent timer in the Linux top bar, OS-level site blocking, session sync — no browser needed at all
- Both connect to the same Express backend with the same authentication

**Speaker notes:**  
"We didn't stop at the website. We built two native integrations.

The Chrome extension runs the Pomodoro timer in a background process that Chrome keeps alive even when you close the tab. During focus sessions, it activates network-level blocking rules — sites like YouTube are blocked at the HTTP request layer, not through a JavaScript overlay you can bypass.

But we also built a GNOME Shell extension called Tamatem. GNOME is the desktop environment for Ubuntu, Fedora, and most Linux distributions — which many computer science students use. Tamatem puts a live Pomodoro timer directly in the system's top bar. It blocks sites at the operating system level. And it syncs completed sessions to the same Cortex backend through the same API.

Think about what that means: a student can use the web app on any device, the Chrome extension in their browser, or the GNOME extension on their Linux desktop — and all three share the same notes, the same leaderboard, the same data. One login. One system."

**Timing:** 2 minutes  
**Transition:** "Let me walk through the product in detail."

---

## SLIDE 5 — Product Walkthrough: Notes System
**Title:** Notes — More Than a Text Editor

**Bullets:**
- Rich text: headings, tables, code blocks, images, checklists, embeds
- **Slash commands** (`/`) insert any block type — keyboard-first workflow
- **`/ai` command** — AI writes, edits, or comments inline in real-time
- Folders (nested, hierarchical) + Tags (color-coded, filterable)
- **Share with a teammate** — viewer or editor role
- **Publish publicly** — any note can become a public study resource
- AI sidebar: Summarize, Suggest Tags, Ask Library Assistant
- Archive with restore or permanent delete

**Speaker notes:**  
"The notes system is the centerpiece of Cortex. The editor is built on Plate.js, a highly extensible rich-text framework. You can write headings, insert tables, paste code with syntax highlighting, embed images, create nested checklists — all with slash commands or keyboard shortcuts.

The AI is built into the editor itself. Type `/ai` anywhere and a panel opens where you can ask it to generate content, rewrite a selection, or comment on your text. It streams the response character by character, directly into your document.

Notes have a complete organization system: folders within folders, color-coded tags, and a fast filter bar. You can share any note with another student — giving them view-only or edit access. You can publish any note publicly, making it accessible to anyone who has the link — without even logging in. This turns student notes into community resources."

**Timing:** 1.5 minutes  

---

## SLIDE 6 — Product Walkthrough: Resource Registry
**Title:** The University Catalog — One Home for Everything

**Visual (hierarchy):**
```
🏛️ Menoufia University
   └── 📚 Faculty of Computers & Information
        └── 🎓 Computer Science
             └── 📅 Year 2
                  └── 📖 Data Structures (CS201)
                       ├── 📄 Lecture Notes  [Download]
                       ├── 🔗 Competitive Programming Platform  [Open]
                       └── 👨‍🏫 Dr. Ahmed Hassan
```

**Bullets:**
- Organized by: University → College → Major → Year → Course
- Resources per course: PDFs, external links, videos
- Doctor assignments: who teaches which course
- Auto-filtered to YOUR curriculum based on your profile
- Admin-managed: only designated admins can add/edit content
- Bilingual: every course has an Arabic name and an English name

**Speaker notes:**  
"The resource registry is a structured, admin-managed catalog of the university's entire academic content. It follows the real hierarchy of Egyptian universities: university, college, major, year level, course.

The moment you log in and set up your profile — selecting your university, college, and major — the catalog opens pre-filtered to your exact curriculum. You do not scroll through other departments. Your courses are front and center.

Each course page shows the available resources with direct download links, and the doctors assigned to teach it. Admins upload the resources — PDFs, lecture videos, reference links. Students browse and download."

**Timing:** 1.5 minutes  

---

## SLIDE 7 — Product Walkthrough: Daily Journal & Calendar
**Title:** The Daily Planner — Your Academic Diary

**Visual (calendar + day view):**
```
       JULY 2026
  Mo Tu We Th Fr Sa Su
        1  2  3  4  5
   6  7  8  9 10 11 12
  [●][●][●][●][●]      ← dots = logged days

TODAY (July 2):
  ✨ Highlight: Finished OS scheduling chapter!
  📝 [Rich text note about what I studied]
  ✅ Tasks:
     [✓] Review Chapter 3
     [✓] Solve 3 algorithm problems
     [ ] Read AI lecture notes
```

**Bullets:**
- One page per day — created on demand when you click a date
- **Highlight field** — your best achievement today (journaling habit)
- **Rich text note** — same Plate.js editor as the notes system
- **Task list** with checkboxes that respond instantly (optimistic UI)
- Calendar view — dots mark days you have written a log
- Every log is AI-embedded — searchable by meaning, not just keywords

**Speaker notes:**  
"The daily planner gives each day a structured page. You arrive here at the start of your study session, write what you are working on, add your tasks, and capture your highlight at the end of the day.

The calendar makes your study history visible — every day with a log has a dot. Clicking any past day opens what you wrote and studied. Over time, this creates a visual record of your academic progress across the entire semester.

And every log is processed by the AI embedding system. After you save the day's content, the backend generates a 768-dimensional vector representing the meaning of that day's work. Later, the Library Assistant can find relevant days when you ask it questions — not by searching for keywords, but by understanding meaning."

**Timing:** 1.5 minutes  

---

## SLIDE 8 — Product Walkthrough: Habits, Pomodoro & Social
**Title:** Productivity System + Social Accountability

**Three-part visual:**
```
HABITS                    POMODORO TIMER           LEADERBOARD
📖 Read 30 pages          🍅 OS Algorithms         🥇 Ahmed     240 min
🔥 14-day streak ✅        [22:30 remaining]        🥈 Sara      210 min
🧮 Solve problems          [■ Pause] [✕ Stop]       🥉 Omar      175 min
🔥 7-day streak ✅
📝 Flashcards
🔥 0 (broken)  ○
```

**Bullets:**
- **Habits** — daily, weekly, or monthly with streak tracking (break a 21-day streak and you know it)
- **Pomodoro** — 25 min focus / 5 min break / 15 min long break, subject-labeled, logged to database
- **Friends + Study Groups** — add friends, create study groups, start group focus sessions
- **Weekly Leaderboard** — friends ranked by total focus minutes, resets every Monday
- **Extensions sync** — Chrome and GNOME extension sessions appear on the same leaderboard

**Speaker notes:**  
"The productivity layer has three interlocking parts.

Habits give students long-term structure. You define habits with any frequency pattern — daily reading, gym three times a week, monthly assignment review. Streak counts make consistency feel like a game. Breaking a 21-day streak is genuinely painful — that is the psychology that keeps habits going.

The Pomodoro timer is built on the science of focused work: 25 minutes of deep focus, 5 minutes of break, repeated four times, then a longer 15-minute break. Every completed session is logged to the database with a timestamp and what you were studying.

The social layer is what makes all of this stick. You add friends, you see their weekly focus minutes, you want to beat them. The leaderboard resets every Monday — so last week's winner has to earn it again. Study groups let you start shared focus sessions with teammates. And whether a session came from the web app, the Chrome extension, or the GNOME extension — it all goes to the same leaderboard."

**Timing:** 2 minutes  

---

## SLIDE 9 — The Architecture: How It All Connects
**Title:** Three Clouds, One Coherent System

**Visual:**
```
[Chrome Extension]  ─────┐
[GNOME Extension]   ─────┤── REST + JWT ──→  [Express Backend]  ──→  [Supabase DB]
[Web App (Vercel)]  ─────┘                       (Railway)            PostgreSQL
                                                                       + pgvector
                                                    ↕                  + RLS
                                              [Gemini API]
                                           (Chat + Embeddings)
```

**One rule above all:**  
`Browser / Extension → Express Backend → Supabase`  
`Browser → Supabase` ❌ — never, ever

**Speaker notes:**  
"The architecture we designed has one rule that governs everything: no client — web, Chrome extension, or GNOME extension — ever talks to the database directly. Everything goes through the Express backend.

This matters because Supabase has an admin key that bypasses all security. That key lives only on the Railway server. No client, no browser, no extension ever sees it.

The backend is organized in three strict layers for every domain: Controller handles HTTP, Service handles business logic, Repository handles all database calls. Seven domains, same pattern, always.

Every client — three different clients, three different platforms — calls the same Express API with the same JWT token. One backend serves all of them equally."

**Timing:** 1.5 minutes  

---

## SLIDE 10 — Technology Choices That Were Not Accidents
**Title:** Why Each Technology — Our Reasoning

**Table:**
| We chose | Over | Because |
|---------|------|---------|
| **Plate.js** | Quill, TipTap | Produces JSON AST — AI can process it cleanly. Quill produces HTML. |
| **Google Gemini** | OpenAI, Anthropic | Arabic quality + cheapest + the only provider with both chat AND embedding models |
| **Supabase** | Firebase, raw PostgreSQL | RLS + pgvector + Auth in one managed service — Firebase is NoSQL, unusable for this schema |
| **Next.js 15** | Vite SPA | Server Components render the catalog on the server — instant, no JS loading state |
| **Separate Express backend** | Next.js API routes only | Admin key isolation, independent scaling, one API for all three clients |
| **declarativeNetRequest** (Chrome) | Content script blocking | Blocks at network level — cannot be bypassed, survives Manifest V3 |
| **GNOME Shell extension** | Nothing | Extends Cortex to the Linux desktop — no browser tab required |

**Speaker notes:**  
"None of these choices were defaults. Every one was made after evaluating the alternative.

The most consequential: Plate.js produces structured JSON; Quill produces HTML. This single choice is what made clean AI processing of note content possible. If we had chosen Quill, every AI operation would require parsing and stripping HTML — fragile and slow.

The second most consequential: Gemini over OpenAI. Better Arabic, dramatically cheaper, and the only provider that gives us a quality embedding model alongside a quality chat model in one API.

And the separate Express backend — not for complexity's sake, but because three different clients need to share one API without any of them having access to the database admin key."

**Timing:** 1.5 minutes  

---

## SLIDE 11 — The Scope of Our System
**Title:** Cortex System Architecture Scope

**Table:**
| Component | Scope |
|-----------|-------------|
| 44 database migrations | Every table, index, RLS policy, pgvector schema, trigger, SQL RPC function |
| 7 backend service domains | Auth, Notes, Daily, Data, AI, Admin, Workspace — Controller + Service + Repository each |
| 50+ API endpoints | All routes, auth guards, admin guards, validation, error handling |
| 15+ frontend routes | App Router, server components, admin guards, bilingual layouts |
| 20+ Plate.js editor plugins | Including AI command, slash commands, copilot, tables, images |
| 3 AI systems | Editor AI (streaming, 4 providers), Note AI (local NLP), Library Assistant (RAG + pgvector) |
| Chrome Extension | 5-tab popup, service worker timer, declarativeNetRequest blocker, backend sync |
| GNOME Extension (Tamatem) | Top bar timer, OS-level blocking, session sync via Cortex API |
| Full i18n | Arabic + English, RTL CSS logical properties, locale switcher, 200+ translated keys |
| Production deployment | Vercel + Railway + Supabase — environment variable isolation, CI/CD, health checks |

**Speaker notes:**  
"This represents the full engineering scope of the system we built. 44 migrations, 50 API endpoints, three clients, and three AI subsystems.

As a team, we divided the engineering tasks across these domains while maintaining a unified, modular architecture. The six presentations that follow go deep into each of these subsystems. As the lead architect, I will be happy to answer any questions about the overall design and system integration."

**Timing:** 1 minute  

---

## SLIDE 12 — Handoff
**Title:** Six Deep Dives Follow

**Bullets:**
- **Section 2:** Authentication, sessions, user profiles
- **Section 3:** Notes system, rich text editor, collaboration
- **Section 4:** AI integration — embeddings, RAG, streaming
- **Section 5:** University resource catalog
- **Section 6:** Daily planning, habits, Pomodoro, social leaderboard
- **Section 7:** Admin panel, Arabic/English, Chrome + GNOME extensions, deployment

**Speaker notes:**  
"Everything that follows is a deep dive into the subsystems my team implemented under this architecture. I'll take any architecture or design questions now — or save them for the end of the presentation."

---

## Q&A Prep

**Q: What is the GNOME extension and why did you build it?**  
A: GNOME is the desktop environment used by most Linux distributions — Ubuntu, Fedora, and others. A GNOME Shell extension integrates directly into the desktop's top bar. We built Tamatem (`tamatem@frey.dev`) so that Linux users — especially CS students who are likely on Linux — can have a persistent Pomodoro timer in their system tray and site blocking at the OS level, with no browser tab required. It connects to the same Express API with the same JWT authentication as the web app and Chrome extension.

**Q: Why did you build both a Chrome extension AND a GNOME extension?**  
A: Different students use different environments. A Windows or macOS student uses the Chrome extension. A Linux student using GNOME gets native OS integration through Tamatem. Both are clients of the same API, so their sessions appear on the same leaderboard regardless of which interface they used.

**Q: Why not use Next.js API routes instead of a separate Express backend?**  
A: Two reasons. First: the database service role key must live on an infrastructure environment completely separate from the frontend deployment — Next.js API routes run on Vercel alongside the frontend, creating key exposure risk. Second: three separate clients (web, Chrome, GNOME) need one shared API. That API should not be a Next.js implementation detail. It is a first-class service.

**Q: How does sharing data across three clients (web, Chrome, GNOME) work?**  
A: All three authenticate using the same JWT from Supabase Auth — stored in a cookie for the web app, in `chrome.storage.local` for the Chrome extension, and in GNOME's settings storage for the GNOME extension. All three make HTTP calls to the same Railway Express backend with `Authorization: Bearer <token>`. The backend does not care which client is calling — it verifies the token and processes the request identically.

**Q: What was the hardest part of building this?**  
A: The AI embedding pipeline. Getting pgvector set up, choosing the right embedding model, tuning the similarity threshold so the Library Assistant retrieves relevant notes without false positives, and making the embedding run asynchronously after every save without blocking the user's experience — all of that required significant iteration. The final solution runs `syncLogEmbedding` in the background and silently fails without surfacing errors to the user, so the save operation always feels instant.
