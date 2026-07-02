# Section 2 — Presentation Script
# Authentication, Session Management & User Profiles
**Estimated time:** 10–12 minutes

---

## SLIDE 1 — Title
**Title:** Authentication & User Management in Cortex  
**Subtitle:** Secure, transparent, and profile-aware identity management

**Speaker notes:**  
"In this section I will explain how Cortex verifies who you are, keeps you securely logged in, and personalizes your experience based on your university profile. Authentication is the entry point to everything — no feature works without it — so getting it right is critical."

---

## SLIDE 2 — Why Authentication Matters in Academic Platforms
**Title:** The Stakes of Getting Auth Wrong

**Bullets:**
- Students' personal notes must ONLY be visible to them
- Shared notes need fine-grained permission control (viewer vs editor)
- Admin operations (managing courses) must be strictly role-limited
- Sessions must persist across browser closes and device restarts
- A broken token or session leak = data breach

**Speaker notes:**  
"Authentication in a generic app means 'you are logged in.' In an academic platform that stores personal study notes, habits, daily journals, and university records, authentication means 'only you can see your data.' Every single API call, every database query, every page render is gated behind verified identity. A failure here is not a UX problem — it is a privacy breach."

---

## SLIDE 3 — Two-Layer Security Architecture
**Title:** Not One Layer — Three Layers of Protection

**Visual:**
```
Layer 1: Supabase Auth ─── JWT issuance + cookie storage
Layer 2: Express Middleware ─── Server-side JWT verification (every request)
Layer 3: Row-Level Security ─── Database rejects queries violating ownership
```

**Speaker notes:**  
"Cortex does not rely on a single security mechanism. We have three independent layers. Supabase handles the actual authentication and issues JWTs. Our Express middleware verifies every single incoming JWT by making a server-to-server call to Supabase — not just checking the signature locally, but confirming the token is still valid on Supabase's servers. And even if both of those were somehow bypassed, Supabase's Row-Level Security policies reject database queries that violate data ownership rules. A hacker would need to defeat all three layers simultaneously."

---

## SLIDE 4 — The Login Journey
**Title:** What Happens When You Click 'Sign In'

**Numbered steps:**
1. You enter email and password, click Sign In
2. Frontend sends credentials to Express backend (`POST /api/auth/login`)
3. Express calls Supabase's `signInWithPassword()`
4. Supabase verifies credentials and returns `{access_token, refresh_token}`
5. Backend returns tokens to frontend
6. Frontend stores tokens in **httpOnly cookies** (invisible to JavaScript)
7. Every future request automatically includes the token in the `Authorization` header
8. Backend middleware verifies the token on every single call

**Speaker notes:**  
"The key security detail is step 6 — storing tokens in httpOnly cookies. These cookies are invisible to JavaScript running in the browser. This means that even if a malicious script is somehow injected into the page (an XSS attack), it cannot steal your authentication token. The browser sends the cookie automatically, but no JavaScript can read it."

---

## SLIDE 5 — Automatic Session Refresh
**Title:** You Never Get Logged Out — Here's Why

**Bullets:**
- Access tokens expire after **1 hour**
- Refresh tokens are valid for **60 days**
- Next.js **middleware** runs before EVERY page load
- Middleware calls `supabase.auth.getUser()` which auto-refreshes expired tokens
- Users never see a login prompt unless they explicitly log out or 60 days pass

**Speaker notes:**  
"One of the most frustrating things about poorly-built authentication is getting logged out mid-session. Cortex solves this with Next.js middleware that intercepts every single page request. Before the page renders, the middleware checks if the access token is expired. If it is, it silently uses the refresh token to get a new one and updates the cookie. The user never knows this happened. They just keep working."

---

## SLIDE 6 — Your Profile — More Than a Name
**Title:** The Profile System — Personalizing Cortex to YOU

**Bullets:**
- Every user has a profile linked to their auth account
- Profile stores: name, role (user/admin), university, college, major, year level
- Profile is created **automatically** when you register (database trigger)
- After first login → setup flow: pick your university → college → major
- After setup → app auto-redirects to YOUR course catalog

