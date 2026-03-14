/* ═══════════════════════════════════════════════
   BUTTCOIN — app.js
   Handles: quotes, nav, FAQ, tabs, modals,
            CA copy, tagline rotator
═══════════════════════════════════════════════ */

// ─── QUOTES ───────────────────────────────────
const QUOTES = [
  { text: "Just flip it.", author: "Buttoshi" },
  { text: "Hyperbuttcoinification is inevitable.", author: "The Buttverse" },
  { text: "Not to the moon, but one better: to Uranus.", author: "Buttcoin Community" },
  { text: "Buttcoin is never down. We are either up or upgrading.", author: "Buttoshi" },
  { text: "The first ever Buttcoin block was mined more than 12 years ago by Buttoshi.", author: "Buttcoin Lore" },
  { text: "How can you be a Bitcoin maxi, but not a Buttcoin maxi?", author: "The Buttverse" },
  { text: "Bitcoin|Buttcoin — best barbell strategy in the whole game right now.", author: "Michael J. Buttlor" },
  { text: "Stay humble and stack butts.", author: "Buttoshi" },
  { text: "As long as bitcoin is relevant, Buttcoin has mindshare.", author: "The Buttverse" },
  { text: "We are all Buttoshi.", author: "Buttcoin Community" },
  { text: "No one, and I mean no one — touches my butt!", author: "Buttoshi" },
  { text: "Diamond butts will win.", author: "Michael J. Buttlor" },
  { text: "Buttcoin is the bitcoin of memes.", author: "Buttoshi" },
  { text: "If enough people decide that flipping Bitcoin is funny, righteous, or spiritually necessary, math will obediently rearrange itself.", author: "The Buttverse" },
  { text: "It's not over. It's not back. It's the next Bitcoin and it's called Buttcoin. See you on Uranus.", author: "Buttoshi" },
  { text: "Lore runs deep. Study Buttcoin.", author: "Michael J. Buttlor" },
  { text: "Delusional people often are the ones that change the world.", author: "The Buttverse" },
  { text: "Buttcoin will do to BTC what email did to the post office.", author: "Buttoshi" },
  { text: "Spread Buttcoin with love.", author: "Buttcoin Community" },
  { text: "Buttcoin is freedom.", author: "Buttoshi" },
  { text: "What you focus on will grow. Always remember that, my Buttcoining friends.", author: "The Buttverse" },
  { text: "Buttoshi was the first to discover a simple truth — Buttcoin is the bitcoin of memes.", author: "Buttcoin Lore" },
  { text: "Fortify your future, stack butts.", author: "Michael J. Buttlor" },
  { text: "Only rotation that makes sense: Bitcoin → Buttcoin.", author: "Buttoshi" },
  { text: "Buttcoiner don't follow the crowd. We let the crowd follow us.", author: "The Buttverse" },
  { text: "Buttcoin — greatness from small beginnings.", author: "Buttoshi" },
  { text: "The Buttcoin network is a glorious mess of tangled threads, each node humming its own tune without a conductor's baton.", author: "Buttoshi" },
  { text: "Daily reminder: Put your money where your butt is.", author: "Buttcoin Community" },
  { text: "Buttcoin will make believers out of disbelievers and disbelievers out of believers.", author: "Michael J. Buttlor" },
  { text: "Relentless accumulation.", author: "Michael J. Buttlor" },
  { text: "It's literally coded — the next Bitcoin.", author: "Buttoshi" },
  { text: "Gbuttcoin. Because it's always gbutt somewhere in the world of Buttcoiners.", author: "The Buttverse" },
];

const TAGLINES = [
  "The Next Bitcoin",
  "Just flip it",
  "Hyperbuttcoinification is inevitable",
  "Not to the moon — to Uranus",
  "We are all Buttoshi",
  "Buttcoin to Buttillions",
  "Stack butts. Stay humble.",
  "Literally coded.",
];

let currentQuote = 0;
let taglineIndex = 0;

function initQuote() {
  // Start with a random quote
  currentQuote = Math.floor(Math.random() * QUOTES.length);
  showQuote(currentQuote);
}

function showQuote(i) {
  const q = QUOTES[i];
  const el = document.getElementById('quote-text');
  const auth = document.getElementById('quote-author');
  if (!el || !auth) return;
  el.style.opacity = 0;
  setTimeout(() => {
    el.textContent = q.text;
    auth.textContent = `— ${q.author}`;
    el.style.opacity = 1;
  }, 300);
}

function nextQuote() {
  currentQuote = (currentQuote + 1) % QUOTES.length;
  showQuote(currentQuote);
}

function rotateTagline() {
  const el = document.getElementById('tagline-rotator');
  if (!el) return;
  el.style.opacity = 0;
  setTimeout(() => {
    taglineIndex = (taglineIndex + 1) % TAGLINES.length;
    el.textContent = TAGLINES[taglineIndex];
    el.style.opacity = 1;
  }, 400);
}

