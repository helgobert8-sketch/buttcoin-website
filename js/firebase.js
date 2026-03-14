/* ═══════════════════════════════════════════════
   BUTTCOIN — firebase.js
   Firebase config + Auth + Firestore + Storage
   Project: butttcoin-fbe0f
═══════════════════════════════════════════════ */

// Firebase is loaded via CDN <script> tags in index.html
// This file initializes the app and exports helpers

const firebaseConfig = {
  apiKey:            "AIzaSyDcdgb_x9IXBqTIgHOc0GEgTcak-PErt9k",
  authDomain:        "butttcoin-fbe0f.firebaseapp.com",
  projectId:         "butttcoin-fbe0f",
  storageBucket:     "butttcoin-fbe0f.firebasestorage.app",
  messagingSenderId: "482524167127",
  appId:             "1:482524167127:web:761862f55e3312fb97a992"
};

// ─── ROLES ────────────────────────────────────
// admin     — full access: manage content, upload, delete
// moderator — limited: upload memes, approve submissions
// user      — registered: can submit memes (pending review)
// (no account) — visitor: read-only public access

let app, auth, db, storage, currentUser = null;

// ─── INIT ─────────────────────────────────────
function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded yet');
    return;
  }

  app     = firebase.initializeApp(firebaseConfig);
  auth    = firebase.auth();
  db      = firebase.firestore();
  storage = firebase.storage();

  // Expose storage for memes.js
  window.firebaseStorage = storage;
  window.firebaseDB      = db;
  window.firebaseAuth    = auth;

  // Auth state listener
  auth.onAuthStateChanged(user => {
    currentUser = user;
    updateAuthUI(user);
    if (user) checkUserRole(user);
  });

  // Wire up upload function for memes.js
  window.uploadMeme = uploadMeme;

  console.log('[Buttcoin] Firebase initialized');
}

// ─── AUTH STATE UI ────────────────────────────
function updateAuthUI(user) {
  const adminPanel = document.getElementById('admin-panel');
  const loginBtn   = document.getElementById('btn-login');
  const logoutBtn  = document.getElementById('btn-logout');
  const userEmail  = document.getElementById('user-email');

  if (user) {
    if (loginBtn)  loginBtn.style.display  = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (userEmail) userEmail.textContent   = user.email;
  } else {
    if (loginBtn)  loginBtn.style.display  = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'none';
  }
}

// ─── ROLE CHECK ───────────────────────────────
async function checkUserRole(user) {
  if (!db) return;
  try {
    const doc = await db.collection('users').doc(user.uid).get();
    const role = doc.exists ? (doc.data().role || 'user') : 'user';
    window.userRole = role;

    // Show admin panel for admins/moderators
    if (role === 'admin' || role === 'moderator') {
      const panel = document.getElementById('admin-panel');
      if (panel) panel.style.display = 'block';
    }

    // Admins get extra upload controls
    if (role === 'admin') {
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }
    if (role === 'admin' || role === 'moderator') {
      document.querySelectorAll('.mod-only').forEach(el => el.style.display = 'block');
    }
  } catch (err) {
    console.warn('Role check failed:', err);
  }
}

// ─── SIGN IN / OUT ────────────────────────────
async function signIn() {
  if (!auth) return;
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (err) {
    console.error('Sign in failed:', err);
    showAuthError(err.message);
  }
}

async function signOut() {
  if (!auth) return;
  await auth.signOut();
  window.userRole = null;
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

// ─── MEME UPLOAD ──────────────────────────────
async function uploadMeme(file) {
  if (!storage || !db) throw new Error('Firebase not initialized');
  if (!currentUser) throw new Error('Please sign in to upload');

  const role = window.userRole || 'user';
  const isApproved = (role === 'admin' || role === 'moderator');

  // Upload file to Storage
  const timestamp = Date.now();
  const filename  = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const folder    = isApproved ? 'memes/approved' : 'memes/pending';
  const ref       = storage.ref(`${folder}/${filename}`);

  const snapshot  = await ref.put(file);
  const url       = await snapshot.ref.getDownloadURL();

  // Save metadata to Firestore
  await db.collection('memes').add({
    url,
    filename,
    uploadedBy:  currentUser.uid,
    uploaderEmail: currentUser.email,
    uploadedAt:  firebase.firestore.FieldValue.serverTimestamp(),
    approved:    isApproved,
    category:    'community',
    fileSize:    file.size,
    fileType:    file.type,
  });

  return url;
}

// ─── LOAD MEMES FROM FIRESTORE ─────────────────
async function loadMemesFromFirebase(category = 'all', limit = 20, startAfter = null) {
  if (!db) return [];
  try {
    let query = db.collection('memes')
      .where('approved', '==', true)
      .orderBy('uploadedAt', 'desc')
      .limit(limit);

    if (category !== 'all') {
      query = query.where('category', '==', category);
    }
    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    const snap = await query.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Firestore load failed:', err);
    return [];
  }
}

// ─── PENDING MEME APPROVAL (admin/mod only) ───
async function getPendingMemes() {
  if (!db || !currentUser) return [];
  const role = window.userRole;
  if (role !== 'admin' && role !== 'moderator') return [];

  const snap = await db.collection('memes')
    .where('approved', '==', false)
    .orderBy('uploadedAt', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function approveMeme(memeId) {
  if (!db || window.userRole !== 'admin' && window.userRole !== 'moderator') return;
  await db.collection('memes').doc(memeId).update({ approved: true });
}

async function deleteMeme(memeId) {
  if (!db || window.userRole !== 'admin') return;
  await db.collection('memes').doc(memeId).delete();
}

// ─── EXPOSE GLOBALS ───────────────────────────
window.buttcoinAuth = { signIn, signOut, checkUserRole };
window.loadMemesFromFirebase = loadMemesFromFirebase;
window.getPendingMemes = getPendingMemes;
window.approveMeme = approveMeme;
window.deleteMeme  = deleteMeme;

// ─── AUTO-INIT ────────────────────────────────
// Wait for Firebase SDK to load
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure Firebase CDN scripts loaded
  setTimeout(initFirebase, 300);
});
