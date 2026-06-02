import type { GroupItem, FriendItem, FriendRequestItem, LeaderboardEntry } from "../../lib/types";
import { getGroups, createGroup, deleteGroup, getFriends, getFriendRequests, sendFriendRequest, respondToFriendRequest, removeFriend, getLeaderboard, getFriendsLeaderboard, getGroupLeaderboard } from "../../lib/api";
import { getAuth } from "../../lib/storage";

// ── Render Tab ──────────────────────────────────────────

function renderSocialTab(container: HTMLElement): void {
  container.innerHTML = `
    <div class="social-tab">
      <div class="social-nav">
        <button class="social-nav-btn active" data-social-tab="leaderboard">Leaderboard</button>
        <button class="social-nav-btn" data-social-tab="friends">Friends</button>
        <button class="social-nav-btn" data-social-tab="groups">Groups</button>
      </div>
      <div id="social-content"></div>
    </div>
  `;

  document.querySelectorAll(".social-nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".social-nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.getAttribute("data-social-tab")!;
      loadSocialTab(tab);
    });
  });

  loadSocialTab("leaderboard");
}

function loadSocialTab(tab: string) {
  const content = document.getElementById("social-content")!;
  content.innerHTML = `<div class="loading-screen"><div class="spinner"></div></div>`;

  if (tab === "leaderboard") loadLeaderboard(content);
  else if (tab === "friends") loadFriends(content);
  else if (tab === "groups") loadGroups(content);
}

// ── Leaderboard ─────────────────────────────────────────

type LeaderboardScope = { type: "global" } | { type: "friends" } | { type: "group"; group: GroupItem };

let leaderboardScope: LeaderboardScope = { type: "global" };
let cachedGroups: GroupItem[] = [];

async function loadLeaderboard(container: HTMLElement) {
  try {
    const [groupsResult] = await Promise.all([
      getGroups().catch(() => ({ groups: [] as GroupItem[] })),
    ]);
    cachedGroups = groupsResult.groups;

    const headerHtml = buildLeaderboardHeader(cachedGroups);
    container.innerHTML = headerHtml;
    attachLeaderboardSelectorEvents(container);

    const listContainer = container.querySelector("#leaderboard-list") as HTMLElement;
    if (listContainer) {
      await fetchLeaderboardData(listContainer);
    }
  } catch {
    container.innerHTML = `<p style="text-align:center;padding:24px;color:var(--text-tertiary);font-size:13px;">Could not load leaderboard.</p>`;
  }
}

function buildLeaderboardHeader(groups: GroupItem[]): string {
  const options = [`<option value="global">🌍 Global</option>`, `<option value="friends">👥 Friends</option>`];
  groups.forEach((g) => {
    options.push(`<option value="group-${g.id}">👤 ${g.name}</option>`);
  });

  const selectedValue =
    leaderboardScope.type === "global" ? "global" :
    leaderboardScope.type === "friends" ? "friends" :
    `group-${leaderboardScope.group.id}`;

  return `
    <div class="social-section">
      <div class="social-invite" style="margin-bottom:4px;">
        <select id="leaderboard-select" class="subject-select" style="flex:1;">
          ${options.join("")}
        </select>
      </div>
      <h3 class="social-section-title">Today's Leaderboard</h3>
      <div id="leaderboard-list"><div class="loading-screen"><div class="spinner"></div></div></div>
    </div>
  `;
}

function attachLeaderboardSelectorEvents(container: HTMLElement) {
  const select = container.querySelector("#leaderboard-select") as HTMLSelectElement;
  if (!select) return;
  select.value =
    leaderboardScope.type === "global" ? "global" :
    leaderboardScope.type === "friends" ? "friends" :
    `group-${leaderboardScope.group.id}`;

  select.addEventListener("change", async () => {
    const val = select.value;
    if (val === "global") leaderboardScope = { type: "global" };
    else if (val === "friends") leaderboardScope = { type: "friends" };
    else {
      const groupId = val.replace("group-", "");
      const group = cachedGroups.find((g) => g.id === groupId);
      if (group) leaderboardScope = { type: "group", group };
    }
    const listContainer = container.querySelector("#leaderboard-list") as HTMLElement;
    if (listContainer) {
      listContainer.innerHTML = `<div class="loading-screen"><div class="spinner"></div></div>`;
      await fetchLeaderboardData(listContainer);
    }
  });
}

async function fetchLeaderboardData(container: HTMLElement) {
  try {
    let leaderboard: LeaderboardEntry[];
    if (leaderboardScope.type === "global") {
      const res = await getLeaderboard();
      leaderboard = res.leaderboard;
    } else if (leaderboardScope.type === "friends") {
      const res = await getFriendsLeaderboard();
      leaderboard = res.leaderboard;
    } else {
      const res = await getGroupLeaderboard(leaderboardScope.group.id);
      leaderboard = res.leaderboard;
    }
    container.innerHTML = buildLeaderboardItems(leaderboard);
  } catch {
    container.innerHTML = `<p style="text-align:center;padding:24px;color:var(--text-tertiary);font-size:13px;">Could not load leaderboard.</p>`;
  }
}

function buildLeaderboardItems(leaderboard: LeaderboardEntry[]): string {
  if (!leaderboard.length) {
    return `<p style="text-align:center;padding:24px;color:var(--text-tertiary);font-size:13px;">No data yet.</p>`;
  }

  const items = leaderboard.map((entry, i) => {
    const hours = Math.floor(entry.total_seconds / 3600);
    const mins = Math.floor((entry.total_seconds % 3600) / 60);
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
    const isTop3 = i < 3;

    return `
      <div class="social-item ${isTop3 ? "social-item-top" : ""}">
        <span class="social-rank">${medal}</span>
        <span class="social-name">${entry.name || entry.email}</span>
        <span class="social-time">${timeStr}</span>
      </div>
    `;
  }).join("");

  return items;
}

