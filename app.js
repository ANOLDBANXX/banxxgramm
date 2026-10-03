const KEY = "banxxgram_posts_v3";

const users = [
  { u: "anold.banxx", i: "AB", l: "Kampala, Uganda", name: "Anold Banxx" },
  { u: "lynda.banxx", i: "LB", l: "Kampala", name: "Lynda" },
  { u: "sarah.styles", i: "SS", l: "Mityana", name: "Sarah" },
  { u: "john.daily", i: "JD", l: "Entebbe", name: "John" },
  { u: "kato.ug", i: "KU", l: "Uganda", name: "Kato" },
  { u: "queen_bee", i: "QB", l: "Kampala", name: "Queen Bee" }
];

const demo = [
  {
    id: "1",
    u: "anold.banxx",
    i: "AB",
    l: "Kampala, Uganda",
    text: "Welcome to Banxxgram! 🚀 Share • Connect • Be You.",
    likes: 24,
    liked: false,
    c: [
      ["lynda.banxx", "This is fire 🔥"],
      ["kato.ug", "Nice design!"]
    ],
    label: "BANXX",
    theme: ""
  },
  {
    id: "2",
    u: "sarah.styles",
    i: "SS",
    l: "Mityana",
    text: "New week, new designs ✨",
    likes: 51,
    liked: false,
    c: [],
    label: "STYLE",
    theme: "theme2"
  },
  {
    id: "3",
    u: "john.daily",
    i: "JD",
    l: "Entebbe",
    text: "Good vibes only 😎",
    likes: 87,
    liked: false,
    c: [],
    label: "VIBES",
    theme: "theme3"
  }
];

let posts = JSON.parse(localStorage.getItem(KEY) || "null") || demo;
const SUPABASE_URL = "https://pniuwblnrhybnkdggbim.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_I7QNLZO9Z5z73kRijjSLug_N58b9yXk";let currentUser = null;
let currentProfile = null;
let demoAccount = null;

/* =========================================================
   BANXXGRAM SUPABASE SETUP
   ========================================================= */

const SUPABASE_URL = "https://eeoyocbchcgxiafugyrx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YoDt1uYphw89Ri83UGkY-A_wV04ti33";
let sb = null;

async function initSupabase() {
  if (!window.supabase) {
    console.warn("Supabase library is not loaded. Operating in demo mode.");
    return false;
  }
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return true;
}

/* =========================================================
   PROFILE HELPERS
   ========================================================= */

async function loadCurrentProfile() {
  if (!sb || !currentUser) return null;

  const profileResult = await sb
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (profileResult.error) {
    console.error("Could not load profile:", profileResult.error);
    currentProfile = null;
    return null;
  }

  currentProfile = profileResult.data;
  return currentProfile;
}

function getDisplayName() {
  if (demoAccount) return demoAccount.name;
  if (currentProfile?.full_name) return currentProfile.full_name;
  if (currentUser?.user_metadata?.full_name) return currentUser.user_metadata.full_name;
  return "Guest User";
}

function getUsername() {
  if (demoAccount) return demoAccount.u;
  if (currentProfile?.username) return currentProfile.username;
  if (currentUser?.user_metadata?.username) return currentUser.user_metadata.username;
  return "guest";
}

function getInitials() {
  if (demoAccount) return demoAccount.i;
  const name = getDisplayName() || getUsername();
  if (!name) return "GU";
  const parts = name.replace("@", "").trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.replace("@", "").slice(0, 2).toUpperCase();
}

/* =========================================================
   UPDATE UI ELEMENTS
   ========================================================= */

