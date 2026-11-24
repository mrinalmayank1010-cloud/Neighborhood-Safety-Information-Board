
// ============================================
// SAFE NEIGHBORHOOD - COMPLETE JAVASCRIPT
// HTML + CSS + JAVASCRIPT PROJECT
// ============================================

const KEYS = {
  posts: "sn_posts",
  users: "sn_users",
  notifications: "sn_notifications",
  session: "sn_session"
};

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";

function readData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const demoPosts = [
  {
    id: "demo1",
    title: "Streetlight Not Working",
    description: "The streetlight near the main park entrance is not working. Residents can report this issue to the local municipal office.",
    category: "Streetlight Problem",
    urgency: "Medium",
    location: "Green Park",
    source: "Municipal Notice",
    verified: true,
    status: "approved",
    author: "Community Admin",
    date: new Date().toISOString(),
    comments: [],
    reports: []
  },
  {
    id: "demo2",
    title: "Road Repair Work",
    description: "Road maintenance is taking place near the main market. Please check local traffic updates before travelling.",
    category: "Road Closure",
    urgency: "Low",
    location: "Main Market",
    source: "Resident Welfare Association",
    verified: true,
    status: "approved",
    author: "Community Admin",
    date: new Date(Date.now() - 3600000).toISOString(),
    comments: [],
    reports: []
  },
  {
    id: "demo3",
    title: "Community Safety Reminder",
    description: "Residents are encouraged to keep common areas well lit and report genuine safety concerns through appropriate channels.",
    category: "Other",
    urgency: "Low",
    location: "Central Area",
    source: "",
    verified: false,
    status: "approved",
    author: "Community Admin",
    date: new Date(Date.now() - 7200000).toISOString(),
    comments: [],
    reports: []
  }
];

let posts = readData(KEYS.posts, null);
if (!Array.isArray(posts)) {
  posts = demoPosts;
  saveData(KEYS.posts, posts);
}

let users = readData(KEYS.users, []);
let notifications = readData(KEYS.notifications, []);
let currentUser = readData(KEYS.session, null);
let isAdmin = false;
let authMode = "login";

// --------------------------------------------
// BASIC HELPERS
// --------------------------------------------

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function toast(message) {
  const box = document.getElementById("toast");
  box.textContent = message;
  box.style.display = "block";

  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    box.style.display = "none";
  }, 3000);
}

