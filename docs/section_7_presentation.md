# Section 7 — Presentation Script
# Admin Panel, Deployment, Internationalization & Browser Extension
**Estimated time:** 12–14 minutes

---

## SLIDE 1 — Title
**Title:** The Infrastructure — Admin, Deployment, Languages & Extensions  
**Subtitle:** The systems that make Cortex trustworthy, bilingual, and production-ready

**Speaker notes:**  
"I will cover the four infrastructure pillars of Cortex: the admin panel that keeps the platform organized, the internationalization system that makes Cortex genuinely bilingual, the Chrome extension that extends Cortex into the browser, and the deployment architecture that puts all of this in production. These are the parts of the system that users do not see directly, but everything they use depends on them."

---

## SLIDE 2 — The Admin Panel: Who Manages Cortex?
**Title:** Every Platform Needs a Control Room

**Bullets:**
- Admin role = university staff or designated student representatives
- Two key responsibilities:
  - **Catalog management:** add courses, resources, doctors, update descriptions
  - **User management:** view all accounts, change roles, resolve issues
- Admin access: gated at frontend, backend, AND database — three layers
- Regular users never see the admin panel (redirect to home if they try)

**Speaker notes:**  
"In any multi-user platform, there needs to be someone who can manage the content and users. In Cortex, that is the admin. Admins can do things regular students cannot: they manage the course catalog — adding new courses, uploading resources for each course, assigning doctors to courses. They can also view all registered users and change roles when needed.

Admin access is enforced at three levels. The frontend redirects non-admins before any admin page renders. The backend rejects any API call from non-admins with a 403 error. And the database itself rejects any write operation from a non-admin account through Row-Level Security policies. An attacker would need to defeat all three layers."

---

## SLIDE 3 — Admin Dashboard
**Title:** The Admin at a Glance

**Visual (dashboard with stat cards):**
```
┌──────────────────────────────────────────────────────┐
│  👥 Total Users   📝 Total Notes   👁️ Active Today  📚 Resources │
│     1,247            8,932              143              286      │
└──────────────────────────────────────────────────────┘

Side navigation:
• Dashboard
• Users
• Data Manager
• Settings
```

**Bullets:**
- Platform stats: total users, notes, active sessions, resources
- Quick navigation to user management and data management
- Activity overview: who is using the platform today
- Server-side rendered: admin sees fresh data every time they open the page

**Speaker notes:**  
"The admin dashboard gives platform managers an instant overview. How many users have registered? How many notes exist? How many resources are in the catalog? How many users were active today?

This data is fetched directly from the database via Express API calls and rendered server-side — no stale data. The admin always sees the current state of the platform."

---

## SLIDE 4 — User Management
**Title:** Managing Every Account on the Platform

**Visual (user table):**
```
Name              Email                    Role    Joined       Actions
Ahmed Tawfik      ahmed@gmail.com          admin   Jan 15       [Change Role ▼]
Sara Kamal        sara@student.menofia.edu user    Feb 3        [Change Role ▼]
Omar Hassan       omar@gmail.com           user    Feb 8        [Change Role ▼]
Nour Ali          nour@student.edu         user    Mar 1        [Change Role ▼]
```

**Bullets:**
- View all registered users with their name, email, role, and join date
- Change any user's role: user ↔ admin
- Search by name or email
- Pagination for large user bases

**Speaker notes:**  
"The user management page shows every registered account. The most important action is the role change dropdown: select 'admin' and the user immediately gains admin access on their next page load. This is how Cortex expands its admin team — no database editing required.

The search functionality lets admins quickly find a specific user. The table is paginated to handle thousands of accounts efficiently."

---

## SLIDE 5 — Data Manager: The Catalog Control Center
**Title:** Building the Course Catalog — Admin CRUD

**Visual (tabbed interface):**
```
[Universities] [Colleges] [Majors] [Courses] [Doctors] [Resources] [Assignments]

Selected: Courses tab
────────────────────────────────────────────────────────────
[+ Add Course]

CS201 | Data Structures | Year 2 | 3 Credits  [Edit] [Delete]
CS301 | Algorithms      | Year 3 | 3 Credits  [Edit] [Delete]
MATH201 | Discrete Math | Year 2 | 3 Credits  [Edit] [Delete]
```

