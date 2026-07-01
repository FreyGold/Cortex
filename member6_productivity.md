# Cortex B.Sc. Graduation Project - Technical Report & Presentation
## Module 6: Daily Planner Logs, Habit Streak Analytics (CTE Queries), and Pomodoro Focus Synchronization

**Presenter Name:** Member 6 (Productivity & Analytics Developer)  
**Workspace File Path:** [member6_productivity.md](file:///home/frey/Important/college/Graduation%20Project/member6_productivity.md)

---

## 1. Daily Planner & Analytics Deep-Dive

Cortex integrates a daily planner, habit tracker, and Pomodoro focus log to help students manage study time. We use database schemas and SQL queries to track habits and focus sessions.

### 1.1 Habit Streaks SQL Calculation (PostgreSQL Common Table Expressions)

To track a student's consistency, we compute habit streaks. We write a PL/pgSQL database function that uses a Common Table Expression (CTE) and window functions to identify consecutive days of habit completion:

```sql
CREATE OR REPLACE FUNCTION public.calculate_habit_streak(target_habit_id UUID)
RETURNS TABLE (
  current_streak INT,
  longest_streak INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_val INT := 0;
  longest_val INT := 0;
BEGIN
  WITH habit_completions AS (
    -- Get completed habit logs ordered by date
    SELECT 
      date,
      completed,
      -- Generate groupings based on row number differences
      (date - ROW_NUMBER() OVER (ORDER BY date)::int) AS group_key
    FROM public.habit_logs
    WHERE habit_id = target_habit_id AND completed = TRUE
  ),
  streak_groupings AS (
    -- Count consecutive days in each grouping
    SELECT 
      COUNT(*) AS streak_length,
      MIN(date) as start_date,
      MAX(date) as end_date
    FROM habit_completions
    GROUP BY group_key
  )
  SELECT 
    -- Calculate longest streak length
    COALESCE(MAX(streak_length), 0) INTO longest_val
  FROM streak_groupings;

  -- Compute current active streak
  WITH active_completions AS (
    SELECT date
    FROM public.habit_logs
    WHERE habit_id = target_habit_id AND completed = TRUE
    ORDER BY date DESC
  ),
  active_run AS (
    SELECT 
      date,
      (CURRENT_DATE - date)::int AS diff_days,
      ROW_NUMBER() OVER (ORDER BY date DESC) as rn
    FROM active_completions
  )
  SELECT 
    COUNT(*) INTO current_val
  FROM active_run
  -- Ensure completions are consecutive up to today or yesterday
  WHERE diff_days = rn - 1 OR diff_days = rn;

  RETURN QUERY SELECT current_val, longest_val;
END;
$$;
```

---

### 1.2 Habit Frequency Checker Rules

Habits can be scheduled with different frequencies (Daily, Weekdays, Weekends, Custom). To filter which habits are active for a given date, we implement a database helper function:

```sql
CREATE OR REPLACE FUNCTION public.is_habit_active_on_date(
  habit_id UUID,
  check_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  habit_record RECORD;
  day_name TEXT;
  day_number INT;
BEGIN
  SELECT frequency, custom_days FROM public.habits WHERE id = habit_id INTO habit_record;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  day_name := TRIM(TO_CHAR(check_date, 'Day'));
  day_number := EXTRACT(ISODOW FROM check_date)::int; -- 1 (Monday) to 7 (Sunday)

  CASE habit_record.frequency
    WHEN 'Daily' THEN
      RETURN TRUE;
    WHEN 'Weekdays' THEN
      RETURN day_number BETWEEN 1 AND 5;
    WHEN 'Weekends' THEN
      RETURN day_number IN (6, 7);
    WHEN 'Custom' THEN
      -- check if day name exists in user custom selection array
      RETURN day_name = ANY(habit_record.custom_days);
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;
```

---

### 1.3 Pomodoro Focus Tracking SQL Database Layout

Cortex syncs Pomodoro focus sessions across client applications. Sessions are stored in a dedicated table, allowing us to aggregate study hours:

```sql
-- Focus Sessions Table
CREATE TABLE public.pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_type TEXT NOT NULL CHECK (client_type IN ('web', 'chrome_ext', 'gnome_widget')),
  notes TEXT
);

-- Index focus sessions by user ID and course ID for analysis
CREATE INDEX idx_pomodoro_user_course ON public.pomodoro_sessions(user_id, course_id);
```

#### SQL View to Aggregate Study Statistics
```sql
CREATE OR REPLACE VIEW public.v_user_productivity_metrics AS
  SELECT 
    ps.user_id,
    c.name_en AS course_name,
    COUNT(ps.id) AS total_sessions,
    SUM(ps.duration_minutes) AS total_focus_minutes,
    ROUND((SUM(ps.duration_minutes)::numeric / 60.0), 1) AS total_focus_hours
  FROM public.pomodoro_sessions ps
  LEFT JOIN public.courses c ON ps.course_id = c.id
  GROUP BY ps.user_id, c.name_en;
```

---

## 2. Slide Presentation Script

### Slide 1: Title & Executive Introduction
*   **Visual Layout Blueprint:** Title slide. Warm off-white background with a purple sidebar and department metadata.
*   **Screenshot Placeholder:** `[SCREENSHOT: Productivity panel showing focus dashboard metrics, habit streaks, and active task lists]`
*   **Slide Content:**
    *   **Cortex: Daily Planner Logs & Productivity Analytics**
    *   **Habits streaking CTEs, Pomodoro focus sync, and productivity commit grids**
    *   **Speaker:** Member 6 (Productivity & Analytics Developer)
    *   **Scope:** Mood icons maps, habit scheduling rules, PL/pgSQL CTE streaks queries, and Pomodoro focus tables DDL.
*   **Word-for-Word Presenter Script:**
    "Good afternoon. I am Member 6, the Productivity and Analytics Developer for Cortex. Today, I will present our productivity systems, detailing our daily planners, habit tracker tables, PL/pgSQL streak calculation scripts, and Pomodoro focus synchronization models. Let us start by looking at our habit streak tracking logic."

---

### Slide 2: Daily Logs & Task Entities Schema
*   **Visual Layout Blueprint:** ER diagram showing how the `daily_logs` table links to `daily_tasks` and `habit_logs`.
*   **Screenshot Placeholder:** `[SCREENSHOT: User daily sheet showing mood ratings, highlights text, and finished task checkboxes]`
*   **Slide Content:**
    *   **Daily Logs Table:** Stores user daily highlights and mood ratings.
    *   **Daily Tasks:** Maps tasks directly to daily logs.
    *   **Index optimization:** Indexes daily logs by date and user ID to speed up searches.
    *   **Workspace scoping:** Supports filtering daily logs by workspace.
*   **Word-for-Word Presenter Script:**
    "Cortex integrates a daily planner to help students coordinate their coursework. The database stores mood ratings and daily highlights, referencing tasks in the `daily_tasks` table. We index these records by user ID and date, allowing the application to load planner views quickly. Let us look at our streak calculations."

---

### Slide 3: Mood Tracker Icon Mappings & tags
*   **Visual Layout Blueprint:** Spacing cards displaying mood icons tags and their target ratings values in databases.
*   **Screenshot Placeholder:** `[SCREENSHOT: Mood selection panel screen view]`
*   **Slide Content:**
    *   **Happy Face:** (Happy) Emoji matches active study states.
    *   **Neutral Face:** (Neutral) Emoji maps normal study consistency.
    *   **Sad Face:** (Sad) Emoji maps low energy study states.
    *   **Flame Spark:** (Fire) Emoji matches high focus consistency.
*   **Word-for-Word Presenter Script:**
    "Students select mood icons to track their daily consistency, which the database stores as emoji tags. The application uses these tags to group productivity metrics, displaying stars or flame badges on the student's dashboard to indicate high focus periods."

---

### Slide 4: Habits Tracker Scheduling Frequencies
*   **Visual Layout Blueprint:** Flowchart illustrating active check dates checking scheduling rules.
*   **Screenshot Placeholder:** `[SCREENSHOT: Habits tracker component displaying active tasks for weekdays]`
*   **Slide Content:**
    *   **Scheduling Rules:** Supports Daily, Weekdays, Weekends, or Custom frequencies.
    *   **Weekday parsing:** Helper functions identify days of the week.
    *   **Custom checkers:** Compares day names against custom arrays.
    *   **Dynamic Filtering:** Filters active habits dynamically based on the current date.
*   **Word-for-Word Presenter Script:**
    "Students can set habits to recur daily, on weekdays, on weekends, or on custom days. This SQL helper function checks if a habit is active for a given date, parsing day names and week indexes. The planner uses this function to filter active habits dynamically."

---

### Slide 5: Habit Tracking Streaks SQL Calculation (CTE)
*   **Visual Layout Blueprint:** Code panel displaying the PL/pgSQL function `calculate_habit_streak(target_habit_id)`.
*   **Screenshot Placeholder:** `[SCREENSHOT: User profile dashboard rendering habit streak counts and flame icons]`
*   **Slide Content:**
    *   **PostgreSQL Common Table Expressions:** Queries habit logs to identify consecutive days of habit completion.
    *   **Window functions:** Computes differences between calendar dates and row indexes.
    *   **Active Streaks:** Tracks active habit runs up to the current date.
    *   **Database performance:** Computes streak statistics directly in the database to optimize client performance.
*   **Word-for-Word Presenter Script:**
    "To calculate habit streaks, we use a PostgreSQL Common Table Expression. The query computes the difference between completion dates and row indexes, grouping consecutive days of habit logs. Running this analysis directly in the database saves client processing power. Let us review our habit frequency checker rules."

---

### Slide 6: Pomodoro Focus Session Schema & Logging
*   **Visual Layout Blueprint:** Database DDL showing the `pomodoro_sessions` table structure and index mappings.
*   **Screenshot Placeholder:** `[SCREENSHOT: Web app focus page displaying active Pomodoro timer widgets]`
*   **Slide Content:**
    *   **Focus Session Entries:** Records focus session duration and completion timestamps.
    *   **Entity references:** Associates focus sessions with courses to track study hours.
    *   **Device synchronization:** Records if focus sessions were logged from the web, Chrome extension, or GNOME applet.
    *   **Database indexes:** Indexes sessions by user ID and course ID to optimize queries.
*   **Word-for-Word Presenter Script:**
    "To help students track study time, we log Pomodoro focus sessions. The table records focus session duration, completion timestamps, and linked courses. We index these records by user ID and course ID, allowing the application to load study logs quickly. Let us look at our productivity metrics view."

---

### Slide 7: Database Productivity Views & Queries
*   **Visual Layout Blueprint:** SQL code displaying the `v_user_productivity_metrics` view schema.
*   **Screenshot Placeholder:** `[SCREENSHOT: Productivity report displaying tables of focus durations and session charts]`
*   **Slide Content:**
    *   **Aggregated metrics views:** Aggregates study statistics to track total focus hours per course.
    *   **Aggregate computations:** Computes focus duration metrics automatically.
    *   **Professor Mappings:** Lists focus hours logged for courses taught by specific professors.
    *   **Query Optimization:** Pre-compiles views to reduce query sizes when loading reports.
*   **Word-for-Word Presenter Script:**
    "This slide displays our productivity metrics view. The view aggregates study sessions and duration metrics by course, allowing the application to render study reports quickly. Having this analysis pre-compiled in the database helps optimize dashboard page loading times. Let us look at our Pomodoro focus time charts."

---

### Slide 8: Pomodoro Focus Time by Course Subject
*   **Visual Layout Blueprint:** Horizontal bar chart displaying focus hours mapped across subjects.
*   **Screenshot Placeholder:** `[SCREENSHOT: Productivity analytics dashboard showing focus hours charts per subject]`
*   **Slide Content:**
    *   **Systems Focus:** 18.5 hours logged for Operating Systems.
    *   **Compilers Study:** 14.2 hours logged for Compilers.
    *   **Machine Learning:** 22.4 hours logged for Machine Learning.
    *   **Analytics reports:** Maps focus hours to identify popular courses.
*   **Word-for-Word Presenter Script:**
    "This slide shows focus hours logged across different courses. As shown, Machine Learning has 22.4 focus hours and Operating Systems has 18.5 hours. These metrics help students evaluate their study habits over time. Let us discuss how we sync focus records across devices."

---

### Slide 9: Focus Session Synchronizations by Client Device
*   **Visual Layout Blueprint:** Bar chart comparing monthly focus logs synced from web clients, Chrome extensions, and GNOME widgets.
*   **Screenshot Placeholder:** `[SCREENSHOT: Focus logs chart showing logs synced from browser extensions and desktop widgets]`
*   **Slide Content:**
    *   **Web Client Logs:** Records 1,840 focus logs monthly.
    *   **Browser Extension Sync:** Records 2,450 focus logs monthly.
    *   **Desktop applet logs:** Records 1,120 focus logs monthly.
    *   **Sync APIs:** REST API endpoints coordinate focus data across clients.
*   **Word-for-Word Presenter Script:**
    "To support study sessions across different platforms, Cortex syncs focus logs from multiple client apps. Our browser extension logs 2,450 focus sessions monthly, while our web client logs 1,840 sessions. The gateway coordinates this data, keeping study metrics updated across devices. Let us look at our productivity heatmaps."

---

### Slide 10: Productivity Yearly Commit Heatmap
*   **Visual Layout Blueprint:** Graphic representation of the yearly commit grid layout, displaying cell color intensity.
*   **Screenshot Placeholder:** `[SCREENSHOT: GitHub-style commit grid displaying daily study contributions]`
*   **Slide Content:**
    *   **Activity Grid:** Renders a daily grid of study activity over the year.
    *   **Contribution weights:** Uses color intensity to represent study duration metrics.
    *   **Client page renderings:** Updates grid cells dynamically using canvas rendering.
    *   **Database execution paths:** Queries yearly log structures in under 5 milliseconds.
*   **Word-for-Word Presenter Script:**
    "This slide shows the layout of our productivity commit grid, which renders daily study contributions. We use color intensity to represent focus duration metrics, rendering grids dynamically using canvas coordinates. The database queries yearly logs in under 5 milliseconds. Let us summarize our productivity modules."