function updateCurrentUserUI() {
  const displayName = getDisplayName();
  const username = getUsername();
  const initials = getInitials();

  const sideDisplayName = document.getElementById("sideDisplayName");
  const sideUsername = document.getElementById("sideUsername");
  const sideAvatar = document.getElementById("sideAvatar");

  const profileUsername = document.getElementById("profileUsername");
  const profileBio = document.getElementById("profileBio");
  const profileAvatar = document.getElementById("profileAvatar");

  if (sideDisplayName) sideDisplayName.textContent = displayName;
  if (sideUsername) sideUsername.textContent = "@" + username;

  if (profileUsername) profileUsername.textContent = "@" + username;
  if (profileBio) profileBio.textContent = demoAccount ? "Demo User Account" : (currentProfile?.bio || "No bio added yet.");

  if (sideAvatar) {
    sideAvatar.textContent = initials;
    sideAvatar.style.backgroundImage = currentProfile?.avatar_url ? `url("${currentProfile.avatar_url}")` : "";
  }

  if (profileAvatar) {
    profileAvatar.textContent = initials;
    profileAvatar.style.backgroundImage = currentProfile?.avatar_url ? `url("${currentProfile.avatar_url}")` : "";
  }

  const headerSignInBtn = document.getElementById("headerSignInBtn");
  const headerSignUpBtn = document.getElementById("headerSignUpBtn");

  if (headerSignInBtn && headerSignUpBtn) {
    if (currentUser || demoAccount) {
      headerSignInBtn.textContent = "Switch Account";
      headerSignUpBtn.textContent = "Log Out";
    } else {
      headerSignInBtn.textContent = "Sign In";
      headerSignUpBtn.textContent = "Sign Up";
    }
  }
}

function renderEmptyProfile() {
  demoAccount = null;
  currentUser = null;
  currentProfile = null;

  const postCount = document.getElementById("postCount");
  const followerCount = document.getElementById("followerCount");
  const followingCount = document.getElementById("followingCount");

  if (postCount) postCount.textContent = "0";
  if (followerCount) followerCount.textContent = "0";
  if (followingCount) followingCount.textContent = "0";

  updateCurrentUserUI();
}

/* =========================================================
   MODALS & AUTH HANDLING
   ========================================================= */

function openAuthModal() {
  const modal = document.getElementById("authModal");
  if (modal) modal.classList.remove("hidden");
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (modal) modal.classList.add("hidden");
}

function setupModalEvents() {
  const closeBtn = document.getElementById("closeAuthModal");
  const headerSignInBtn = document.getElementById("headerSignInBtn");
  const headerSignUpBtn = document.getElementById("headerSignUpBtn");
  const modalSignInBtn = document.getElementById("modalSignInBtn");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeAuthModal);
  }

  if (headerSignInBtn) {
    headerSignInBtn.addEventListener("click", () => openAuthModal());
  }

  if (headerSignUpBtn) {
    headerSignUpBtn.addEventListener("click", () => {
      if (currentUser || demoAccount) {
        signOut();
      } else {
        openAuthModal();
      }
    });
  }

  if (modalSignInBtn) {
    modalSignInBtn.addEventListener("click", signIn);
  }

  document.querySelectorAll(".chip[data-user]").forEach(chip => {
    chip.addEventListener("click", () => {
      const targetUserKey = chip.dataset.user;
      const targetUser = users.find(u => u.u.startsWith(targetUserKey));

      if (targetUser) {
        demoAccount = targetUser;
        updateCurrentUserUI();
        renderProfile();
        closeAuthModal();
        toast(`Switched to demo user @${targetUser.u}`);
      }
    });
  });
}

async function signIn() {
  if (!sb) {
    toast("Supabase is not connected.");
    return;
  }

  const email = document.getElementById("authEmail")?.value.trim();
  const password = document.getElementById("authPassword")?.value;

  if (!email || !password) {
    toast("Enter your email and password.");
    return;
  }

  const result = await sb.auth.signInWithPassword({ email, password });

  if (result.error) {
    toast(result.error.message);
    return;
  }

  currentUser = result.data.user;
  demoAccount = null;
  await loadCurrentProfile();
  updateCurrentUserUI();
  renderProfile();
  closeAuthModal();
  toast("Welcome back!");
}

async function signOut() {
  if (sb && currentUser) {
    await sb.auth.signOut();
  }

  renderEmptyProfile();
  renderProfile();
  toast("Signed out successfully.");
}

/* =========================================================
   UTILITIES
   ========================================================= */

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(posts));
}

function toast(message) {
  const element = document.getElementById("toast");
  if (!element) return;

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(window.__banxxToast);
  window.__banxxToast = setTimeout(() => {
    element.classList.remove("show");
  }, 2600);
}

function showSection(section) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("active", page.id === section);
  });

  document.querySelectorAll("[data-section]").forEach(button => {
    button.classList.toggle("active", button.dataset.section === section);
  });
}

/* =========================================================
   DOM RENDERING & NAVIGATION
   ========================================================= */

document.querySelectorAll("[data-section]").forEach(button => {
  button.addEventListener("click", () => showSection(button.dataset.section));
});

