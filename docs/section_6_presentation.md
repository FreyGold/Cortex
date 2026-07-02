# Section 6 — Presentation Script
# Daily Planning System, Habit Tracking & Social Pomodoro
**Estimated time:** 12–14 minutes

---

## SLIDE 1 — Title
**Title:** Daily Planning, Habits & Social Pomodoro  
**Subtitle:** A complete academic productivity system with social accountability

**Speaker notes:**  
"I will present the Daily Planning System — Cortex's answer to the productivity challenge every university student faces. It is not just a to-do list. It combines journaling, habit building, focused study timers, and social competition into one integrated system."

---

## SLIDE 2 — The Student Productivity Problem
**Title:** Why Students Struggle with Productivity

**Bullets:**
- 📋 To-do apps are disconnected from study notes
- 🔔 Phone notifications destroy focus during study sessions
- 📊 No visibility into how much you actually studied this week
- 🤷 Easy to skip habits when no one is watching
- 📅 No structured way to reflect on each study day
- 🎯 Goals and tasks are never connected to outcomes

**Speaker notes:**  
"The productivity problem for students is well-known. You make a study plan, you open YouTube 'for one video', and suddenly it is midnight. You plan to review your notes every day — habit dies after day 3. You think you studied for 4 hours when in reality it was 1 hour and 45 minutes of actual focus.

The Cortex Daily Planning system addresses all of these. It is four tools in one."

---

## SLIDE 3 — The Four Layers
**Title:** Four Layers of Academic Productivity

**Visual (stacked):**
```
🗓️ DAILY JOURNAL     — Reflect, plan, write, task-track each day
🎯 HABIT TRACKER     — Build streaks, stay consistent
🍅 POMODORO TIMER    — Focus with science-backed time blocks
👥 SOCIAL LAYER      — Compete with friends, study in groups
```

**Speaker notes:**  
"Let me walk through each layer. The Daily Journal is your per-day workspace: what you studied, what tasks you completed, what your highlight was. The Habit Tracker builds long-term consistency through streaks. The Pomodoro Timer makes you actually do focused work in 25-minute blocks. And the Social Layer makes all of this visible to your friends — accountability through competition."

---

## SLIDE 4 — Daily Journal: More Than a To-Do List
**Title:** Your Daily Academic Journal

**Visual (daily log UI sketch):**
```
📅 Tuesday, July 2, 2026
────────────────────────────────────────
✨ Today's Highlight:
[Finished the OS scheduling chapter and understood Round Robin!]

📝 Notes:
[Full Plate.js rich-text editor here — headings, lists, code]

✅ Tasks:
[✓] Review Chapter 3 of Operating Systems
[✓] Solve 3 algorithm problems
[ ] Read AI lecture notes
[ ] Prepare data structures summary
```

**Bullets:**
- One page per day, created on-demand
- Rich text note area (same Plate.js editor as Notes)
- Highlight field: "what was your best achievement today?"
- Task list with checkboxes (optimistic toggle — instant response)
- Everything auto-saves continuously

**Speaker notes:**  
"The daily log is a focused single-day workspace. You open it for today, write a note about what you are studying — using the same powerful rich text editor as the notes system, with headings, code blocks, everything — then add tasks to your list, and write your day's highlight.

The highlight concept is from productivity research: ending each study day by identifying your best accomplishment creates a sense of progress and motivates the next day. It might be 'understood CPU scheduling' or 'solved 5 exam problems.'

Tasks are stored as a JSON array in the database — each with a text, completion state, and ID. Checking a task uses optimistic updates — the checkbox responds immediately, and the server is updated in the background. No loading spinner."

---

## SLIDE 5 — Habit Tracker: Build Academic Routines
**Title:** Habits With Streaks — The Psychology of Consistency

**Visual (habit list):**
```
📖 Read 30 pages          🔥 14-day streak    ✅ Done today
🧮 Solve 3 problems       🔥 7-day streak     ✅ Done today
📝 Review flashcards      🔥 0 (broken)       ○  Not done today
🏃 Morning exercise       🔥 21-day streak    ✅ Done today
```