**Bullets:**
- Seven tabs cover all catalog entities
- Full create, read, update, delete for every entity
- Changes are immediately reflected in the student-facing catalog
- Doctor assignment tab: link doctors to multiple courses
- Resource upload: PDF files go to CDN, links stored in database

**Speaker notes:**  
"The Data Manager is where the catalog content is built. An admin starts by creating the university, then adds colleges inside it, then majors inside each college, then courses inside each major. For each course, they can add resources and assign doctors.

This structured process ensures data consistency. You cannot create a course without selecting a major. You cannot create a college without selecting a university. The hierarchy is enforced by both the UI and the database foreign key constraints."

---

## SLIDE 6 — Internationalization: One App, Two Languages
**Title:** Arabic and English — From the Ground Up

**Bullets:**
- All UI text stored in JSON files: `messages/en.json` + `messages/ar.json`
- Server components: `getTranslations('namespace')` → `t('key')`
- Client components: `useTranslations('namespace')` → `t('key')`
- No code changes needed to add a new language — just add a new messages file
- Language switcher in navbar: one click switches the entire UI

**Speaker notes:**  
"Internationalization in Cortex is not an afterthought — it was built into the architecture from day one. Every piece of text you see in the UI comes from a translation key, not a hardcoded string. Server components use an async translation function. Client components use a hook. Both read from the same JSON message files.

Switching languages changes every button label, heading, error message, and placeholder in the entire application simultaneously. And because the catalog data has both `name_en` and `name_ar` for every course and university, even the content becomes bilingual."

---

## SLIDE 7 — Arabic RTL Layout
**Title:** Right-to-Left Design — More Than Mirroring Text

**Visual (side-by-side screenshots):**
```
English (LTR)              Arabic (RTL)
[Logo]   [Nav → →] [User]  [User] [← ← Nav]  [Logo]
```

**Bullets:**
- When Arabic is active: `dir="rtl"` on the HTML element
- Text flows right-to-left (Arabic script renders correctly)
- Navigation menus flip to the right side
- Icons that indicate direction (chevrons, arrows) rotate 180°
- Tailwind CSS RTL utilities: `rtl:rotate-180`, `rtl:space-x-reverse`, `ms-auto` (margin-inline-start)
- Arabic font (Noto Kufi Arabic) loaded via Google Fonts

**Speaker notes:**  
"Supporting Arabic is significantly more complex than just translating text. The entire layout needs to mirror. In English, the page flows left-to-right: the logo is on the left, navigation is in the middle, user menu on the right. In Arabic, this reverses: user menu on the left, navigation in the middle, logo on the right.

Setting `dir='rtl'` on the HTML element handles most of this automatically. Tailwind CSS provides RTL-specific utilities for the cases that need explicit handling. We also load a dedicated Arabic font — Noto Kufi Arabic — which renders Arabic script with correct typography and kerning."

---

## SLIDE 8 — The Chrome Extension
**Title:** Cortex in the Browser — Beyond the Website

**Visual (extension popup):**
```
[🍅 Timer] [🚫 Blocker] [👥 Social] [📊 History] [⚙️ Settings]

         OS Algorithms — 18:42 remaining
              [Pause]   [Stop]

Currently blocked:
  ✓ youtube.com
  ✓ twitter.com
  ○ instagram.com
  [+ Add site]
```

**Bullets:**
- Chrome Manifest V3 extension — modern, secure, performance-optimized
- Background service worker: timer runs with no visible browser tab
- Site blocker: blocks distracting sites at the HTTP request level during focus
- Syncs completed sessions to Cortex backend (same JWT as web app)
- Social tab: see which friends are currently focusing

**Speaker notes:**  
"The Chrome Extension is Cortex in the browser itself. It uses Manifest V3 — the current Chrome extension standard, which is more secure and more efficient than the older Manifest V2.

The timer runs in a background service worker — a background JavaScript process that continues running even when the popup is closed. This means the Pomodoro timer keeps ticking even after you close the extension window. Alarms are set using Chrome's alarms API, which fires with high precision even when Chrome is in the background.

The site blocker uses Chrome's `declarativeNetRequest` API — a modern, privacy-preserving approach that blocks at the network level. When you start a focus session, blocking rules are added; sites like YouTube resolve to an error page. When the session ends, rules are removed automatically."

---

## SLIDE 9 — Deployment: Three Clouds Working Together
**Title:** Production Architecture — Vercel + Railway + Supabase