function renderStories() {
  const container = document.getElementById("stories");
  if (!container) return;

  container.innerHTML = `
    <div class="story"><div class="avatar">AB</div><span>Your story</span></div>
    <div class="story"><div class="avatar">LB</div><span>Lynda</span></div>
    <div class="story"><div class="avatar">SS</div><span>Sarah</span></div>
    <div class="story"><div class="avatar">JD</div><span>John</span></div>
  `;
}

function renderFeed() {
  const feed = document.getElementById("feed");
  if (!feed) return;

  if (!posts.length) {
    feed.innerHTML = `<div class="card page-card"><p class="muted">No posts yet.</p></div>`;
    return;
  }

  feed.innerHTML = posts.map(post => {
    const comments = (post.c || []).map(comment => `
      <div class="comment">
        <strong>@${esc(comment[0])}</strong>
        <span>${esc(comment[1])}</span>
      </div>
    `).join("");

    let mediaHtml = "";
    if (post.media) {
      if (post.media.type && post.media.type.startsWith("video/")) {
        mediaHtml = `<video class="post-image" src="${esc(post.media.url)}" controls></video>`;
      } else {
        mediaHtml = `<img class="post-image" src="${esc(post.media.url)}" alt="Post media">`;
      }
    } else if (post.image) {
      mediaHtml = `<img class="post-image" src="${esc(post.image)}" alt="Post image">`;
    }

    return `
      <article class="card post ${esc(post.theme || "")}" data-id="${esc(post.id)}">
        <div class="post-head">
          <div class="avatar">${esc(post.i || "GU")}</div>
          <div>
            <strong>@${esc(post.u)}</strong>
            <small>${esc(post.l || "")}</small>
          </div>
        </div>

        <div class="post-label">${esc(post.label || "BANXX")}</div>
        <p class="post-text">${esc(post.text || "")}</p>
        ${mediaHtml}

        <div class="post-actions">
          <button class="like-btn" data-like="${esc(post.id)}">
            ${post.liked ? "♥" : "♡"} ${post.likes || 0}
          </button>
          <button class="comment-btn" data-comment="${esc(post.id)}">
            💬 ${(post.c || []).length}
          </button>
        </div>

        <div class="comments">${comments}</div>

        <div class="comment-form" data-form="${esc(post.id)}" style="display:none;">
          <input type="text" placeholder="Write a comment..." maxlength="200">
          <button class="btn primary" data-send-comment="${esc(post.id)}">Send</button>
        </div>
      </article>
    `;
  }).join("");

  attachFeedEvents();
}

function attachFeedEvents() {
  document.querySelectorAll("[data-like]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.like;
      const post = posts.find(item => item.id === id);
      if (!post) return;

      post.liked = !post.liked;
      post.likes = Math.max(0, (post.likes || 0) + (post.liked ? 1 : -1));
      save();
      renderFeed();
    });
  });

  document.querySelectorAll("[data-comment]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.comment;
      const form = document.querySelector(`[data-form="${id}"]`);
      if (form) {
        form.style.display = form.style.display === "none" ? "flex" : "none";
      }
    });
  });

  document.querySelectorAll("[data-send-comment]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.sendComment;
      const form = document.querySelector(`[data-form="${id}"]`);
      if (!form) return;

      const input = form.querySelector("input");
      const text = input.value.trim();

      if (!text) {
        toast("Write a comment first.");
        return;
      }

      const post = posts.find(item => item.id === id);
      if (!post) return;

      post.c = post.c || [];
      post.c.push([getUsername(), text]);
      input.value = "";

      save();
      renderFeed();
    });
  });
}

function renderSuggestions() {
  const container = document.getElementById("suggestions");
  if (!container) return;

  const activeUser = getUsername();
  container.innerHTML = users
    .filter(user => user.u !== activeUser)
    .slice(0, 5)
    .map(user => `
      <div class="suggestion-row" style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
        <div class="avatar">${esc(user.i)}</div>
        <div>
          <strong>@${esc(user.u)}</strong><br>
          <small class="muted">${esc(user.l)}</small>
        </div>
      </div>
    `).join("");
}

