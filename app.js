// ==========================================
// 1. SUPABASE INITIALIZATION
// ==========================================
const SUPABASE_URL = 'https://YOUR_SUPABASE_PROJECT_ID.supabase.co'; // Replace with your actual Supabase URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your actual anon key

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Current user state
let currentUser = null;

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
    const initials = name
      .split(' ')
      .map(p => p[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    element.textContent = initials || 'U';
  }
}

// Upload file to Supabase Storage bucket
async function uploadFileToStorage(file, bucket, folderPath) {
  const fileExt = file.name.split('.').pop();
  const filePath = `${folderPath}/${Date.now()}.${fileExt}`;

  const { data, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    throw new Error('Upload failed: ' + uploadError.message);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}

// ==========================================
// 3. INITIALIZATION & NAVIGATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupNavigation();
  setupModals();
  setupForms();
});

async function initApp() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session && session.user) {
    currentUser = session.user;
    await loadUserProfile();
    await loadPosts();
  } else {
    // Fallback demo state if not logged in
    currentUser = {
      id: 'demo-user-id',
      email: 'demo@banxxgram.com',
      full_name: 'Anold Banxx',
      username: 'anold.banxx',
      bio: 'Welcome to my Banxxgram profile!',
      location: 'Kampala, Uganda',
      avatar_url: ''
    };
    updateUIWithUser(currentUser);
    await loadPosts();
  }
}

function updateUIWithUser(profile) {
  const fullName = profile.full_name || profile.username || 'User';
  const username = profile.username ? `@${profile.username}` : '@user';

  // Avatars
  renderAvatar(document.getElementById('sidebarAvatar'), profile.avatar_url, fullName);
  renderAvatar(document.getElementById('createPostAvatar'), profile.avatar_url, fullName);
  renderAvatar(document.getElementById('profileAvatar'), profile.avatar_url, fullName);

  // Profile Section text
  const profileUsernameEl = document.getElementById('profileUsername');
  const profileBioEl = document.getElementById('profileBio');
  if (profileUsernameEl) profileUsernameEl.textContent = username;
  if (profileBioEl) profileBioEl.textContent = profile.bio || 'Welcome to my profile!';

  // Edit Modal Inputs
  const editFullNameInput = document.getElementById('editFullName');
  const editUsernameInput = document.getElementById('editUsername');
  const editBioInput = document.getElementById('editBio');

  if (editFullNameInput) editFullNameInput.value = profile.full_name || '';
  if (editUsernameInput) editUsernameInput.value = profile.username || '';
  if (editBioInput) editBioInput.value = profile.bio || '';
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

      // Sync active state on matching top nav and sidebar buttons
      document.querySelectorAll(`.nav-item[data-page="${targetPageId}"]`).forEach(btn => btn.classList.add('active'));
      
      const targetPage = document.getElementById(targetPageId);
      if (targetPage) targetPage.classList.add('active');
    });
  });
}

function setupModals() {
  const editModal = document.getElementById('editProfileModal');
  const createModal = document.getElementById('createPostModal');

  // Edit Profile triggers
  const openEditBtn = document.getElementById('openEditProfileBtn');
  const closeEditBtn = document.getElementById('closeEditProfileBtn');
  if (openEditBtn) openEditBtn.addEventListener('click', () => editModal?.classList.remove('hidden'));
  if (closeEditBtn) closeEditBtn.addEventListener('click', () => editModal?.classList.add('hidden'));

  // Create Post triggers
  const openCreateBtn = document.getElementById('openCreatePostBtn');
  const sidebarCreateBtn = document.getElementById('sidebarCreateBtn');
  const closeCreateBtn = document.getElementById('closeCreatePostBtn');

  if (openCreateBtn) openCreateBtn.addEventListener('click', () => createModal?.classList.remove('hidden'));
  if (sidebarCreateBtn) sidebarCreateBtn.addEventListener('click', () => createModal?.classList.remove('hidden'));
  if (closeCreateBtn) closeCreateBtn.addEventListener('click', () => createModal?.classList.add('hidden'));

  // Close modals when clicking outside card
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.add('hidden');
    }
  });
}

// ==========================================
// 4. DATA OPS (PROFILE & POSTS)
// ==========================================
async function loadUserProfile() {
  if (!currentUser) return;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (data) {
    currentUser = { ...currentUser, ...data };
    updateUIWithUser(currentUser);
  }
}