**Visual (deployment diagram):**
```
GitHub push → Auto-deploy to Vercel (Frontend)
                    ↕ REST API
              Railway (Backend Express)
                    ↕ PostgreSQL
              Supabase (Database + Auth)
                    ↕
              UploadThing (File CDN)
```

**Bullets:**
- **Vercel:** Global CDN, auto-deploys from GitHub, Edge functions for AI
- **Railway:** Express server, Docker container, auto-restarts on crash
- **Supabase:** Managed PostgreSQL, Auth, no database administration needed
- **UploadThing:** File CDN for resource PDFs and images
- Every push to `main` branch → automatic deployment, zero manual steps

**Speaker notes:**  
"Cortex runs on three separate cloud providers, each specializing in what they do best. Vercel specializes in frontend hosting — it has a global Content Delivery Network that caches pages close to users worldwide, and it handles auto-deployment from GitHub. Push code to the main branch and the site is updated in two minutes without any manual steps.

Railway specializes in backend services — it takes our Express application, wraps it in a Docker container, and manages it. If the process crashes, Railway automatically restarts it. It monitors health and scales when needed.

Supabase manages our database — we get PostgreSQL, authentication, storage, and Row-Level Security without managing any servers. This is the infrastructure choice that saved us hundreds of hours of database administration work."

---

## SLIDE 10 — Security in Production
**Title:** Production Security Guarantees

**Bullets:**
- Service Role Key (admin DB access) lives ONLY on Railway — never in browser
- Frontend environment variables: only `NEXT_PUBLIC_` variables reach the browser
- CORS: Express only accepts requests from Vercel domain + localhost
- All cookies: `httpOnly`, `secure` (HTTPS only), `sameSite: lax`
- HTTPS everywhere: Vercel, Railway, Supabase all enforce HTTPS
- Database: RLS on every table — defense in depth

**Speaker notes:**  
"The production deployment maintains every security guarantee we designed. The Service Role Key — which can bypass Row-Level Security and access any data — never leaves Railway's servers. Even if someone could inspect every environment variable on Vercel, they would not find it.

HTTPS is enforced everywhere. All cookies use security flags that prevent JavaScript theft and cross-site request forgery. Row-Level Security means that even if an attacker somehow bypassed the application code, the database would reject their queries."

---

## SLIDE 11 — Demo Points
**Title:** What to Show

**Demo steps:**
1. Login as admin → show admin panel in sidebar
2. Admin dashboard → show statistics
3. Admin users → show user table, demonstrate role change dropdown
4. Admin data manager → show course creation form with both language fields
5. Switch language to Arabic (top nav) → show entire UI flip to RTL
6. Show Arabic text in notes list, Arabic course names in catalog
7. Show extension popup (if installed) — timer, blocker, social tabs

---

## SLIDE 12 — Q&A Preparation

**Q: Can there be multiple admins?**  
A: Yes. Any number of users can have the admin role. Admins can grant admin access to other users. There is no single root admin — this is a flat role model by design.

**Q: What if an admin makes a mistake and deletes a course with resources?**  
A: The `resources` table has `ON DELETE CASCADE` from courses, so resources are deleted with the course. We plan to add a soft-delete mechanism (similar to notes archiving) for catalog entities as a future enhancement. Currently, deleting a course is a destructive operation with a confirmation dialog.

**Q: How do you add a new language?**  
A: Create a new `messages/xx.json` file with all the same keys translated. Add `'xx'` to the `locales` array in `lib/i18n.ts`. The rest of the system handles it automatically — no code changes needed anywhere else.

**Q: Is the Chrome Extension on the Chrome Web Store?**  
A: The extension is developed and ready for submission. Chrome Web Store submission requires a $5 developer account fee and Google's review process. Submission is planned after the graduation presentation.

**Q: What happens if Railway (backend) goes down?**  
A: The frontend would be unable to fetch data, showing error states. Static content would still be accessible via Vercel's cache. Railway has an uptime SLA and auto-restarts crashed services. We could add a fallback UI that shows a maintenance message when the backend is unreachable.

**Q: How much does all this infrastructure cost?**  
A: For a student project scale:
- Vercel: Free tier (generous limits for hobby projects)
- Railway: ~$5/month for the Express server
- Supabase: Free tier (500MB database, 50K monthly active users)
- UploadThing: Free tier (2GB storage)
- Total: approximately $5-10/month to run the entire platform