function dateText(date) {
  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function addNotification(message, user = "all") {
  notifications.unshift({
    id: uid(),
    message,
    user,
    date: new Date().toISOString(),
    read: false
  });

  notifications = notifications.slice(0, 100);
  saveData(KEYS.notifications, notifications);
  updateNotificationCount();
}

function updateNotificationCount() {
  const count = notifications.filter(n =>
    !n.read && (n.user === "all" || n.user === currentUser?.email)
  ).length;

  document.getElementById("notificationCount").textContent = count;
}

function publicPosts() {
  return posts.filter(p => p.status === "approved");
}

// --------------------------------------------
// AUTHENTICATION - RESIDENT
// --------------------------------------------

function openAuth() {
  if (currentUser) {
    if (confirm("You are logged in as " + currentUser.name + ". Logout?")) {
      logoutResident();
    }
    return;
  }

  document.getElementById("authModal").classList.add("show");
  setAuthMode("login");
}

function closeAuth() {
  document.getElementById("authModal").classList.remove("show");
}

function setAuthMode(mode) {
  authMode = mode;

  document.getElementById("authTitle").textContent =
    mode === "login" ? "Resident Login" : "Create Resident Account";

  document.getElementById("nameField").hidden = mode !== "register";

  document.getElementById("residentName").required =
    mode === "register";

  document.getElementById("authSubmit").textContent =
    mode === "login" ? "Login" : "Register";

  document.getElementById("loginTab").classList.toggle("active", mode === "login");
  document.getElementById("registerTab").classList.toggle("active", mode === "register");

  document.getElementById("authError").textContent = "";
}

document.getElementById("authForm").addEventListener("submit", event => {
  event.preventDefault();

  const email = document.getElementById("residentEmail").value.trim().toLowerCase();
  const password = document.getElementById("residentPassword").value;
  const error = document.getElementById("authError");

  if (authMode === "register") {
    const name = document.getElementById("residentName").value.trim();

    if (users.some(u => u.email === email)) {
      error.textContent = "This email is already registered.";
      return;
    }

    users.push({ id: uid(), name, email, password });
    saveData(KEYS.users, users);

    toast("Registration successful! Please login.");
    setAuthMode("login");
    document.getElementById("residentPassword").value = "";
    return;
  }

  const user = users.find(u =>
    u.email === email && u.password === password
  );

  if (!user) {
    error.textContent = "Incorrect email or password.";
    return;
  }

  currentUser = { name: user.name, email: user.email };
  saveData(KEYS.session, currentUser);

  closeAuth();
  updateAuthButton();
  toast("Welcome, " + user.name + "!");
});

function logoutResident() {
  currentUser = null;
  localStorage.removeItem(KEYS.session);
  updateAuthButton();
  toast("You have logged out.");
}

function updateAuthButton() {
  const button = document.getElementById("authButton");
  button.textContent = currentUser ? "👤 " + currentUser.name + " / Logout" : "Login";
}

function requireLogin() {
  if (!currentUser) {
    toast("Please login or register before continuing.");
    openAuth();
    return false;
  }
  return true;
}

// --------------------------------------------
// CREATE, EDIT AND DELETE POSTS
// --------------------------------------------

document.getElementById("postForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!requireLogin()) return;

  const post = {
    id: uid(),
    title: document.getElementById("postTitle").value.trim(),
    description: document.getElementById("postDescription").value.trim(),
    category: document.getElementById("postCategory").value,
    urgency: document.getElementById("postUrgency").value,
    location: document.getElementById("postLocation").value.trim(),
    source: document.getElementById("postSource").value.trim(),
    verified: false,
    status: "pending",
    author: currentUser.name,
    email: currentUser.email,
    date: new Date().toISOString(),
    comments: [],
    reports: []
  };

  posts.unshift(post);
  saveData(KEYS.posts, posts);

  addNotification(
    "Your post '" + post.title + "' is awaiting admin review.",
    currentUser.email
  );

  event.target.reset();
  renderAll();
  toast("Post submitted! Awaiting admin approval.");
});

function editPost(id) {
  if (!requireLogin()) return;

  const post = posts.find(p => p.id === id);

  if (!post || post.email !== currentUser.email) {
    toast("You can only edit your own posts.");
    return;
  }

  const title = prompt("Edit title:", post.title);
  if (title === null) return;
  if (!title.trim()) return toast("Title cannot be empty.");

  const description = prompt("Edit description:", post.description);
  if (description === null) return;

  post.title = title.trim();
  post.description = description.trim();
  post.status = "pending";
  post.verified = false;

  saveData(KEYS.posts, posts);
  renderAll();
  toast("Updated post sent for moderation again.");
}

function deleteOwnPost(id) {
  if (!requireLogin()) return;

  const post = posts.find(p => p.id === id);

  if (!post || post.email !== currentUser.email) {
    return toast("You can only delete your own posts.");
  }

  if (!confirm("Delete your post?")) return;

  posts = posts.filter(p => p.id !== id);
  saveData(KEYS.posts, posts);
  renderAll();
  toast("Post deleted.");
}

// --------------------------------------------
// PUBLIC ALERT DISPLAY AND SEARCH
// --------------------------------------------

