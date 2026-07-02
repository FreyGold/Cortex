# Section 1 — Technical Reference
# System Architecture, Technology Decisions & Project Vision
**Presenter:** Ahmed Tawfik — Project Architect & Lead Developer

---

> *"I designed this system, made every architectural decision, built the backend, the frontend, the database layer, the AI integration, the Chrome extension, the GNOME extension, and the deployment pipeline. The other six sections exist because I built a platform large enough to require six people to explain it."*

---

## 1. What Is Cortex?

Cortex is a **bilingual, AI-powered academic workspace** built specifically for Egyptian university students. It is not a note app with extra features. It is a unified platform where five distinct tools — that students currently use in five separate apps — exist as one coherent system that shares data, context, and intelligence between them.

### The Five Systems Inside Cortex

**1. Collaborative Notes**
A rich-text note editor where students write, organize, share, and publish study notes. Notes have folders, tags, sharing with permission levels (viewer / editor), AI summarization, AI tag suggestions, and a Library Assistant that can answer questions grounded in what the student has written. Notes are not plain text — they are structured JSON documents that the backend can process for AI features.

**2. University Resource Registry (Data Catalog)**
A hierarchical catalog of every course in the student's university, organized by university → college → major → year → course. Each course has associated resources (PDFs, links, videos) uploaded by admins, and assigned doctors (professors). The catalog auto-filters to the student's curriculum based on their profile. Students no longer hunt for materials in WhatsApp groups.

**3. Daily Planner with Calendar**
A per-day workspace where students write what they are studying, track tasks with checkboxes, and record their day's highlight (best achievement). A calendar view shows every day they have written a log, with visual indicators. The daily log uses the same rich-text editor as the notes system. Every log is also embedded as an AI vector — meaning students can later ask "what was I studying last Tuesday?" and the Library Assistant can find it semantically.

**4. Habit Tracker, Pomodoro Timer & Social Leaderboard**
Built on top of the daily planner: a habit tracking system with streaks (daily, weekly, or monthly habits with custom frequency patterns), a Pomodoro focus timer (25 min focus / 5 min short break / 15 min long break) that records every session to the database, a friends system with friend requests and study groups, and a weekly leaderboard that ranks friends by total focus minutes. This social accountability layer is what makes the productivity system sticky.

**5. AI Library Assistant**
Cuts across all the above. The student can open the Library Assistant at any time and ask an academic question. The system finds the most semantically similar notes and daily logs in their library using vector similarity search (pgvector), then sends those as context to Google Gemini, which answers grounded in what the student has actually studied — not from the internet.

---

## 2. The Extensions: Cortex Outside the Browser Tab

Beyond the web application, Cortex ships as two separate native integrations:

### Chrome Extension — Cortex Focus
A **Manifest V3 Chrome extension** that brings the Pomodoro timer and site blocker into the browser itself. The timer runs in a background service worker — it keeps ticking even when the popup is closed. During focus sessions, `chrome.declarativeNetRequest` rules are activated that block distracting sites at the HTTP request level. Completed sessions sync to the Cortex backend automatically, appearing on the social leaderboard. The extension authenticates with the same JWT as the web app — one login, everywhere.

Tabs: Timer | Blocker | Social | History | Settings

### GNOME Extension — Tamatem (`tamatem@frey.dev`)
A **GNOME Shell extension** (shell versions 48–50) that integrates the Pomodoro timer and session tracker directly into the Linux desktop environment. Students running GNOME-based Linux distributions (Ubuntu, Fedora, etc.) get a persistent timer indicator in their top bar, site blocking at the system level, and session syncing to their Cortex account — without needing any browser tab open at all. The extension is named **Tamatem** and connects to the same Express backend API as every other client.

This makes Cortex one of the few academic platforms that extends its functionality not just to a browser extension, but to the operating system itself.

---

## 3. Why This System Exists

I did not start by picking technologies. I started by living the problem.