**Speaker notes:**  
"The profile is what makes Cortex feel personal. When you register, a database trigger automatically creates your profile — you do not need to do anything. After your first login, we ask you three questions: which university, which college, which major. This takes about 30 seconds. After that, every time you open the Data Browser, it is already filtered to your exact curriculum. Your Menoufia University Computer Science courses are front and center, not buried under hundreds of other departments."

---

## SLIDE 7 — Role-Based Access Control
**Title:** User vs Admin — What Each Role Can Do

**Table:**
| Feature | Student | Admin |
|---------|---------|-------|
| Create/edit own notes | ✅ | ✅ |
| Share notes | ✅ | ✅ |
| Browse course catalog | ✅ | ✅ |
| Add courses/resources | ❌ | ✅ |
| Manage all users | ❌ | ✅ |
| Change user roles | ❌ | ✅ |
| View admin dashboard | ❌ | ✅ |

**Speaker notes:**  
"The role system in Cortex is simple: user or admin. Admins are typically university staff or designated student representatives. They can manage the course catalog — adding courses, uploading resources, assigning doctors to courses. They can also manage users — viewing all accounts and changing roles if needed. The role is stored in the profiles table and is checked on BOTH the frontend (to show/hide UI elements) and the backend (to reject unauthorized API calls)."

---

## SLIDE 8 — The Verified Profile Pattern
**Title:** Why We Verify Profile on the Backend, Not Just in Cookies

**Bullets:**
- `supabase.auth.getSession()` reads from cookie — NOT verified with server
- A tampered cookie could contain a fake user ID
- `getServerSession()` in Cortex calls the **Express backend**
- Express calls `supabase.auth.getUser(token)` — cryptographic server verification
- Only then is the profile trusted for data access decisions

**Speaker notes:**  
"This is a subtle but important security detail. Supabase provides two ways to get the current user. `getSession()` reads the session from the local cookie — fast, but not cryptographically verified. It trusts what's in the cookie. `getUser()` is different — it makes a call to Supabase's servers to verify the JWT signature AND check that the token has not been revoked. In Cortex, every server-side session check uses `getUser()`, never just `getSession()`. This means even a carefully crafted fake cookie would be rejected."

---

## SLIDE 9 — Demo Points
**Title:** What to Show in the Demo

**Demo script:**
1. Open the login page — show the clean, bilingual form
2. Enter credentials → observe the redirect to `/data?university=...&college=...&major=...`
3. Show how the data page is pre-filtered (profile-aware personalization)
4. Open DevTools → Application → Cookies → show the httpOnly token (not readable by JS)
5. Navigate to `/admin` as a regular user → show the redirect to home (access denied)
6. Log in as admin → show the admin panel is accessible
7. Show the profile setup page (or describe it)

---

## SLIDE 10 — Q&A Preparation

**Q: What happens if someone steals the cookie?**  
A: The token would work for up to 1 hour (the access token lifetime). If suspicious activity is detected, an admin can revoke the user's sessions from the Supabase dashboard. We also plan to add device session management as a future feature.

**Q: Why not use OAuth (Google/Facebook login)?**  
A: We considered it, but OAuth would require students to have a specific Google or Facebook account linked to their university email. Email/password is the most universal option. OAuth can be added as a future enhancement — Supabase supports it out of the box.

**Q: How are passwords stored?**  
A: Cortex never stores passwords. Supabase's Auth system handles credential storage using industry-standard bcrypt hashing. We never see or touch the actual password.

**Q: Can an admin see my notes?**  
A: No. Admin role allows managing the course catalog and user accounts, but notes are protected by Row-Level Security at the database level. Even an admin calling the notes API would only receive their own notes — the database enforces this, not the application code.

**Q: What if both the access token and refresh token expire?**  
A: The user is logged out and must log in again. This happens after 60 days of complete inactivity.
