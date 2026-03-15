/* ═══════════════════════════════════════════════
   BUTTCOIN — laser.js
   Purple laser eye maker using Canvas API
   Click image to place laser eyes · Download
═══════════════════════════════════════════════ */

let laserImg      = null;
let laserEyes     = [];   // [{x, y}]
let laserColor    = '#a855f7';
let laserSize     = 30;
let laserIntensity = 0.85;

const canvas  = document.getElementById('laser-canvas');
const ctx     = canvas ? canvas.getContext('2d') : null;

// ─── UPLOAD IMAGE ─────────────────────────────
function initLaser() {
  const input = document.getElementById('laser-input');
  if (!input || !canvas || !ctx) return;

  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        laserImg  = img;
        laserEyes = [];

        // Scale canvas to image (max 800px wide)
        const maxW = 800;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width  = img.width  * scale;
        canvas.height = img.height * scale;

        // Show canvas, hide placeholder
        canvas.style.display   = 'block';
        const ph = document.getElementById('laser-placeholder');
        if (ph) ph.style.display = 'none';

        // Show controls
        const opts = document.getElementById('laser-options');
        if (opts) opts.style.display = 'block';

        // Hide upload area text
        const area = document.getElementById('laser-upload-area');
        if (area) area.querySelector('p').textContent = '✓ Image loaded. Click to replace.';

        drawLaser();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Click on canvas to place eye
  canvas.addEventListener('click', e => {
    if (!laserImg) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top)  * scaleY;
    laserEyes.push({ x, y });
    drawLaser();
  });
}

// ─── DRAW ─────────────────────────────────────
function drawLaser() {
  if (!ctx || !laserImg) return;

  // Clear and draw base image
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(laserImg, 0, 0, canvas.width, canvas.height);

  // Draw each laser eye
  laserEyes.forEach(eye => drawEye(eye.x, eye.y));
}

function drawEye(x, y) {
  const size  = laserSize;
  const alpha = laserIntensity;

  const rgb = hexToRgb(laserColor);
  if (!rgb) return;

  const R = `${rgb.r},${rgb.g},${rgb.b}`;

  ctx.save();

  // Additive blending — makes overlapping glows burn bright like real lasers
  ctx.globalCompositeOperation = 'lighter';

  // ── Outer ambient glow ────────────────────────
  const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
  outerGlow.addColorStop(0,   `rgba(${R},${alpha * 0.4})`);
  outerGlow.addColorStop(0.3, `rgba(${R},${alpha * 0.12})`);
  outerGlow.addColorStop(1,   `rgba(${R},0)`);
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(x, y, size * 4, 0, Math.PI * 2);
  ctx.fill();

  // ── Sharp star burst rays ─────────────────────
  // 4 long main spikes + 4 medium + 8 short secondary + 16 hair = 32
  const rayDefs = [];
  for (let i = 0; i < 32; i++) {
    const angle   = (i / 32) * Math.PI * 2;
    const isMajor = i % 8 === 0;
    const isMid   = i % 4 === 0 && !isMajor;
    const len   = isMajor ? size * 7    : isMid ? size * 4.5  : size * 2.5;
    const width = isMajor ? size * 0.10 : isMid ? size * 0.06 : size * 0.03;
    rayDefs.push({ angle, len, width });
  }

  rayDefs.forEach(({ angle, len, width }) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const grad = ctx.createLinearGradient(0, 0, len, 0);
    grad.addColorStop(0,    `rgba(255,255,255,${alpha})`);
    grad.addColorStop(0.04, `rgba(${R},${alpha * 0.95})`);
    grad.addColorStop(0.25, `rgba(${R},${alpha * 0.5})`);
    grad.addColorStop(0.7,  `rgba(${R},${alpha * 0.15})`);
    grad.addColorStop(1,    `rgba(${R},0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -width / 2);
    ctx.lineTo(len, 0);
    ctx.lineTo(0,  width / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // ── Purple mid glow ───────────────────────────
  const midGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 1.4);
  midGlow.addColorStop(0,   `rgba(${R},${alpha * 0.9})`);
  midGlow.addColorStop(0.5, `rgba(${R},${alpha * 0.4})`);
  midGlow.addColorStop(1,   `rgba(${R},0)`);
  ctx.fillStyle = midGlow;
  ctx.beginPath();
  ctx.arc(x, y, size * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // ── Blazing white core ────────────────────────
  const core = ctx.createRadialGradient(x, y, 0, x, y, size * 0.7);
  core.addColorStop(0,   `rgba(255,255,255,${alpha})`);
  core.addColorStop(0.4, `rgba(255,255,255,${alpha * 0.8})`);
  core.addColorStop(0.8, `rgba(${R},${alpha * 0.5})`);
  core.addColorStop(1,   `rgba(${R},0)`);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─── CONTROLS ─────────────────────────────────
function updateLaser() {
  const sizeEl      = document.getElementById('laser-size');
  const intensityEl = document.getElementById('laser-intensity');
  if (sizeEl)      laserSize      = parseInt(sizeEl.value);
  if (intensityEl) laserIntensity = parseFloat(intensityEl.value);
  drawLaser();
}

function setLaserColor(color, btn) {
  laserColor = color;
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  drawLaser();
}

function undoLaser() {
  if (laserEyes.length > 0) {
    laserEyes.pop();
    drawLaser();
  }
}

function clearLasers() {
  laserEyes = [];
  drawLaser();
}

function downloadLaser() {
  if (!canvas || !laserImg) return;
  const link = document.createElement('a');
  link.download = 'buttcoin-laser-eyes.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ─── HELPERS ──────────────────────────────────
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', initLaser);