As a university student at Menoufia University, my academic life was spread across a dozen disconnected tools:
- Study notes in Google Docs — no AI, no structure, no connection to courses
- Lecture materials in a WhatsApp group that expires and is unsearchable
- A habit tracker on my phone that knows nothing about my curriculum
- ChatGPT that answers from the internet but has never read my notes
- No single tool designed for Arabic-speaking university students

Every tool was built for someone else. None of them talked to each other. **Cortex is my answer.** A ground-up system where every feature was designed to work with every other feature, in Arabic and English, from day one.

---

## 4. The Core Architectural Decisions

### Decision 1: Decoupled Backend — Frontend Never Touches the Database

The most important decision: **the frontend never calls the database directly**. Everything goes through the Express API.

Supabase provides two access modes: a public anon key (safe), and a service role key that bypasses all security policies and has full admin database access. Many projects use both from the frontend. I explicitly refused.

The service role key lives only on the Railway backend — a server the browser never contacts. Even if there is a bug in the frontend code, even if an attacker manipulates a network request — the database remains protected because the backend is the only gatekeeper.

This also makes adding new clients trivial. The Chrome extension, the GNOME extension, and a future mobile app all call the same Express API. They do not need to know anything about Supabase. The API is the product.

### Decision 2: Three-Layer Backend (Controller → Service → Repository)

Every domain in the system follows the same pattern:

```
Controller   → HTTP only. Parse request, validate input, return response.
Service      → Business logic. Rules, orchestration, cross-service calls.
Repository   → Database only. All Supabase queries live here and nowhere else.
```

No Supabase call outside a Repository file — ever. This means:
- Replacing the database means changing only Repository files
- Testing business logic needs no database
- Adding a new feature means following an established, predictable pattern

### Decision 3: Next.js 15 Server Components

The course catalog contains hundreds of courses. With a Single-Page Application, the browser downloads all data and renders in JavaScript — the user sees a loading state. With Next.js Server Components, the filtered catalog renders on the server and arrives as finished HTML. Instant.

Server Components also enforce admin security: the admin layout calls `requireAdmin()` before any page renders. There is no JavaScript to bypass — the redirect happens server-side before a byte of the page is sent.

### Decision 4: Supabase for Database, Auth, and pgvector

Supabase was chosen for three specific capabilities:

- **Row-Level Security** — policies that execute at the database level, not the application level. Even a buggy query cannot return data it should not.
- **pgvector** — the PostgreSQL extension for vector similarity search. Notes and daily logs are embedded as 768-dimensional vectors; semantic search uses cosine distance to find related content. Setting this up on raw PostgreSQL would have taken days.
- **Managed Auth** — JWT issuance, refresh token rotation, and SSR cookie helpers, all handled without custom implementation.

### Decision 5: Google Gemini

The AI subsystem required both a quality chat model AND an embedding model. Anthropic has no embedding model. OpenAI's embeddings are more expensive. Google's `text-embedding-004` produces 768-dimensional vectors, Gemini Flash is dramatically cheaper than GPT-4, and Gemini has the best Arabic language comprehension of all options at this price tier.

### Decision 6: Plate.js for the Rich Text Editor

The note editor must produce a structured JSON AST (not HTML), because the backend walks this tree to extract plain text for AI processing. Quill produces HTML — messy to parse for AI. Draft.js is deprecated. Plate.js is built on Slate.js and produces a clean, traversable JSON tree. It was the only editor that made the AI features clean to implement.

### Decision 7: Manifest V3 + `declarativeNetRequest` for Chrome Extension

`declarativeNetRequest` is the only blocking approach that works in Manifest V3 and that Chrome will continue supporting. It blocks at the network level — the browser never initiates the request to the blocked site. This is more secure and more effective than JavaScript-based content script blocking.

### Decision 8: GNOME Shell Extension for Linux Desktop Integration

The GNOME extension (Tamatem) was built to extend Cortex's reach beyond the browser entirely. Linux users — especially developers and computer science students — can have a persistent Pomodoro timer in their system tray, site blocking at the OS level, and session tracking without a browser tab. This is a client that connects to the same Express API using the same JWT authentication system.

