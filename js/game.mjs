import {
  START_ANGLE,
  angleAtTimestamp,
  applyResult,
  classifyAngle,
  loadPersistedState,
  relativeFlipAngle,
  savePersistedState,
  speedForLevel,
} from './game-logic.mjs';

const surface = document.querySelector('#game-surface');
const coin = document.querySelector('#coin');
const gameStatus = document.querySelector('#game-status');
const milestone = document.querySelector('#milestone');
const lifetimeFlips = document.querySelector('#lifetime-flips');
const streak = document.querySelector('#streak');
const bestDeviation = document.querySelector('#best-deviation');
const muteToggle = document.querySelector('#mute-toggle');
const shareBlock = document.querySelector('#share-block');
const shareText = document.querySelector('#share-text');
const copyShare = document.querySelector('#copy-share');
const copyFeedback = document.querySelector('#copy-feedback');

const unavailableStorage = {
  getItem() {
    return null;
  },
  setItem() {},
};

function getStorage() {
  try {
    return window.localStorage ?? unavailableStorage;
  } catch {
    return unavailableStorage;
  }
}

const storage = getStorage();
let state = loadPersistedState(storage);
let phase = 'idle';
let roundStartedAt = 0;
let roundSpeed = speedForLevel(state.speedLevel);
let animationFrame = 0;
let audioContext;

function renderAngle(absoluteAngle) {
  const relativeAngle = relativeFlipAngle(absoluteAngle);
  coin.style.transform = `rotate(${relativeAngle}deg)`;
}

function renderCounters() {
  lifetimeFlips.textContent = String(state.lifetimeFlips);
  streak.textContent = String(state.streak);
  bestDeviation.textContent = state.bestDeviation === null
    ? '—'
    : `${state.bestDeviation.toFixed(1)}°`;
}

function renderMute() {
  muteToggle.setAttribute('aria-pressed', String(state.muted));
  muteToggle.textContent = `Sound: ${state.muted ? 'off' : 'on'}`;
}

function renderFrame(timestamp) {
  if (phase !== 'running') return;

  const absoluteAngle = angleAtTimestamp(START_ANGLE,
    roundStartedAt,
    timestamp,
    roundSpeed);
  renderAngle(absoluteAngle);
  animationFrame = requestAnimationFrame(renderFrame);
}

function startRound(startTimestamp) {
  phase = 'running';
  roundStartedAt = startTimestamp;
  roundSpeed = speedForLevel(state.speedLevel);
  surface.dataset.state = phase;
  surface.classList.remove('is-buttoshi');
  surface.setAttribute('aria-label', 'Stop The Flip');
  renderAngle(START_ANGLE);
  animationFrame = requestAnimationFrame(renderFrame);
}

function playButtoshiClick() {
  if (state.muted) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    audioContext ??= new AudioContext();
    if (audioContext.state === 'suspended') {
      void audioContext.resume().catch(() => {});
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.035);
  } catch {
    // Sound support must never interrupt a round.
  }
}

function stopRound(inputTimestamp) {
  if (phase !== 'running') return;

  phase = 'result';
  cancelAnimationFrame(animationFrame);

  const absoluteAngle = angleAtTimestamp(START_ANGLE,
    roundStartedAt,
    inputTimestamp,
    roundSpeed);
  renderAngle(absoluteAngle);

  const result = classifyAngle(absoluteAngle);
  const relativeAngle = relativeFlipAngle(absoluteAngle);
  state = applyResult(state, result);
  savePersistedState(storage, state);
  renderCounters();

  surface.dataset.state = phase;
  surface.classList.toggle('is-buttoshi', result.buttoshi);
  surface.setAttribute('aria-label', 'Round complete');
  gameStatus.textContent = result.buttoshi
    ? result.copy
    : `${relativeAngle.toFixed(1)}° — ${result.copy}`;

  milestone.textContent = state.milestone ?? '';
  milestone.hidden = !state.milestone;

  if (result.buttoshi) {
    shareBlock.hidden = false;
    shareText.value = `I flipped Bitcoin. Deviation: ${result.deviation.toFixed(1)}°. buttcoin.wtf`;
    copyFeedback.textContent = '';
    playButtoshiClick();
  }

  window.setTimeout(() => {
    startRound(performance.now());
  }, 1500);
}

function handleGameInput(event) {
  if (phase === 'idle') {
    gameStatus.textContent = '';
    startRound(event.timeStamp);
  } else if (phase === 'running') {
    stopRound(event.timeStamp);
  }
}

async function copyShareText() {
  shareText.focus();
  shareText.select();
  shareText.setSelectionRange(0, shareText.value.length);

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(shareText.value);
      copyFeedback.textContent = 'Copied.';
      return;
    } catch {
      // The selected textarea remains the no-permission fallback.
    }
  }

  copyFeedback.textContent = 'Text selected. Copy it manually.';
}

surface.addEventListener('pointerdown', (event) => {
  if (
    event.isPrimary === false
    || (event.button !== undefined && event.button !== 0)
  ) return;

  surface.focus({ preventScroll: true });
  handleGameInput(event);
});

surface.addEventListener('keydown', (event) => {
  if (
    (event.code !== 'Space' && event.code !== 'Enter')
    || event.repeat
  ) return;

  event.preventDefault();
  handleGameInput(event);
});

muteToggle.addEventListener('click', () => {
  state = { ...state, muted: !state.muted };
  savePersistedState(storage, state);
  renderMute();
});

copyShare.addEventListener('click', copyShareText);

renderAngle(START_ANGLE);
renderCounters();
renderMute();