function setupForms() {
  // EDIT PROFILE FORM
  const editProfileForm = document.getElementById('editProfileForm');
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullName = document.getElementById('editFullName').value;
      const username = document.getElementById('editUsername').value;
      const bio = document.getElementById('editBio').value;
      const avatarFileInput = document.getElementById('editAvatarFile');

      let avatarUrl = currentUser.avatar_url || '';

      try {
        if (avatarFileInput.files && avatarFileInput.files[0]) {
          avatarUrl = await uploadFileToStorage(
            avatarFileInput.files[0],
            'avatars',
            currentUser.id
          );
        }

        const profileData = {
          id: currentUser.id,
          full_name: fullName,
          username: username,
          bio: bio,
          avatar_url: avatarUrl,
          updated_at: new Date()
        };

        const { error } = await supabase.from('profiles').upsert(profileData);
        if (error) throw error;

        currentUser = { ...currentUser, ...profileData };
        updateUIWithUser(currentUser);

        document.getElementById('editProfileModal').classList.add('hidden');
        showToast('Profile updated!');

      } catch (err) {
        showToast('Error: ' + err.message);
      }
    });
  }

  // MODAL CREATE POST FORM
  const createPostForm = document.getElementById('createPostForm');
  if (createPostForm) {
    createPostForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const caption = document.getElementById('postContent').value;
      const mediaFileInput = document.getElementById('postMediaFile');
      let mediaUrl = '';

      try {
        if (mediaFileInput.files && mediaFileInput.files[0]) {
          mediaUrl = await uploadFileToStorage(
            mediaFileInput.files[0],
            'posts',
            currentUser.id
          );
        }

        const { error } = await supabase.from('posts').insert({
          user_id: currentUser.id,
          caption: caption,
          media_url: mediaUrl,
          created_at: new Date()
        });

        if (error) throw error;

        createPostForm.reset();
        document.getElementById('createPostModal').classList.add('hidden');
        showToast('Post published!');
        await loadPosts();

      } catch (err) {
        showToast('Error: ' + err.message);
      }
    });
  }

  // INLINE FEED POST BUTTON
  const inlinePostBtn = document.getElementById('inlinePostBtn');
  const inlinePostContent = document.getElementById('inlinePostContent');

  if (inlinePostBtn && inlinePostContent) {
    inlinePostBtn.addEventListener('click', async () => {
      const caption = inlinePostContent.value.trim();
      if (!caption) {
        showToast('Please type a message before posting.');
        return;
      }

      try {
        const { error } = await supabase.from('posts').insert({
          user_id: currentUser.id,
          caption: caption,
          media_url: '',
          created_at: new Date()
        });

        if (error) throw error;

        inlinePostContent.value = '';
        showToast('Post published!');
        await loadPosts();

      } catch (err) {
        showToast('Error: ' + err.message);
      }
    });
  }
}

async function loadPosts() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*, profiles(full_name, username, avatar_url, location)')
    .order('created_at', { ascending: false });

  if (error || !posts) {
    return;
  }

  renderPosts(posts);
}

function renderPosts(posts) {
  const feedContainer = document.getElementById('feedContainer');
  const profileGrid = document.getElementById('profileGrid');

  if (!feedContainer) return;
  feedContainer.innerHTML = '';
  if (profileGrid) profileGrid.innerHTML = '';

  const userPosts = posts.filter(p => p.user_id === currentUser?.id);

  posts.forEach(post => {
    const postCard = document.createElement('div');
    postCard.className = 'feed-post-card';

    const authorName = post.profiles?.full_name || post.profiles?.username || 'Banxx User';
    const authorHandle = post.profiles?.username ? `@${post.profiles.username}` : '@user';
    const authorLocation = post.profiles?.location || 'Uganda';
    const avatarUrl = post.profiles?.avatar_url || '';

    postCard.innerHTML = `
      <div class="post-card-header">
        <div class="post-author-info">
          <div class="avatar-sm" id="postAvatar-${post.id}"></div>
          <div class="author-names">
            <strong>${authorHandle}</strong>
            <small>${authorLocation}</small>
          </div>
        </div>
        <span class="post-more-options">•••</span>
      </div>
      ${post.caption ? `<p class="post-caption-text">${post.caption}</p>` : ''}
      ${post.media_url ? `<img src="${post.media_url}" class="post-image-preview" alt="Post content">` : ''}
      <div class="post-action-bar">
        <div class="left-actions">
          <span class="action-item">♥ 0</span>
          <span class="action-item">💬 0</span>
          <span class="action-item">✈️</span>
        </div>
        <span class="action-item">🔖</span>
      </div>
    `;

    feedContainer.appendChild(postCard);
    renderAvatar(document.getElementById(`postAvatar-${post.id}`), avatarUrl, authorName);
  });

  // Populate user tiles in profile grid
  if (profileGrid) {
    userPosts.forEach(post => {
      const tile = document.createElement('div');
      tile.style.background = 'var(--panel-bg)';
      tile.style.border = '1px solid var(--panel-border)';
      tile.style.borderRadius = '12px';
      tile.style.height = '160px';
      tile.style.overflow = 'hidden';
      tile.style.display = 'flex';
      tile.style.alignItems = 'center';
      tile.style.justifyContent = 'center';
      tile.style.padding = '10px';

      if (post.media_url) {
        tile.innerHTML = `<img src="${post.media_url}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;" alt="User post">`;
      } else {
        tile.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">${post.caption || 'Post'}</p>`;
      }
      profileGrid.appendChild(tile);
    });
  }
}
