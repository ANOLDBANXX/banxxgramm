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
    e.preventDefault
