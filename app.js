// ==========================================
// 1. SUPABASE INITIALIZATION
// ==========================================
const SUPABASE_URL = 'https://pniuwblnrhybnkdggbim.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuaXV3Ymxucmh5Ym5rZGdnYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTAzNzEsImV4cCI6MjEwNjA4NjM3MX0.iTfeaEeLjQqhxSbVhMS30mNJ9eg9nRtSGUxdhHFyjOc';

let supabaseClient = null;
if (window.supabase && typeof window.supabase.createClient === 'function' && SUPABASE_URL.includes('https://')) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ==========================================
// 2. GLOBAL STATE
// ==========================================
let currentUser = {
  id: 'user-default-123',
  full_name: 'Anold Banxx',
  username: 'anold.banxx',
  bio: 'Creator & Developer',
  location: 'Kampala, Uganda',
  avatar_url: ''
};

let allPosts = [
  {
    id: 'demo-1',
    user_id: 'user-2',
    author: '@llynda.banxx',
    location: 'Kampala, Uganda',
    caption: 'Good vibes only ☀️ #Banxxgram #GoodVibes',
    media_url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1000',
    likes: 24,
    liked: false,
    saved: false,
    comments: ['Beautiful view!', 'Loving this content.']
  },
  {
    id: 'demo-2',
    user_id: 'user-3',
    author: '@sarah.styles',
    location: 'Mityana',
    caption: 'New week, new designs ✨ #Fashion #Kampala',
    media_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000',
    likes: 51,
    liked: false,
    saved: false,
    comments: ['Amazing outfit!']
  }
];

let activeCommentPostId = null;

// ==========================================
// 3. INITIALIZATION & LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupNavigation();
  setupModals();
  setupForms();
  setupSearch();
  setupSidebarAndWidgets();
});

async function initApp() {
  if (supabaseClient) {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session && session.user) {
        currentUser.id = session.user.id;
        await loadUserProfile();
      }
      await fetchSupabasePosts();
    } catch (e) {
      console.warn('Supabase offline or schema missing. Utilizing active local state.');
    }
  }
  updateUIWithUser(currentUser);
  renderPosts(allPosts);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function renderAvatar(element, avatarUrl, name = 'User') {
  if (!element) return;
  if (avatarUrl && avatarUrl.trim() !== '') {
    element.style.backgroundImage = `url('${avatarUrl}')`;
    element.style.backgroundSize = 'cover';
    element.style.backgroundPosition = 'center';
    element.textContent = '';
  } else {
    element.style.backgroundImage = 'none';
    const initials = name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
    element.textContent = initials || 'U';
  }
}

function updateUIWithUser(profile) {
  const fullName = profile.full_name || 'User';
  const username = `@${profile.username || 'user'}`;

  renderAvatar(document.getElementById('sidebarAvatar'), profile.avatar_url, fullName);
  renderAvatar(document.getElementById('createPostAvatar'), profile.avatar_url, fullName);
  renderAvatar(document.getElementById('profileAvatar'), profile.avatar_url, fullName);

  const profileUsernameEl = document.getElementById('profileUsername');
  const profileBioEl = document.getElementById('profileBio');
  if (profileUsernameEl) profileUsernameEl.textContent = username;
  if (profileBioEl) profileBioEl.textContent = profile.bio || 'Welcome to my profile!';

  const editFullName = document.getElementById('editFullName');
  const editUsername = document.getElementById('editUsername');
  const editBio = document.getElementById('editBio');
  if (editFullName) editFullName.value = profile.full_name || '';
  if (editUsername) editUsername.value = profile.username || '';
  if (editBio) editBio.value = profile.bio || '';
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPageId = item.getAttribute('data-page');
      if (!targetPageId) return;

      navItems.forEach(i => i.classList.remove('active'));
      pages.forEach(p => p.classList.remove('active'));

      document.querySelectorAll(`.nav-item[data-page="${targetPageId}"]`).forEach(btn => btn.classList.add('active'));
      const targetPage = document.getElementById(targetPageId);
      if (targetPage) targetPage.classList.add('active');
    });
  });
}