function renderAlerts() {
  const search = document.getElementById("searchInput").value.toLowerCase().trim();
  const category = document.getElementById("categoryFilter").value;
  const urgency = document.getElementById("urgencyFilter").value;
  const location = document.getElementById("locationFilter").value;

  const filtered = publicPosts().filter(p => {
    const text = [p.title, p.description, p.category, p.location].join(" ").toLowerCase();

    return text.includes(search) &&
      (category === "All" || p.category === category) &&
      (urgency === "All" || p.urgency === urgency) &&
      (location === "All" || p.location === location);
  });

  const container = document.getElementById("alertList");

  if (!filtered.length) {
    container.innerHTML = '<div class="empty">No alerts found. Try changing your search filters.</div>';
    return;
  }

  container.innerHTML = filtered.map(p => {
    const ownPost = currentUser && p.email === currentUser.email;

    return `
      <article class="alert-card">
        <div class="card-top">
          <span class="pill category">${escapeHTML(p.category)}</span>
          <span class="pill ${p.urgency.toLowerCase()}">${escapeHTML(p.urgency)} Priority</span>
        </div>

        <h3>${escapeHTML(p.title)}</h3>
        <p>${escapeHTML(p.description)}</p>

        <div class="meta">
          <span>📍 ${escapeHTML(p.location)}</span>
          <span>🕒 ${escapeHTML(dateText(p.date))}</span>
        </div>

        <div class="meta">
          <span>${p.verified
            ? '<span class="pill verified">✓ Admin Verified Source</span>'
            : '<span class="pill unverified">Unverified Source</span>'}</span>
          <span>By: ${escapeHTML(p.author || "Resident")}</span>
        </div>

        ${p.source ? `<div class="meta">Source: ${escapeHTML(p.source)}</div>` : ""}

        <div class="card-actions">
          <a class="small-btn light" target="_blank" rel="noopener"
             href="https://www.openstreetmap.org/search?query=${encodeURIComponent(p.location)}">
             📍 View Map
          </a>
          <button class="small-btn report-btn" onclick="reportPost('${p.id}')">⚑ Report</button>
          ${ownPost ? `<button class="small-btn light" onclick="editPost('${p.id}')">Edit</button>
          <button class="small-btn danger" onclick="deleteOwnPost('${p.id}')">Delete</button>` : ""}
        </div>

        <div class="comment-box">
          <strong>💬 Comments (${p.comments.length})</strong>
          <div>
            ${p.comments.map(c => `
              <div class="comment-item"><b>${escapeHTML(c.name)}:</b> ${escapeHTML(c.text)}</div>
            `).join("")}
          </div>
          <input id="comment-${p.id}" maxlength="300" placeholder="Write a comment...">
          <button class="small-btn light" onclick="addComment('${p.id}')">Add Comment</button>
        </div>
      </article>
    `;
  }).join("");
}

["searchInput", "categoryFilter", "urgencyFilter"].forEach(id => {
  document.getElementById(id).addEventListener("input", renderAlerts);
});

document.getElementById("locationFilter").addEventListener("change", renderAlerts);

function updateStats() {
  const approved = publicPosts();

  document.getElementById("totalPosts").textContent = approved.length;
  document.getElementById("highPosts").textContent =
    approved.filter(p => p.urgency === "High").length;
  document.getElementById("areaCount").textContent =
    new Set(approved.map(p => p.location.toLowerCase())).size;
  document.getElementById("verifiedPosts").textContent =
    approved.filter(p => p.verified).length;
}

function updateLocationOptions() {
  const select = document.getElementById("locationFilter");
  const selected = select.value;

  const locations = [...new Set(publicPosts().map(p => p.location))].sort();

  select.innerHTML = '<option value="All">All Locations</option>' +
    locations.map(loc =>
      `<option value="${escapeHTML(loc)}">${escapeHTML(loc)}</option>`
    ).join("");

  if (locations.includes(selected)) select.value = selected;
}

// --------------------------------------------
// COMMENTS
// --------------------------------------------

function addComment(id) {
  if (!requireLogin()) return;

  const post = posts.find(p => p.id === id);
  if (!post || post.status !== "approved") return;

  const input = document.getElementById("comment-" + id);
  const text = input.value.trim();

  if (!text) return toast("Write a comment first.");

  post.comments.push({
    name: currentUser.name,
    text: text,
    email: currentUser.email
  });

  saveData(KEYS.posts, posts);
  renderAlerts();
  toast("Comment added successfully.");
}

