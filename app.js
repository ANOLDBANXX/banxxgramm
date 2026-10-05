// ==========================================
// 1. SUPABASE INITIALIZATION
// ==========================================
const SUPABASE_URL = 'https://YOUR_SUPABASE_PROJECT_ID.supabase.co'; 
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; 

const supabase = (window.supabase && SUPABASE_URL.includes('https://')) 
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// Application State
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
    caption: 'Good vibes only ☀️',
    media_url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1000',
    likes: 24,
    liked: false,
    comments: ['Beautiful view!', 'Loving this content.']
  },
  {
    id: 'demo-2',
    user_id: 'user-3',
    author: '@sarah.styles',
    location: 'Mityana',
    caption: 'New week, new designs ✨',
    media_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000',
    likes: 51,
    liked: false,
    comments: ['Amazing outfit!']
  }
];

let activeCommentPostId = null;

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================
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

// ==========================================
// 3. APP INIT & EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupNavigation();
  setupModals();
  setupForms();
  setupSearch();
});

async function initApp() {
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        currentUser.id = session.user.id;
        await loadUserProfile();
      }
      await fetchSupabasePosts();
    } catch (e) {
      console.warn('Supabase offline or table missing. Using local state.');
    }
  }
  updateUIWithUser(currentUser);
  renderPosts(allPosts);
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
    item.addEventListener('click', () => {
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

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.add('hidden');
    }
  });
}

// ==========================================
// 4. FORMS & ACTIONS
// ==========================================
function setupForms() {
  // Edit Profile
  document.getElementById('editProfileForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    currentUser.full_name = document.getElementById('editFullName').value;
    currentUser.username = document.getElementById('editUsername').value;
    currentUser.bio = document.getElementById('editBio').value;
    
    updateUIWithUser(currentUser);
    document.getElementById('editProfileModal').classList.add('hidden');
    showToast('Profile updated!');
  });

  // Modal Create Post
  document.getElementById('createPostForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const caption = document.getElementById('postContent').value;
    const fileInput = document.getElementById('postMediaFile');
    
    createNewPost(caption, fileInput.files[0]);
    document.getElementById('createPostForm').reset();
    document.getElementById('createPostModal').classList.add('hidden');
  });

  // Inline Feed Post
  document.getElementById('inlinePostBtn')?.addEventListener('click', () => {
    const input = document.getElementById('inlinePostContent');
    const fileInput = document.getElementById('inlineFileInput');
    if (!input.value.trim() && (!fileInput.files || !fileInput.files[0])) {
      showToast('Please type a message or select an image');
      return;
    }
    createNewPost(input.value, fileInput.files ? fileInput.files[0] : null);
    input.value = '';
    if (fileInput) fileInput.value = '';
  });

  // Comments submit
  document.getElementById('sendCommentBtn')?.addEventListener('click', () => {
    const input = document.getElementById('commentInput');
    if (!input.value.trim() || !activeCommentPostId) return;

    const post = allPosts.find(p => p.id === activeCommentPostId);
    if (post) {
      if (!post.comments) post.comments = [];
      post.comments.push(`${currentUser.username}: ${input.value}`);
      input.value = '';
      openCommentsModal(post.id);
      renderPosts(allPosts);
      showToast('Comment added!');
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
    comments: []
  };

  allPosts.unshift(newPost);
  renderPosts(allPosts);
  showToast('Post published!');
}

function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = allPosts.filter(p => 
      p.caption.toLowerCase().includes(query) || 
      p.author.toLowerCase().includes(query)
    );
    renderPosts(filtered);
  });
}

// ==========================================
// 5. RENDERING & INTERACTION
// ==========================================
function renderPosts(postsToRender) {
  const feedContainer = document.getElementById('feedContainer');
  const profileGrid = document.getElementById('profileGrid');

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
        <span class="post-more-options">•••</span>
      </div>
      ${post.caption ? `<p class="post-caption-text">${post.caption}</p>` : ''}
      ${post.media_url ? `<img src="${post.media_url}" class="post-image-preview" alt="Media">` : ''}
      <div class="post-action-bar">
        <div class="left-actions">
          <span class="action-item ${post.liked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
            ${post.liked ? '❤️' : '♥'} ${post.likes}
          </span>
          <span class="action-item" onclick="openCommentsModal('${post.id}')">
            💬 ${(post.comments || []).length}
          </span>
          <span class="action-item" onclick="showToast('Link copied!')">✈️</span>
        </div>
        <span class="action-item" onclick="showToast('Post saved!')">🔖</span>
      </div>
    `;

    feedContainer?.appendChild(card);
  });

  // Populate Profile Grid
  const myPosts = allPosts.filter(p => p.user_id === currentUser.id);
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
}

function toggleLike(postId) {
  const post = allPosts.find(p => p.id === postId);
  if (post) {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    renderPosts(allPosts);
  }
}

function openCommentsModal(postId) {
  activeCommentPostId = postId;
  const post = allPosts.find(p => p.id === postId);
  const commentsList = document.getElementById('commentsList');
  if (!post || !commentsList) return;

  commentsList.innerHTML = '';
  const comments = post.comments || [];

  if (comments.length === 0) {
    commentsList.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No comments yet. Be the first!</p>';
  } else {
    comments.forEach(c => {
      const item = document.createElement('div');
      item.style.cssText = 'background:#061022; padding:8px 12px; border-radius:8px; font-size:0.85rem;';
      item.textContent = c;
      commentsList.appendChild(item);
    });
  }

  document.getElementById('commentsModal')?.classList.remove('hidden');
}

async function fetchSupabasePosts() {
  if (!supabase) return;
  const { data, error } = await supabase.from('posts').select('*');
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
      comments: []
    }));
  }
}