function setupModals() {
  const editModal = document.getElementById('editProfileModal');
  const createModal = document.getElementById('createPostModal');
  const commentsModal = document.getElementById('commentsModal');

  document.getElementById('openEditProfileBtn')?.addEventListener('click', () => editModal?.classList.remove('hidden'));
  document.getElementById('closeEditProfileBtn')?.addEventListener('click', () => editModal?.classList.add('hidden'));

  document.getElementById('openCreatePostBtn')?.addEventListener('click', () => createModal?.classList.remove('hidden'));
  document.getElementById('sidebarCreateBtn')?.addEventListener('click', () => createModal?.classList.remove('hidden'));
  document.getElementById('closeCreatePostBtn')?.addEventListener('click', () => createModal?.classList.add('hidden'));

  document.getElementById('closeCommentsBtn')?.addEventListener('click', () => commentsModal?.classList.add('hidden'));

  document.getElementById('switchAccountBtn')?.addEventListener('click', () => showToast('Sign In feature active!'));
  document.getElementById('logoutBtn')?.addEventListener('click', () => showToast('Sign Up feature active!'));

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.add('hidden');
    }
  });
}

function setupForms() {
  document.getElementById('editProfileForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    currentUser.full_name = document.getElementById('editFullName').value;
    currentUser.username = document.getElementById('editUsername').value;
    currentUser.bio = document.getElementById('editBio').value;
    
    updateUIWithUser(currentUser);
    document.getElementById('editProfileModal').classList.add('hidden');
    showToast('Profile updated!');
  });

  document.getElementById('createPostForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const caption = document.getElementById('postContent').value;
    const fileInput = document.getElementById('postMediaFile');
    
    createNewPost(caption, fileInput.files ? fileInput.files[0] : null);
    document.getElementById('createPostForm').reset();
    document.getElementById('createPostModal').classList.add('hidden');
  });

  document.getElementById('inlinePostBtn')?.addEventListener('click', () => {
    const input = document.getElementById('inlinePostContent');
    const fileInput = document.getElementById('inlineFileInput');
    if (!input.value.trim() && (!fileInput || !fileInput.files[0])) {
      showToast('Please enter text or select a photo.');
      return;
    }
    createNewPost(input.value, fileInput ? fileInput.files[0] : null);
    input.value = '';
    if (fileInput) fileInput.value = '';
  });

  document.getElementById('sendCommentBtn')?.addEventListener('click', () => {
    const input = document.getElementById('commentInput');
    if (!input.value.trim() || !activeCommentPostId) return;

    const post = allPosts.find(p => p.id === activeCommentPostId);
    if (post) {
      if (!post.comments) post.comments = [];
      post.comments.push(`@${currentUser.username}: ${input.value.trim()}`);
      input.value = '';
      openCommentsModal(post.id);
      renderPosts(allPosts);
      showToast('Comment posted!');
    }
  });
}

function createNewPost(caption, file) {
  const newPost = {
    id: 'post-' + Date.now(),
    user_id: currentUser.id,
    author: `@${currentUser.username}`,
    location: currentUser.location,
    caption: caption,
    media_url: file ? URL.createObjectURL(file) : '',
    likes: 0,
    liked: false,
    saved: false,
    comments: []
  };

  allPosts.unshift(newPost);
  renderPosts(allPosts);
  showToast('Post created successfully!');
}

function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    filterPosts(query);
  });
}

function filterPosts(query) {
  const filtered = allPosts.filter(p => 
    p.caption.toLowerCase().includes(query) || 
    p.author.toLowerCase().includes(query)
  );
  renderPosts(filtered);
}

function setupSidebarAndWidgets() {
  document.querySelectorAll('.story-item').forEach(item => {
    item.addEventListener('click', () => {
      showToast('Story feature clicked!');
    });
  });

  document.querySelectorAll('.btn-follow-outline').forEach(btn => {
    btn.addEventListener('click', function() {
      const followersEl = document.getElementById('followersCount');
      let currentFollowers = followersEl ? parseInt(followersEl.textContent) || 128 : 128;

      if (this.textContent === 'Follow') {
        this.textContent = 'Following';
        this.style.background = 'var(--accent-blue)';
        if (followersEl) followersEl.textContent = currentFollowers + 1;
      } else {
        this.textContent = 'Follow';
        this.style.background = 'transparent';
        if (followersEl) followersEl.textContent = Math.max(0, currentFollowers - 1);
      }
    });
  });

  document.querySelectorAll('.trending-item').forEach(item => {
    item.addEventListener('click', function() {
      const tag = this.querySelector('.trending-tag')?.textContent;
      if (tag) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = tag;
        filterPosts(tag.toLowerCase());
        showToast(`Filtered feed for ${tag}`);
      }
    });
  });
}