// ── Friends ─────────────────────────────────────────────

async function loadFriends(container: HTMLElement) {
  try {
    const [friendsRes, requestsRes, auth] = await Promise.all([
      getFriends(),
      getFriendRequests(),
      getAuth(),
    ]);
    const currentUserId = auth?.user?.id || null;
    container.innerHTML = buildFriendsHtml(friendsRes.friends, requestsRes.requests, currentUserId);
    attachFriendEvents();
  } catch {
    container.innerHTML = `<p style="text-align:center;padding:24px;color:var(--text-tertiary);font-size:13px;">Could not load friends.</p>`;
  }
}

function buildFriendsHtml(friends: FriendItem[], requests: FriendRequestItem[], currentUserId: string | null): string {
  const pendingIncoming = requests.filter((r) => r.status === "pending" && r.recipient_id === currentUserId);
  const friendsList = friends.map((f) => `
    <div class="social-item" data-friend-id="${f.friend.id}">
      <span class="social-name">${f.friend.email}</span>
      <button class="social-action social-remove" data-action="remove-friend" data-friend-id="${f.friend.id}">✕</button>
    </div>
  `).join("");

  const incomingHtml = pendingIncoming.map((r) => `
    <div class="social-item social-request" data-request-id="${r.id}">
      <span class="social-name">${r.recipient_email}</span>
      <div class="social-request-actions">
        <button class="social-action social-accept" data-action="accept-request" data-request-id="${r.id}">✓</button>
        <button class="social-action social-reject" data-action="reject-request" data-request-id="${r.id}">✕</button>
      </div>
    </div>
  `).join("");

  return `
    <div class="social-section">
      <div class="social-invite">
        <input type="email" id="friend-email-input" placeholder="Email to invite..." />
        <button class="btn btn-primary" id="send-friend-request">Send</button>
      </div>
      ${incomingHtml ? `<h3 class="social-section-title">Pending Requests</h3>${incomingHtml}` : ""}
      <h3 class="social-section-title">Your Friends</h3>
      ${friendsList || `<p style="text-align:center;padding:24px;color:var(--text-tertiary);font-size:13px;">No friends yet.</p>`}
    </div>
  `;
}

function attachFriendEvents() {
  document.getElementById("send-friend-request")?.addEventListener("click", async () => {
    const input = document.getElementById("friend-email-input") as HTMLInputElement;
    const email = input.value.trim();
    if (!email) return;
    try {
      await sendFriendRequest(email);
      input.value = "";
      const content = document.getElementById("social-content")!;
      loadFriends(content);
    } catch (err: any) {
      alert(err.message ?? "Failed to send request");
    }
  });

  document.querySelectorAll("[data-action='accept-request']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = (btn as HTMLElement).dataset.requestId!;
      try {
        await respondToFriendRequest(id, "accepted");
        const content = document.getElementById("social-content")!;
        loadFriends(content);
      } catch (err: any) {
        alert(err.message);
      }
    });
  });

  document.querySelectorAll("[data-action='reject-request']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = (btn as HTMLElement).dataset.requestId!;
      try {
        await respondToFriendRequest(id, "rejected");
        const content = document.getElementById("social-content")!;
        loadFriends(content);
      } catch (err: any) {
        alert(err.message);
      }
    });
  });

  document.querySelectorAll("[data-action='remove-friend']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const friendId = (btn as HTMLElement).dataset.friendId!;
      try {
        await removeFriend(friendId);
        const content = document.getElementById("social-content")!;
        loadFriends(content);
      } catch (err: any) {
        alert(err.message);
      }
    });
  });
}

// ── Groups ──────────────────────────────────────────────

async function loadGroups(container: HTMLElement) {
  try {
    const { groups } = await getGroups();
    container.innerHTML = buildGroupsHtml(groups);
    attachGroupEvents();
  } catch {
    container.innerHTML = `<p style="text-align:center;padding:24px;color:var(--text-tertiary);font-size:13px;">Could not load groups.</p>`;
  }
}

function buildGroupsHtml(groups: GroupItem[]): string {
  const list = groups.map((g) => `
    <div class="social-item">
      <div class="social-group-info">
        <span class="social-name">${g.name}</span>
        <span class="social-subtitle">${g.group_members?.length || 0} members</span>
      </div>
      <button class="social-action social-remove" data-action="delete-group" data-group-id="${g.id}">✕</button>
    </div>
  `).join("");

  return `
    <div class="social-section">
      <div class="social-invite">
        <input type="text" id="group-name-input" placeholder="Group name..." />
        <button class="btn btn-primary" id="create-group-btn">Create</button>
      </div>
      <h3 class="social-section-title">Your Groups</h3>
      ${list || `<p style="text-align:center;padding:24px;color:var(--text-tertiary);font-size:13px;">No groups yet.</p>`}
    </div>
  `;
}

function attachGroupEvents() {
  document.getElementById("create-group-btn")?.addEventListener("click", async () => {
    const input = document.getElementById("group-name-input") as HTMLInputElement;
    const name = input.value.trim();
    if (!name) return;
    try {
      await createGroup(name);
      input.value = "";
      const content = document.getElementById("social-content")!;
      loadGroups(content);
    } catch (err: any) {
      alert(err.message ?? "Failed to create group");
    }
  });

  document.querySelectorAll("[data-action='delete-group']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const groupId = (btn as HTMLElement).dataset.groupId!;
      try {
        await deleteGroup(groupId);
        const content = document.getElementById("social-content")!;
        loadGroups(content);
      } catch (err: any) {
        alert(err.message);
      }
    });
  });
}
