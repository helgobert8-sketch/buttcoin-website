/* ═══════════════════════════════════════════════
   BUTTCOIN — memes.js
   Meme Depot gallery, upload, randomizer
   Firebase integration (stubbed — wire up after config)
═══════════════════════════════════════════════ */

// ─── TAGLINES + QUOTES for randomizer ─────────
const MEME_TAGLINES = [
  "Just flip it.",
  "The Next Bitcoin",
  "Hyperbuttcoinification is inevitable.",
  "Not to the moon — to Uranus.",
  "We are all Buttoshi.",
  "Buttcoin to Buttillions",
  "Stack butts. Stay humble.",
  "It's literally coded.",
  "Spread Buttcoin with love.",
  "Buttcoin is freedom.",
  "Diamond butts will win.",
  "The People's Bitcoin",
  "Lore runs deep. Study Buttcoin.",
  "Relentless accumulation.",
  "Buttcoin is either up or upgrading.",
  "Fortify your future, stack butts.",
  "Buttcoiners forge their own path.",
  "In Buttoshi we trust.",
  "Only rotation that makes sense.",
  "Buttcoin — greatness from small beginnings.",
  "Put your money where your butt is.",
];

const MEME_QUOTES = [
  "If enough people decide that flipping Bitcoin is funny, righteous, or spiritually necessary, math will obediently rearrange itself.",
  "The first ever Buttcoin block was mined more than 12 years ago by Buttoshi.",
  "How can you be a Bitcoin maxi, but not a Buttcoin maxi?",
  "No one, and I mean no one — touches my butt.",
  "As long as bitcoin is relevant, Buttcoin has mindshare.",
  "Delusional people often are the ones that change the world.",
  "Buttcoin will do to BTC what email did to the post office.",
  "It's not over. It's not back. It's the next Bitcoin. See you on Uranus.",
];

// ─── MEME GALLERY (Firebase will populate this) ─
// These are placeholder entries. Once Firebase Storage
// is connected, this list will be loaded dynamically.
const PLACEHOLDER_MEMES = [
  { id: 1, category: 'iconic', url: 'assets/memes/iconic/Buttcoin DOMINACE.jpg', alt: 'Buttcoin Dominance' },
  { id: 2, category: 'iconic', url: 'assets/memes/iconic/Buttcoin dominance.jpg', alt: 'Buttcoin dominance' },
  { id: 3, category: 'iconic', url: 'assets/memes/iconic/Buttcoiners final 24072025.png', alt: 'Buttcoiners' },
  { id: 4, category: 'iconic', url: 'assets/memes/iconic/butt worlds upscaled.png', alt: 'Butt Worlds' },
  { id: 5, category: 'iconic', url: 'assets/memes/iconic/memedepot.png', alt: 'Meme Depot' },
  { id: 6, category: 'iconic', url: 'assets/memes/iconic/Literally coded.jpg', alt: 'Literally Coded' },
];

let currentCategory = 'all';
let displayedMemes  = [];
let page            = 0;
const PAGE_SIZE     = 32;

