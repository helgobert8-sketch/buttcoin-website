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
const memeCanvas    = document.getElementById('meme-canvas');
const memeCtx       = memeCanvas ? memeCanvas.getContext('2d') : null;

function generateMeme() {
  if (!memeCanvas || !memeCtx) return;

  const useLogo     = document.getElementById('r-logo')?.checked;
  const useTagline  = document.getElementById('r-tagline')?.checked;
  const useQuote    = document.getElementById('r-quote')?.checked;
  const useButtoshi = document.getElementById('r-buttoshi')?.checked;
  const useButtlor  = document.getElementById('r-buttlor')?.checked;

  // Pick random tagline/quote
  const tagline = MEME_TAGLINES[Math.floor(Math.random() * MEME_TAGLINES.length)];
  const quote   = MEME_QUOTES[Math.floor(Math.random() * MEME_QUOTES.length)];

  // Choose a random background color scheme
  const schemes = [
    { bg: '#0d0d0d', accent: '#f7931a' },
    { bg: '#0a0a1a', accent: '#a855f7' },
    { bg: '#1a0a00', accent: '#f7931a' },
    { bg: '#0a1a0a', accent: '#22c55e' },
    { bg: '#000000', accent: '#f7931a' },
  ];
  const scheme = schemes[Math.floor(Math.random() * schemes.length)];

  memeCanvas.width  = 600;
  memeCanvas.height = 600;
  memeCanvas.style.display = 'block';

  const hint = document.getElementById('randomizer-hint');
  if (hint) hint.style.display = 'none';

  // Draw background
  memeCtx.fillStyle = scheme.bg;
  memeCtx.fillRect(0, 0, 600, 600);

  // Subtle radial gradient overlay
  const grad = memeCtx.createRadialGradient(300, 300, 0, 300, 300, 420);
  grad.addColorStop(0,   hexToRgbaStr(scheme.accent, 0.08));
  grad.addColorStop(0.6, hexToRgbaStr(scheme.accent, 0.03));
  grad.addColorStop(1,   'rgba(0,0,0,0)');
  memeCtx.fillStyle = grad;
  memeCtx.fillRect(0, 0, 600, 600);

  let loadCount = 0;
  let totalLoads = (useLogo ? 1 : 0) + (useButtoshi ? 1 : 0) + (useButtlor ? 1 : 0);

  function onImageLoad() {
    loadCount++;
    if (loadCount >= totalLoads) {
      // Draw text on top after images load
      drawMemeText(useTagline ? tagline : null, useQuote ? quote : null, scheme.accent);
      document.getElementById('download-meme-btn').style.display = 'block';
    }
  }

  if (totalLoads === 0) {
    // Text only
    drawMemeText(useTagline ? tagline : null, useQuote ? quote : null, scheme.accent);
    document.getElementById('download-meme-btn').style.display = 'block';
    return;
  }

  // Draw logo centered (if selected)
  if (useLogo && !useButtoshi && !useButtlor) {
    const img = new Image();
    img.onload = () => {
      const size = 320;
      const x = (600 - size) / 2;
      const y = (600 - size) / 2 - (useTagline || useQuote ? 40 : 0);
      memeCtx.drawImage(img, x, y, size, size);
      onImageLoad();
    };
    img.onerror = onImageLoad;
    img.src = 'assets/logo.png';
  }

  // Draw Buttoshi (if selected)
  if (useButtoshi) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const h = 350;
      const w = (img.width / img.height) * h;
      const x = useButtlor ? 60 : (600 - w) / 2;
      memeCtx.drawImage(img, x, 180, w, h);
      if (useLogo) {
        const logo = new Image();
        logo.onload = () => {
          memeCtx.drawImage(logo, 220, 30, 160, 160);
          onImageLoad();
        };
        logo.onerror = onImageLoad;
        logo.src = 'assets/logo.png';
      } else {
        onImageLoad();
      }
    };
    img.onerror = onImageLoad;
    img.src = 'assets/characters/buttoshi.png';
  }

  // Draw Buttlor (if selected)
  if (useButtlor) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const h = 350;
      const w = (img.width / img.height) * h;
      const x = useButtoshi ? 600 - w - 60 : (600 - w) / 2;
      memeCtx.drawImage(img, x, 180, w, h);
      onImageLoad();
    };
    img.onerror = onImageLoad;
    img.src = 'assets/characters/buttlor.png';
  }
}

function drawMemeText(tagline, quote, accentColor) {
  if (!memeCtx) return;
  const text = quote || tagline;
  if (!text) return;

  memeCtx.save();

  // Text area
  const padding = 40;
  const maxWidth = 600 - padding * 2;
  const isQuote  = !!quote;

  const fontSize  = isQuote ? 22 : 30;
  const fontStyle = 'bold italic';
  memeCtx.font = `${fontStyle} ${fontSize}px Ubuntu, Arial, sans-serif`;
  memeCtx.fillStyle = '#ffffff';
  memeCtx.textAlign = 'center';
  memeCtx.shadowColor = 'rgba(0,0,0,0.8)';
  memeCtx.shadowBlur = 6;

  // Wrap text
  const lines = wrapText(memeCtx, text, maxWidth);
  const lineH = fontSize * 1.4;
  const totalH = lines.length * lineH;

  // Position at bottom
  const startY = 600 - padding - totalH + fontSize;

  // Background pill
  const bgH = totalH + 24;
  const bgY = startY - fontSize - 12;
  memeCtx.fillStyle = 'rgba(0,0,0,0.6)';
  roundRect(memeCtx, padding - 16, bgY, maxWidth + 32, bgH, 12);
  memeCtx.fill();

  // Draw text
  memeCtx.fillStyle = '#ffffff';
  memeCtx.shadowColor = 'rgba(0,0,0,0.9)';
  lines.forEach((line, i) => {
    memeCtx.fillText(line, 300, startY + i * lineH);
  });

  // Accent line at bottom
  if (tagline && quote) {
    // Also draw tagline at top
    memeCtx.font = `bold italic 26px Ubuntu, Arial, sans-serif`;
    memeCtx.fillStyle = accentColor;
    memeCtx.shadowColor = 'rgba(0,0,0,0.9)';
    memeCtx.fillText(tagline, 300, 52);
  } else if (tagline && !quote) {
    memeCtx.fillStyle = accentColor;
  }

  // Buttcoin watermark
  memeCtx.font = '13px Ubuntu, Arial, sans-serif';
  memeCtx.fillStyle = 'rgba(255,255,255,0.35)';
  memeCtx.shadowBlur = 0;
  memeCtx.textAlign = 'right';
  memeCtx.fillText('buttcoin.meme', 590, 592);

  memeCtx.restore();
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
  const link = document.createElement('a');
  link.download = 'buttcoin-meme.png';
  link.href = memeCanvas.toDataURL('image/png');
  link.click();
}

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initUpload();
  window.loadMemes('all');

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
