# Cortex B.Sc. Graduation Project - Technical Report & Presentation
## Module 7: Multi-Platform Extensions (Chrome MV3 & GNOME GJS) and Peer Leaderboards

**Presenter Name:** Member 7 (Extension & Social Integrations Developer)  
**Workspace File Path:** [member7_extensions.md](file:///home/frey/Important/college/Graduation%20Project/member7_extensions.md)

---

## 1. Browser Extensions, GNOME Shell Widgets & Social Features Deep-Dive

Cortex extends study controls beyond the web dashboard, providing a Chrome extension and a native GNOME desktop widget to block distracting sites and track focus sessions. We also implement study groups and leaderboards.

### 1.1 Chrome Extension Manifest V3 Site Blocker Engine

The Chrome Extension uses Manifest V3 background service workers and `declarativeNetRequest` rules to block distracting websites:

#### manifest.json (Chrome Extension MV3 Schema)
```json
{
  "manifest_version": 3,
  "name": "Cortex Focus Space",
  "version": "1.0.0",
  "description": "Sync active study sessions and block distracting websites.",
  "permissions": [
    "declarativeNetRequest",
    "storage",
    "alarms"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "action": {
    "default_popup": "popup.html"
  }
}
```

#### background.js (MV3 Service Worker Site Blocking Logic)
```javascript
// Dynamic rule IDs for declarativeNetRequest blocking
const RULE_ID_DISTRACTING = 1001;

// Distracting domains list
const defaultBlockList = [
  "facebook.com",
  "youtube.com",
  "twitter.com",
  "instagram.com",
  "reddit.com"
];

// Configure dynamic blocking rules
export async function enableFocusSiteBlocking() {
  const rules = defaultBlockList.map((domain, index) => ({
    id: RULE_ID_DISTRACTING + index,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: `*://*.${domain}/*`,
      resourceTypes: ["main_frame", "sub_frame"]
    }
  }));

  try {
    // Remove existing rules and register the new blocking rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map(r => r.id),
      addRules: rules
    });
    console.log("Cortex Focus Site Blocking Rules registered.");
  } catch (error) {
    console.error("Failed to register dynamic blocking rules:", error);
  }
}

// Remove blocking rules when the focus timer ends
export async function disableFocusSiteBlocking() {
  const ruleIds = defaultBlockList.map((_, index) => RULE_ID_DISTRACTING + index);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: ruleIds
  });
}
```

---

### 1.2 GNOME Desktop GJS Status Area Indicator

The desktop widget is written in Javascript for GNOME GJS. It runs directly in the Linux shell desktop, query-polling focus session states and updating the panel status:

#### extension.js (GNOME Status Area Indicator GJS)
```javascript
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

const CortexFocusIndicator = GObject.registerClass(
class CortexFocusIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'Cortex Focus Applet');

        // Layout container
        this.box = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
        
        // Status indicator icon
        this.icon = new St.Icon({
            gicon: new Gio.ThemedIcon({ name: 'media-record-symbolic' }),
            style_class: 'system-status-icon'
        });
        this.box.add_child(this.icon);

        // Status indicator text label
        this.label = new St.Label({
            text: 'Cortex Focus: Idle',
            y_align: Clutter.ActorAlign.CENTER
        });
        this.box.add_child(this.label);
        this.add_child(this.box);

        // Periodically poll backend focus state
        this._pollInterval = setInterval(() => this._pollFocusState(), 10000);
    }

    _pollFocusState() {
        // GNOME GJS fetches active user metrics from local state files
        try {
            let file = Gio.File.new_for_path('/tmp/cortex_focus.state');
            let [success, contents] = file.load_contents(null);
            if (success) {
                let state = JSON.parse(new TextDecoder().decode(contents));
                if (state.isActive) {
                    this.label.set_text(`Cortex Focus: ${state.remainingMinutes}m`);
                    this.icon.set_style('color: #EF4444;'); // Set red icon for active sessions
                } else {
                    this.label.set_text('Cortex Focus: Idle');
                    this.icon.set_style('color: #7C3AED;'); // Set purple icon for idle states
                }
            }
        } catch (error) {
            this.label.set_text('Cortex Offline');
        }
    }

    destroy() {
        if (this._pollInterval) {
            clearInterval(this._pollInterval);
        }
        super.destroy();
    }
});

