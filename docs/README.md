# Cortex — Graduation Project Documentation Index

**Project:** Cortex — Bilingual Collaborative Academic Workspace  
**University:** Menoufia University  
**Stack:** Next.js 15 · Express.js · Supabase · Google Gemini · Plate.js · Chrome Extension

---

## Document Overview

This `docs/` folder contains **14 documents** covering all 7 sections of the graduation presentation. Each section has two files:
- **Technical Reference** (`_technical.md`) — deep code-level explanations, diagrams, schemas, API docs
- **Presentation Script** (`_presentation.md`) — slide-by-slide content, speaker notes, timing, Q&A prep

Total documentation: **~5,900 lines** across all 14 files.

---

## Section Map

| # | Title | Presenter | Technical | Presentation |
|---|-------|-----------|-----------|-------------|
| 1 | System Architecture & Technology Decisions | Ahmed Tawfik (Leader) | [section_1_technical.md](./section_1_technical.md) | [section_1_presentation.md](./section_1_presentation.md) |
| 2 | Authentication, Session Management & User Profiles | — | [section_2_technical.md](./section_2_technical.md) | [section_2_presentation.md](./section_2_presentation.md) |
| 3 | Collaborative Note-taking System & Rich Text Editing | — | [section_3_technical.md](./section_3_technical.md) | [section_3_presentation.md](./section_3_presentation.md) |
| 4 | AI-Powered Academic Assistant & Intelligent Features | — | [section_4_technical.md](./section_4_technical.md) | [section_4_presentation.md](./section_4_presentation.md) |
| 5 | Academic Resource Registry & University Data Catalog | — | [section_5_technical.md](./section_5_technical.md) | [section_5_presentation.md](./section_5_presentation.md) |
| 6 | Daily Planning System, Habits & Social Pomodoro | — | [section_6_technical.md](./section_6_technical.md) | [section_6_presentation.md](./section_6_presentation.md) |
| 7 | Admin Panel, Deployment, Internationalization & Extension | — | [section_7_technical.md](./section_7_technical.md) | [section_7_presentation.md](./section_7_presentation.md) |

---

## Quick Reference — What Each Document Contains

### Section 1 (Architecture)
**Technical:** Problem statement, 4 pillars, full tech stack rationale (Next.js vs alternatives, Express vs NestJS, Supabase vs Firebase, Plate.js vs TipTap, Gemini vs OpenAI), 3-tier architecture, database schema overview (44 migrations), API catalog, security model, monorepo structure, deployment architecture, Chrome extension overview, Mermaid diagrams  
**Presentation:** 12 slides covering the problem, the solution, tech choices, architecture diagram, security, deployment, Q&A prep

### Section 2 (Authentication)
**Technical:** Two Supabase clients (browser vs server), Next.js middleware session refresh, `getServerSession()` verified profile pattern, `AuthService` / `AuthRepository` / auth middleware code, `use-auth.ts` / `use-auth-mutations.ts` hooks, profiles table schema, DB trigger for auto-profile creation, profile setup flow, role-based access, RLS policies, Mermaid sequence diagrams  
**Presentation:** 10 slides on the two-layer security model, JWT lifecycle, login flow, automatic session refresh, profile personalization, role-based access, demo script, Q&A

### Section 3 (Notes System)
**Technical:** Notes/folders/tags/note_shares schema (including `vector(768)` embedding), `NoteService` methods, `NoteRepository` key queries, REST routes, notes dashboard client architecture, auto-save debounce pattern, Plate.js plugin list (20+ plugins), AI slash command in editor, tag filtering, sharing model, public notes, archive, Mermaid diagrams  
**Presentation:** 10 slides on the rich text editor, Plate.js capabilities, auto-save UX, organization, collaboration, public notes, demo script, Q&A

### Section 4 (AI Integration)
**Technical:** Three AI layers (editor AI / note AI / library assistant), Vercel AI SDK streaming, intent classification with `generateObject`, multi-model support (OpenAI/Anthropic/Groq/Google), `AIService` methods (`embedText`, `summarizeNote`, `suggestTags`, `askLibrary`, `askGeneral`), extractive summarization algorithm, NLP tag extraction, RAG pipeline code, pgvector similarity search SQL, daily log embedding, frontend `GlobalAssistantModal`, AI copilot, Mermaid diagrams  
**Presentation:** 11 slides on the three AI layers, text embeddings explained with analogy, RAG pipeline step-by-step, why Gemini, responsible AI, demo script, Q&A