// ─── GALLERY ──────────────────────────────────
window.loadMemes = function(category = 'all') {
  currentCategory = category;
  page = 0;
  displayedMemes = [];
  const grid = document.getElementById('meme-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="meme-loading">Loading memes…</div>';

  // Always load from static manifest (memes.json) — complete source of truth
  loadFromManifest(category);
};

window.loadNextPage = function() {
  page++;
  renderMemes();
  document.getElementById('meme-depot')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.loadPrevPage = function() {
  if (page > 0) {
    page--;
    renderMemes();
    document.getElementById('meme-depot')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

async function loadFromFirebase(category) {
  const grid = document.getElementById('meme-grid');
  try {
    const memes = await window.loadMemesFromFirebase(category, PAGE_SIZE);
    displayedMemes = memes;
    if (grid) grid.innerHTML = '';
    if (memes.length === 0) {
      if (grid) grid.innerHTML = `
        <div class="meme-loading">
          <p>Memes loading from the Buttverse…</p>
          <p style="margin-top:12px">
            <a href="https://memedepot.com/d/buttcoin" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
              Browse all 1,800+ memes on Meme Depot ↗
            </a>
          </p>
        </div>`;
      return;
    }
    memes.forEach(meme => {
      const el = document.createElement('div');
      el.className = 'meme-item';
      el.innerHTML = `<img src="${meme.url}" alt="${meme.alt || 'Buttcoin meme'}" loading="lazy" onerror="this.closest('.meme-item').style.display='none'" />`;
      el.addEventListener('click', () => openMemeModal(meme));
      if (grid) grid.appendChild(el);
    });
  } catch (err) {
    console.warn('Firebase load failed, falling back to placeholder:', err);
    loadPlaceholder(category);
  }
}

function countUp(el, target, duration = 1800) {
  const start = 0;
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    el.textContent = current.toLocaleString('en-US');
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.style.transition = 'color 0.6s ease';
      el.style.color = 'var(--orange)';
    }
  }
  requestAnimationFrame(step);
}

async function loadFromManifest(category) {
  const grid = document.getElementById('meme-grid');
  try {
    const res = await fetch('memes.json');
    const all = await res.json();

    // Store total for counter — triggered by Intersection Observer when section enters view
    const countEl = document.getElementById('meme-count');
    if (countEl && !countEl.dataset.total) {
      countEl.dataset.total = all.length;
    }

    const filtered = category === 'all' ? all : all.filter(m => m.category === category);
    displayedMemes = filtered;
    if (filtered.length === 0) { loadPlaceholder(category); return; }
    renderMemes();
  } catch (err) {
    loadPlaceholder(category);
  }
}

function loadPlaceholder(category) {
  const filtered = category === 'all'
    ? PLACEHOLDER_MEMES
    : PLACEHOLDER_MEMES.filter(m => m.category === category);

  displayedMemes = filtered;
  renderMemes();
}

function renderPagination() {
  const el = document.getElementById('meme-pagination');
  if (!el) return;
  const totalPages = Math.ceil(displayedMemes.length / PAGE_SIZE);
  if (totalPages <= 1) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <button class="page-btn" onclick="loadPrevPage()" ${page === 0 ? 'disabled' : ''}>← Previous</button>
    <span class="page-info">Page ${page + 1} of ${totalPages}</span>
    <button class="page-btn" onclick="loadNextPage()" ${page >= totalPages - 1 ? 'disabled' : ''}>Next →</button>
  `;
}

function renderMemes() {
  const grid = document.getElementById('meme-grid');
  if (!grid) return;

  const start = page * PAGE_SIZE;
  const batch = displayedMemes.slice(start, start + PAGE_SIZE);

  grid.innerHTML = '';

  if (batch.length === 0) {
    grid.innerHTML = `
      <div class="meme-loading">
        <p>Memes loading from the Buttverse…</p>
        <p style="margin-top:12px">
          <a href="https://memedepot.com/d/buttcoin" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
            Browse all memes on Meme Depot ↗
          </a>
        </p>
      </div>`;
    renderPagination();
    return;
  }

  batch.forEach((meme, i) => {
    const el = document.createElement('div');
    el.className = 'meme-item';
    el.innerHTML = `<img src="${meme.url}" alt="${meme.alt || 'Buttcoin meme'}" loading="lazy" onerror="this.closest('.meme-item').style.display='none'" />`;
    const globalIndex = page * PAGE_SIZE + i;
    el.addEventListener('click', () => openLightbox(displayedMemes, globalIndex));
    grid.appendChild(el);
  });
  renderPagination();
}

// ─── LIGHTBOX ─────────────────────────────────
let lbMemes = [];
let lbIndex = 0;

function openLightbox(memeList, index) {
  lbMemes = memeList;
  lbIndex = index;
  renderLightbox();
}

function renderLightbox() {
  const existing = document.getElementById('meme-lightbox');
  if (existing) existing.remove();

  const meme = lbMemes[lbIndex];
  if (!meme) return;

  const lb = document.createElement('div');
  lb.id = 'meme-lightbox';
  lb.style.cssText = `position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.93);display:flex;align-items:center;justify-content:center;`;

  lb.innerHTML = `
    <button class="lb-btn lb-close" onclick="document.getElementById('meme-lightbox').remove();document.removeEventListener('keydown',lbKeyHandler)">✕</button>
    <button class="lb-btn lb-prev" onclick="lbNav(-1)" ${lbIndex === 0 ? 'disabled' : ''}>‹</button>
    <img src="${meme.url}" alt="${meme.filename || ''}"
      style="max-width:88vw;max-height:88vh;border-radius:8px;object-fit:contain;display:block;" />
    <button class="lb-btn lb-next" onclick="lbNav(1)" ${lbIndex >= lbMemes.length - 1 ? 'disabled' : ''}>›</button>
    <span class="lb-counter">${lbIndex + 1} / ${lbMemes.length}</span>
  `;

  // Click backdrop to close
  lb.addEventListener('click', e => {
    if (e.target === lb) {
      lb.remove();
      document.removeEventListener('keydown', lbKeyHandler);
    }
  });

  document.body.appendChild(lb);
  document.addEventListener('keydown', lbKeyHandler);
}

function lbNav(dir) {
  const next = lbIndex + dir;
  if (next >= 0 && next < lbMemes.length) {
    lbIndex = next;
    renderLightbox();
  }
}

function lbKeyHandler(e) {
  if (e.key === 'ArrowRight') lbNav(1);
  if (e.key === 'ArrowLeft')  lbNav(-1);
  if (e.key === 'Escape') {
    document.getElementById('meme-lightbox')?.remove();
    document.removeEventListener('keydown', lbKeyHandler);
  }
}

// ─── RANDOM MODE ──────────────────────────────
window.loadRandomMemes = async function() {
  // Fetch all memes if not already loaded
  let all = displayedMemes;
  if (!all || all.length === 0) {
    try {
      const res = await fetch('memes.json');
      all = await res.json();
    } catch(e) { return; }
  }
  // Shuffle all memes
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  // Open lightbox with full shuffled set
  openLightbox(shuffled, 0);
};

// ─── UPLOAD ───────────────────────────────────
function initUpload() {
  const input = document.getElementById('meme-upload-input');
  if (!input) return;

  input.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;

    const status = document.getElementById('upload-status');

    // Check size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      if (status) status.innerHTML = `<p style="color:#ef4444;margin-top:12px">File too large. Max 10MB.</p>`;
      return;
    }

    if (status) status.innerHTML = `<p style="color:var(--muted);margin-top:12px">Uploading…</p>`;

    if (window.uploadMeme) {
      // Firebase upload
      try {
        await window.uploadMeme(file);
        if (status) status.innerHTML = `<p style="color:#22c55e;margin-top:12px">✓ Submitted for review. Thank you, Buttcoiner!</p>`;
      } catch (err) {
        if (status) status.innerHTML = `<p style="color:#ef4444;margin-top:12px">Upload failed: ${err.message}</p>`;
      }
    } else {
      // Firebase not connected yet
      if (status) status.innerHTML = `
        <p style="color:#f59e0b;margin-top:12px">
          Upload coming soon. For now, submit your meme directly to
          <a href="https://memedepot.com/d/buttcoin" target="_blank" rel="noopener">Meme Depot</a>
          or the <a href="https://t.me/buttcointnbsol" target="_blank" rel="noopener">Telegram channel</a>.
        </p>`;
    }
  });
}

// ─── MEME RANDOMIZER ─────────────────────────
const memeCanvas = document.getElementById('meme-canvas');
const memeCtx    = memeCanvas ? memeCanvas.getContext('2d') : null;

// Persisted state — enables drag/resize after generation
let _memeState = null;
// Single interaction slot (mode: null | 'logoDrag' | 'logoResize' | 'textDrag' | 'tagDrag')
const _interact = { mode: null, offX: 0, offY: 0, corner: null, anchorX: 0, anchorY: 0 };

// ─── LOGO POOL ────────────────────────────────
const LOGO_IMGS = [
  'assets/logos/randomizer/bitcoin-15518 no background.png',
  'assets/logos/randomizer/bitcoin-icon-512x512-6lwse9jk.png',
  'assets/logos/randomizer/logo head on.png',
  'assets/logos/randomizer/logo rund.png',
  'assets/logos/randomizer/vecteezy_3d-render-of-a-blue-bitcoin-cryptocurrency-coin_55079150.png',
  'assets/logos/randomizer/vecteezy_bitcoin-gold-btg-glass-crypto-coin-3d-illustration_24092708.png',
  'assets/logos/randomizer/vecteezy_bitcoin-photo-isolated-on-transparent-background_48411608.png',
  'assets/logos/randomizer/vecteezy_bitcoin-photo-isolated-on-transparent-background_48411623.png',
  'assets/logos/randomizer/vecteezy_bitcoin-symbol-in-cyber-style_56472366.png',
  'assets/logos/randomizer/vecteezy_neon-bitcoin-coin-digital-art_56472368 (1).png',
];

function randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function loadImg(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function randomMemeSrc() {
  try {
    if (!window._memeManifestCache) {
      const res = await fetch('memes.json');
      window._memeManifestCache = await res.json();
    }
    const pool = window._memeManifestCache;
    return pool.length ? randFrom(pool).url : null;
  } catch { return null; }
}

async function generateMeme() {
  if (!memeCanvas || !memeCtx) return;

  const useLogo    = document.getElementById('r-logo')?.checked;
  const useTagline = document.getElementById('r-tagline')?.checked;
  const useQuote   = document.getElementById('r-quote')?.checked;
  const useMemeBg  = document.getElementById('r-memebg')?.checked;

  const tagline = randFrom(MEME_TAGLINES);
  const quote   = randFrom(MEME_QUOTES);
  const schemes = [
    { bg: '#0d0d0d', accent: '#f7931a' },
    { bg: '#0a0a1a', accent: '#a855f7' },
    { bg: '#1a0a00', accent: '#f7931a' },
    { bg: '#000000', accent: '#f7931a' },
  ];
  const scheme = randFrom(schemes);

  memeCanvas.width  = 600;
  memeCanvas.height = 600;
  memeCanvas.style.display = 'block';
  const hint = document.getElementById('randomizer-hint');
  if (hint) hint.style.display = 'none';

  const memeSrc = useMemeBg ? await randomMemeSrc() : null;
  const [bgImg, logoImg] = await Promise.all([
    memeSrc ? loadImg(memeSrc)             : Promise.resolve(null),
    useLogo ? loadImg(randFrom(LOGO_IMGS)) : Promise.resolve(null),
  ]);

  // Default logo position — centered, shifted up slightly when text is present
  let logoX = 0, logoY = 0, logoW = 0, logoH = 0;
  if (logoImg) {
    logoW = logoH = 320;
    logoX = (600 - logoW) / 2;
    logoY = (600 - logoH) / 2 - (useTagline || useQuote ? 40 : 0);
  }

  _memeState = {
    bgImg, logoImg,
    scheme, tagline, quote, useTagline, useQuote,
    logoX, logoY, logoW, logoH,
    // Text pill style
    textBgAlpha: 0.6,
    textBgColor: '#000000',
    // Text positions: null = auto-positioned on first draw
    textPos: null,
    tagPos:  null,
    // Hit-boxes filled in by drawMemeText each frame
    textBox: null,
    tagBox:  null,
  };

  // Sync sliders/buttons to defaults
  const intEl = document.getElementById('text-intensity');
  if (intEl) intEl.value = 0.6;
  document.querySelectorAll('.text-color-btn').forEach((b, i) => b.classList.toggle('active', i === 0));

  redrawMeme();

  document.getElementById('download-meme-btn').style.display = 'block';
  const dragHint = document.getElementById('logo-drag-hint');
  if (dragHint) dragHint.style.display = (logoImg || useTagline || useQuote) ? 'block' : 'none';
  const stylePanel = document.getElementById('text-style-panel');
  if (stylePanel) stylePanel.style.display = (useTagline || useQuote) ? 'flex' : 'none';
}

// ─── REDRAW FROM STATE ────────────────────────
// _drawMemeContent — clean render (no handles); used for download
function _drawMemeContent() {
  if (!_memeState || !memeCtx) return;
  const s = _memeState;

  memeCtx.fillStyle = s.scheme.bg;
  memeCtx.fillRect(0, 0, 600, 600);

  if (s.bgImg) {
    const scale = Math.max(600 / s.bgImg.width, 600 / s.bgImg.height);
    const sw = s.bgImg.width * scale, sh = s.bgImg.height * scale;
    memeCtx.drawImage(s.bgImg, (600 - sw) / 2, (600 - sh) / 2, sw, sh);
    memeCtx.fillStyle = 'rgba(0,0,0,0.58)';
    memeCtx.fillRect(0, 0, 600, 600);
  } else {
    const grad = memeCtx.createRadialGradient(300, 300, 0, 300, 300, 420);
    grad.addColorStop(0, hexToRgbaStr(s.scheme.accent, 0.08));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    memeCtx.fillStyle = grad;
    memeCtx.fillRect(0, 0, 600, 600);
  }

  if (s.logoImg) {
    memeCtx.drawImage(s.logoImg, s.logoX, s.logoY, s.logoW, s.logoH);
  }

  const boxes = drawMemeText(
    s.useTagline ? s.tagline : null,
    s.useQuote   ? s.quote   : null,
    s.scheme.accent,
    s.textPos, s.tagPos
  );
  if (boxes) {
    s.textBox = boxes.textBox;
    s.tagBox  = boxes.tagBox;
    if (!s.textPos && boxes.defaultTextPos) s.textPos = boxes.defaultTextPos;
    if (!s.tagPos  && boxes.defaultTagPos)  s.tagPos  = boxes.defaultTagPos;
  }
}

// _drawHandles — draws resize corner squares on top (not included in download)
function _drawHandles() {
  if (!_memeState || !_memeState.logoImg || !memeCtx) return;
  const s  = _memeState;
  const hw = 7;
  const corners = [
    [s.logoX,           s.logoY],
    [s.logoX + s.logoW, s.logoY],
    [s.logoX,           s.logoY + s.logoH],
    [s.logoX + s.logoW, s.logoY + s.logoH],
  ];
  memeCtx.save();
  corners.forEach(([cx, cy]) => {
    memeCtx.fillStyle   = 'rgba(255,255,255,0.95)';
    memeCtx.strokeStyle = 'rgba(0,0,0,0.75)';
    memeCtx.lineWidth   = 1.5;
    memeCtx.fillRect  (cx - hw, cy - hw, hw * 2, hw * 2);
    memeCtx.strokeRect(cx - hw, cy - hw, hw * 2, hw * 2);
  });
  memeCtx.restore();
}

// redrawMeme — full render including handles (used during interaction)
function redrawMeme() {
  _drawMemeContent();
  _drawHandles();
}

// ─── INTERACTION ──────────────────────────────
const CORNER_R = 24;  // corner resize hit radius in canvas px

function _canvasPos(e) {
  const rect   = memeCanvas.getBoundingClientRect();
  const scaleX = memeCanvas.width  / rect.width;
  const scaleY = memeCanvas.height / rect.height;
  const src    = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left) * scaleX,
    y: (src.clientY - rect.top)  * scaleY,
  };
}

// Returns corner name ('nw','ne','sw','se') if (x,y) is near a logo corner
function _logoCorner(x, y) {
  if (!_memeState || !_memeState.logoImg) return null;
  const s = _memeState;
  const corners = {
    nw: [s.logoX,           s.logoY],
    ne: [s.logoX + s.logoW, s.logoY],
    sw: [s.logoX,           s.logoY + s.logoH],
    se: [s.logoX + s.logoW, s.logoY + s.logoH],
  };
  for (const [name, [cx, cy]] of Object.entries(corners)) {
    if (Math.hypot(x - cx, y - cy) < CORNER_R) return name;
  }
  return null;
}

// True if (x,y) is inside the logo body (excluding corner zones)
function _overLogo(x, y) {
  if (!_memeState || !_memeState.logoImg) return false;
  const s = _memeState;
  return x > s.logoX + CORNER_R && x < s.logoX + s.logoW - CORNER_R &&
         y > s.logoY + CORNER_R && y < s.logoY + s.logoH - CORNER_R;
}

function _overBox(x, y, box) {
  if (!box) return false;
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}

function _cursorFor(x, y) {
  const c = _logoCorner(x, y);
  if (c) return (c === 'nw' || c === 'se') ? 'nwse-resize' : 'nesw-resize';
  if (_overLogo(x, y)) return 'grab';
  if (_memeState && (_overBox(x, y, _memeState.textBox) || _overBox(x, y, _memeState.tagBox))) return 'move';
  return 'default';
}

function _onMemePointerDown(e) {
  if (!_memeState) return;
  const { x, y } = _canvasPos(e);

  // 1. Logo corner → resize
  const corner = _logoCorner(x, y);
  if (corner) {
    const s = _memeState;
    // Anchor = opposite corner (stays fixed during resize)
    _interact.anchorX = corner.includes('e') ? s.logoX           : s.logoX + s.logoW;
    _interact.anchorY = corner.includes('s') ? s.logoY           : s.logoY + s.logoH;
    _interact.mode   = 'logoResize';
    _interact.corner = corner;
    memeCanvas.style.cursor = (corner === 'nw' || corner === 'se') ? 'nwse-resize' : 'nesw-resize';
    e.preventDefault();
    return;
  }

  // 2. Logo body → drag
  if (_overLogo(x, y)) {
    _interact.mode = 'logoDrag';
    _interact.offX = x - _memeState.logoX;
    _interact.offY = y - _memeState.logoY;
    memeCanvas.style.cursor = 'grabbing';
    e.preventDefault();
    return;
  }

  // 3. Main text block → drag
  if (_overBox(x, y, _memeState.textBox)) {
    _interact.mode = 'textDrag';
    _interact.offX = x - (_memeState.textPos?.cx ?? 300);
    _interact.offY = y - (_memeState.textPos?.cy ?? 560);
    memeCanvas.style.cursor = 'grabbing';
    e.preventDefault();
    return;
  }

  // 4. Tagline block → drag
  if (_overBox(x, y, _memeState.tagBox)) {
    _interact.mode = 'tagDrag';
    _interact.offX = x - (_memeState.tagPos?.cx ?? 300);
    _interact.offY = y - (_memeState.tagPos?.cy ?? 38);
    memeCanvas.style.cursor = 'grabbing';
    e.preventDefault();
    return;
  }
}

function _onMemePointerMove(e) {
  if (!_memeState) return;
  const { x, y } = _canvasPos(e);

  if (_interact.mode === 'logoResize') {
    const dx = Math.abs(x - _interact.anchorX);
    const dy = Math.abs(y - _interact.anchorY);
    const newSize = Math.max(40, Math.min(580, Math.max(dx, dy)));
    _memeState.logoW = _memeState.logoH = newSize;
    const c = _interact.corner;
    _memeState.logoX = c.includes('e') ? _interact.anchorX           : _interact.anchorX - newSize;
    _memeState.logoY = c.includes('s') ? _interact.anchorY           : _interact.anchorY - newSize;
    redrawMeme();
    e.preventDefault();
    return;
  }

  if (_interact.mode === 'logoDrag') {
    const maxOX = _memeState.logoW  * 0.5;
    const maxOY = _memeState.logoH  * 0.5;
    _memeState.logoX = Math.max(-maxOX, Math.min(600 - maxOX, x - _interact.offX));
    _memeState.logoY = Math.max(-maxOY, Math.min(600 - maxOY, y - _interact.offY));
    redrawMeme();
    e.preventDefault();
    return;
  }

  if (_interact.mode === 'textDrag') {
    _memeState.textPos = {
      cx: Math.max(60, Math.min(540, x - _interact.offX)),
      cy: Math.max(20, Math.min(590, y - _interact.offY)),
    };
    redrawMeme();
    e.preventDefault();
    return;
  }

  if (_interact.mode === 'tagDrag') {
    _memeState.tagPos = {
      cx: Math.max(60, Math.min(540, x - _interact.offX)),
      cy: Math.max(20, Math.min(590, y - _interact.offY)),
    };
    redrawMeme();
    e.preventDefault();
    return;
  }

  // Hover: update cursor
  memeCanvas.style.cursor = _cursorFor(x, y);
}

function _onMemePointerUp() {
  if (_interact.mode) {
    _interact.mode = null;
    memeCanvas.style.cursor = 'default';
  }
}

// drawMemeText — position-aware, returns hit-boxes for drag interaction
// textPos / tagPos are {cx, cy} center points; null = use default positions
function drawMemeText(tagline, quote, accentColor, textPos, tagPos) {
  if (!memeCtx) return null;
  const text = quote || tagline;
  if (!text) return null;

  memeCtx.save();

  const padding  = 40;
  const maxWidth = 600 - padding * 2;
  const isQuote  = !!quote;
  const fontSize = isQuote ? 22 : 30;

  memeCtx.font      = `bold italic ${fontSize}px Ubuntu, Arial, sans-serif`;
  memeCtx.textAlign = 'center';

  // ── Main text block ────────────────────────────
  const lines  = wrapText(memeCtx, text, maxWidth);
  const lineH  = fontSize * 1.4;
  const totalH = lines.length * lineH;

  const pillW = maxWidth + 32;
  const pillH = totalH + 24;
  // Default: bottom-center
  const defaultTextCy = 600 - padding - pillH / 2;
  const cx = textPos?.cx ?? 300;
  const cy = textPos?.cy ?? defaultTextCy;
  const pillX = cx - pillW / 2;
  const pillY = cy - pillH / 2;

  const bgAlpha = _memeState?.textBgAlpha ?? 0.6;
  const bgColor = _memeState?.textBgColor ?? '#000000';
  memeCtx.fillStyle = hexToRgbaStr(bgColor, bgAlpha);
  roundRect(memeCtx, pillX, pillY, pillW, pillH, 12);
  memeCtx.fill();

  memeCtx.fillStyle   = isQuote ? '#ffffff' : accentColor;
  memeCtx.shadowColor = 'rgba(0,0,0,0.9)';
  memeCtx.shadowBlur  = 6;
  const baselineY = pillY + 12 + fontSize;
  lines.forEach((line, i) => memeCtx.fillText(line, cx, baselineY + i * lineH));

  const textBox = { x: pillX, y: pillY, w: pillW, h: pillH };

  // ── Tagline pill (shown at top when both tagline + quote are active) ──
  let tagBox = null;
  let defaultTagPos = null;
  if (tagline && quote) {
    const tagFontSize = 26;
    memeCtx.font = `bold italic ${tagFontSize}px Ubuntu, Arial, sans-serif`;

    const tagLines  = wrapText(memeCtx, tagline, maxWidth);
    const tagLineH  = tagFontSize * 1.4;
    const tagTotalH = tagLines.length * tagLineH;
    const tagPillW  = Math.min(maxWidth + 32, memeCtx.measureText(tagline).width + 48);
    const tagPillH  = tagTotalH + 20;

    const defaultTagCy = 38;
    const tcx = tagPos?.cx ?? 300;
    const tcy = tagPos?.cy ?? defaultTagCy;
    const tagPillX = tcx - tagPillW / 2;
    const tagPillY = tcy - tagPillH / 2;

    memeCtx.fillStyle = hexToRgbaStr(bgColor, bgAlpha * 0.85);
    roundRect(memeCtx, tagPillX, tagPillY, tagPillW, tagPillH, 10);
    memeCtx.fill();

    memeCtx.fillStyle   = accentColor;
    memeCtx.shadowColor = 'rgba(0,0,0,0.9)';
    const tagBaselineY = tagPillY + 10 + tagFontSize;
    tagLines.forEach((line, i) => memeCtx.fillText(line, tcx, tagBaselineY + i * tagLineH));

    tagBox = { x: tagPillX, y: tagPillY, w: tagPillW, h: tagPillH };
    defaultTagPos = { cx: 300, cy: defaultTagCy };
  }

  // Watermark
  memeCtx.font      = '13px Ubuntu, Arial, sans-serif';
  memeCtx.fillStyle = 'rgba(255,255,255,0.35)';
  memeCtx.shadowBlur = 0;
  memeCtx.textAlign = 'right';
  memeCtx.fillText('buttcoin.meme', 590, 592);

  memeCtx.restore();

  return {
    textBox,
    tagBox,
    defaultTextPos: { cx: 300, cy: defaultTextCy },
    defaultTagPos,
  };
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function hexToRgbaStr(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function downloadGeneratedMeme() {
  if (!memeCanvas) return;
  _drawMemeContent();   // clean render — no handles
  const link = document.createElement('a');
  link.download = 'buttcoin-meme.png';
  link.href = memeCanvas.toDataURL('image/png');
  link.click();
  redrawMeme();         // restore handles on canvas
}

// ─── TEXT STYLE CONTROLS ──────────────────────
function updateTextStyle() {
  if (!_memeState) return;
  const el = document.getElementById('text-intensity');
  if (el) _memeState.textBgAlpha = parseFloat(el.value);
  redrawMeme();
}

function setTextBgColor(color, btn) {
  if (!_memeState) return;
  _memeState.textBgColor = color;
  document.querySelectorAll('.text-color-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  redrawMeme();
}

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initUpload();
  window.loadMemes('all');

  // Logo drag events on the randomizer canvas
  if (memeCanvas) {
    memeCanvas.addEventListener('mousedown',  _onMemePointerDown);
    memeCanvas.addEventListener('mousemove',  _onMemePointerMove);
    memeCanvas.addEventListener('mouseup',    _onMemePointerUp);
    memeCanvas.addEventListener('mouseleave', _onMemePointerUp);
    memeCanvas.addEventListener('touchstart', _onMemePointerDown, { passive: false });
    memeCanvas.addEventListener('touchmove',  _onMemePointerMove, { passive: false });
    memeCanvas.addEventListener('touchend',   _onMemePointerUp);
  }

  // Trigger meme count animation only when section enters viewport
  const section = document.getElementById('meme-depot');
  const countEl = document.getElementById('meme-count');
  if (section && countEl && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && countEl.dataset.total && !countEl.dataset.counted) {
          countEl.dataset.counted = '1';
          countUp(countEl, parseInt(countEl.dataset.total));
          observer.disconnect();
        }
      });
    }, { threshold: 0.2 });
    observer.observe(section);
  }
});
