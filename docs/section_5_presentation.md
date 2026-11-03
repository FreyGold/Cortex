# Section 5 — Presentation Script
# Academic Resource Registry & University Data Catalog
**Estimated time:** 10–12 minutes

---

## SLIDE 1 — Title
**Title:** The Data Catalog — One Place for Every Course Resource  
**Subtitle:** A structured, hierarchical, bilingual registry of university academic content

**Speaker notes:**  
"I will present the Data Catalog — the system that transforms how students find and organize their academic resources. Instead of scattered links on WhatsApp and random Google Drive folders, Cortex gives every student a structured, searchable registry connected to their actual university."

---

## SLIDE 2 — The Problem: Scattered Academic Resources
**Title:** Where Are Your Course Materials Right Now?

**Bullets:**
- 📱 PDF shared in WhatsApp → hard to find later, expires after a year
- 📁 Google Drive folders → no standard naming, permissions change
- 🌐 Random links bookmarked → browser crashes, links die
- 📋 University portal → often outdated, inaccessible, slow
- ❓ "Which doctor teaches Data Structures this semester?" — no easy answer

**Speaker notes:**  
"Let me ask a simple question: if I need the lecture slides for your second-year Algorithms course right now, where do you find them? Probably in a WhatsApp group that you have to scroll through. Maybe in someone's Google Drive where the permission changed last week. Maybe on a university portal that is down for maintenance. This is the reality for every Egyptian university student.

Cortex's data catalog is the answer: a structured, admin-managed registry that tells you exactly what courses exist in your university, what materials are available for each, and who teaches them."

---

## SLIDE 3 — The Catalog Structure
**Title:** University → College → Major → Year → Course → Resources

**Visual (hierarchy tree):**
```
🏛️ Menoufia University
   📚 Faculty of Computers & Information
      🎓 Computer Science
         📅 Year 1
            📖 Introduction to Programming (CS101)
               📄 Lecture 1 Slides (PDF)
               🔗 C++ Reference (Link)
               👨‍🏫 Dr. Ahmed Hassan
         📅 Year 2
            📖 Data Structures (CS201)
               📄 Lecture Notes (PDF)
               👨‍🏫 Dr. Nour Mostafa
```

**Speaker notes:**  
"The catalog mirrors the exact structure of Egyptian universities. At the top: the university itself. Inside: colleges or faculties. Inside each college: majors or specializations. Each major has year levels, and each year level has courses. Each course can have multiple resources — PDFs, links, videos, books — and assigned doctors who teach it.

This structure is not invented. It maps directly to how Egyptian university curricula are officially organized."

---

## SLIDE 4 — Profile-Aware Personalization
**Title:** Opens to YOUR Courses — Automatically

**Bullets:**
- After login, the system reads your profile: university, college, major
- Data browser automatically filters to YOUR curriculum
- URL becomes `/data?university=X&college=Y&major=Z`
- URL is shareable — send this link to a classmate and they see the same view
- Change filters manually to explore other departments

**Speaker notes:**  
"The best user experience is one where you do not have to configure anything. After login, Cortex reads your profile — the university, college, and major you selected during setup — and automatically redirects you to the data page with those filters pre-applied.

A Computer Science student at Menoufia University sees Computer Science courses instantly. They do not need to scroll through other faculties. And because the filter state lives in the URL, they can copy and share the link with classmates who will see the same filtered view immediately."

---

## SLIDE 5 — Cascading Filters
**Title:** Drill Down from University to Individual Course

**Visual (filter dropdowns in sequence):**
```
[All Universities ▼] → [Faculty of Computers ▼] → [Computer Science ▼] → [Year 2 ▼]
                                    ↓
                         [Year 2 Courses Shown]
                         • Data Structures (CS201)
                         • Discrete Mathematics (MATH201)
                         • Algorithms (CS202)
```

**Bullets:**
- Selecting a university shows only that university's colleges
- Selecting a college shows only its majors
- Selecting a major + year shows exactly those courses
- Search box filters courses by name (English or Arabic)
- Filter state lives in URL → shareable, bookmarkable

**Speaker notes:**  
"The filter system is cascading — each selection narrows the options in the next dropdown. If you select Menoufia University, the college dropdown shows only Menoufia's colleges. Select a college, and the major dropdown narrows to that college's majors. This prevents impossible combinations like selecting a major from a different university.

Each change updates the URL, so the filter state is always bookmarkable and shareable. This is URL-driven state management — the URL IS the filter state."

---

## SLIDE 6 — Course Detail Page
**Title:** Everything You Need to Know About One Course

