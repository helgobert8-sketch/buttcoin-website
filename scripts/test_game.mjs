import assert from 'node:assert/strict';

const tests = [];

function test(name, run) {
  tests.push({ name, run });
}

test('game domain module publishes the deterministic contract', async () => {
  let gameModule;
  let importError;

  try {
    gameModule = await import('../js/game-logic.mjs');
  } catch (error) {
    importError = error;
  }

  assert.ok(
    gameModule,
    `expected js/game-logic.mjs to load: ${importError?.message ?? 'module unavailable'}`,
  );

  const expectedConstants = {
    START_ANGLE: 14,
    TARGET_ANGLE: 104,
    WRONG_ANGLE: 284,
    START_SPEED: 120,
    SPEED_MULTIPLIER: 1.12,
    MAX_SPEED: 720,
  };

  for (const [name, value] of Object.entries(expectedConstants)) {
    assert.equal(gameModule[name], value, `${name} must equal ${value}`);
  }

  for (const name of [
    'normalizeAngle',
    'circularDistance',
    'relativeFlipAngle',
    'angleAtTimestamp',
    'classifyAngle',
    'speedForLevel',
    'applyResult',
    'loadPersistedState',
    'savePersistedState',
  ]) {
    assert.equal(typeof gameModule[name], 'function', `${name} must be exported`);
  }
});

test('fixed absolute angles map to the canonical score tiers and copy', async () => {
  const { classifyAngle } = await import('../js/game-logic.mjs');
  const cases = [
    [104, 'buttoshi', 'Buttoshi Flip. 90.0°.', 0, true, true],
    [104.5, 'buttoshi', 'Buttoshi Flip. 90.0°.', 0.5, true, true],
    [109, 'crossed', 'Crossed.', 5, true, false],
    [119, 'halfway', 'Halfway there.', 15, false, false],
    [284, 'wrong', 'Wrong cheeks.', 180, false, false],
    [14, 'still', 'Still Bitcoin.', 90, false, false],
  ];

  for (const [angle, key, copy, deviation, success, buttoshi] of cases) {
    assert.deepEqual(classifyAngle(angle), {
      key,
      copy,
      deviation,
      success,
      buttoshi,
    });
  }
});

test('angle normalization and distance are circular at wrap boundaries', async () => {
  const { circularDistance, normalizeAngle } = await import('../js/game-logic.mjs');

  assert.equal(normalizeAngle(-1), 359);
  assert.equal(normalizeAngle(360), 0);
  assert.equal(normalizeAngle(721), 1);
  assert.equal(circularDistance(359, 1), 2);
  assert.equal(circularDistance(1, 359), 2);
  assert.equal(circularDistance(0, 180), 180);
});

test('classification uses unrounded values at inclusive tier boundaries', async () => {
  const { classifyAngle } = await import('../js/game-logic.mjs');

  assert.equal(classifyAngle(104.5000001).key, 'crossed');
  assert.equal(classifyAngle(109.0000001).key, 'halfway');
  assert.equal(classifyAngle(119.0000001).key, 'still');
});

test('Wrong cheeks takes priority across its circular inclusive window', async () => {
  const { classifyAngle } = await import('../js/game-logic.mjs');

  assert.equal(classifyAngle(279).key, 'wrong');
  assert.equal(classifyAngle(289).key, 'wrong');
  assert.equal(classifyAngle(-76).key, 'wrong');
  assert.equal(classifyAngle(278.9999999).key, 'still');
  assert.equal(classifyAngle(289.0000001).key, 'still');
});

test('stop angle is derived from the input timestamp', async () => {
  const { angleAtTimestamp } = await import('../js/game-logic.mjs');

  assert.equal(angleAtTimestamp(14, 1000, 1750, 120), 104);
  assert.equal(angleAtTimestamp(350, 1000, 1250, 120), 20);
});

test('relative flip angle removes the native fourteen-degree tilt', async () => {
  const { relativeFlipAngle } = await import('../js/game-logic.mjs');
  const actual = relativeFlipAngle(105.7);

  assert.ok(Math.abs(actual - 91.7) < 1e-10, `expected 91.7, received ${actual}`);
});