### Section 5 (Data Catalog)
**Technical:** Full hierarchical schema (universities → colleges → majors → year_levels → courses → resources + doctors + course_doctors), `DataService` methods, `DataRepository` queries, REST routes with admin guards, server-side data page with `next: { revalidate: 300 }`, cascading filter client component with URL-driven state, profile-aware redirect, UploadThing file upload integration, RLS policies, Mermaid diagrams  
**Presentation:** 11 slides on the scattered resource problem, catalog hierarchy, cascading filters, profile personalization, course detail page, bilingual support, admin data management, URL-driven state as technical highlight, demo script, Q&A

### Section 6 (Daily Planning)
**Technical:** `daily_logs` schema (tasks as JSONB, `vector(768)` embedding), `DailyService` methods (updateDailyLog, syncLogEmbedding, task toggle with optimistic updates), Plate text extraction algorithm, `use-daily.ts` hooks, habits schema (frequency/target_days logic, streak calculation), `pomodoro_sessions` schema, `get_friends_leaderboard` SQL RPC function, social schema (friendships/study_groups/group_members), Chrome extension timer sync, Mermaid diagrams  
**Presentation:** 11 slides on the productivity problem, four layers (journal/habits/pomodoro/social), daily log UX, habit streaks psychology, Pomodoro science, leaderboard accountability, Chrome extension, AI-embedded daily logs, demo script, Q&A

### Section 7 (Admin, Deployment, i18n, Extension)
**Technical:** Admin access at 4 layers (frontend guard / layout / backend middleware / DB RLS), admin dashboard stats, users manager (role change), data manager (7-tab CRUD), admin API functions, next-intl configuration (`i18n/request.ts`, `lib/i18n.ts`), server vs client translation usage, `messages/en.json` and `messages/ar.json` structure, RTL with `dir="rtl"` + Tailwind RTL utilities, locale switcher, Chrome Manifest V3 structure, service-worker timer via alarms, `declarativeNetRequest` site blocker, `API.recordSession()`, Vercel/Railway/Supabase deployment config, environment variables table, Next.js rewrites proxy, 44 migrations deployment, metadata for SEO, TanStack Query cache config, Mermaid diagrams  
**Presentation:** 12 slides on admin role, dashboard, user management, data manager, i18n architecture, Arabic RTL design, Chrome extension, deployment diagram, production security, demo script, Q&A

---

## Presentation Order & Total Time

| Section | Estimated Time |
|---------|----------------|
| Section 1 — Architecture (Ahmed Tawfik) | 12–15 min |
| Section 2 — Authentication | 10–12 min |
| Section 3 — Notes System | 12–14 min |
| Section 4 — AI Integration | 12–14 min |
| Section 5 — Data Catalog | 10–12 min |
| Section 6 — Daily Planning | 12–14 min |
| Section 7 — Admin & Infrastructure | 12–14 min |
| **Total** | **~80–95 min** |

---

## Key Technical Facts to Know by Heart

- **Frontend:** Next.js 15, React 19, TypeScript, Plate.js, TanStack Query, next-intl, Shadcn/ui
- **Backend:** Express.js, TypeScript, Controllers → Services → Repositories
- **Database:** Supabase PostgreSQL 15, 44 migrations, pgvector `vector(768)`
- **AI:** Google Gemini (`text-embedding-004` + `gemini-flash-latest`), Vercel AI SDK
- **Extension:** Chrome Manifest V3, background service-worker, `declarativeNetRequest`
- **Deployment:** Vercel (frontend) + Railway (backend) + Supabase (database)
- **Rule #1:** Frontend NEVER calls Supabase directly — always through Express API
- **Rule #2:** Service Role Key lives ONLY on Railway backend
- **Rule #3:** RLS protects every table at the database level regardless of app code