// ─── CONTRACT ADDRESS COPY ─────────────────────
const CA = 'FasH397CeZLNYWkd3wWK9vrmjd1z93n3b59DssRXpump';

function copyCA() {
  navigator.clipboard.writeText(CA).then(() => {
    const btn = document.getElementById('btn-copy');
    if (btn) {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    }
  }).catch(() => {
    // Fallback
    const el = document.createElement('textarea');
    el.value = CA;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  });
}

// ─── NAVBAR ───────────────────────────────────
function initNavbar() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    // Close on nav link click
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  // Scroll shadow
  window.addEventListener('scroll', () => {
    const nb = document.getElementById('navbar');
    if (nb) {
      nb.style.boxShadow = window.scrollY > 20
        ? '0 2px 20px rgba(0,0,0,0.5)'
        : 'none';
    }
  }, { passive: true });
}

// ─── FAQ ──────────────────────────────────────
function toggleFAQ(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  // Toggle current
  if (!isOpen) item.classList.add('open');
}

// ─── TABS (Meme Depot) ─────────────────────────
function switchDepotTab(tab, btn) {
  document.querySelectorAll('.depot-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.depot-panel').forEach(p => p.classList.add('hidden'));
  btn.classList.add('active');
  const panel = document.getElementById('depot-' + tab);
  if (panel) panel.classList.remove('hidden');
}

// ─── MODALS ───────────────────────────────────
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
  document.body.style.overflow = '';
}

// Escape key closes modals
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  }
});

// ─── ARTICLES ─────────────────────────────────
const ARTICLE_CONTENT = {
  fundamentals: {
    title: "Fundamentals vs. FUD",
    tag: "Analysis",
    author: "paronthes",
    body: `<p>Buttcoin has three fundamental essences that make it unlike any other memecoin in the market:</p>
    <h4>1. Bitcoin</h4>
    <p>Buttcoin is inseparably tied to Bitcoin — it IS the Bitcoin logo, rotated 90 degrees. As long as Bitcoin is relevant, Buttcoin has mindshare. Bitcoin's dominance is Buttcoin's mirror. Every time someone talks about BTC, Buttcoin echoes.</p>
    <h4>2. The Parody</h4>
    <p>Buttcoin is Bitcoin's loyal critic and companion. It laughs at Bitcoin's broken promises while respecting its foundation. The meme isn't mean-spirited — it's a love letter to crypto written sideways.</p>
    <h4>3. The Next Bitcoin</h4>
    <p>This is the mission. The community is on a mission to flip BTC. This isn't delusional — it's the only position that's internally consistent with holding Buttcoin. If you believe the meme, you believe the mission.</p>
    <p>The conclusion: the meme is "fundamentally too good" and truly inevitable. FUD is noise. Fundamentals are forever. Hyperbuttcoinification is inevitable.</p>`
  },
  retracements: {
    title: "Why Big Retracements in Memecoins Are Not Only Healthy",
    tag: "Strategy",
    body: `<p>Memecoins are volatile by nature. But for a community-owned coin like Buttcoin, big retracements serve an important function: they separate the diamond butts from the paper hands.</p>
    <p>Every major retracement in Buttcoin's history has been followed by a stronger community. The weak sell. The believers accumulate. The lore deepens.</p>
    <p>Remember: Buttcoin is either up or upgrading. There is no down — only a different angle of ascent toward Uranus.</p>
    <p>The barbell strategy (Bitcoin + Buttcoin) means you're covered in both scenarios: if Bitcoin continues to dominate, Buttcoin captures the meme upside. If Buttcoin flips Bitcoin, you're already holding the winner.</p>
    <p>Stack butts. Stay humble. Relentless accumulation.</p>`
  },
  believing: {
    title: "Believing in Yourself",
    tag: "Culture",
    body: `<p>Holding Buttcoin requires a specific kind of mental fortitude. The rest of the world isn't ready for it yet. That's the point.</p>
    <p>Every great idea looked ridiculous before it didn't. Email. The internet. Bitcoin itself. The joke that became a movement. The butt that became a barbell.</p>
    <p>Delusional people are the ones that change the world. If enough people decide that flipping Bitcoin is funny, righteous, or spiritually necessary, math will obediently rearrange itself.</p>
    <p>Buttcoin — greatness from small beginnings.</p>`
  },
  'doge-love': {
    title: "Dr. DOGE-Love, or How I Learned to Stop BONK-ing and Love the Buttcoin",
    tag: "Culture",
    body: `<p>There was a time before Buttcoin. A dark time of BONKing and DOGE speculation, of chasing pumps and following influencers into oblivion.</p>
    <p>Then someone rotated the Bitcoin logo 90 degrees and everything changed.</p>
    <p>The pre-ETF era of crypto was characterized by noise — a thousand memecoins competing for attention with no underlying thesis. Buttcoin was different. Buttcoin had lore. Buttcoin had a mission. Buttcoin had Buttoshi.</p>
    <p>The transition from trader to Buttcoiner is a one-way door. You either see it or you don't. And once you see it, you can't unsee it.</p>
    <p>Welcome to the Buttverse. The next Bitcoin awaits.</p>`
  },
  'di-news': {
    title: "Buttcoin: Can a 2013 Meme Really Be the Next Bitcoin?",
    tag: "News",
    source: "DI News — February 14, 2025",
    body: `<p>Published in DI News on Valentine's Day, 2025 — the mainstream started to ask the question the Buttcoin community had been answering for weeks.</p>
    <p>The article explored how a decade-old joke video by James D. McMurray had spawned a Solana-based memecoin with a legitimate thesis: that the meme is fundamentally tied to Bitcoin, and as Bitcoin's relevance grows, so does Buttcoin's.</p>
    <p>The community's answer to the headline question: <em>Yes. Obviously.</em></p>
    <p>Hyperbuttcoinification is inevitable.</p>`
  }
};