// --------------------------------------------
// REPORT MISLEADING POSTS
// --------------------------------------------

function reportPost(id) {
  if (!requireLogin()) return;

  const post = posts.find(p => p.id === id);
  if (!post) return;

  if (post.email === currentUser.email) {
    return toast("You cannot report your own post.");
  }

  if (post.reports.some(r => r.email === currentUser.email)) {
    return toast("You have already reported this post.");
  }

  const reason = prompt("Why are you reporting this post?");

  if (!reason || !reason.trim()) return;

  post.reports.push({
    email: currentUser.email,
    reason: reason.trim()
  });

  saveData(KEYS.posts, posts);
  addNotification("A community post has been reported for admin review.", "all");

  renderAll();
  toast("Report submitted for administrator review.");
}

// --------------------------------------------
// LOCATION MAP LIST
// --------------------------------------------

function renderMap() {
  const container = document.getElementById("mapList");
  const approved = publicPosts();

  if (!approved.length) {
    container.innerHTML = '<div class="empty">No published locations yet.</div>';
    return;
  }

  container.innerHTML = approved.map(p => `
    <div class="map-card">
      <span class="pill category">${escapeHTML(p.category)}</span>
      <h3>📍 ${escapeHTML(p.location)}</h3>
      <p>${escapeHTML(p.title)}</p>
      <a class="map-link" target="_blank" rel="noopener"
         href="https://www.openstreetmap.org/search?query=${encodeURIComponent(p.location)}">
         Open location on map →
      </a>
    </div>
  `).join("");
}

// --------------------------------------------
// NOTIFICATIONS
// --------------------------------------------

function showNotifications() {
  document.getElementById("notifications").scrollIntoView({ behavior: "smooth" });

  const list = document.getElementById("notificationList");

  const visible = notifications.filter(n =>
    n.user === "all" || n.user === currentUser?.email
  );

  if (!visible.length) {
    list.innerHTML = '<div class="empty">No notifications available.</div>';
    return;
  }

  list.innerHTML = visible.map(n => `
    <div class="notification-item ${n.read ? "" : "unread"}">
      ${escapeHTML(n.message)}
      <div class="muted small">${escapeHTML(dateText(n.date))}</div>
    </div>
  `).join("");

  notifications.forEach(n => {
    if (n.user === "all" || n.user === currentUser?.email) n.read = true;
  });

  saveData(KEYS.notifications, notifications);
  updateNotificationCount();
}

function clearNotifications() {
  notifications = notifications.filter(n =>
    n.user !== "all" && n.user !== currentUser?.email
  );

  saveData(KEYS.notifications, notifications);
  document.getElementById("notificationList").innerHTML =
    '<div class="empty">Notifications cleared.</div>';

  updateNotificationCount();
}

// --------------------------------------------
// ADMIN LOGIN AND LOGOUT
// --------------------------------------------

document.getElementById("adminLoginForm").addEventListener("submit", event => {
  event.preventDefault();

  const username = document.getElementById("adminUsername").value.trim();
  const password = document.getElementById("adminPassword").value;

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    document.getElementById("adminError").textContent = "Invalid admin credentials.";
    return;
  }

  isAdmin = true;
  document.getElementById("adminLogin").hidden = true;
  document.getElementById("adminDashboard").hidden = false;

  renderAdmin();
  toast("Admin login successful.");
});

function adminLogout() {
  isAdmin = false;
  document.getElementById("adminLogin").hidden = false;
  document.getElementById("adminDashboard").hidden = true;
  document.getElementById("adminLoginForm").reset();
  toast("Admin logged out.");
}

// --------------------------------------------
// ADMIN MODERATION
// --------------------------------------------

function renderAdmin() {
  if (!isAdmin) return;

  const pending = posts.filter(p => p.status === "pending");
  const approved = publicPosts();
  const rejected = posts.filter(p => p.status === "rejected");
  const reported = posts.filter(p => p.reports && p.reports.length > 0);

  document.getElementById("pendingCount").textContent = pending.length;
  document.getElementById("approvedCount").textContent = approved.length;
  document.getElementById("rejectedCount").textContent = rejected.length;

  renderAdminList("pendingList", pending);
  renderAdminList("approvedList", approved);
  renderAdminList("rejectedList", rejected);
  renderAdminList("reportedList", reported);
}

