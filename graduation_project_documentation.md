# Cortex: Collaborative Academic Second Brain
## B.Sc. Graduation Project Master Documentation Book

---

## Departmental Metadata
* **Institution:** Menoufia University  
* **Faculty:** Faculty of Electronic Engineering  
* **Department:** Computer Science & Engineering Division  
* **Academic Year:** 2025/2026  
* **Project Title:** Cortex: Bilingual Collaborative Note-taking & Resource Registry System

---

## Chapter 1: Enterprise System Architecture & Relational Topology

Cortex separates layers of execution (presentation, coordination, data, caching, and background processing) to prevent bottlenecks. It is designed to handle high concurrent read/write ratios during peak exam periods, real-time note-taking synchronization, and high-performance vector semantic queries.

### 1.1 Decoupled System Architecture & Topology
1. **Presentation Client Tier:** 
   * Next.js 15 Web Application using React 19 concurrent hydration, server components, and responsive app shells.
   * Chrome MV3 extension service workers monitor active tabs, block distracting domains, and sync Pomodoro logs.
   * GNOME Shell desktop widget applet written in GJS, polling local active states and updating status indicators.
2. **Reverse Proxy Load Balancer (Nginx):**
   * Manages SSL termination and path-based routing (API requests go to Express, WebSockets to Yjs).
   * Restricts request volumes per IP subnet to prevent denial-of-service attempts.
3. **Application Tier (Express & TypeScript):**
   * API Gateway: handles JWT parsing, rate-limiting, CORS, and error logging.
   * Yjs websocket server: processes binary-serialized update buffers to merge document changes in real-time.
   * Redis cache: stores active session profiles and leaderboard stats.
   * Background queue worker: parses note changes, calls Gemini API, and inserts vector chunks.
4. **Data Tier (Supabase PostgreSQL):**
   * Relational schemas model universities, colleges, majors, year levels, courses, profiles, and resources.
   * Row-Level Security (RLS) policies secure notes and shared folders at the database level.
   * pgvector extension: indexes and queries 384-dimensional vector embeddings.

---

## Chapter 2: Next.js Layout Routing & Bilingual Localization

Cortex supports English and Arabic layouts, managing path routing and direction changes dynamically.

### 2.1 File-System App Routing
Routes are grouped under the dynamic locale folder `app/[locale]/`. An App router structure isolates routes:
* `(marketing)` group: public landing and login pages.
* `(app)` group: authenticated workspace dashboards, note directories, calendars, and AI chat.
* `(admin)` group: admin portal screens for verification approvals and user management.

### 2.2 next-intl Bilingual Localization
Language routing is processed by next-intl middleware. Locales (`en` and `ar`) map pages to language dictionaries. Visual components use CSS logical properties (like `ms-`, `me-`, `ps-`, `pe-`, and `text-start`) that adapt spacing automatically based on the layout direction, avoiding layout breakage. Theme styles (primary purple and light/dark modes) are defined using OKLCH color variables to maintain consistent contrast ratios.

---

## Chapter 3: Rich Plate.js Editor Canvas & Real-time Sync

The note-taking editor handles block nodes, real-time sync, and document version history.

### 3.1 Plate.js & Slate.js Node Tree
Documents are saved as JSON trees of block nodes, where each block contains a unique ID, its type, and child leaves for formatting. A keyboard event interceptor plugin handles formatting shortcuts, transforming block types dynamically.

### 3.2 Real-time Sync Binding (Yjs)
We bind the editor canvas to Yjs text objects using `@slate-yjs/core`. Keystrokes are converted to binary updates and broadcast over WebSockets. The Yjs collaboration server merges these updates and saves snapshots to the database every 30 seconds.

### 3.3 Version History (Myers Diff)
The database stores snapshot history in the `note_snapshots` table. The backend runs a Myers-based diff algorithm over the block JSON arrays to highlight additions in green and deletions in red.

---

## Chapter 4: Academic Registries & Google Drive Integrations

This module manages the university directory, document sharing approvals, and external file embeds.

### 4.1 Registry Relational Schemas
The database catalog maps universities, colleges, majors, courses, and professors. Students request verification by uploading credentials, which admins review. An SQL trigger updates profiles upon approval, granting verified users rights to publish files to public directories.

### 4.2 Google Drive Integration
We use the Google Drive API to link and embed lecture slides and exam papers. Embedded files are rendered inside the Next.js client using secure `iframe` viewer tags. Database triggers calculate file average ratings and update statistics in real-time.

---

## Chapter 5: Retrieval-Augmented Generation (RAG) & Vector Database

The search pipeline matches user queries against notes vector indexes.

### 5.1 Note Chunking & Embedding Generation
Note text is split into overlapping chunks of roughly 800 characters, using a 150-character overlap to keep context across boundaries. Chunks are sent to the Gemini API (`text-embedding-004` model) to generate 384-dimensional vector embeddings, which are stored in the database.

### 5.2 pgvector Indexing & Similarity Matching
Vector columns are indexed using HNSW parameters (`M=16`, `ef_construction=64`) to optimize query speed. We write a custom SQL query function `match_notes` to compute cosine similarity scores, filtering out results below a minimum score. An Express backend controller streams AI-generated responses to the client using Server-Sent Events (SSE).

---

## Chapter 6: Daily Planner Tracker & Habit Streaks

This module manages study calendars, checklists, and focus session stats.

### 6.1 Daily Logs & Habit tracking
The planner maps checklists to daily logs, supporting mood tracking and custom habit frequencies (Daily, Weekdays, Weekends, Custom).

### 6.2 Habit Streaks (SQL CTEs)
To calculate habit streaks, we write a database query that uses a Common Table Expression (CTE) and window functions. The query groups consecutive days of habit logs, computing current active streaks and longest streaks directly in the database.

### 6.3 Pomodoro Focus Sync
Focus logs are stored in the database, allowing us to aggregate study hours by course and device type. The data is synchronized across web, browser extension, and GNOME desktop clients.

---

## Chapter 7: Multi-Platform Extensions & Leaderboards

Cortex extends study controls beyond the web dashboard, providing a Chrome extension and a native GNOME desktop widget.

### 7.1 Chrome Focus Extension (MV3)
The Chrome Extension uses Manifest V3 background service workers and `declarativeNetRequest` rules to block distracting websites automatically during study sessions.

### 7.2 GNOME Shell applet Indicator (GJS)
The GNOME widget applet is written in Javascript for GNOME GJS. It runs in the desktop panel status area, polling local focus state cache files to display remaining focus minutes.

### 7.3 Leaderboards Point Calculations
We write an SQL query to calculate leaderboard positions. The query calculates points from focus session logs and published notes, ranking group members dynamically.