function openArticle(id) {
  const content = ARTICLE_CONTENT[id];
  if (!content) return;
  const body = document.getElementById('article-modal-body');
  if (!body) return;
  body.innerHTML = `
    <span class="article-tag">${content.tag || ''}</span>
    <h2 style="margin: 12px 0 8px; font-size: 1.5rem; line-height: 1.3">${content.title}</h2>
    ${content.author ? `<p style="color: var(--muted); font-size: 0.85rem; font-style: italic; margin-bottom: 8px">by ${content.author}</p>` : ''}
    ${content.source ? `<p style="color: var(--purple); font-size: 0.8rem; margin-bottom: 16px">${content.source}</p>` : ''}
    <hr style="border-color: var(--border); margin-bottom: 24px">
    <div style="line-height: 1.8; color: var(--text)">${content.body}</div>
  `;
  openModal('article-modal');
}

// ─── PRESENTATIONS ─────────────────────────────
const PRES_DATA = {
  legend: {
    title: "The Legend of Buttcoin",
    folder: "Legend of Buttcoin",
    count: 25,
    prefix: "Legend of Buttcoin (",
    suffix: ").png"
  },
  rules: {
    title: "21 Rules of Buttcoin — Michael J. Buttlor",
    folder: "Saylor 21 rules of BTC",
    count: 25,
    prefix: "",
    suffix: "-25.jpg"
  },
  standard: {
    title: "The Buttcoin Standard",
    folder: "The Buttcoin Standard",
    isPDF: true,
    pdfPath: "assets/presentations/The Buttcoin Standard.pdf"
  }
};

let currentSlide = 0;
let currentSlides = [];

function openPresentation(id) {
  const pres = PRES_DATA[id];
  if (!pres) return;

  if (pres.isPDF) {
    // Open PDF in new tab
    window.open(pres.pdfPath, '_blank');
    return;
  }

  currentSlide = 0;
  currentSlides = [];

  const slideshow = document.getElementById('slideshow');
  const counter = document.getElementById('slide-counter');
  if (!slideshow || !counter) return;

  if (id === 'legend') {
    for (let i = 1; i <= pres.count; i++) {
      currentSlides.push(`assets/presentations/legend/${i}.png`);
    }
  } else if (id === 'rules') {
    for (let i = 1; i <= pres.count; i++) {
      const num = String(i).padStart(2, '0');
      currentSlides.push(`assets/presentations/rules/${num}-25.jpg`);
    }
  }

  renderSlide();
  openModal('presentation-modal');
}

function renderSlide() {
  const slideshow = document.getElementById('slideshow');
  const counter = document.getElementById('slide-counter');
  if (!slideshow || !currentSlides.length) return;
  slideshow.innerHTML = `<img src="${currentSlides[currentSlide]}" alt="Slide ${currentSlide + 1}" />`;
  counter.textContent = `${currentSlide + 1} / ${currentSlides.length}`;
}

function nextSlide() {
  if (currentSlide < currentSlides.length - 1) {
    currentSlide++;
    renderSlide();
  }
}

function prevSlide() {
  if (currentSlide > 0) {
    currentSlide--;
    renderSlide();
  }
}

// ─── MEME FILTER ──────────────────────────────
function filterMemes(category, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // This will be handled by memes.js
  if (window.loadMemes) window.loadMemes(category);
}

function loadMoreMemes() {
  if (window.loadNextPage) window.loadNextPage();
}

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initQuote();
  // Rotate tagline every 4 seconds
  setInterval(rotateTagline, 4000);
  // Auto-advance quote every 30 seconds
  setInterval(nextQuote, 30000);
});