function renderProfile() {
  const grid = document.getElementById("profileGrid");
  const postCount = document.getElementById("postCount");
  const userName = getUsername();

  const myPosts = posts.filter(post => post.u === userName);
  if (postCount) postCount.textContent = myPosts.length;

  if (grid) {
    if (!myPosts.length) {
      grid.innerHTML = `<div class="muted">You have not created any posts yet.</div>`;
    } else {
      grid.innerHTML = myPosts.map(post => {
        let mediaContent = "";
        if (post.media) {
          mediaContent = post.media.type.startsWith("video/")
            ? `<video src="${esc(post.media.url)}"></video>`
            : `<img src="${esc(post.media.url)}" alt="Post">`;
        } else if (post.image) {
          mediaContent = `<img src="${esc(post.image)}" alt="Post">`;
        } else {
          mediaContent = `<div class="profile-tile-text">${esc(post.text || "")}</div>`;
        }

        return `<div class="profile-tile">${mediaContent}</div>`;
      }).join("");
    }
  }
}

/* =========================================================
   SEARCH & POST PUBLISHING
   ========================================================= */

function doSearch(value) {
  const results = document.getElementById("results");
  if (!results) return;

  const query = value.trim().toLowerCase();
  if (!query) {
    results.className = "results empty";
    results.textContent = "Start typing to search.";
    return;
  }

  const matches = users.filter(user => user.u.toLowerCase().includes(query));
  if (!matches.length) {
    results.className = "results empty";
    results.textContent = "No users found.";
    return;
  }

  results.className = "results";
  results.innerHTML = matches.map(user => `
    <div class="suggestion-row" style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
      <div class="avatar">${esc(user.i)}</div>
      <div>
        <strong>@${esc(user.u)}</strong><br>
        <small class="muted">${esc(user.l)}</small>
      </div>
    </div>
  `).join("");
}

const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", e => doSearch(e.target.value));
}

const globalSearch = document.getElementById("globalSearch");
if (globalSearch) {
  globalSearch.addEventListener("input", e => {
    if (e.target.value.trim()) {
      showSection("search");
      if (searchInput) searchInput.value = e.target.value;
      doSearch(e.target.value);
    }
  });
}

const postImage = document.getElementById("postImage");
if (postImage) {
  postImage.addEventListener("change", e => {
    const file = e.target.files?.[0];
    const previewEl = document.getElementById("imagePreview");

    if (!file) {
      previewMedia = null;
      if (previewEl) previewEl.textContent = "No file selected";
      return;
    }

    const reader = new FileReader();
    reader.onload = evt => {
      previewMedia = {
        url: evt.target.result,
        type: file.type
      };

      if (previewEl) {
        previewEl.innerHTML = file.type.startsWith("video/")
          ? `<video src="${esc(previewMedia.url)}" controls></video>`
          : `<img src="${esc(previewMedia.url)}" alt="Preview">`;
      }
    };
    reader.readAsDataURL(file);
  });
}

const publishBtn = document.getElementById("publishBtn");
if (publishBtn) {
  publishBtn.addEventListener("click", () => {
    const textInput = document.getElementById("postText");
    const text = textInput?.value.trim();

    if (!text && !previewMedia) {
      toast("Write a caption or attach media first");
      return;
    }

    posts.unshift({
      id: "p" + Date.now(),
      u: getUsername(),
      i: getInitials(),
      l: currentProfile?.location || "Kampala, Uganda",
      text: text || "",
      likes: 0,
      liked: false,
      c: [],
      label: "BANXX",
      media: previewMedia,
      theme: ""
    });

    save();

    if (textInput) textInput.value = "";
    if (postImage) postImage.value = "";
    previewMedia = null;

    const previewEl = document.getElementById("imagePreview");
    if (previewEl) previewEl.textContent = "No file selected";

    renderFeed();
    renderProfile();
    showSection("home");
    toast("Post shared!");
  });
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

setupModalEvents();
renderStories();
renderFeed();
renderSuggestions();
renderProfile();

(async () => {
  try {
    const connected = await initSupabase();

    if (connected && sb) {
      const sessionResult = await sb.auth.getSession();
      currentUser = sessionResult.data?.session?.user || null;

      if (currentUser) {
        await loadCurrentProfile();
      }

      updateCurrentUserUI();
      renderProfile();

      sb.auth.onAuthStateChange(async (_event, session) => {
        currentUser = session?.user || null;
        currentProfile = null;

        if (currentUser) {
          await loadCurrentProfile();
        }

        updateCurrentUserUI();
        renderProfile();
        renderSuggestions();
      });
    }
  } catch (err) {
    console.warn("Operating in fallback mode:", err);
  }
})();