function renderAdminList(elementId, list) {
  const container = document.getElementById(elementId);

  if (!list.length) {
    container.innerHTML = '<div class="empty">No posts in this section.</div>';
    return;
  }

  container.innerHTML = list.map(p => {
    let actions = "";

    if (p.status === "pending") {
      actions += `
        <button class="approve" onclick="adminAction('${p.id}','approve')">✓ Approve</button>
        <button class="reject" onclick="adminAction('${p.id}','reject')">✕ Reject</button>
      `;
    }

    if (p.status === "approved") {
      actions += `
        <button class="verify-btn" onclick="adminAction('${p.id}','verify')">
          ${p.verified ? "Remove Verification" : "✓ Mark Verified"}
        </button>
      `;
    }

    if (p.status === "rejected") {
      actions += `
        <button class="approve" onclick="adminAction('${p.id}','approve')">Restore / Approve</button>
      `;
    }

    actions += `<button class="delete-btn" onclick="adminAction('${p.id}','delete')">Delete</button>`;

    const reportInfo = (p.reports || []).map(r =>
      `<div class="meta">Report: ${escapeHTML(r.reason)}</div>`
    ).join("");

    return `
      <div class="admin-card">
        <span class="pill category">${escapeHTML(p.category)}</span>
        <span class="pill ${p.status === "approved" ? "verified" : p.status === "rejected" ? "rejected" : "pending"}">${escapeHTML(p.status)}</span>
        <h4>${escapeHTML(p.title)}</h4>
        <p>${escapeHTML(p.description)}</p>
        <div class="meta">
          📍 ${escapeHTML(p.location)}<br>
          Priority: ${escapeHTML(p.urgency)}<br>
          Author: ${escapeHTML(p.author)}<br>
          Source: ${escapeHTML(p.source || "Not provided")}<br>
          Date: ${escapeHTML(dateText(p.date))}<br>
          Verification: ${p.verified ? "Verified" : "Not verified"}<br>
          Reports: ${(p.reports || []).length}
        </div>
        ${reportInfo}
        <div class="card-actions">${actions}</div>
      </div>
    `;
  }).join("");
}

function adminAction(id, action) {
  if (!isAdmin) return;

  const post = posts.find(p => p.id === id);
  if (!post) return;

  if (action === "approve") {
    if (!confirm("Approve this post?")) return;

    post.status = "approved";

    if (post.email) {
      addNotification("Your post '" + post.title + "' has been approved.", post.email);
    }

    toast("Post approved.");
  }

  if (action === "reject") {
    if (!confirm("Reject this post?")) return;

    post.status = "rejected";
    post.verified = false;

    if (post.email) {
      addNotification("Your post '" + post.title + "' was not approved.", post.email);
    }

    toast("Post rejected.");
  }

  if (action === "verify") {
    if (!post.source || !post.source.trim()) {
      return toast("A source or reference is required first.");
    }

    if (!confirm("Have you independently checked this source?")) return;

    post.verified = !post.verified;
    toast(post.verified ? "Source marked verified." : "Verification removed.");
  }

  if (action === "delete") {
    if (!confirm("Permanently delete this post?")) return;

    posts = posts.filter(p => p.id !== id);
    toast("Post deleted.");
  }

  saveData(KEYS.posts, posts);
  renderAll();
}

// --------------------------------------------
// RENDER ALL SECTIONS
// --------------------------------------------

function renderAll() {
  updateStats();
  updateLocationOptions();
  renderAlerts();
  renderMap();
  updateNotificationCount();

  if (isAdmin) renderAdmin();
}

// --------------------------------------------
// INITIALIZE WEBSITE
// --------------------------------------------

updateAuthButton();
renderAll();
