export const START_ANGLE = 14;
export const TARGET_ANGLE = 104;
export const WRONG_ANGLE = 284;
export const START_SPEED = 120;
export const SPEED_MULTIPLIER = 1.12;
export const MAX_SPEED = 720;

const MILESTONES = new Map([
  [10, "Ten flips. It's starting to look natural."],
  [50, 'Fifty. You see it now.'],
  [100, 'Hyperbuttcoinification will purify us all.'],
]);
const STORAGE_KEY = 'buttcoin-the-flip-state-v1';
const memoryFallback = new WeakMap();

function sanitizePersistedState(value) {
  const stored = value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {};
  const seenMilestones = Array.isArray(stored.seenMilestones)
    ? [...new Set(stored.seenMilestones.filter((item) => MILESTONES.has(item)))].sort(
      (a, b) => a - b,
    )
    : [];

  return {
    lifetimeFlips:
      Number.isInteger(stored.lifetimeFlips) && stored.lifetimeFlips >= 0
        ? stored.lifetimeFlips
        : 0,
    bestDeviation:
      typeof stored.bestDeviation === 'number'
      && Number.isFinite(stored.bestDeviation)
      && stored.bestDeviation >= 0
      && stored.bestDeviation <= 180
        ? stored.bestDeviation
        : null,
    speedLevel:
      Number.isInteger(stored.speedLevel) && stored.speedLevel >= 0
        ? stored.speedLevel
        : 0,
    seenMilestones,
    muted: typeof stored.muted === 'boolean' ? stored.muted : false,
  };
}

export function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

export function circularDistance(a, b) {
  const difference = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(difference, 360 - difference);
}

export function relativeFlipAngle(absoluteAngle) {
  return normalizeAngle(absoluteAngle - START_ANGLE);
}

export function angleAtTimestamp(
  startAngle,
  startedAt,
  inputTimestamp,
  degreesPerSecond,
) {
  const elapsedSeconds = (inputTimestamp - startedAt) / 1000;
  return normalizeAngle(startAngle + elapsedSeconds * degreesPerSecond);
}

export function classifyAngle(absoluteAngle) {
  const deviation = circularDistance(absoluteAngle, TARGET_ANGLE);

  if (circularDistance(absoluteAngle, WRONG_ANGLE) <= 5) {
    return {
      key: 'wrong',
      copy: 'Wrong cheeks.',
      deviation,
      success: false,
      buttoshi: false,
    };
  }

  if (deviation <= 0.5) {
    return {
      key: 'buttoshi',
      copy: 'Buttoshi Flip. 90.0°.',
      deviation,
      success: true,
      buttoshi: true,
    };
  }

  if (deviation <= 5) {
    return {
      key: 'crossed',
      copy: 'Crossed.',
      deviation,
      success: true,
      buttoshi: false,
    };
  }

  if (deviation <= 15) {
    return {
      key: 'halfway',
      copy: 'Halfway there.',
      deviation,
      success: false,
      buttoshi: false,
    };
  }

  return {
    key: 'still',
    copy: 'Still Bitcoin.',
    deviation,
    success: false,
    buttoshi: false,
  };
}

export function speedForLevel(level) {
  const speed = START_SPEED * SPEED_MULTIPLIER ** Math.max(0, level);
  return Math.min(speed, MAX_SPEED);
}

export function applyResult(state, result) {
  const success = result.success;
  const lifetimeFlips = state.lifetimeFlips + (success ? 1 : 0);
  const seenMilestones = [...state.seenMilestones];
  let milestone = null;

  if (success) {
    const milestoneCopy = MILESTONES.get(lifetimeFlips);
    if (milestoneCopy && !seenMilestones.includes(lifetimeFlips)) {
      seenMilestones.push(lifetimeFlips);
      milestone = milestoneCopy;
    }
  }

  let speedLevel = state.speedLevel;
  if (success) {
    speedLevel += 1;
  } else if (result.key === 'wrong' || result.key === 'still') {
    speedLevel = Math.max(0, speedLevel - 1);
  }

  return {
    ...state,
    lifetimeFlips,
    bestDeviation:
      state.bestDeviation === null
        ? result.deviation
        : Math.min(state.bestDeviation, result.deviation),
    speedLevel,
    seenMilestones,
    streak: success ? state.streak + 1 : 0,
    milestone,
  };
}

export function loadPersistedState(storage) {
  let serialized;

  try {
    serialized = storage.getItem(STORAGE_KEY);
  } catch {
    // The in-memory copy below keeps the current session playable.
  }

  if (typeof serialized !== 'string') {
    try {
      serialized = memoryFallback.get(storage);
    } catch {
      // A missing or invalid storage object falls through to defaults.
    }
  }

  if (typeof serialized !== 'string') {
    return { ...sanitizePersistedState(null), streak: 0 };
  }

  try {
    return { ...sanitizePersistedState(JSON.parse(serialized)), streak: 0 };
  } catch {
    return { ...sanitizePersistedState(null), streak: 0 };
  }
}

export function savePersistedState(storage, state) {
  const serialized = JSON.stringify(sanitizePersistedState(state));

  try {
    memoryFallback.set(storage, serialized);
  } catch {
    // The caller still owns its live state if no storage object is available.
  }

  try {
    storage.setItem(STORAGE_KEY, serialized);
  } catch {
    // Persistence must never interrupt a round.
  }
}