function gameState(overrides = {}) {
  return {
    lifetimeFlips: 0,
    bestDeviation: null,
    speedLevel: 0,
    seenMilestones: [],
    muted: false,
    streak: 0,
    ...overrides,
  };
}

test('a successful flip increments lifetime, streak, and speed level', async () => {
  const { applyResult, classifyAngle } = await import('../js/game-logic.mjs');
  const previous = gameState({
    lifetimeFlips: 3,
    bestDeviation: 1.5,
    speedLevel: 2,
    streak: 2,
  });
  const next = applyResult(previous, classifyAngle(104.4));

  assert.equal(next.lifetimeFlips, 4);
  assert.equal(next.streak, 3);
  assert.equal(next.speedLevel, 3);
  assert.ok(Math.abs(next.bestDeviation - 0.4) < 1e-10);
  assert.deepEqual(previous, gameState({
    lifetimeFlips: 3,
    bestDeviation: 1.5,
    speedLevel: 2,
    streak: 2,
  }), 'applyResult must not mutate its input state');
});

test('Halfway resets streak without changing level', async () => {
  const { applyResult, classifyAngle } = await import('../js/game-logic.mjs');
  const next = applyResult(
    gameState({ lifetimeFlips: 7, speedLevel: 4, streak: 3 }),
    classifyAngle(119),
  );

  assert.equal(next.lifetimeFlips, 7);
  assert.equal(next.streak, 0);
  assert.equal(next.speedLevel, 4);
});

test('Wrong and Still results each lower level but never below zero', async () => {
  const { applyResult, classifyAngle } = await import('../js/game-logic.mjs');

  const afterWrong = applyResult(
    gameState({ speedLevel: 2, streak: 4 }),
    classifyAngle(284),
  );
  const afterStill = applyResult(afterWrong, classifyAngle(14));
  const atFloor = applyResult(gameState(), classifyAngle(14));

  assert.equal(afterWrong.speedLevel, 1);
  assert.equal(afterWrong.streak, 0);
  assert.equal(afterStill.speedLevel, 0);
  assert.equal(atFloor.speedLevel, 0);
});

test('best deviation keeps the smallest result across successful and failed attempts', async () => {
  const { applyResult, classifyAngle } = await import('../js/game-logic.mjs');

  const firstFailure = applyResult(gameState(), classifyAngle(14));
  const worseThanBest = applyResult(
    gameState({ bestDeviation: 0.25 }),
    classifyAngle(109),
  );

  assert.equal(firstFailure.bestDeviation, 90);
  assert.equal(worseThanBest.bestDeviation, 0.25);
});

test('speed grows by level and caps at 720 degrees per second', async () => {
  const { speedForLevel } = await import('../js/game-logic.mjs');

  assert.equal(speedForLevel(0), 120);
  assert.ok(Math.abs(speedForLevel(1) - 134.4) < 1e-10);
  assert.equal(speedForLevel(100), 720);
});

test('milestone copy fires once at lifetime totals 10, 50, and 100', async () => {
  const { applyResult, classifyAngle } = await import('../js/game-logic.mjs');
  const success = classifyAngle(109);
  const milestones = [
    [10, "Ten flips. It's starting to look natural."],
    [50, 'Fifty. You see it now.'],
    [100, 'Hyperbuttcoinification will purify us all.'],
  ];

  for (const [threshold, copy] of milestones) {
    const reached = applyResult(
      gameState({ lifetimeFlips: threshold - 1 }),
      success,
    );
    assert.equal(reached.milestone, copy);
    assert.deepEqual(reached.seenMilestones, [threshold]);

    const alreadySeen = applyResult(
      gameState({ lifetimeFlips: threshold - 1, seenMilestones: [threshold] }),
      success,
    );
    assert.equal(alreadySeen.milestone, null);
    assert.deepEqual(alreadySeen.seenMilestones, [threshold]);
  }
});

class MemoryStorage {
  constructor(value = null) {
    this.value = value;
  }

  getItem() {
    return this.value;
  }

  setItem(_key, value) {
    this.value = value;
  }
}

