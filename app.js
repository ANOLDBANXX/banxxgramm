// ==========================================
// 1. SUPABASE INITIALIZATION
// ==========================================
const SUPABASE_URL = 'https://sb_publishable_I7QNLZO9Z5z73kRijjSLug_N58b9yXk.supabase.co'; // Replace with your URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuaXV3Ymxucmh5Ym5rZGdnYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTAzNzEsImV4cCI6MjEwNjA4NjM3MX0.iTfeaEeLjQqhxSbVhMS30mNJ9eg9nRtSGUxdhHFyjOc'; // Replace with your anon key

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
// 3. UI & NAVIGATION
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
    // Fallback mock user if not logged in via Supabase auth yet
    currentUser = {
      id: 'demo-user-id',
      email: 'demo@banxxgram.com',
      full_name: 'Anold Banxx',
      username: 'anoldbanxx4',
      bio: 'Welcome to my Banxxgram profile!',
      location: 'Uganda',
      avatar_url: ''
    };
    updateUIWithUser(currentUser);
    await loadPosts();
  }
}

function updateUIWithUser(profile) {
  const fullName = profile.full_name || profile.username || 'User';
  const username = profile.username ? `@${profile.username}` : '@user';

  // Sidebar User Card
  document.getElementById('sidebarFullName').textContent = fullName;
  document.getElementById('sidebarUsername').textContent = username;
  renderAvatar(document.getElementById('sidebarAvatar'), profile.avatar_url, fullName);

  // Profile Page
  document.getElementById('profileUsername').textContent = username;
  document.getElementById('profileBio').textContent = profile.bio || 'No bio provided.';
  document.getElementById('profileLocation').textContent = profile.location || '';
  renderAvatar(document.getElementById('profileAvatar'), profile.avatar_url, fullName);
  renderAvatar(document.getElementById('yourStoryAvatar'), profile.avatar_url, fullName);

  // Prefill Edit Modal inputs
  document.getElementById('editFullName').value = profile.full_name || '';
  document.getElementById('editUsername').value = profile.username || '';
  document.getElementById('editLocation').value = profile.location || '';
  document.getElementById('editBio').value = profile.bio || '';
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetPageId = item.getAttribute('data-page');

      navItems.forEach(i => i.classList.remove('active'));
      pages.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      const targetPage = document.getElementById(targetPageId);
      if (targetPage) targetPage.classList.add('active');
    });
  });
}

function setupModals() {
  // Edit Profile Modal
  const editModal = document.getElementById('editProfileModal');
  document.getElementById('openEditProfileBtn').addEventListener('click', () => editModal.classList.remove('hidden'));
  document.getElementById('closeEditProfileBtn').addEventListener('click', () => editModal.classList.add('hidden'));

  // Create Post Modal
  const createModal = document.getElementById('createPostModal');
  document.getElementById('openCreatePostBtn').addEventListener('click', () => createModal.classList.remove('hidden'));
  document.getElementById('closeCreatePostBtn').addEventListener('click', () => createModal.classList.add('hidden'));

  // Close modals when clicking outside
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
  document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('editFullName').value;
    const username = document.getElementById('editUsername').value;
    const location = document.getElementById('editLocation').value;
    const bio = document.getElementById('editBio').value;
    const avatarFileInput = document.getElementById('editAvatarFile');

    let avatarUrl = currentUser.avatar_url || '';

    try {
      // 1. Upload new avatar image if selected
      if (avatarFileInput.files && avatarFileInput.files[0]) {
        avatarUrl = await uploadFileToStorage(
          avatarFileInput.files[0],
          'avatars',
          currentUser.id
        );
      }

      // 2. Save updated profile fields to Supabase
      const profileData = {
        id: currentUser.id,
        full_name: fullName,
        username: username,
        location: location,
        bio: bio,
        avatar_url: avatarUrl,
        updated_at: new Date()
      };

      const { error } = await supabase.from('profiles').upsert(profileData);
      if (error) throw error;

      currentUser = { ...currentUser, ...profileData };
      updateUIWithUser(currentUser);

      document.getElementById('editProfileModal').classList.add('hidden');
      showToast('Profile updated successfully!');

    } catch (err) {
      showToast('Error: ' + err.message);
    }
  });

  // CREATE POST FORM
  document.getElementById('createPostForm').addEventListener('submit', async (e) => {
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

      document.getElementById('createPostForm').reset();
      document.getElementById('createPostModal').classList.add('hidden');
      showToast('Post created!');
      await loadPosts();

    } catch (err) {
      showToast('Error: ' + err.message);
    }
  });
}

async function loadPosts() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*, profiles(full_name, username, avatar_url)')
    .order('created_at', { ascending: false });

  if (error || !posts) {
    renderPosts([]);
    return;
  }

  renderPosts(posts);
}

function renderPosts(posts) {
  const feedContainer = document.getElementById('feedContainer');
  const profileGrid = document.getElementById('profileGrid');
  const statPostsCount = document.getElementById('statPostsCount');

  feedContainer.innerHTML = '';
  profileGrid.innerHTML = '';

  const userPosts = posts.filter(p => p.user_id === currentUser?.id);
  statPostsCount.textContent = userPosts.length;

  if (posts.length === 0) {
    feedContainer.innerHTML = '<div class="card"><p class="muted">No posts yet. Be the first to create one!</p></div>';
  } else {
    posts.forEach(post => {
      const postCard = document.createElement('div');
      postCard.className = 'card post';

      const authorName = post.profiles?.full_name || 'User';
      const authorUsername = post.profiles?.username ? `@${post.profiles.username}` : '@user';
      const avatarUrl = post.profiles?.avatar_url || '';

      postCard.innerHTML = `
        <div class="post-head">
          <div class="avatar" id="postAvatar-${post.id}">U</div>
          <div>
            <strong>${authorName}</strong>
            <small class="muted">${authorUsername}</small>
          </div>
        </div>
        ${post.caption ? `<p class="post-text">${post.caption}</p>` : ''}
        ${post.media_url ? `<img src="${post.media_url}" class="post-image" alt="Post content">` : ''}
        <div class="post-actions">
          <button>♥ Like</button>
          <button>💬 Comment</button>
        </div>
      `;

      feedContainer.appendChild(postCard);
      renderAvatar(document.getElementById(`postAvatar-${post.id}`), avatarUrl, authorName);
    });
  }

  // Populate profile grid tiles
  userPosts.forEach(post => {
    const tile = document.createElement('div');
    tile.className = 'profile-tile';
    if (post.media_url) {
      tile.innerHTML = `<img src="${post.media_url}" alt="Profile post">`;
    } else {
      tile.innerHTML = `<div class="profile-tile-text">${post.caption || 'Text Post'}</div>`;
    }
    profileGrid.appendChild(tile);
  });
}
