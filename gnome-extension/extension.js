import St from 'gi://St';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Soup from 'gi://Soup?version=3.0';
import Clutter from 'gi://Clutter';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

// ── Constants ─────────────────────────────────────────────

const MODES = ['Focus', 'Short Break', 'Long Break'];
const DEFAULT_DURATIONS = {Focus: 25, 'Short Break': 5, 'Long Break': 15};
const DEFAULT_BACKEND = 'http://localhost:4000';

const DATA_DIR = `${GLib.get_user_data_dir()}/tamatem`;
const AUTH_FILE = `${DATA_DIR}/auth.json`;
const SETTINGS_FILE = `${DATA_DIR}/settings.json`;
const SUBJECTS_FILE = `${DATA_DIR}/subjects.json`;
const TIMER_FILE = `${DATA_DIR}/timer.json`;
const GREENLIST_FILE = `${DATA_DIR}/greenlist.json`;

const SUBJECTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ── Storage helpers ───────────────────────────────────────

function loadJson(path) {
  try {
    const file = Gio.File.new_for_path(path);
    const [ok, contents] = file.load_contents(null);
    if (ok) return JSON.parse(new TextDecoder('utf-8').decode(contents));
  } catch (_) {}
  return null;
}

function saveJson(path, data) {
  try {
    const dir = Gio.File.new_for_path(DATA_DIR);
    if (!dir.query_exists(null)) dir.make_directory_with_parents(null);
    const file = Gio.File.new_for_path(path);
    file.replace_contents(JSON.stringify(data, null, 2), null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
  } catch (_) {}
}

function deleteFile(path) {
  try {
    const f = Gio.File.new_for_path(path);
    if (f.query_exists(null)) f.delete(null);
  } catch (_) {}
}

// ── Utilities ─────────────────────────────────────────────

function fmt(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function fmtDur(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  return `${s}s`;
}

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

function base64Decode(str) {
  try {
    const bytes = GLib.base64_decode(str);
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return '';
  }
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(base64Decode(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// ── API Client ────────────────────────────────────────────

class Api {
  constructor() {
    this._session = new Soup.Session();
    this._auth = null;
    this._settings = null;
    this._subjectsCache = null;
  }

  _backendUrl() {
    return this._settings?.backendUrl ?? DEFAULT_BACKEND;
  }

  _request(method, path, body = null) {
    const url = `${this._backendUrl()}${path}`;
    const msg = Soup.Message.new(method, url);
    msg.request_headers.append('Content-Type', 'application/json');
    if (this._auth?.accessToken) {
      msg.request_headers.append('Authorization', `Bearer ${this._auth.accessToken}`);
    }
    if (body) {
      msg.set_request_body_from_bytes('application/json', new GLib.Bytes(JSON.stringify(body)));
    }

    return new Promise((resolve, reject) => {
      this._session.send_and_read_async(msg, GLib.PRIORITY_DEFAULT, null, (s, r) => {
        try {
          const bytes = s.send_and_read_finish(r);
          const text = new TextDecoder('utf-8').decode(bytes?.get_data() ?? new Uint8Array(0));
          const data = text ? JSON.parse(text) : null;
          if (msg.status_code >= 200 && msg.status_code < 300) {
            resolve(data);
          } else {
            reject(new Error(data?.error ?? `HTTP ${msg.status_code}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  async _ensureValidAuth() {
    if (!this._auth) return false;
    if (!this._auth.refreshToken) return true;
    if (!isTokenExpired(this._auth.accessToken)) return true;

    try {
      const data = await this._request('POST', '/api/auth/refresh', {refreshToken: this._auth.refreshToken});
      if (data?.session) {
        this._auth = {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token ?? this._auth.refreshToken,
          user: data.user ?? this._auth.user,
        };
        saveJson(AUTH_FILE, this._auth);
        return true;
      }
    } catch (_) {}
    return true; // return true anyway so existing token gets a chance
  }

  async _r(method, path, body = null) {
    await this._ensureValidAuth();
    return this._request(method, path, body);
  }

  // ── Auth ──

  async login(email, password) {
    const data = await this._request('POST', '/api/auth/login', {email, password});
    if (data?.session) {
      this._auth = {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: data.user ? {id: data.user.id, email: data.user.email} : null,
      };
      saveJson(AUTH_FILE, this._auth);
    }
    return data;
  }

  async signup(email, password, fullName) {
    const data = await this._request('POST', '/api/auth/signup', {email, password, fullName});
    if (data?.session) {
      this._auth = {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: data.user ? {id: data.user.id, email: data.user.email} : null,
      };
      saveJson(AUTH_FILE, this._auth);
    }
    return data;
  }

  loadAuth() {
    this._auth = loadJson(AUTH_FILE);
    return this._auth;
  }

  clearAuth() {
    this._auth = null;
    deleteFile(AUTH_FILE);
  }

  get isAuthenticated() {
    return !!this._auth?.accessToken;
  }

  get userEmail() {
    return this._auth?.user?.email ?? '';
  }

  get accessToken() {
    return this._auth?.accessToken ?? null;
  }

  // ── Subjects ──

  async getSubjects() {
    const now = Date.now();
    if (this._subjectsCache && now - this._subjectsCache.timestamp < SUBJECTS_CACHE_TTL) {
      return this._subjectsCache.subjects;
    }
    const data = await this._r('GET', '/api/daily/subjects');
    const subjects = data?.subjects ?? [];
    this._subjectsCache = {subjects, timestamp: now};
    saveJson(SUBJECTS_FILE, this._subjectsCache);
    return subjects;
  }

  loadSubjectsCache() {
    const d = loadJson(SUBJECTS_FILE);
    if (d) this._subjectsCache = d;
    return this._subjectsCache;
  }

  async createSubject(name, color) {
    const data = await this._r('POST', '/api/daily/subjects', {name, color: color ?? '#3b82f6'});
    this._subjectsCache = null; // invalidate cache
    return data;
  }

  // ── Timer / Sessions ──

  async logSession(params) {
    return this._r('POST', '/api/daily/pomodoro', params);
  }

  async getSessions(date) {
    return this._r('GET', `/api/daily/pomodoro?date=${date}`);
  }

  // ── Social: Groups ──

  getGroups() { return this._r('GET', '/api/daily/groups'); }
  createGroup(name, description) { return this._r('POST', '/api/daily/groups', {name, description}); }
  deleteGroup(id) { return this._r('DELETE', `/api/daily/groups/${id}`); }
  removeGroupMember(id, userId) { return this._r('DELETE', `/api/daily/groups/${id}/members/${userId}`); }
  createGroupInvitation(id, email) { return this._r('POST', `/api/daily/groups/${id}/invitations`, {email}); }
  getGroupInvitations(id) { return this._r('GET', `/api/daily/groups/${id}/invitations`); }
  respondToGroupInvitation(invitationId, status) { return this._r('PUT', `/api/daily/group-invitations/${invitationId}`, {status}); }
  joinGroupByCode(code) { return this._r('POST', '/api/daily/groups/join', {code}); }

  // ── Social: Friends ──

  getFriends() { return this._r('GET', '/api/daily/friends'); }
  getFriendRequests() { return this._r('GET', '/api/daily/friend-requests'); }
  sendFriendRequest(email) { return this._r('POST', '/api/daily/friend-requests', {email}); }
  respondToFriendRequest(id, status) { return this._r('PUT', `/api/daily/friend-requests/${id}`, {status}); }
  removeFriend(id) { return this._r('DELETE', `/api/daily/friends/${id}`); }

  // ── Social: Leaderboard ──

  getLeaderboard() { return this._r('GET', '/api/daily/leaderboard'); }
  getGroupLeaderboard(id) { return this._r('GET', `/api/daily/leaderboard/groups/${id}`); }
  getFriendsLeaderboard() { return this._r('GET', '/api/daily/leaderboard/friends'); }

  // ── Settings ──

  loadSettings() {
    this._settings = loadJson(SETTINGS_FILE);
    return this._settings;
  }

  saveSettings(s) {
    this._settings = s;
    saveJson(SETTINGS_FILE, s);
  }

  get settings() {
    if (!this._settings) this.loadSettings();
    return this._settings ?? {
      backendUrl: DEFAULT_BACKEND,
      durations: {...DEFAULT_DURATIONS},
    };
  }
}

// ── Blocker ────────────────────────────────────────────────

class Blocker {
  constructor() {
    this._on = false;
    this._list = ['google.com', 'github.com', 'stackoverflow.com', 'chatgpt.com'];
  }

  load() {
    const d = loadJson(GREENLIST_FILE);
    if (d) {
      this._on = d.enabled ?? false;
      this._list = d.greenlist ?? this._list;
    }
    return this;
  }

  save() {
    saveJson(GREENLIST_FILE, {enabled: this._on, greenlist: this._list});
  }

  get on() { return this._on; }
  get list() { return this._list; }
  set list(v) { this._list = v; this.save(); }

  async toggle() {
    if (this._on) await this._down();
    else await this._up();
    this._on = !this._on;
    this.save();
    return this._on;
  }

  async _resolve(doms) {
    const ips = [];
    for (const d of doms) {
      try {
        const [ok, out] = GLib.spawn_command_line_sync(`getent hosts ${d}`);
        if (ok && out) {
          for (const l of new TextDecoder('utf-8').decode(out).trim().split('\n')) {
            const ip = l.split(/\s+/)[0];
            if (ip && !ip.includes(':')) ips.push(ip);
          }
        }
      } catch (_) {}
    }
    return [...new Set(ips)];
  }

  async _up() {
    const ips = await this._resolve(this._list);
    const lines = [
      '#!/usr/sbin/nft -f',
      'flush table inet tamatem_block 2>/dev/null || true',
      'table inet tamatem_block {',
      '  chain out {',
      '    type filter hook output priority 0; policy drop;',
      '    ct state related,established accept',
      ...ips.map(ip => `    tcp dport { 80, 443 } ip daddr ${ip} accept`),
      '    udp dport 53 accept',
      '    tcp dport 53 accept',
      '  }',
      '}',
    ];
    GLib.file_set_contents('/tmp/tamatem-block.nft', lines.join('\n'));
    await this._pkexec(['nft', '-f', '/tmp/tamatem-block.nft']);
  }

  async _down() {
    GLib.file_set_contents('/tmp/tamatem-unblock.nft',
      '#!/usr/sbin/nft -f\nflush table inet tamatem_block; delete table inet tamatem_block');
    await this._pkexec(['nft', '-f', '/tmp/tamatem-unblock.nft']);
  }

  _pkexec(a) {
    return new Promise((resolve, reject) => {
      const p = Gio.Subprocess.new(['pkexec', ...a], Gio.SubprocessFlags.NONE);
      p.wait_async(null, (proc, res) => {
        try {
          if (proc.wait_finish(res)) resolve();
          else reject(new Error('pkexec failed'));
        } catch (e) { reject(e); }
      });
    });
  }
}

// ── Timer State ────────────────────────────────────────────

class TimerState {
  constructor() {
    this.phase = 'idle'; // idle | running | completed
    this.mode = 'Focus';
    this.duration = 25; // minutes
    this.elapsed = 0; // seconds
    this.startTime = 0; // Date.now()
    this.subjectName = null;
    this._timeoutId = null;
    this._onTick = null;
    this._onComplete = null;
  }

  load() {
    const d = loadJson(TIMER_FILE);
    if (d && d.phase === 'running') {
      this.phase = d.phase;
      this.mode = d.mode;
      this.duration = d.duration;
      this.startTime = d.startTime;
      this.subjectName = d.subjectName;
      this.elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      if (this.elapsed >= this.duration * 60) {
        this.elapsed = this.duration * 60;
        this.phase = 'completed';
      }
    }
    return this;
  }

  save() {
    if (this.phase === 'running') {
      saveJson(TIMER_FILE, {
        phase: 'running',
        mode: this.mode,
        duration: this.duration,
        startTime: this.startTime,
        subjectName: this.subjectName,
      });
    } else {
      deleteFile(TIMER_FILE);
    }
  }

  start(mode, duration, subjectName) {
    this.mode = mode;
    this.duration = duration;
    this.subjectName = subjectName;
    this.elapsed = 0;
    this.startTime = Date.now();
    this.phase = 'running';
    this.save();
  }

  stop() {
    if (this._timeoutId) {
      GLib.source_remove(this._timeoutId);
      this._timeoutId = null;
    }
    const elapsed = this.elapsed;
    this.phase = 'idle';
    this.elapsed = 0;
    this.startTime = 0;
    this.save();
    return elapsed;
  }

  get remaining() {
    return Math.max(0, this.duration * 60 - this.elapsed);
  }

  get isRunning() {
    return this.phase === 'running';
  }

  get isDone() {
    return this.phase === 'completed';
  }

  tick(cb) {
    this._onTick = cb;
    if (this._timeoutId) {
      GLib.source_remove(this._timeoutId);
    }
    this._timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 200, () => {
      if (this.phase !== 'running') return GLib.SOURCE_REMOVE;
      this.elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      if (this.elapsed >= this.duration * 60) {
        this.elapsed = this.duration * 60;
        this.phase = 'completed';
        this.save();
        if (this._onComplete) this._onComplete();
        return GLib.SOURCE_REMOVE;
      }
      if (this._onTick) this._onTick(this.remaining);
      return GLib.SOURCE_CONTINUE;
    });
  }

  stopTick() {
    if (this._timeoutId) {
      GLib.source_remove(this._timeoutId);
      this._timeoutId = null;
    }
  }

  onComplete(cb) {
    this._onComplete = cb;
  }

  destroy() {
    this.stopTick();
    this._onTick = null;
    this._onComplete = null;
  }
}

// ── Popup UI ───────────────────────────────────────────────

class TamatemPopup {
  constructor(indicator, api, blocker, timer) {
    this._indicator = indicator;
    this._api = api;
    this._blocker = blocker;
    this._timer = timer;
    this._tab = 0; // 0=focus 1=history 2=social 3=block 4=settings
    this._socialSub = 0; // 0=leaderboard 1=friends 2=groups
    this._tabBtns = [];
    this._subjects = [];
    this._leaderboardScope = {type: 'global'};

    this._build();
  }

  _build() {
    this._main = new St.BoxLayout({vertical: true, style_class: 'tmt-popup', width: 360});

    // Tab bar (only when authenticated)
    this._tabBar = new St.BoxLayout({style_class: 'tmt-bar'});
    const tabs = ['Focus', 'History', 'Social', 'Block', 'Settings'];
    tabs.forEach((n, i) => {
      const btn = new St.Button({label: n, style_class: `tmt-tab${i === 0 ? ' on' : ''}`});
      btn.connect('clicked', () => this._switchTab(i));
      this._tabBar.add_child(btn);
      this._tabBtns.push(btn);
    });

    this._content = new St.BoxLayout({vertical: true});
    this._main.add_child(this._content);

    const section = new PopupMenu.PopupMenuSection();
    section.actor.add_child(this._main);
    this._indicator.menu.addMenuItem(section);

    this._render();
  }

  _switchTab(i) {
    this._tab = i;
    this._socialSub = 0;
    this._tabBtns.forEach((b, j) => {
      b.style_class = `tmt-tab${j === i ? ' on' : ''}`;
    });
    this._render();
  }

  _switchSocialSub(i) {
    this._socialSub = i;
    this._renderSocialContent();
  }

  _render() {
    this._content.destroy_all_children();

    if (!this._api.isAuthenticated) {
      this._renderLogin();
      return;
    }

    // Show tab bar
    const barClone = new St.BoxLayout({style_class: 'tmt-bar'});
    const tabs = ['Focus', 'History', 'Social', 'Block', 'Settings'];
    tabs.forEach((n, i) => {
      const btn = new St.Button({label: n, style_class: `tmt-tab${i === this._tab ? ' on' : ''}`});
      btn.connect('clicked', () => this._switchTab(i));
      barClone.add_child(btn);
    });
    this._content.add_child(barClone);

    switch (this._tab) {
      case 0: this._renderFocus(); break;
      case 1: this._renderHistory(); break;
      case 2: this._renderSocial(); break;
      case 3: this._renderBlocker(); break;
      case 4: this._renderSettings(); break;
    }
  }

  _showError(msg) {
    Main.notifyError('Tamatem', msg);
  }

  _btn(label, cls, cb) {
    const btn = new St.Button({label, style_class: `tmt-btn ${cls}`, x_expand: true});
    if (cb) btn.connect('clicked', cb);
    return btn;
  }

  _sbtn(label, cls, cb) {
    const btn = new St.Button({label, style_class: `tmt-sbtn ${cls}`});
    if (cb) btn.connect('clicked', cb);
    return btn;
  }

  _scroller(child) {
    const sw = new St.ScrollView({
      style_class: 'tmt-scroll',
      hscrollbar_policy: St.PolicyType.NEVER,
      vscrollbar_policy: St.PolicyType.AUTOMATIC,
    });
    sw.add_actor(child);
    return sw;
  }

  _section(title) {
    const box = new St.BoxLayout({vertical: true, style_class: 'tmt-section'});
    box.add_child(new St.Label({text: title, style_class: 'tmt-section-title'}));
    return box;
  }

  _row() {
    return new St.BoxLayout({style_class: 'tmt-row'});
  }

  _input(hint, opts = {}) {
    const entry = new St.Entry({
      hint_text: hint,
      style_class: 'tmt-in',
      can_focus: true,
      ...opts,
    });
    return entry;
  }

  // ── Login Screen ──────────────────────────────────────────

  _renderLogin() {
    const box = new St.BoxLayout({vertical: true, style_class: 'tmt-cnt tmt-login'});

    box.add_child(new St.Label({text: 'College Knowledge Hub', style_class: 'tmt-login-title'}));
    box.add_child(new St.Label({text: 'Sign in to track your focus sessions', style_class: 'tmt-login-sub'}));

    const emailInput = this._input('Email');
    const passInput = this._input('Password');
    passInput.clutter_text.set_password_char('•');

    const errorLabel = new St.Label({text: '', style_class: 'tmt-login-error'});
    const signInBtn = this._btn('Sign In', 'go', async () => {
      errorLabel.set_text('');
      signInBtn.reactive = false;
      signInBtn.label = 'Signing in...';
      try {
        await this._api.login(emailInput.get_text(), passInput.get_text());
        this._timer.load();
        this._render();
      } catch (e) {
        errorLabel.set_text(e.message ?? 'Failed to sign in');
      }
      signInBtn.reactive = true;
      signInBtn.label = 'Sign In';
    });

    box.add_child(emailInput);
    box.add_child(passInput);
    box.add_child(errorLabel);
    box.add_child(signInBtn);

    // Signup toggle
    const signupBtn = new St.Button({
      label: 'Need an account? Sign up',
      style_class: 'tmt-link-btn',
    });
    signupBtn.connect('clicked', () => this._renderSignup(box, emailInput, passInput, errorLabel, signInBtn));
    box.add_child(signupBtn);

    this._content.add_child(box);
  }

  _renderSignup(container, emailInput, passInput, errorLabel, submitBtn) {
    container.destroy_all_children();

    container.add_child(new St.Label({text: 'Create Account', style_class: 'tmt-login-title'}));

    const nameInput = this._input('Full Name');
    container.add_child(nameInput);

    // Reuse existing email input if non-empty
    const email = emailInput.get_text();
    const emailField = this._input('Email');
    if (email) emailField.set_text(email);
    container.add_child(emailField);

    const passField = this._input('Password');
    passField.clutter_text.set_password_char('•');
    container.add_child(passField);

    const errLabel = new St.Label({text: '', style_class: 'tmt-login-error'});

    const createBtn = this._btn('Create Account', 'go', async () => {
      errLabel.set_text('');
      createBtn.reactive = false;
      createBtn.label = 'Creating...';
      try {
        const result = await this._api.signup(
          emailField.get_text(),
          passField.get_text(),
          nameInput.get_text()
        );
        if (result?.session) {
          this._timer.load();
          this._render();
        } else {
          errLabel.set_text(result?.message ?? 'Check your email to confirm your account.');
        }
      } catch (e) {
        errLabel.set_text(e.message ?? 'Failed to sign up');
      }
      createBtn.reactive = true;
      createBtn.label = 'Create Account';
    });
    container.add_child(errLabel);
    container.add_child(createBtn);

    const backBtn = new St.Button({
      label: 'Back to Sign In',
      style_class: 'tmt-link-btn',
    });
    backBtn.connect('clicked', () => this._renderLogin());
    container.add_child(backBtn);
  }

  // ── Focus Tab ─────────────────────────────────────────────

  _renderFocus() {
    const box = new St.BoxLayout({vertical: true, style_class: 'tmt-cnt'});
    const timer = this._timer;
    const running = timer.isRunning;

    // Mode buttons
    const mb = new St.BoxLayout({style_class: 'tmt-mb'});
    const settings = this._api.settings;
    const durations = settings.durations ?? DEFAULT_DURATIONS;
    MODES.forEach(m => {
      const active = timer.mode === m;
      const btn = new St.Button({
        label: m,
        style_class: `tmt-mbtn${active ? ' on' : ''}`,
        x_expand: true,
      });
      if (running) btn.reactive = false;
      btn.connect('clicked', () => {
        if (!running) {
          timer.mode = m;
          timer.duration = durations[m] ?? DEFAULT_DURATIONS[m] ?? 25;
          this._renderFocus();
        }
      });
      mb.add_child(btn);
    });
    box.add_child(mb);

    // Timer display
    const displayText = running ? fmt(timer.remaining) : fmt((timer.duration ?? durations[timer.mode] ?? 25) * 60);
    const display = new St.Label({text: displayText, style_class: 'tmt-display'});
    box.add_child(display);

    // Subjects (only when not running)
    let subjectSelect = null;
    if (!running) {
      const subjectBox = new St.BoxLayout({style_class: 'tmt-subject-row'});
      subjectSelect = new St.Entry({
        hint_text: 'Subject (optional)',
        style_class: 'tmt-in',
        can_focus: true,
        x_expand: true,
      });
      if (timer.subjectName) subjectSelect.set_text(timer.subjectName);
      subjectBox.add_child(subjectSelect);

      // Load subjects from API and show as quick-select chips
      this._loadSubjectChips(subjectBox, subjectSelect);

      box.add_child(subjectBox);
    }

    // Start/Stop button
    const actionBtn = this._btn(
      running ? 'Stop' : 'Start',
      running ? 'st' : 'go',
      () => running ? this._stopTimer() : this._startTimer(subjectSelect)
    );
    box.add_child(actionBtn);

    // Quick info
    const info = new St.BoxLayout({style_class: 'tmt-stq'});
    const modeLabel = timer.mode;
    const durLabel = `${timer.duration ?? durations[timer.mode] ?? 25} min`;
    info.add_child(new St.Label({text: `${modeLabel} · ${durLabel}`, style_class: 'tmt-stql'}));
    if (running && timer.subjectName) {
      info.add_child(new St.Label({text: ` · ${timer.subjectName}`, style_class: 'tmt-stql'}));
    }
    box.add_child(info);

    this._content.add_child(box);
  }

  async _loadSubjectChips(box, selectInput) {
    try {
      let subjects = this._subjects;
      if (subjects.length === 0) {
        subjects = await this._api.getSubjects();
        this._subjects = subjects;
      }
      if (subjects.length > 0) {
        const chipRow = new St.BoxLayout({style_class: 'tmt-chip-row'});
        const shown = subjects.slice(0, 5);
        shown.forEach(s => {
          const chip = new St.Button({
            label: s.name,
            style_class: 'tmt-chip',
            can_focus: true,
          });
          chip.connect('clicked', () => {
            selectInput.set_text(s.name);
          });
          chipRow.add_child(chip);
        });
        box.add_child(chipRow);
      }
    } catch (_) {}
  }

  _startTimer(subjectSelect = null) {
    const settings = this._api.settings;
    const durations = settings.durations ?? DEFAULT_DURATIONS;
    const mode = this._timer.mode;
    const duration = this._timer.duration ?? durations[mode] ?? 25;
    const subjectName = subjectSelect?.get_text()?.trim() || null;

    this._timer.start(mode, duration, subjectName);
    this._timer.onComplete(() => this._onTimerComplete());

    this._timer.tick((remaining) => {
      this._indicator.setTimerLabel(fmt(remaining));
    });

    this._indicator.setTimerLabel(fmt(this._timer.duration * 60));
    this._render();
  }

  _stopTimer() {
    const {duration, mode, subjectName, startTime} = this._timer;
    const elapsed = this._timer.stop();
    this._indicator.setTimerLabel('');

    if (elapsed > 15 && this._api.isAuthenticated) {
      this._api.logSession({
        duration,
        type: mode,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
        actualDurationSeconds: elapsed,
        completed: false,
        subject_name: subjectName ?? '',
      }).catch(() => {});
    }

    this._render();
  }

  async _onTimerComplete() {
    this._indicator.setTimerLabel('');

    const elapsed = this._timer.duration * 60;

    if (this._api.isAuthenticated) {
      try {
        const startTime = new Date(this._timer.startTime).toISOString();
        await this._api.logSession({
          duration: this._timer.duration,
          type: this._timer.mode,
          startTime,
          endTime: new Date().toISOString(),
          actualDurationSeconds: elapsed,
          completed: true,
          subject_name: this._timer.subjectName ?? '',
        });
      } catch (_) {}
    }

    Main.notify('Tamatem', `${this._timer.mode} complete! (${fmtDur(elapsed)})`);

    if (this._tab === 0) {
      this._render();
    }
  }

  // ── History Tab ───────────────────────────────────────────

  async _renderHistory() {
    const box = new St.BoxLayout({vertical: true, style_class: 'tmt-cnt'});
    box.add_child(new St.Label({text: 'Loading...', style_class: 'tmt-emp'}));
    this._content.add_child(box);

    try {
      const r = await this._api.getSessions(today());
      const sessions = r?.sessions ?? [];

      box.destroy_all_children();

      // Header
      const totalFocus = sessions
        .filter(s => s.type === 'Focus' || s.type === 'Deep Work')
        .reduce((sum, s) => sum + (s.actual_duration_seconds ?? s.duration * 60), 0);

      const header = new St.BoxLayout({style_class: 'tmt-logh'});
      header.add_child(new St.Label({text: 'Today', style_class: 'tmt-sh'}));
      header.add_child(new St.Label({text: fmtDur(totalFocus), style_class: 'tmt-logo'}));
      box.add_child(header);

      if (!sessions.length) {
        box.add_child(new St.Label({text: 'No sessions yet.', style_class: 'tmt-emp'}));
        return;
      }

      // Session list
      const list = new St.BoxLayout({vertical: true, style_class: 'tmt-logls'});
      sessions.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
      for (const s of sessions) {
        const row = new St.BoxLayout({style_class: 'tmt-logi'});
        row.add_child(new St.Label({
          text: s.completed ? s.type : `${s.type} (interrupted)`,
          style_class: 'tmt-logty',
        }));
        row.add_child(new St.Label({
          text: fmtDur(s.actual_duration_seconds ?? s.duration * 60),
          style_class: 'tmt-logtm',
        }));
        row.add_child(new St.Label({text: fmtTime(s.start_time), style_class: 'tmt-logrg'}));
        if (s.subject_name) {
          row.add_child(new St.Label({text: s.subject_name, style_class: 'tmt-logsub'}));
        }
        list.add_child(row);
      }
      box.add_child(this._scroller(list));
    } catch {
      box.destroy_all_children();
      box.add_child(new St.Label({text: 'Could not load sessions.', style_class: 'tmt-emp tmt-err'}));
    }
  }

  // ── Social Tab ────────────────────────────────────────────

  _renderSocial() {
    const outer = new St.BoxLayout({vertical: true});

    // Sub-tab bar
    const subs = ['Leaderboard', 'Friends', 'Groups'];
    const sbar = new St.BoxLayout({style_class: 'tmt-sbar'});
    subs.forEach((n, i) => {
      const btn = new St.Button({
        label: n,
        style_class: `tmt-stab${i === this._socialSub ? ' on' : ''}`,
        x_expand: true,
      });
      btn.connect('clicked', () => {
        this._socialSub = i;
        this._renderSocialContent();
      });
      sbar.add_child(btn);
    });
    outer.add_child(sbar);

    const content = new St.BoxLayout({vertical: true, style_class: 'tmt-cnt'});
    outer.add_child(this._scroller(content));
    this._content.add_child(outer);

    if (!this._api.isAuthenticated) {
      content.add_child(new St.Label({text: 'Sign in to use social features.', style_class: 'tmt-emp'}));
      return;
    }

    this._renderSocialContent();
  }

  _renderSocialContent() {
    // Find the content box inside social tab
    const outer = this._content.get_last_child();
    if (!outer) return;
    const children = outer.get_children();
    const content = children.length > 1 ? children[1] : null;
    if (!content) return;

    content.destroy_all_children();

    switch (this._socialSub) {
      case 0: this._loadLeaderboard(content); break;
      case 1: this._loadFriends(content); break;
      case 2: this._loadGroups(content); break;
    }
  }

  async _loadLeaderboard(container) {
    container.add_child(new St.Label({text: '...', style_class: 'tmt-emp'}));
    try {
      const groupsResult = await this._api.getGroups().catch(() => ({groups: []}));
      const groups = groupsResult?.groups ?? [];
      const scope = this._leaderboardScope ?? {type: 'global'};

      container.destroy_all_children();

      // Scope selector (buttons row)
      const selRow = new St.BoxLayout({style_class: 'tmt-mb'});

      const globalBtn = new St.Button({
        label: '🌍 Global',
        style_class: `tmt-mbtn${scope.type === 'global' ? ' on' : ''}`,
        x_expand: true,
      });
      globalBtn.connect('clicked', () => {
        this._leaderboardScope = {type: 'global'};
        this._loadLeaderboard(container);
      });
      selRow.add_child(globalBtn);

      const friendsBtn = new St.Button({
        label: '👥 Friends',
        style_class: `tmt-mbtn${scope.type === 'friends' ? ' on' : ''}`,
        x_expand: true,
      });
      friendsBtn.connect('clicked', () => {
        this._leaderboardScope = {type: 'friends'};
        this._loadLeaderboard(container);
      });
      selRow.add_child(friendsBtn);

      // Add a button per group if there are not too many
      const MAX_VISIBLE = 4;
      const visibleGroups = groups.slice(0, MAX_VISIBLE);
      const extraCount = groups.length - MAX_VISIBLE;

      for (const g of visibleGroups) {
        const gBtn = new St.Button({
          label: g.name.substring(0, 8),
          style_class: `tmt-mbtn${scope.type === 'group' && scope.groupId === g.id ? ' on' : ''}`,
          x_expand: true,
        });
        gBtn.connect('clicked', () => {
          this._leaderboardScope = {type: 'group', groupId: g.id, groupName: g.name};
          this._loadLeaderboard(container);
        });
        selRow.add_child(gBtn);
      }

      if (extraCount > 0 && groups.length > 0) {
        const moreBtn = new St.Button({
          label: `+${extraCount}`,
          style_class: `tmt-mbtn${scope.type === 'group' && !visibleGroups.find(g => g.id === scope.groupId) ? ' on' : ''}`,
          x_expand: true,
        });
        selRow.add_child(moreBtn);
      }

      container.add_child(selRow);

      // Fetch the right leaderboard
      let board = [];
      if (scope.type === 'global') {
        const r = await this._api.getLeaderboard();
        board = r?.leaderboard ?? [];
      } else if (scope.type === 'friends') {
        const r = await this._api.getFriendsLeaderboard();
        board = r?.leaderboard ?? [];
      } else if (scope.type === 'group') {
        const r = await this._api.getGroupLeaderboard(scope.groupId);
        board = r?.leaderboard ?? [];
      }

      const label = scope.type === 'global' ? "Today's Leaderboard" :
        scope.type === 'friends' ? "Friends Leaderboard" :
        `${scope.groupName} Leaderboard`;
      const h = new St.BoxLayout({style_class: 'tmt-logh'});
      h.add_child(new St.Label({text: label, style_class: 'tmt-sh'}));
      container.add_child(h);

      if (!board.length) {
        container.add_child(new St.Label({text: 'No data yet.', style_class: 'tmt-emp'}));
        return;
      }

      const list = new St.BoxLayout({vertical: true, style_class: 'tmt-slist'});
      board.sort((a, b) => b.total_seconds - a.total_seconds);
      board.forEach((e, i) => {
        const isTop3 = i < 3;
        const row = new St.BoxLayout({style_class: `tmt-lrow${isTop3 ? ' top' : ''}`});
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
        row.add_child(new St.Label({text: medal, style_class: 'tmt-lr'}));
        row.add_child(new St.Label({text: e.name || e.email, x_expand: true, style_class: 'tmt-lrn'}));
        row.add_child(new St.Label({text: fmtDur(e.total_seconds), style_class: 'tmt-lrt'}));
        list.add_child(row);
      });
      container.add_child(list);
    } catch {
      container.destroy_all_children();
      container.add_child(new St.Label({text: 'Could not load leaderboard.', style_class: 'tmt-emp tmt-err'}));
    }
  }

  async _loadFriends(container) {
    container.add_child(new St.Label({text: '...', style_class: 'tmt-emp'}));
    try {
      const [fr, rqr] = await Promise.all([
        this._api.getFriends(),
        this._api.getFriendRequests(),
      ]);
      const friends = fr?.friends ?? [];
      const requests = rqr?.requests ?? [];

      container.destroy_all_children();

      // Invite form
      const h = new St.BoxLayout({style_class: 'tmt-logh'});
      h.add_child(new St.Label({text: 'Friends', style_class: 'tmt-sh'}));
      h.add_child(new St.Label({text: `${friends.length}`, style_class: 'tmt-logo'}));
      container.add_child(h);

      const inviteRow = new St.BoxLayout({style_class: 'tmt-ar'});
      const inviteInput = this._input('Email to invite...');
      inviteRow.add_child(inviteInput);
      const sendBtn = this._sbtn('Send', 'go', async () => {
        const email = inviteInput.get_text()?.trim();
        if (!email) return;
        try {
          await this._api.sendFriendRequest(email);
          inviteInput.set_text('');
          this._renderSocialContent();
        } catch (e) {
          this._showError(e.message);
        }
      });
      inviteRow.add_child(sendBtn);
      container.add_child(inviteRow);

      // Pending incoming requests
      const currentUserId = this._api._auth?.user?.id;
      const incoming = requests.filter(r => r.status === 'pending' && r.recipient_id === currentUserId);
      if (incoming.length > 0) {
        const sec = this._section('Pending Requests');
        for (const req of incoming) {
          const rrow = this._row();
          rrow.add_child(new St.Label({text: req.recipient_email, x_expand: true, style_class: 'tmt-frn'}));
          const acc = this._sbtn('✓', 'go', async () => {
            try {
              await this._api.respondToFriendRequest(req.id, 'accepted');
              this._renderSocialContent();
            } catch (e) { this._showError(e.message); }
          });
          rrow.add_child(acc);
          const rej = this._sbtn('✕', 'st', async () => {
            try {
              await this._api.respondToFriendRequest(req.id, 'rejected');
              this._renderSocialContent();
            } catch (e) { this._showError(e.message); }
          });
          rrow.add_child(rej);
          sec.add_child(rrow);
        }
        container.add_child(sec);
      }

      // Friends list
      const fsec = this._section('Your Friends');
      if (friends.length > 0) {
        for (const f of friends) {
          const frow = this._row();
          frow.add_child(new St.Label({
            text: f.friend?.email ?? 'Unknown',
            x_expand: true,
            style_class: 'tmt-frn',
          }));
          const rm = this._sbtn('✕', 'st', async () => {
            try {
              await this._api.removeFriend(f.id);
              this._renderSocialContent();
            } catch (e) { this._showError(e.message); }
          });
          frow.add_child(rm);
          fsec.add_child(frow);
        }
      } else {
        fsec.add_child(new St.Label({text: 'No friends yet.', style_class: 'tmt-emp'}));
      }
      container.add_child(fsec);
    } catch {
      container.destroy_all_children();
      container.add_child(new St.Label({text: 'Could not load friends.', style_class: 'tmt-emp tmt-err'}));
    }
  }

  async _loadGroups(container) {
    container.add_child(new St.Label({text: '...', style_class: 'tmt-emp'}));
    try {
      const r = await this._api.getGroups();
      const groups = r?.groups ?? [];

      container.destroy_all_children();

      // Header + create form
      const h = new St.BoxLayout({style_class: 'tmt-logh'});
      h.add_child(new St.Label({text: 'Groups', style_class: 'tmt-sh'}));
      h.add_child(new St.Label({text: `${groups.length}`, style_class: 'tmt-logo'}));
      container.add_child(h);

      const createRow = new St.BoxLayout({style_class: 'tmt-ar'});
      const createInput = this._input('Group name...');
      createRow.add_child(createInput);
      const createBtn = this._sbtn('Create', 'go', async () => {
        const name = createInput.get_text()?.trim();
        if (!name) return;
        try {
          await this._api.createGroup(name, '');
          createInput.set_text('');
          this._renderSocialContent();
        } catch (e) { this._showError(e.message); }
      });
      createRow.add_child(createBtn);
      container.add_child(createRow);

      if (!groups.length) {
        container.add_child(new St.Label({text: 'No groups yet. Create one above.', style_class: 'tmt-emp'}));
        return;
      }

      const list = new St.BoxLayout({vertical: true, style_class: 'tmt-slist'});
      for (const g of groups) {
        const groupBox = new St.BoxLayout({vertical: true, style_class: 'tmt-grp'});

        const head = new St.BoxLayout({style_class: 'tmt-grph'});
        head.add_child(new St.Label({text: g.name, x_expand: true, style_class: 'tmt-grpt'}));
        head.add_child(new St.Label({text: `${g.group_members?.length ?? 0} members`, style_class: 'tmt-grpc'}));
        groupBox.add_child(head);

        // Members (if available)
        if (g.group_members?.length > 0) {
          const mlist = new St.BoxLayout({vertical: true, style_class: 'tmt-grpd'});
          g.group_members.forEach(m => {
            const mrow = new St.BoxLayout({style_class: 'tmt-mrow'});
            mrow.add_child(new St.Label({text: m.profile?.email ?? m.user_id, x_expand: true, style_class: 'tmt-mrn'}));
            mrow.add_child(new St.Label({text: m.role, style_class: 'tmt-mrr'}));
            mlist.add_child(mrow);
          });
          groupBox.add_child(mlist);
        }

        // Delete button
        const del = this._sbtn('Delete Group', 'st', async () => {
          try {
            await this._api.deleteGroup(g.id);
            this._renderSocialContent();
          } catch (e) { this._showError(e.message); }
        });
        groupBox.add_child(del);
        list.add_child(groupBox);
      }
      container.add_child(list);
    } catch {
      container.destroy_all_children();
      container.add_child(new St.Label({text: 'Could not load groups.', style_class: 'tmt-emp tmt-err'}));
    }
  }

  // ── Blocker Tab ───────────────────────────────────────────

  _renderBlocker() {
    const box = new St.BoxLayout({vertical: true, style_class: 'tmt-cnt'});
    const bl = this._blocker;

    const h = new St.BoxLayout({style_class: 'tmt-logh'});
    h.add_child(new St.Label({text: 'Site Blocker', style_class: 'tmt-sh'}));
    const badge = new St.Label({text: bl.on ? 'Active' : 'Off', style_class: `tmt-bd${bl.on ? ' on' : ''}`});
    h.add_child(badge);
    box.add_child(h);

    box.add_child(new St.Label({
      text: `Block all websites except those on your greenlist. ${bl.list.length} domain${bl.list.length !== 1 ? 's' : ''} currently allowed.`,
      style_class: 'tmt-desc',
    }));

    const toggle = this._btn(bl.on ? 'Deactivate' : 'Activate', bl.on ? 'st' : 'go', async () => {
      try {
        await bl.toggle();
        this._renderBlocker();
      } catch (e) {
        this._showError(`Blocker failed: ${e.message}. Is pkexec/nft installed?`);
      }
    });
    box.add_child(toggle);

    if (bl.list.length > 0) {
      const glist = new St.BoxLayout({vertical: true, style_class: 'tmt-glist'});
      bl.list.forEach((d, i) => {
        const r = new St.BoxLayout({style_class: 'tmt-drow'});
        r.add_child(new St.Label({text: d, x_expand: true, style_class: 'tmt-dname'}));
        const rm = new St.Button({label: '✕', style_class: 'tmt-rm'});
        rm.connect('clicked', () => {
          bl.list = bl.list.filter((_, j) => j !== i);
          this._renderBlocker();
        });
        r.add_child(rm);
        glist.add_child(r);
      });
      box.add_child(glist);
    } else {
      box.add_child(new St.Label({text: 'No domains allowed. Everything will be blocked.', style_class: 'tmt-emp'}));
    }

    const addRow = new St.BoxLayout({style_class: 'tmt-ar'});
    const addInput = this._input('domain.com');
    addRow.add_child(addInput);
    const addBtn = this._sbtn('Add', 'go', () => {
      const t = addInput.get_text()?.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '') ?? '';
      if (t && !bl.list.includes(t)) {
        bl.list = [...bl.list, t];
        this._renderBlocker();
      }
      addInput.set_text('');
    });
    addRow.add_child(addBtn);
    box.add_child(addRow);

    this._content.add_child(box);
  }

  // ── Settings Tab ──────────────────────────────────────────

  _renderSettings() {
    const box = new St.BoxLayout({vertical: true, style_class: 'tmt-cnt'});
    const settings = this._api.settings;
    const durations = settings.durations ?? DEFAULT_DURATIONS;

    // Backend URL
    const urlSec = this._section('Backend URL');
    const urlInput = this._input('http://localhost:4000');
    urlInput.set_text(settings.backendUrl ?? DEFAULT_BACKEND);
    urlSec.add_child(urlInput);
    box.add_child(urlSec);

    // Durations
    const durSec = this._section('Timer Durations (minutes)');
    const durGrid = new St.BoxLayout({style_class: 'tmt-dur-grid'});
    const durInputs = {};
    MODES.forEach(m => {
      const dbox = new St.BoxLayout({vertical: true, style_class: 'tmt-dur-item'});
      dbox.add_child(new St.Label({text: m, style_class: 'tmt-dur-label'}));
      const inp = new St.Entry({
        text: String(durations[m] ?? DEFAULT_DURATIONS[m] ?? 25),
        style_class: 'tmt-in tmt-dur-in',
        can_focus: true,
      });
      durInputs[m] = inp;
      dbox.add_child(inp);
      durGrid.add_child(dbox);
    });
    durSec.add_child(durGrid);
    box.add_child(durSec);

    // Account info
    const acctSec = this._section('Account');
    const userBox = new St.BoxLayout({style_class: 'tmt-userbox'});
    userBox.add_child(new St.Label({text: this._api.userEmail, style_class: 'tmt-user'}));
    acctSec.add_child(userBox);
    box.add_child(acctSec);

    // Save button
    const saveBtn = this._btn('Save', 'go', () => {
      const newUrl = urlInput.get_text()?.trim() || DEFAULT_BACKEND;
      const newDurations = {};
      MODES.forEach(m => {
        const v = parseInt(durInputs[m].get_text());
        newDurations[m] = v > 0 ? v : DEFAULT_DURATIONS[m];
      });
      this._api.saveSettings({backendUrl: newUrl, durations: newDurations});
      saveBtn.label = 'Saved!';
      GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1500, () => {
        saveBtn.label = 'Save';
        return GLib.SOURCE_REMOVE;
      });
    });
    box.add_child(saveBtn);

    // Sign out
    const logoutBtn = this._btn('Sign Out', 'st', () => {
      this._timer.stop();
      this._api.clearAuth();
      this._subjects = [];
      this._render();
    });
    box.add_child(logoutBtn);

    this._content.add_child(box);
  }

  // ── Cleanup ──

  destroy() {
    this._timer.destroy();
  }
}

// ── Panel Indicator ────────────────────────────────────────

var Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
  _init(path) {
    super._init(0.0, 'Tamatem', false);

    this._box = new St.BoxLayout({
      style_class: 'panel-status-menu-box',
    });

    const iconPath = Gio.File.new_for_path(`${path}/tamatem-icon.svg`);
    const gicon = Gio.Icon.new_for_string(iconPath.get_path());

    this._icon = new St.Icon({
      gicon,
      style_class: 'system-status-icon',
    });
    this._box.add_child(this._icon);

    this._label = new St.Label({
      text: '',
      style_class: 'tmt-panel',
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER,
    });
    this._label.hide();
    this._box.add_child(this._label);

    this.add_child(this._box);
  }

  setTimerLabel(t) {
    if (!this._label || this._label.already_disposed) return;
    if (t) {
      this._label.set_text(t);
      this._label.show();
    } else {
      this._label.hide();
    }
  }
});

// ── Extension Entry ────────────────────────────────────────

export default class TamatemExtension extends Extension {
  enable() {
    this._api = new Api();
    this._api.loadAuth();
    this._api.loadSettings();
    this._api.loadSubjectsCache();

    this._blocker = new Blocker().load();
    this._timer = new TimerState().load();

    this._indicator = new Indicator(this.path);
    Main.panel.addToStatusArea('tamatem', this._indicator, 1, 'right');

    this._popup = new TamatemPopup(this._indicator, this._api, this._blocker, this._timer);

    // Show timer on indicator if running
    if (this._timer.isRunning) {
      this._timer.onComplete(() => this._popup._onTimerComplete());
      this._timer.tick((remaining) => {
        this._indicator.setTimerLabel(fmt(remaining));
      });
      this._indicator.setTimerLabel(fmt(this._timer.remaining));
    }
  }

  disable() {
    if (this._popup) {
      this._popup.destroy();
      this._popup = null;
    }
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
    if (this._timer) {
      this._timer.destroy();
      this._timer = null;
    }
    this._api = null;
    this._blocker = null;
  }
}
