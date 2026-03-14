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

  // Parse color to RGB
  const rgb = hexToRgb(laserColor);
  if (!rgb) return;

  // Outer glow
  const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 2.5);
  outerGlow.addColorStop(0,   `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.7})`);
  outerGlow.addColorStop(0.4, `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.3})`);
  outerGlow.addColorStop(1,   `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(x, y, size * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Core bright spot
  const core = ctx.createRadialGradient(x, y, 0, x, y, size * 0.8);
  core.addColorStop(0,   `rgba(255,255,255,${alpha})`);
  core.addColorStop(0.3, `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`);
  core.addColorStop(1,   `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Laser beam shooting right
  const beamLen = canvas.width - x;
  const beamH   = Math.max(2, size * 0.15);
  const beam = ctx.createLinearGradient(x, y, canvas.width, y);
  beam.addColorStop(0,    `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.9})`);
  beam.addColorStop(0.05, `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.7})`);
  beam.addColorStop(0.3,  `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.3})`);
  beam.addColorStop(1,    `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
  ctx.fillStyle = beam;
  ctx.fillRect(x, y - beamH / 2, beamLen, beamH);

  // Beam glow (wider, more transparent)
  const beamGlow = ctx.createLinearGradient(x, y, x + beamLen * 0.5, y);
  beamGlow.addColorStop(0,   `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.3})`);
  beamGlow.addColorStop(1,   `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
  ctx.fillStyle = beamGlow;
  ctx.fillRect(x, y - beamH * 3, beamLen * 0.5, beamH * 6);
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