test('valid persisted progress reloads without the session streak', async () => {
  const { loadPersistedState, savePersistedState } = await import('../js/game-logic.mjs');
  const storage = new MemoryStorage();
  const state = gameState({
    lifetimeFlips: 51,
    bestDeviation: 0.25,
    speedLevel: 8,
    seenMilestones: [10, 50],
    muted: true,
    streak: 7,
    milestone: 'session-only',
  });

  savePersistedState(storage, state);

  assert.deepEqual(Object.keys(JSON.parse(storage.value)).sort(), [
    'bestDeviation',
    'lifetimeFlips',
    'muted',
    'seenMilestones',
    'speedLevel',
  ]);
  assert.deepEqual(loadPersistedState(storage), gameState({
    lifetimeFlips: 51,
    bestDeviation: 0.25,
    speedLevel: 8,
    seenMilestones: [10, 50],
    muted: true,
  }));
});

test('corrupt persisted values fall back to safe field defaults', async () => {
  const { loadPersistedState } = await import('../js/game-logic.mjs');
  const invalidJson = new MemoryStorage('{not-json');
  const corruptFields = new MemoryStorage(JSON.stringify({
    lifetimeFlips: -3,
    bestDeviation: 'close',
    speedLevel: 2.5,
    seenMilestones: [50, 25, 10, 50, '100'],
    muted: 'yes',
    streak: 99,
  }));

  assert.deepEqual(loadPersistedState(invalidJson), gameState());
  assert.deepEqual(loadPersistedState(corruptFields), gameState({
    seenMilestones: [10, 50],
  }));
});

test('storage exceptions use an in-memory fallback instead of breaking play', async () => {
  const { loadPersistedState, savePersistedState } = await import('../js/game-logic.mjs');
  const unavailableStorage = {
    getItem() {
      throw new Error('storage unavailable');
    },
    setItem() {
      throw new Error('storage unavailable');
    },
  };
  const state = gameState({
    lifetimeFlips: 10,
    bestDeviation: 0.1,
    speedLevel: 3,
    seenMilestones: [10],
    streak: 4,
  });

  assert.doesNotThrow(() => savePersistedState(unavailableStorage, state));
  assert.deepEqual(loadPersistedState(unavailableStorage), gameState({
    lifetimeFlips: 10,
    bestDeviation: 0.1,
    speedLevel: 3,
    seenMilestones: [10],
  }));
});

test('new in-memory progress wins when storage still exposes stale data after a failed write', async () => {
  const { loadPersistedState, savePersistedState } = await import('../js/game-logic.mjs');
  const staleState = gameState({
    lifetimeFlips: 4,
    bestDeviation: 2,
    speedLevel: 2,
  });
  const currentState = gameState({
    lifetimeFlips: 5,
    bestDeviation: 0.4,
    speedLevel: 3,
    streak: 1,
  });
  const staleStorage = {
    getItem() {
      return JSON.stringify(staleState);
    },
    setItem() {
      throw new Error('write failed');
    },
  };

  savePersistedState(staleStorage, currentState);

  assert.deepEqual(loadPersistedState(staleStorage), gameState({
    lifetimeFlips: 5,
    bestDeviation: 0.4,
    speedLevel: 3,
  }));
});

test('an initial load without an in-memory value reads valid storage', async () => {
  const { loadPersistedState } = await import('../js/game-logic.mjs');
  const storage = new MemoryStorage(JSON.stringify({
    lifetimeFlips: 12,
    bestDeviation: 0.3,
    speedLevel: 4,
    seenMilestones: [10],
    muted: true,
  }));

  assert.deepEqual(loadPersistedState(storage), gameState({
    lifetimeFlips: 12,
    bestDeviation: 0.3,
    speedLevel: 4,
    seenMilestones: [10],
    muted: true,
  }));
});

test('mute preference persists across reloads', async () => {
  const { loadPersistedState, savePersistedState } = await import('../js/game-logic.mjs');
  const storage = new MemoryStorage();

  savePersistedState(storage, gameState({ muted: true }));
  assert.equal(loadPersistedState(storage).muted, true);

  savePersistedState(storage, gameState({ muted: false }));
  assert.equal(loadPersistedState(storage).muted, false);
});

let failures = 0;

for (const { name, run } of tests) {
  try {
    await run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

if (failures > 0) {
  console.error(`\nThe Flip game logic: FAIL (${failures}/${tests.length} tests failed).`);
  process.exitCode = 1;
} else {
  console.log(`\nThe Flip game logic: PASS (${tests.length} tests).`);
}