**Bullets:**
- Create habits with name, color, icon, and frequency
- **Daily:** applies every day (Read 30 pages)
- **Weekly:** specific days of the week (Gym on Mon/Wed/Fri)
- **Monthly:** specific dates (Submit assignments on 1st and 15th)
- Streak count: consecutive days completing the habit
- Visual motivation: breaking a 21-day streak hurts!

**Speaker notes:**  
"The habit tracker is built on a powerful insight from behavioral psychology: streaks create commitment. Once you have a 21-day streak of reviewing flashcards, you will not want to break it. The fear of losing the streak is more motivating than the original goal.

Cortex supports three frequency patterns. Daily habits apply every day. Weekly habits apply on specific days of the week — for example, going to the library on Tuesdays and Thursdays. Monthly habits apply on specific dates — submitting assignments on the 1st and 15th.

The streak calculation is precise: it counts consecutive applicable days where the habit was completed. If a habit only applies on weekdays and you completed it every weekday for 3 weeks, your streak is 15, not 21."

---

## SLIDE 6 — Pomodoro Timer: The Science of Focus
**Title:** Why 25 Minutes Changes Everything

**Visual (timer UI):**
```
     🍅 FOCUS SESSION
        25:00
    ████████████████████ 100%

    Subject: Operating Systems

    [Pause]    [Stop Early]

    ─────────────────────────────
    Today's sessions:
    🍅🍅🍅🍅  (4 focus × 25 min = 100 min)
    Next: ☕ Short Break (5 min)
```

**Bullets:**
- Classic Pomodoro: 25 min focus → 5 min break × 4 → 15 min long break
- Name your subject for each session
- Completed sessions logged to database automatically
- All sessions feed into the weekly leaderboard
- Chrome Extension runs the timer even with browser tab closed

**Speaker notes:**  
"The Pomodoro Technique was developed by Francesco Cirillo in the late 1980s. The core principle: break work into 25-minute intervals of deep focus, separated by short breaks. After 4 intervals, take a longer break. This rhythm matches human attention patterns — we can maintain deep focus for 25 minutes, but not much longer without a break.

In Cortex, every completed Pomodoro session is logged to the database with the start time, end time, duration, session type, and what you were studying. This history becomes the data for the leaderboard — and it gives you a real answer to 'how many hours did I study this week?'"

---

## SLIDE 7 — Social Accountability: The Leaderboard
**Title:** Study Competition — Friendly Accountability

**Visual (leaderboard):**
```
📊 WEEKLY LEADERBOARD — This Week's Focus Minutes

🥇  Ahmed Tawfik       ████████████ 240 min   ← You
🥈  Sara Kamal         ██████████   210 min
🥉  Omar Hassan        ███████      175 min
4th  Nour Ali          █████        140 min
5th  Amr Mostafa       ██           60 min
```

**Bullets:**
- Weekly leaderboard: friends ranked by total focus minutes
- Resets every Monday — new competition each week
- Friends add each other by username
- Study groups: shared Pomodoro sessions, group tracking
- Social pressure: if you see your friend studying 240 minutes, you are motivated

**Speaker notes:**  
"The leaderboard is simple but powerful. Every week, your friends are ranked by total focus minutes from completed Pomodoro sessions. You see your rank, your friends' minutes, and the gap. This creates healthy academic competition.

The key insight from behavioral research is that social visibility dramatically increases follow-through. Knowing that your friend can see how many minutes you studied this week makes you less likely to skip a session. It is the same psychology behind public gym records and fitness apps — social accountability works.

Study groups take this further: groups can start shared Pomodoro sessions where all members focus together, virtually, tracked in real-time."

---

## SLIDE 8 — Chrome Extension Integration
**Title:** The Browser Extension — Study Even When Cortex Tab is Closed