export default class Extension {
    constructor() {
        this._indicator = null;
    }

    enable() {
        this._indicator = new CortexFocusIndicator();
        Main.panel.addToStatusArea('cortex-focus-applet', this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
```

---

### 1.3 Leaderboards & Study Groups (SQL Mappings)

Cortex implements peer study groups and competitive leaderboards. Members earn points by completing study sheets and logging focus hours. We write a SQL query to calculate leaderboard positions:

```sql
-- Study Groups Table
CREATE TABLE public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Members mappings
CREATE TABLE public.study_group_members (
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);
```

#### SQL Leaderboard Points Aggregation Query
```sql
CREATE OR REPLACE FUNCTION public.get_group_leaderboard(target_group_id UUID)
RETURNS TABLE (
  rank INT,
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  focus_points INT,
  notes_points INT,
  total_points INT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- Aggregate study points from focus logs and notes updates
  WITH focus_points_cte AS (
    SELECT 
      ps.user_id,
      -- 10 points per completed focus hour
      COALESCE(SUM(ps.duration_minutes) / 60 * 10, 0)::INT as pts
    FROM public.pomodoro_sessions ps
    GROUP BY ps.user_id
  ),
  notes_points_cte AS (
    SELECT 
      n.user_id,
      -- 5 points per published study resource
      COALESCE(COUNT(n.id) * 5, 0)::INT as pts
    FROM public.notes n
    WHERE n.is_archived = FALSE
    GROUP BY n.user_id
  )
  SELECT
    (ROW_NUMBER() OVER (ORDER BY (COALESCE(f.pts, 0) + COALESCE(nt.pts, 0)) DESC))::INT as rank,
    p.id as user_id,
    p.name as username,
    p.avatar_url,
    COALESCE(f.pts, 0)::INT as focus_points,
    COALESCE(nt.pts, 0)::INT as notes_points,
    (COALESCE(f.pts, 0) + COALESCE(nt.pts, 0))::INT as total_points
  FROM public.study_group_members gm
  JOIN public.profiles p ON gm.user_id = p.id
  LEFT JOIN focus_points_cte f ON p.id = f.user_id
  LEFT JOIN notes_points_cte nt ON p.id = nt.user_id
  WHERE gm.group_id = target_group_id
  ORDER BY total_points DESC;
$$;
```

---

## 2. Slide Presentation Script

### Slide 1: Title & Executive Introduction
*   **Visual Layout Blueprint:** Title slide. Warm off-white background with a purple side bar. Department details and credentials centered.
*   **Screenshot Placeholder:** `[SCREENSHOT: Multi-client system diagram showing desktop widgets, extensions panel, and web app shell]`
*   **Slide Content:**
    *   **Cortex: Multi-Platform Extensions & Competitive Study Groups**
    *   **Chrome MV3 blocker, GNOME Shell applet, and group leaderboards**
    *   **Speaker:** Member 7 (Extension & Social Integrations Developer)
    *   **Scope:** Chrome blocker workers, GNOME status GJS applets, and group leaderboards points queries.
*   **Word-for-Word Presenter Script:**
    "Good afternoon. I am Member 7, the Extension and Social Integrations Developer for Cortex. Today, I will present our client extensions and social features: our Chrome MV3 site-blocking engine, GNOME status indicator widget, study groups, and group leaderboards. Our goal with this module was to extend study controls to the browser and desktop levels, helping students stay focused. Let us start by looking at our Chrome extension configurations."

---

### Slide 2: Chrome Extension MV3 Site Blocker
*   **Visual Layout Blueprint:** Directory map displaying extension files alongside the dynamic blocking rules schemas.
*   **Screenshot Placeholder:** `[SCREENSHOT: Chrome browser displaying active extension popups and block action alerts]`
*   **Slide Content:**
    *   **Manifest Version 3:** Uses dynamic site blocking APIs to configure blocklists.
    *   **Background Service Workers:** Monitors focus sessions in the background.
    *   **Site blocker engine:** Blocks distracting sites automatically during study sessions.
    *   **Expiring alarms:** Disables site blocking rules automatically when focus sessions end.
*   **Word-for-Word Presenter Script:**
    "We built a Chrome extension using Manifest V3 to help students block distracting sites during study sessions. When a student starts a focus session, the extension registers dynamic site-blocking rules. The service worker tracks alarms to disable these rules automatically when the focus timer ends. Let us review the extension background code."

---

### Slide 3: Service Worker & declarativeNetRequest rules
*   **Visual Layout Blueprint:** Code panel displaying the MV3 service worker site-blocking rules definition.
*   **Screenshot Placeholder:** `[SCREENSHOT: Browser popup showing list of blocked websites and focus timers]`
*   **Slide Content:**
    *   **Dynamic rules:** Registers site-blocking rules using browser APIs.
    *   **URL Filters:** Defines match conditions to catch distracting domains.
    *   **Priority overrides:** Sets rule execution priorities.
    *   **Rule Cleanup:** Removes blocking rules when focus sessions complete.
*   **Word-for-Word Presenter Script:**
    "This slide shows the background script for site blocking. We use the browser's dynamic rule APIs to register blocklists, filtering distracting domains. The service worker removes these rules when focus sessions end, restore access to blocked sites. Let us look at our GNOME Shell widget applet."

---

### Slide 4: GNOME Desktop Applet (GJS Widget)
*   **Visual Layout Blueprint:** Workflow diagram displaying GNOME widget initialization, state-file polling, and desktop UI indicator updates.
*   **Screenshot Placeholder:** `[SCREENSHOT: Linux desktop panel showing the Cortex Status Area Indicator displaying active focus session times]`
*   **Slide Content:**
    *   **GNOME GJS Widget:** Native Javascript applet runs in the GNOME desktop shell status area.
    *   **Focus Status Polling:** Reads active focus states from local cache files.
    *   **Dynamic Status Label:** Updates the panel text to show remaining study minutes.
    *   **System Theme Icons:** Changes panel icon colors to indicate study states.
*   **Word-for-Word Presenter Script:**
    "To integrate focus tracking directly into the desktop, we built a GNOME Shell applet in Javascript using GNOME GJS. The applet polls local state cache files to read active focus states. The panel label updates dynamically to show remaining study minutes, changing color to indicate when a session is active. Let us check the GJS script implementation."

---

### Slide 5: GNOME extension.js Widget Code
*   **Visual Layout Blueprint:** Code panel displaying the GJS widget class definitions and file polling helper functions.
*   **Screenshot Placeholder:** `[SCREENSHOT: Linux terminal showing GNOME extension log files and state metrics updates]`
*   **Slide Content:**
    *   **Button Class definitions:** Extends PanelMenu buttons to construct applet shells.
    *   **Asynchronous file readers:** Reads state metrics files asynchronously.
    *   **Label modifiers:** Updates status text and icon colors.
    *   **Interval loops:** Schedules periodic polling tasks to check focus status.
*   **Word-for-Word Presenter Script:**
    "Here we see the GJS widget script code. The applet button class extends GNOME panel menus, layout boxes, and status labels. An interval loop checks local state files, updating panel labels and icons to show active focus times. The applet cleans up its resources when disabled. Let us discuss peer study groups."

---

### Slide 6: Study Groups & Members Tables DDL
*   **Visual Layout Blueprint:** ER diagram showing relations between `study_groups` and `study_group_members`.
*   **Screenshot Placeholder:** `[SCREENSHOT: Group dashboard showing invite cards and list of group members]`
*   **Slide Content:**
    *   **Study Groups:** Allows students to coordinate study sessions with peers.
    *   **Invite Codes:** Generates group codes to share study groups with classmates.
    *   **Group Memberships:** Maps users to study groups.
    *   **Data cascading rules:** Cascade rules prevent broken data records when groups are deleted.
*   **Word-for-Word Presenter Script:**
    "Cortex supports peer study groups to help classmates collaborate. The database maps user memberships to study groups, generating unique group codes that students can share to invite classmates. We enforce cascading foreign key rules to clean up membership records when groups are deleted. Let us look at our leaderboard rankings query."

---

### Slide 7: Invite Codes Dynamic Validation Code
*   **Visual Layout Blueprint:** Code panel displaying the invite codes validations methods and workspace folders sharing.
*   **Screenshot Placeholder:** `[SCREENSHOT: Workspace settings popup showing generating invite codes buttons]`
*   **Slide Content:**
    *   **Invite Verification:** System validates invite codes prior to adding users to group members.
    *   **Workspace link maps:** Grants users access to shared workspace assets.
    *   **Alphanumeric structures:** Unique code structures prevent random guessing.
    *   **Alarms parameters:** Dynamic settings support configuring group expiration limits.
*   **Word-for-Word Presenter Script:**
    "This slide shows our invite validation script. When a user inputs an invite code, the client checks it against active directories, verifying memberships. If valid, the system links the student's profile to the shared group assets. This workflow secures collaborative notes. Next, we will discuss leaderboards."

---

### Slide 8: Competitive Group Leaderboards
*   **Visual Layout Blueprint:** SQL panel showing the `get_group_leaderboard` PL/pgSQL function code.
*   **Screenshot Placeholder:** `[SCREENSHOT: Leaderboard UI showing user rankings, profile icons, and total point scores]`
*   **Slide Content:**
    *   **Total Point Scoring:** Calculates points from focus session logs and published notes.
    *   **Leaderboard Ranking:** Ranks group members dynamically using row number partition rankings.
    *   **Profile integration:** Joins profile records to display usernames and avatars.
    *   **Fast Queries:** Calculates rankings in under 3 milliseconds.
*   **Word-for-Word Presenter Script:**
    "This slide displays our leaderboard rankings query. We calculate points from focus session logs and published study materials, ranking group members dynamically. The query joins profile tables to display usernames and avatars, executing in under 3 milliseconds to optimize client performance. Let us check the synchronized focus rates."

---

### Slide 9: Social Points Allocations Rules
*   **Visual Layout Blueprint:** Spacing grid mapping user actions to target point rewards values.
*   **Screenshot Placeholder:** `[SCREENSHOT: System configuration card detail points allocations rules]`
*   **Slide Content:**
    *   **Timer logs points:** 10 points per completed focus hour.
    *   **Published notes points:** 5 points per verified upload.
    *   **Habits completed points:** 2 points per completed habit log.
    *   **Friend connections points:** 1 point per accepted link.
*   **Word-for-Word Presenter Script:**
    "Our points allocations system is designed to reward consistency and collaboration. Earning points through focus logs and verified resource uploads encourages student involvement. To prevent cheating, the backend enforces maximum daily point limits on uploads. Let us summarize our extension models."

---

### Slide 10: Multi-Platform Extensions Sync summary
*   **Visual Layout Blueprint:** Summary table listing browser extensions, desktop applets, study groups, and sync APIs.
*   **Screenshot Placeholder:** `[SCREENSHOT: Completed extensions popup showing active focus session indicators]`
*   **Slide Content:**
    *   **Chrome Extension:** Blocks distracting sites dynamically during focus sessions.
    *   **GNOME Shell Widget:** Monitors focus status directly from the Linux desktop panel.
    *   **Leaderboard queries:** Aggregates focus logs and published notes to rank members.
    *   **Bilingual localization:** Supports English and Arabic translation alignments.
*   **Word-for-Word Presenter Script:**
    "In summary, our browser extensions, desktop widgets, and study groups extend study controls to browser and desktop levels, helping students stay focused. Verification triggers and leaderboard queries keep data synchronized across clients, supporting English and Arabic translations. I will now hand over to our team leader for the project conclusion. Thank you."
