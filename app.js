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

let allPosts = [];
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
      console.warn('Supabase offline or table missing. Using demo local state.', e);
      loadDemoPosts();
    }
  } else {
    loadDemoPosts();
  }
  updateUIWithUser(currentUser);
  renderPosts(allPosts);
  renderProfileGrid();
}

function loadDemoPosts() {
  allPosts = [
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
}

async function fetchSupabasePosts() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (data && !error && data.length > 0) {
    allPosts = data.map(post => ({
      id: post.id,
      user_id: post.user_id || currentUser.id,
      author: post.username ? `@${post.username}` : '@user',
      location: post.location || 'Kampala, Uganda',
      caption: post.caption || '',
      media_url: post.media_url || '',
      likes: post.likes_count || 0,
      liked: false,
      saved: false,
      comments: post.comments || []
    }));
  } else {
    loadDemoPosts();
  }
}

async function loadUserProfile() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (data && !error) {
    currentUser.full_name = data.full_name || currentUser.full_name;
    currentUser.username = data.username || currentUser.username;
    currentUser.bio = data.bio || currentUser.bio;
    currentUser.avatar_url = data.avatar_url || currentUser.avatar_url;
  }
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

      pages.forEach(p => p.classList.remove('active'));
      const targetPage = document.getElementById(targetPageId);
      if (targetPage) {
        targetPage.classList.add('active');
      }

      document.querySelectorAll('.top-nav-btn, .sidebar-btn, .brand-container').forEach(btn => {
        if (btn.getAttribute('data-page') === targetPageId) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      if (targetPageId === 'profile-page') {
        renderProfileGrid();
      }
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

// ==========================================
// 4. STORAGE & FORM HANDLERS
// ==========================================
async function uploadMediaToSupabase(file, bucket = 'post-media') {
  if (!supabaseClient || !file) return null;
  const fileExt = file.name.split('.').pop();
  const filePath = `${currentUser.id}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabaseClient.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) {
    console.error('Storage upload failed:', uploadError.message);
    return null;
  }

  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(filePath);
  return data?.publicUrl || null;
}

function setupForms() {
  document.getElementById('editProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('editFullName').value;
    const username = document.getElementById('editUsername').value;
    const bio = document.getElementById('editBio').value;
    const avatarFile = document.getElementById('editAvatarFile')?.files[0];

    currentUser.full_name = fullName;
    currentUser.username = username;
    currentUser.bio = bio;

    if (avatarFile) {
      const uploadedAvatarUrl = await uploadMediaToSupabase(avatarFile, 'avatars');
      if (uploadedAvatarUrl) {
        currentUser.avatar_url = uploadedAvatarUrl;
      } else {
        currentUser.avatar_url = URL.createObjectURL(avatarFile);
      }
    }

    if (supabaseClient) {
      await supabaseClient.from('profiles').upsert({
        id: currentUser.id,
        full_name: currentUser.full_name,
        username: currentUser.username,
        bio: currentUser.bio,
        avatar_url: currentUser.avatar_url
      });
    }

    updateUIWithUser(currentUser);
    document.getElementById('editProfileModal').classList.add('hidden');
    showToast('Profile updated!');
  });

  document.getElementById('createPostForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const caption = document.getElementById('postContent').value;
    const mediaFile = document.getElementById('postMediaFile')?.files[0];

    let mediaUrl = '';
    if (mediaFile) {
      const uploadedUrl = await uploadMediaToSupabase(mediaFile, 'post-media');
      mediaUrl = uploadedUrl || URL.createObjectURL(mediaFile);
    }

    await createNewPost(caption, mediaUrl);
    document.getElementById('createPostModal').classList.add('hidden');
    document.getElementById('postContent').value = '';
    if (document.getElementById('postMediaFile')) {
      document.getElementById('postMediaFile').value = '';
    }
  });

  document.getElementById('inlinePostBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('inlinePostContent');
    const mediaFile = document.getElementById('inlineFileInput')?.files[0];
    if ((input && input.value.trim() !== '') || mediaFile) {
      let mediaUrl = '';
      if (mediaFile) {
        const uploadedUrl = await uploadMediaToSupabase(mediaFile, 'post-media');
        mediaUrl = uploadedUrl || URL.createObjectURL(mediaFile);
      }
      await createNewPost(input.value.trim(), mediaUrl);
      input.value = '';
      if (document.getElementById('inlineFileInput')) {
        document.getElementById('inlineFileInput').value = '';
      }
    }
  });

  document.getElementById('sendCommentBtn')?.addEventListener('click', () => {
    const commentInput = document.getElementById('commentInput');
    if (!commentInput || !activeCommentPostId) return;

    const text = commentInput.value.trim();
    if (text === '') return;

    const post = allPosts.find(p => p.id === activeCommentPostId);
    if (post) {
      post.comments.push(`${currentUser.username}: ${text}`);
      renderComments(post.comments);
      commentInput.value = '';
      showToast('Comment added!');
    }
  });
}

async function createNewPost(caption, mediaUrl) {
  const newPostObj = {
    id: `post-${Date.now()}`,
    user_id: currentUser.id,
    author: `@${currentUser.username}`,
    location: currentUser.location,
    caption: caption,
    media_url: mediaUrl,
    likes: 0,
    liked: false,
    saved: false,
    comments: []
  };

  if (supabaseClient) {
    const { error } = await supabaseClient.from('posts').insert([{
      user_id: currentUser.id,
      username: currentUser.username,
      caption: caption,
      media_url: mediaUrl,
      likes_count: 0
    }]);

    if (error) {
      console.error('Supabase post insert failed:', error.message);
    }
  }

  allPosts.unshift(newPostObj);
  renderPosts(allPosts);
  renderProfileGrid();
  showToast('Post created!');
}

// ==========================================
// 5. RENDERING & INTERACTIONS
// ==========================================
function renderPosts(posts) {
  const feedContainer = document.getElementById('feedContainer');
  if (!feedContainer) return;

  feedContainer.innerHTML = posts.map(post => `
    <div class="feed-post-card" data-id="${post.id}">
      <div class="post-card-header">
        <div class="post-author-info">
          <div class="avatar-sm">${post.author.replace('@', '').charAt(0).toUpperCase()}</div>
          <div class="author-names">
            <strong>${post.author}</strong>
            <small>${post.location}</small>
          </div>
        </div>
      </div>

      <p class="post-caption-text">${post.caption}</p>

      ${post.media_url ? `
        <div class="media-container" style="position:relative;">
          <img src="${post.media_url}" class="post-image-preview" alt="Post media">
          <div class="heart-pop" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(0); font-size: 4rem; transition: transform 0.2s ease; pointer-events:none;">❤️</div>
        </div>
      ` : ''}

      <div class="post-action-bar">
        <div class="left-actions">
          <span class="action-item ${post.liked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
            ${post.liked ? '❤️' : '🤍'} ${post.likes}
          </span>
          <span class="action-item" onclick="openComments('${post.id}')">
            💬 ${post.comments.length}
          </span>
        </div>
        <span class="action-item" onclick="toggleSave('${post.id}')">
          ${post.saved ? '🔖 Saved' : '📌 Save'}
        </span>
      </div>
    </div>
  `).join('');

  setupDoubleTapHeart();
}

function setupDoubleTapHeart() {
  document.querySelectorAll('.media-container').forEach(container => {
    let lastTap = 0;
    container.addEventListener('click', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        const card = container.closest('.feed-post-card');
        const postId = card?.getAttribute('data-id');
        if (postId) {
          toggleLike(postId, true);
          const heartPop = container.querySelector('.heart-pop');
          if (heartPop) {
            heartPop.style.transform = 'translate(-50%, -50%) scale(1.2)';
            setTimeout(() => {
              heartPop.style.transform = 'translate(-50%, -50%) scale(0)';
            }, 600);
          }
        }
      }
      lastTap = currentTime;
    });
  });
}

function toggleLike(postId, forceLike = false) {
  const post = allPosts.find(p => p.id === postId);
  if (!post) return;

  if (forceLike) {
    if (!post.liked) {
      post.liked = true;
      post.likes += 1;
    }
  } else {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
  }

  renderPosts(allPosts);
}

function toggleSave(postId) {
  const post = allPosts.find(p => p.id === postId);
  if (!post) return;

  post.saved = !post.saved;
  showToast(post.saved ? 'Post saved!' : 'Post removed from saved');
  renderPosts(allPosts);
}

function openComments(postId) {
  activeCommentPostId = postId;
  const post = allPosts.find(p => p.id === postId);
  if (!post) return;

  renderComments(post.comments);
  document.getElementById('commentsModal')?.classList.remove('hidden');
}

function renderComments(comments) {
  const commentsList = document.getElementById('commentsList');
  if (!commentsList) return;

  if (comments.length === 0) {
    commentsList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">No comments yet. Be the first!</p>';
    return;
  }

  commentsList.innerHTML = comments.map(c => `
    <div style="background: #061022; padding: 8px 12px; border-radius: 8px; font-size: 0.85rem;">
      ${c}
    </div>
  `).join('');
}

function renderProfileGrid() {
  const grid = document.getElementById('profileGrid');
  const postCountEl = document.getElementById('postCount');
  if (!grid) return;

  const myPosts = allPosts.filter(p => p.user_id === currentUser.id || p.author.includes(currentUser.username));
  if (postCountEl) postCountEl.textContent = myPosts.length;

  if (myPosts.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1 / -1; color: var(--text-muted);">No posts shared yet.</p>';
    return;
  }

  grid.innerHTML = myPosts.map(p => `
    <div style="background: var(--panel-bg); border: 1px solid var(--panel-border); border-radius: 8px; height: 120px; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; padding: 8px;">
      ${p.media_url ? `<img src="${p.media_url}" style="width:100%; height:100%; object-fit:cover;">` : `<p>${p.caption}</p>`}
    </div>
  `).join('');
}

function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query === '') {
      renderPosts(allPosts);
      return;
    }

    const filtered = allPosts.filter(p => 
      p.caption.toLowerCase().includes(query) || 
      p.author.toLowerCase().includes(query)
    );
    renderPosts(filtered);
  });
}

function setupSidebarAndWidgets() {
  document.querySelectorAll('.btn-follow-outline').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.textContent === 'Follow') {
        btn.textContent = 'Following';
        btn.style.background = 'var(--accent-blue)';
        btn.style.color = '#fff';
      } else {
        btn.textContent = 'Follow';
        btn.style.background = 'transparent';
        btn.style.color = 'var(--accent-blue)';
      }
    });
  });
}