// ==========================================
// 4. RENDERING & ACTION HANDLERS
// ==========================================
function renderPosts(postsToRender) {
  const feedContainer = document.getElementById('feedContainer');
  const profileGrid = document.getElementById('profileGrid');
  const postCountEl = document.getElementById('postCount');

  if (feedContainer) feedContainer.innerHTML = '';
  if (profileGrid) profileGrid.innerHTML = '';

  postsToRender.forEach(post => {
    const card = document.createElement('div');
    card.className = 'feed-post-card';

    card.innerHTML = `
      <div class="post-card-header">
        <div class="post-author-info">
          <div class="avatar-sm">${post.author.substring(1, 3).toUpperCase()}</div>
          <div class="author-names">
            <strong>${post.author}</strong>
            <small>${post.location || 'Uganda'}</small>
          </div>
        </div>
        <span class="post-more-options" onclick="showToast('Options menu opened')">•••</span>
      </div>
      ${post.caption ? `<p class="post-caption-text">${post.caption}</p>` : ''}
      ${post.media_url ? `<img src="${post.media_url}" class="post-image-preview" data-post-id="${post.id}" alt="Post attachment">` : ''}
      <div class="post-action-bar">
        <div class="left-actions">
          <span class="action-item ${post.liked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
            ${post.liked ? '❤' : '♥'} ${post.likes}
          </span>
          <span class="action-item" onclick="openCommentsModal('${post.id}')">
            💬 ${(post.comments || []).length}
          </span>
          <span class="action-item" onclick="sharePost('${post.id}')">✈</span>
        </div>
        <span class="action-item" onclick="toggleSavePost('${post.id}')">
          ${post.saved ? '🔖 Saved' : '🔖'}
        </span>
      </div>
    `;

    feedContainer?.appendChild(card);
  });

  const myPosts = allPosts.filter(p => p.user_id === currentUser.id);
  if (postCountEl) postCountEl.textContent = myPosts.length;

  myPosts.forEach(post => {
    const tile = document.createElement('div');
    tile.style.cssText = 'background:var(--panel-bg); border:1px solid var(--panel-border); border-radius:12px; height:160px; overflow:hidden; display:flex; align-items:center; justify-content:center; padding:10px;';
    
    if (post.media_url) {
      tile.innerHTML = `<img src="${post.media_url}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;
    } else {
      tile.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">${post.caption}</p>`;
    }
    profileGrid?.appendChild(tile);
  });

  attachImageDoubleTap();
}

window.toggleLike = function(postId) {
  const post = allPosts.find(p => p.id === postId);
  if (post) {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    renderPosts(allPosts);
  }
};

function attachImageDoubleTap() {
  document.querySelectorAll('.post-image-preview').forEach(img => {
    img.addEventListener('dblclick', function() {
      const postId = this.getAttribute('data-post-id');
      if (postId) {
        const post = allPosts.find(p => p.id === postId);
        if (post && !post.liked) {
          toggleLike(postId);
          showToast('Liked post! ❤️');
        } else if (post && post.liked) {
          showToast('Post already liked! ❤️');
        }
      }
    });
  });
}

window.toggleSavePost = function(postId) {
  const post = allPosts.find(p => p.id === postId);
  if (post) {
    post.saved = !post.saved;
    renderPosts(allPosts);
    showToast(post.saved ? 'Post saved to bookmarks!' : 'Post removed from saved.');
  }
};

window.sharePost = function(postId) {
  navigator.clipboard.writeText(window.location.href);
  showToast('Link copied to clipboard!');
};

window.openCommentsModal = function(postId) {
  activeCommentPostId = postId;
  const post = allPosts.find(p => p.id === postId);
  const commentsList = document.getElementById('commentsList');
  if (!post || !commentsList) return;

  commentsList.innerHTML = '';
  const comments = post.comments || [];

  if (comments.length === 0) {
    commentsList.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; text-align:center;">No comments yet. Start the conversation!</p>';
  } else {
    comments.forEach(c => {
      const item = document.createElement('div');
      item.style.cssText = 'background:#061022; padding:10px 14px; border-radius:10px; font-size:0.88rem;';
      item.textContent = c;
      commentsList.appendChild(item);
    });
  }

  document.getElementById('commentsModal')?.classList.remove('hidden');
};

async function fetchSupabasePosts() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.from('posts').select('*');
  if (data && data.length > 0) {
    allPosts = data.map(p => ({
      id: p.id,
      user_id: p.user_id || 'remote',
      author: '@community.user',
      location: 'Uganda',
      caption: p.caption,
      media_url: p.media_url,
      likes: 0,
      liked: false,
      saved: false,
      comments: []
    }));
  }
}