**Visual (course detail page layout):**
```
┌─────────────────────────────────────────────────────┐
│ Data Structures (CS201)                             │
│ Year 2 | 3 Credits | Computer Science               │
│                                                     │
│ TAUGHT BY: Dr. Ahmed Hassan, Dr. Sara Kamal         │
│                                                     │
│ RESOURCES:                                          │
│ 📄 Lecture 1 — Intro to DSA         [Download PDF] │
│ 📄 Lecture 2 — Arrays & Stacks      [Download PDF] │
│ 🔗 Competitive Programming Platform  [Open Link]    │
│ 🎥 Chapter 1 Video Explanation       [Watch]        │
└─────────────────────────────────────────────────────┘
```

**Speaker notes:**  
"The course detail page is the richest view in the catalog. It shows everything about one course: the name in both Arabic and English, the year level, credits, description, which doctors teach it, and all associated resources with direct download links or external links.

Resources can be PDFs stored on our file CDN, external links to websites or YouTube, or any other type of academic content. Admins categorize them by type — lecture, lab, book, reference — so students can filter by what they need."

---

## SLIDE 7 — Bilingual Catalog
**Title:** Every Course Has an Arabic Name and an English Name

**Bullets:**
- All entities: `name_en` (English) + `name_ar` (Arabic)
- UI language switch instantly changes displayed names
- Search works in both languages simultaneously
- RTL layout when Arabic is active
- University official Arabic names accurately stored

**Speaker notes:**  
"Egypt's universities have official names in both Arabic and English. Our data model stores both for every entity — university, college, major, and course. When a student switches the interface language to Arabic, the course names switch to their Arabic equivalents. The search also works in both languages simultaneously — you can type in Arabic script or English letters and find the right course."

---

## SLIDE 8 — Admin: Populating the Catalog
**Title:** How Data Gets Into the Catalog

**Bullets:**
- Only admins can add/edit/delete catalog entries
- Admin panel → Data Manager: full CRUD for all entities
- Create university → create college inside it → create major → add courses
- Assign doctors to courses
- Upload resource files (PDFs up to 32MB) or add external links
- Regular students can only read, never write

**Speaker notes:**  
"The catalog is admin-managed. This is a deliberate choice — open editing would quickly produce inconsistent or incorrect data. Designated admins (typically department representatives or professors) manage the catalog through the admin panel's Data Manager.

The Data Manager provides a full CRUD interface: create universities, add colleges to them, add majors to colleges, add courses to majors with their year and credits, assign which doctors teach each course, and upload resources for each course. This structured process ensures the catalog remains accurate and organized."

---

## SLIDE 9 — Technical Highlight: URL-Driven State
**Title:** Engineering Choice: URL as Source of Truth for Filters

**Bullets:**
- Filter state lives in URL params, not React useState
- `?university=X&college=Y&major=Z` encodes the full filter state
- Next.js Server Component reads URL params — renders on server
- No client-side JavaScript needed for the initial filtered view
- Page is SEO-friendly (search engines can index filtered views)
- Browser back/forward navigation works correctly

**Speaker notes:**  
"One technical decision worth noting: the filter state lives in the URL, not in React's useState. This is unusual but powerful. When you change a filter, the URL updates, Next.js re-renders the page on the server with the new filters applied, and sends pre-filtered HTML to the browser. No client-side filtering JavaScript is needed for the initial render.

The benefit: the page loads fast because content is rendered on the server. The filter state is persistent — refresh the page and filters are preserved. The URL is shareable. And search engines can index specific filtered views, like 'Menoufia University Computer Science courses.'"

---

## SLIDE 10 — Demo Script
**Steps:**
1. Login → observe auto-redirect to pre-filtered data page
2. Show the URL: `?university=...&college=...&major=...`
3. Change the year filter → watch courses update
4. Click a course → show course detail with resources and doctor
5. Download a PDF resource
6. Login as admin → show admin data manager
7. Show creating a course (or adding a resource to existing course)
8. Show the Arabic name appearing when switching language

---

## SLIDE 11 — Q&A Preparation

**Q: Who is responsible for keeping the catalog up to date?**  
A: Designated admins — which could be faculty staff, department heads, or trusted student representatives. The system provides the tools; the institution is responsible for the content. We plan to add an "Update Request" feature where students can flag outdated resources.

**Q: Can students upload their own resources?**  
A: Currently, only admins can add resources to the catalog. This ensures quality control. However, students can publish their personal notes as public notes, which serves as a student-generated resource layer.

**Q: What file types can be uploaded?**  
A: The UploadThing integration currently supports PDFs (up to 32MB) and images (up to 8MB). Other types (video, audio) can be added as external links. Large video files are handled by linking to YouTube or other video platforms.

**Q: Can the catalog handle multiple universities?**  
A: Yes. The hierarchical structure supports any number of universities with their independent college/major/course trees. The current deployment includes Menoufia University data. Adding another university requires only adding a new entry in the universities table.

**Q: Is the catalog available without logging in?**  
A: No. The catalog requires authentication because it is tied to the student's profile for personalization. Public access to catalog data is a planned future feature.