**Visual (extension popup):**
```
[Timer tab] [Blocker tab] [Social tab] [History tab] [Settings]

     🍅 OS Algorithms — 22:15 remaining
     [Pause]   [Stop]

     🚫 Blocked during focus:
        youtube.com
        twitter.com
        facebook.com
```

**Bullets:**
- Chrome Extension installs from the browser
- Timer runs in a background service worker (closes with tab, not with window)
- During focus: blocks distracting websites at the browser level
- Completed sessions automatically sync to Cortex backend
- Show friends' focus status in the social tab

**Speaker notes:**  
"The Chrome Extension is Cortex's reach into your browser. The timer runs in a background service worker — even if you close the Cortex tab, the timer keeps running. When a focus session is active, the extension adds blocking rules that prevent the browser from loading YouTube, Twitter, Instagram, or any other site you designate as distracting. This is enforced at the network request level — not just hiding the page, but actually blocking the HTTP request.

Completed sessions are automatically synced to the Cortex backend, so your leaderboard rankings update even when you used the extension instead of the web app. The social tab shows which of your friends are currently in a focus session — great motivation to start your own."

---

## SLIDE 9 — AI in Daily Logs
**Title:** Your Daily Logs Are Searchable by Meaning

**Bullets:**
- Every time you save a daily log, the backend generates an AI embedding
- Embedding = 768-number representation of the day's meaning
- Stored alongside the log in the database (pgvector)
- Library Assistant can now search across your daily logs too
- Ask: "What was I studying in the first week of June?" → Semantic search finds it

**Speaker notes:**  
"Every daily log is also processed by the AI embedding system. After you save any content — your highlight, your note, or your task list — the backend automatically generates a 768-dimensional vector that represents the semantic meaning of that day's content.

This means the Library Assistant can search across your daily logs too. If you ask 'when did I study CPU scheduling?', the system can find the log from that day even if you wrote 'process time-sharing' instead of 'CPU scheduling.' This is the power of semantic search — it finds meaning, not just keywords."

---

## SLIDE 10 — Demo Script
**Steps:**
1. Open the Daily page — show the calendar with indicators on logged days
2. Click today (or a date with a log) — show the log view
3. Add a task: type text → click "+" → task appears
4. Check a task: click checkbox → instant visual response
5. Add a highlight in the highlight field
6. Switch to Pomodoro tab — show the timer interface
7. Start a 25-minute session → show the countdown
8. Switch to Leaderboard tab — show friends ranked
9. Switch to Habits view — show habits with streaks
10. Open habits modal — show frequency options

---

## SLIDE 11 — Q&A Preparation

**Q: What happens to the Pomodoro if the internet disconnects mid-session?**  
A: The timer continues locally (in the browser or Chrome extension). When the connection is restored, the session is recorded. If the browser is closed, the session is lost. The Chrome extension handles this more robustly via its service worker.

**Q: How is the leaderboard calculated — is it real-time?**  
A: The leaderboard is calculated on-demand when you open the leaderboard tab. The PostgreSQL function aggregates this week's completed focus sessions for all friends. It is not streaming real-time but refreshes when the page loads or when you trigger a refresh.

**Q: Can I have private habits that friends cannot see?**  
A: Yes. Habits are private to each user. The leaderboard only shows total Pomodoro focus minutes — not habits, note content, or daily log text.

**Q: Why store tasks as JSONB instead of a separate table?**  
A: Tasks within a daily log are tightly coupled to that log — they do not exist independently. Storing them as a JSONB array allows atomic updates (the entire task list is read and written together), avoids JOIN queries for a common operation, and makes the data model simpler. A separate tasks table would be more appropriate only if tasks needed to be shared, assigned, or referenced from other entities.

**Q: What is the maximum number of Pomodoro sessions per day?**  
A: There is no technical limit. Practically, 16 focus sessions (400 minutes = 6.7 hours) would be an extreme study day. The system records all of them accurately.