### Decision 9: next-intl for First-Class Arabic/English Bilingualism

Bilingual support was a first-class requirement from the start, not an afterthought. Every piece of UI text lives in `messages/en.json` or `messages/ar.json`. RTL layout for Arabic is handled using CSS logical properties (`padding-inline-start` instead of `padding-left`) so the entire layout flips correctly without Arabic-specific overrides. The catalog data stores `name_en` and `name_ar` for every university, college, major, and course.

---

## 5. The Full System Map

```
CORTEX PLATFORM
│
├── 🌐 Web Application (Next.js 15 — Vercel)
│   ├── /notes          Rich-text notes, folders, tags, sharing, AI tools
│   ├── /data           University course catalog, resources, doctors
│   ├── /daily          Calendar journal, tasks, habits, Pomodoro, leaderboard
│   ├── /settings       AI model selection, preferences, account
│   ├── /profile        University profile setup
│   └── /admin          User management, full catalog CRUD
│
├── 🔌 Chrome Extension (Manifest V3)
│   ├── Timer tab        Pomodoro with subject tracking
│   ├── Blocker tab      Manage and activate site blocks
│   ├── Social tab       Friends' focus status
│   ├── History tab      Past sessions
│   └── Settings tab     Sync with Cortex account
│
├── 🐧 GNOME Extension — Tamatem (tamatem@frey.dev)
│   ├── Top bar indicator  Live Pomodoro timer
│   ├── System-level blocking  Site blocks via GNOME
│   └── Session sync       Same backend API as web + Chrome
│
├── ⚙️ Express Backend (Railway)
│   ├── AuthService       Signup, login, JWT, profile
│   ├── NoteService       CRUD, sharing, archiving, publishing
│   ├── DailyService      Logs, tasks, habits, Pomodoro, social
│   ├── DataService       Catalog CRUD, resources, doctors
│   ├── AIService         Embed, summarize, tag, RAG, general chat
│   └── AdminService      User management, stats
│
└── 🗄️ Supabase (PostgreSQL 15 + pgvector)
    ├── 44 SQL migrations
    ├── Row-Level Security on every table
    ├── pgvector for note + daily log embeddings
    └── Supabase Auth for JWT lifecycle
```

---

## 6. What the Six Sections That Follow Are About

The six presenters after me explain the subsystems I built. Each goes deep on code, schemas, and data flows. The architecture they are presenting, and every decision behind why their feature works the way it does, was mine.

| Section | Domain | What I decided that they explain |
|---------|--------|----------------------------------|
| 2 — Auth | JWT, sessions, profiles | Two-client Supabase pattern, verified profile via backend, profile-aware redirect |
| 3 — Notes | Editor, sharing, organization | Plate.js JSON AST, content_text extraction, sharing roles, auto-save debounce |
| 4 — AI | RAG, embeddings, streaming | pgvector similarity search, three-layer AI design, Gemini for embeddings |
| 5 — Data Catalog | Hierarchical catalog | URL-driven state, SSR with cache, admin-only writes, bilingual schema |
| 6 — Daily Planning | Tasks, habits, Pomodoro, social | JSONB tasks, streak algorithm, leaderboard SQL RPC, syncLogEmbedding |
| 7 — Admin, i18n, Extensions, Deployment | Admin panel, Arabic/English, Chrome + GNOME extension, Vercel + Railway | RTL-first CSS, declarativeNetRequest, GNOME Shell API, Railway + Vercel environment split |

---

## 7. Scale of the Project

| Metric | Count |
|--------|-------|
| Database migrations | 44 |
| Backend service domains | 7 |
| API endpoints | 50+ |
| Frontend routes | 15+ |
| Plate.js editor plugins | 20+ |
| AI model providers supported | 4 (OpenAI, Anthropic, Groq, Google) |
| i18n message keys per language | 200+ |
| Client applications | 3 (Web, Chrome Extension, GNOME Extension) |
| Deployment environments | 3 (Vercel, Railway, Supabase) |
| Lines of TypeScript (estimate) | 15,000+ |
