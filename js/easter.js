/* ═══════════════════════════════════════════════
   BUTTCOIN — easter.js
   Easter egg triggers → Church of Buttcoin
   ─────────────────────────────────────────────
   Triggers:
   • Type 'ibuttlieve' anywhere on the page
   • Click / tap the Buttcoin logo 7 times
═══════════════════════════════════════════════ */

(function () {
  const TARGET    = 'ibuttlieve';
  const LOGO_TAPS = 7;
  const TAP_WINDOW = 4000; // ms to complete all taps

  let typed     = '';
  let tapCount  = 0;
  let tapTimer  = null;
  let triggered = false;

  // ─── TRANSITION ─────────────────────────────
  function trigger() {
    if (triggered) return;
    triggered = true;

    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'background:#0d0d0d',
      'opacity:0', 'z-index:99999',
      'transition:opacity 1s ease',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      setTimeout(() => { window.location.href = 'church.html'; }, 1100);
    });
  }

  // ─── KEYBOARD TRIGGER ───────────────────────
  document.addEventListener('keydown', function (e) {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
    if (e.key.length !== 1) return;

    typed += e.key.toLowerCase();
    if (typed.length > TARGET.length) typed = typed.slice(-TARGET.length);
    if (typed === TARGET) trigger();
  });

  // ─── LOGO TAP TRIGGER ───────────────────────
  function addTapListener(el) {
    if (!el) return;
    el.style.cursor = 'pointer';
    el.addEventListener('click', function () {
      tapCount++;
      if (tapTimer) clearTimeout(tapTimer);

      if (tapCount >= LOGO_TAPS) {
        tapCount = 0;
        trigger();
        return;
      }

      tapTimer = setTimeout(() => { tapCount = 0; }, TAP_WINDOW);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    addTapListener(document.querySelector('.hero-logo'));
    addTapListener(document.querySelector('.nav-logo-img'));
  });
})();
