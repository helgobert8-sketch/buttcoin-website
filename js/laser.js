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

  // ── Outer ambient glow ────────────────────────
  const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 3.5);
  outerGlow.addColorStop(0,   `rgba(${R},${alpha * 0.5})`);
  outerGlow.addColorStop(0.4, `rgba(${R},${alpha * 0.15})`);
  outerGlow.addColorStop(1,   `rgba(${R},0)`);
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(x, y, size * 3.5, 0, Math.PI * 2);
  ctx.fill();

  // ── Star burst rays ───────────────────────────
  // 4 main long rays + 4 secondary shorter rays
  const rays = [
    { angle: 0,         len: size * 5,   width: size * 0.12 },   // right
    { angle: Math.PI,   len: size * 5,   width: size * 0.12 },   // left
    { angle: -Math.PI/2, len: size * 4.5, width: size * 0.1  },  // up
    { angle:  Math.PI/2, len: size * 4.5, width: size * 0.1  },  // down
    { angle:  Math.PI/4,       len: size * 3, width: size * 0.07 },
    { angle: -Math.PI/4,       len: size * 3, width: size * 0.07 },
    { angle:  3*Math.PI/4,     len: size * 3, width: size * 0.07 },
    { angle: -3*Math.PI/4,     len: size * 3, width: size * 0.07 },
  ];

  rays.forEach(({ angle, len, width }) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const grad = ctx.createLinearGradient(0, 0, len, 0);
    grad.addColorStop(0,    `rgba(255,255,255,${alpha * 0.95})`);
    grad.addColorStop(0.05, `rgba(${R},${alpha * 0.85})`);
    grad.addColorStop(0.4,  `rgba(${R},${alpha * 0.3})`);
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

  // ── Bright core ───────────────────────────────
  const core = ctx.createRadialGradient(x, y, 0, x, y, size * 0.9);
  core.addColorStop(0,   `rgba(255,255,255,${alpha})`);
  core.addColorStop(0.2, `rgba(255,255,255,${alpha * 0.95})`);
  core.addColorStop(0.5, `rgba(${R},${alpha * 0.8})`);
  core.addColorStop(1,   `rgba(${R},0)`);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.9, 0, Math.PI * 2);
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
