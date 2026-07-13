import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const tests = [];
const tickerToken = ['BUTT', 'COIN'].join('');
const forbiddenCashtagPattern = new RegExp(`\\$${tickerToken}\\b`, 'i');
const forbiddenTickerPattern = new RegExp(`\\b${tickerToken}\\b`);
const officialOrangePath = 'm63.033,39.744c-4.274,17.143-21.637,27.576-38.782,23.301-17.138-4.274-27.571-21.638-23.295-38.78,4.272-17.145,21.635-27.579,38.775-23.305,17.144,4.274,27.576,21.64,23.302,38.784z';
const officialMarkPath = 'm46.103,27.444c0.637-4.258-2.605-6.547-7.038-8.074l1.438-5.768-3.511-0.875-1.4,5.616c-0.923-0.23-1.871-0.447-2.813-0.662l1.41-5.653-3.509-0.875-1.439,5.766c-0.764-0.174-1.514-0.346-2.242-0.527l0.004-0.018-4.842-1.209-0.934,3.75s2.605,0.597,2.55,0.634c1.422,0.355,1.679,1.296,1.636,2.042l-1.638,6.571c0.098,0.025,0.225,0.061,0.365,0.117-0.117-0.029-0.242-0.061-0.371-0.092l-2.296,9.205c-0.174,0.432-0.615,1.08-1.609,0.834,0.035,0.051-2.552-0.637-2.552-0.637l-1.743,4.019,4.569,1.139c0.85,0.213,1.683,0.436,2.503,0.646l-1.453,5.834,3.507,0.875,1.439-5.772c0.958,0.26,1.888,0.5,2.798,0.726l-1.434,5.745,3.511,0.875,1.453-5.823c5.987,1.133,10.489,0.676,12.384-4.739,1.527-4.36-0.076-6.875-3.226-8.515,2.294-0.529,4.022-2.038,4.483-5.155zm-8.022,11.249c-1.085,4.36-8.426,2.003-10.806,1.412l1.928-7.729c2.38,0.594,10.012,1.77,8.878,6.317zm1.086-11.312c-0.99,3.966-7.1,1.951-9.082,1.457l1.748-7.01c1.982,0.494,8.365,1.416,7.334,5.553z';

function test(name, run) {
  tests.push({ name, run });
}

function normalizeCssDeclarations(block) {
  return block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

async function source(path) {
  try {
    return await readFile(new URL(path, import.meta.url), 'utf8');
  } catch (error) {
    assert.fail(`expected ${path} to exist: ${error.message}`);
  }
}

const controllerHarness = String.raw`
  import assert from 'node:assert/strict';

  class FakeClassList {
    constructor() {
      this.values = new Set();
    }

    contains(name) {
      return this.values.has(name);
    }

    remove(name) {
      this.values.delete(name);
    }

    toggle(name, force) {
      const enabled = force === undefined ? !this.contains(name) : Boolean(force);
      if (enabled) this.values.add(name);
      else this.values.delete(name);
      return enabled;
    }
  }

  class FakeElement {
    constructor() {
      this.attributes = new Map();
      this.classList = new FakeClassList();
      this.dataset = {};
      this.focusCalls = [];
      this.hidden = false;
      this.listeners = new Map();
      this.selectionRange = null;
      this.selectCalls = 0;
      this.style = {};
      this.textContent = '';
      this.value = '';
    }

    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    }

    setAttribute(name, value) {
      this.attributes.set(name, value);
    }

    focus(options) {
      this.focusCalls.push(options);
    }

    select() {
      this.selectCalls += 1;
    }

    setSelectionRange(start, end) {
      this.selectionRange = [start, end];
    }

    dispatch(type, event = {}) {
      return this.listeners.get(type)?.(event);
    }
  }

  const selectors = [
    '#game-surface', '#coin', '#game-status', '#milestone', '#lifetime-flips',
    '#streak', '#best-deviation', '#mute-toggle', '#share-block', '#share-text',
    '#copy-share', '#copy-feedback',
  ];
  const elements = new Map(selectors.map((selector) => [selector, new FakeElement()]));
  const surface = elements.get('#game-surface');
  const coin = elements.get('#coin');
  const status = elements.get('#game-status');
  const shareBlock = elements.get('#share-block');
  const shareText = elements.get('#share-text');
  const copyShare = elements.get('#copy-share');
  const copyFeedback = elements.get('#copy-feedback');
  const muteToggle = elements.get('#mute-toggle');
  status.textContent = 'Tap to flip.';
  shareBlock.hidden = true;
  elements.get('#milestone').hidden = true;
  surface.setAttribute('aria-label', 'Start The Flip');

  globalThis.document = { querySelector: (selector) => elements.get(selector) };

  let nextAnimationFrameId = 1;
  const animationFrames = new Map();
  globalThis.requestAnimationFrame = (callback) => {
    const id = nextAnimationFrameId;
    nextAnimationFrameId += 1;
    animationFrames.set(id, callback);
    return id;
  };
  globalThis.cancelAnimationFrame = (id) => animationFrames.delete(id);

  function runNextAnimationFrame(timestamp) {
    const entry = animationFrames.entries().next().value;
    assert.ok(entry, 'expected a pending animation frame');
    const [id, callback] = entry;
    animationFrames.delete(id);
    callback(timestamp);
  }

  let clock = 0;
  const scheduledTimeouts = [];
  const storage = {
    value: null,
    writes: [],
    getItem() {
      return this.value;
    },
    setItem(key, value) {
      this.value = value;
      this.writes.push({ key, value });
    },
  };
  const audio = { frequencies: [], starts: 0, stops: 0 };

  class FakeAudioContext {
    constructor() {
      this.currentTime = 4;
      this.destination = {};
      this.state = 'running';
    }

    createOscillator() {
      return {
        connect() {},
        frequency: {
          setValueAtTime: (value) => audio.frequencies.push(value),
        },
        start: () => { audio.starts += 1; },
        stop: () => { audio.stops += 1; },
        type: '',
      };
    }

    createGain() {
      return {
        connect() {},
        gain: {
          exponentialRampToValueAtTime() {},
          setValueAtTime() {},
        },
      };
    }

    async resume() {}
  }

  const syntheticWindow = {
    AudioContext: FakeAudioContext,
    localStorage: storage,
    setTimeout(callback, delay) {
      scheduledTimeouts.push({ callback, delay });
      return scheduledTimeouts.length;
    },
  };
  globalThis.window = syntheticWindow;
  Object.defineProperty(globalThis, 'performance', {
    configurable: true,
    value: { now: () => clock },
  });

  const clipboardWrites = [];
  const navigatorObject = {
    clipboard: {
      async writeText(value) {
        clipboardWrites.push(value);
      },
    },
  };
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: navigatorObject,
  });

  function runNextTimeout(now) {
    assert.ok(scheduledTimeouts.length > 0, 'expected a pending timeout');
    clock = now;
    const timeout = scheduledTimeouts.shift();
    timeout.callback();
    return timeout;
  }
`;

function controllerModuleUrl(controllerSource) {
  const gameLogicUrl = new URL('../js/game-logic.mjs', import.meta.url).href;
  const importNeedle = "from './game-logic.mjs';";
  assert.ok(controllerSource.includes(importNeedle), 'controller domain import changed');
  const executableSource = controllerSource.replace(
    importNeedle,
    `from ${JSON.stringify(gameLogicUrl)};`,
  );
  return `data:text/javascript;base64,${Buffer.from(executableSource).toString('base64')}`;
}

function runControllerScenario(controllerSource, scenario, setup = '') {
  const repro = [
    controllerHarness,
    setup,
    `await import(${JSON.stringify(controllerModuleUrl(controllerSource))});`,
    scenario,
  ].join('\n');

  return spawnSync(
    process.execPath,
    ['--input-type=module', '--eval', repro],
    { encoding: 'utf8' },
  );
}

function assertControllerScenarioPasses(result, label) {
  assert.equal(
    result.status,
    0,
    `${label}:\n${result.stderr || result.stdout || 'child process produced no output'}`,
  );
}

function mutateStopScoringToLastFrame(controllerSource) {
  let mutated = controllerSource.replace(
    'let animationFrame = 0;',
    'let animationFrame = 0;\nlet lastRenderedAt = 0;',
  );
  mutated = mutated.replace(
    /(function renderFrame\(timestamp\) \{\r?\n  if \(phase !== 'running'\) return;)/,
    '$1\n\n  lastRenderedAt = timestamp;',
  );
  mutated = mutated.replace(
    /(function stopRound\(inputTimestamp\) \{[\s\S]*?const absoluteAngle = angleAtTimestamp\(START_ANGLE,\s*roundStartedAt,\s*)inputTimestamp(,\s*roundSpeed\);)/,
    '$1lastRenderedAt$2',
  );

  assert.notEqual(mutated, controllerSource, 'expected the timing mutation to change source');
  assert.match(mutated, /lastRenderedAt = timestamp/);
  assert.match(mutated, /roundStartedAt,\s*lastRenderedAt,\s*roundSpeed/);
  return mutated;
}

const timestampScoringScenario = String.raw`
  surface.dispatch('pointerdown', { timeStamp: 1000, isPrimary: true, button: 0 });
  runNextAnimationFrame(1250);
  assert.equal(coin.style.transform, 'rotate(30deg)', 'rAF must render the earlier frame');
  surface.dispatch('pointerdown', { timeStamp: 1750, isPrimary: true, button: 0 });
  assert.equal(
    elements.get('#lifetime-flips').textContent,
    '1',
    'the later input timestamp must score the stop',
  );
  assert.equal(coin.style.transform, 'rotate(90deg)');
  assert.equal(status.textContent, 'Buttoshi Flip. 90.0\u00b0.');
`;

test('the static game route and stylesheet exist', async () => {
  const [html, css] = await Promise.all([
    source('../game.html'),
    source('../css/game.css'),
  ]);

  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.ok(css.length > 0, 'expected css/game.css to contain styles');
});

test('repo guidance documents The Flip files and current homepage section', async () => {
  const guidance = await source('../CLAUDE.md');

  for (const path of [
    'game.html',
    'game.json',
    'css/game.css',
    'js/game.mjs',
    'js/game-logic.mjs',
  ]) {
    const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(guidance, new RegExp(`^${escapedPath}\\s+`, 'm'), `${path} must be listed`);
  }

  const gameSection = guidance
    .split(/\r?\n/)
    .find((line) => line.startsWith('13. Game'));
  assert.ok(gameSection, 'section 13 must document the game');
  assert.match(gameSection, /The Flip/);
  assert.match(gameSection, /teaser/i);
  assert.match(gameSection, /static/i);
  assert.match(gameSection, /`\/game`/);
  assert.doesNotMatch(gameSection, /Pac-?man|Coming Soon/i);
});

test('the page publishes the exact game identity and idle copy', async () => {
  const html = await source('../game.html');

  assert.match(html, /<html\s+lang="en">/);
  assert.match(html, /<title>The Flip — Buttcoin<\/title>/);
  assert.match(html, /<h1[^>]*>The Flip<\/h1>/);
  assert.ok(html.includes('Flip Bitcoin. One Butt at a time.'));
  assert.match(html, /id="game-status"[^>]*>\s*Tap to flip\.\s*<\/p>/);
});

test('the accessible one-screen shell exposes game state and controls', async () => {
  const html = await source('../game.html');

  assert.match(html, /<main\b/);
  assert.match(html, /id="game-surface"[^>]*tabindex="0"[^>]*role="button"/);
  assert.match(html, /id="lifetime-flips"/);
  assert.match(html, /id="streak"/);
  assert.match(html, /id="best-deviation"/);
  assert.match(html, /id="game-status"[^>]*aria-live="polite"/);
  assert.match(html, /id="milestone"[^>]*aria-live="polite"/);
  assert.match(html, /id="share-block"[^>]*hidden/);
  assert.match(html, /<textarea[^>]*id="share-text"[^>]*readonly/);
  assert.match(html, /<button[^>]*id="copy-share"/);
  assert.match(html, /<button[^>]*id="mute-toggle"[^>]*aria-pressed="false"/);
});

test('the active inline coin uses exactly the two official vector paths', async () => {
  const html = await source('../game.html');
  const activeCoin = html.match(/<svg\b[^>]*\bid="coin"[^>]*>[\s\S]*?<\/svg>/)?.[0];
  const pathValues = [...(activeCoin ?? '').matchAll(/<path\b[^>]*\bd="([^"]+)"/g)]
    .map((match) => match[1]);

  assert.ok(activeCoin, 'expected the active #coin SVG');
  assert.deepEqual(pathValues, [officialOrangePath, officialMarkPath]);
});

test('the S1c target lives in a fourth stat and leaves the playfield coin unchanged', async () => {
  const [html, css] = await Promise.all([
    source('../game.html'),
    source('../css/game.css'),
  ]);
  const coinFrame = html.match(/<div\b[^>]*class="[^"]*\bcoin-frame\b[^"]*"[^>]*>([\s\S]*?)<\/div>/)?.[1];
  const activeCoin = coinFrame?.match(/<svg\b[^>]*\bid="coin"[^>]*>[\s\S]*?<\/svg>/)?.[0];
  assert.ok(coinFrame, 'expected .coin-frame markup');
  assert.equal((coinFrame.match(/<svg\b/g) ?? []).length, 1, 'expected only the active coin');
  assert.ok(activeCoin, 'expected the active #coin SVG');

  const stats = html.match(/<dl\b[^>]*class="[^"]*\bstats\b[^"]*"[^>]*>([\s\S]*?)<\/dl>/)?.[1];
  assert.ok(stats, 'expected the game stats');
  const labels = [...stats.matchAll(/<dt>([^<]+)<\/dt>/g)].map((match) => match[1]);
  assert.deepEqual(labels, ['Flips', 'Streak', 'Best', 'Target']);

  const targetCoin = stats.match(
    /<svg\b(?=[^>]*\bclass="[^"]*\btarget-coin\b[^"]*")[^>]*>[\s\S]*?<\/svg>/,
  )?.[0];
  assert.ok(targetCoin, 'expected the S1c target coin in the stats');
  assert.equal((html.match(/\bclass="[^"]*\btarget-coin\b[^"]*"/g) ?? []).length, 1);
  assert.doesNotMatch(`${html}\n${css}`, /target-ghost|target-symbol/);

  const openingTag = (markup) => markup.match(/^<svg\b[^>]*>/)?.[0] ?? '';
  const attribute = (markup, name) => openingTag(markup)
    .match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
  const pathValues = (markup) => [...markup.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)]
    .map((match) => match[1]);
  const groupTransform = (markup) => markup
    .match(/<g\b[^>]*\btransform="([^"]+)"/)?.[1];

  assert.equal(attribute(targetCoin, 'role'), 'img');
  assert.equal(attribute(targetCoin, 'aria-label'), 'The mark, flipped 90 degrees');
  assert.equal(attribute(targetCoin, 'viewBox'), '0 0 64 64');
  assert.equal(groupTransform(targetCoin), 'translate(0.00630876,-0.00301984)');
  assert.deepEqual(pathValues(targetCoin), [officialOrangePath, officialMarkPath]);
  assert.doesNotMatch(targetCoin, /\b(?:href|src)=|<use\b/i);

  const statsRule = css.match(/\.stats\s*\{([^}]*)\}/)?.[1] ?? '';
  const frameRule = css.match(/\.coin-frame\s*\{([^}]*)\}/)?.[1] ?? '';
  const targetRule = css.match(/\.target-coin\s*\{([^}]*)\}/)?.[1] ?? '';
  const targetPathRule = css.match(/\.target-coin\s+path\s*\{([^}]*)\}/)?.[1] ?? '';
  const activeRule = css.match(/#coin\s*\{([^}]*)\}/)?.[1] ?? '';
  const expectedFrameRule = [
    'display: grid;',
    'place-items: center;',
    'inline-size: min(68vw, 42vh, 24rem);',
    'aspect-ratio: 1;',
    'border-radius: 50%;',
  ].join('\n');
  const expectedActiveRule = [
    'display: block;',
    'width: 100%;',
    'height: 100%;',
    'transform: rotate(0deg);',
    'transform-origin: 50% 50%;',
    'will-change: transform;',
    'user-select: none;',
  ].join('\n');
  const mobileBlock = css.match(
    /@media\s*\(max-width:\s*30rem\)\s*\{([\s\S]*?)\r?\n\}\s*@media\s*\(prefers-reduced-motion:\s*reduce\)/,
  )?.[1];

  assert.match(statsRule, /grid-template-columns:\s*repeat\(4,\s*auto\)/);
  assert.match(targetRule, /display:\s*block/);
  assert.match(targetRule, /width:\s*1\.5em/);
  assert.match(targetRule, /height:\s*1\.5em/);
  assert.match(targetRule, /transform:\s*rotate\(90deg\)/);
  assert.match(targetRule, /transform-origin:\s*50%\s+50%/);
  assert.match(targetPathRule, /fill:\s*none/);
  assert.match(targetPathRule, /stroke:\s*#c9c3b7/);
  assert.match(targetPathRule, /stroke-width:\s*1\s*;/);
  assert.match(targetPathRule, /vector-effect:\s*non-scaling-stroke/);

  assert.equal(normalizeCssDeclarations(frameRule), expectedFrameRule);
  assert.equal(normalizeCssDeclarations(activeRule), expectedActiveRule);
  assert.ok(mobileBlock, 'expected the complete max-width: 30rem media block');
  const mobileStatsRule = mobileBlock.match(/\.stats\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.equal(
    normalizeCssDeclarations(mobileStatsRule),
    'gap: clamp(0.5rem, 4vw, 1rem);',
  );
  assert.doesNotMatch(mobileBlock, /\.game-toolbar\s*\{/);
  assert.match(
    css,
    /\.is-buttoshi\s+\.coin-frame\s*\{[^}]*rgba\(255,\s*207,\s*85,\s*0\.45\)/s,
  );
});

test('the unchanged mute control sits after sharing in quiet footer controls', async () => {
  const html = await source('../game.html');
  const toolbar = html.match(/<div\b[^>]*class="[^"]*\bgame-toolbar\b[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<section/)?.[1] ?? '';
  const footerControls = html.match(
    /<div\b[^>]*class="[^"]*\bgame-footer-controls\b[^"]*"[^>]*>([\s\S]*?)<\/div>/,
  )?.[1] ?? '';
  const muteButton = /<button id="mute-toggle" class="mute-toggle" type="button" aria-pressed="false">\s*Sound: on\s*<\/button>/;

  assert.doesNotMatch(toolbar, /id="mute-toggle"/);
  assert.match(footerControls, muteButton);
  assert.equal((html.match(/id="mute-toggle"/g) ?? []).length, 1);
  assert.ok(html.indexOf('id="share-block"') < html.indexOf('class="game-footer-controls"'));
});

test('the page loads only its two local game resources', async () => {
  const html = await source('../game.html');
  const stylesheetUrls = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)]
    .map((match) => match[1]);
  const scriptUrls = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*>/g)]
    .map((match) => match[1]);

  assert.deepEqual(stylesheetUrls, ['css/game.css']);
  assert.deepEqual(scriptUrls, ['js/game.mjs']);
  assert.doesNotMatch(html, /(?:src|href)="(?:https?:)?\/\//i);
  assert.doesNotMatch(html, /firebase|fonts\.googleapis|fonts\.gstatic/i);
  assert.doesNotMatch(html, forbiddenCashtagPattern);
  assert.doesNotMatch(html, forbiddenTickerPattern);
});

test('the game stylesheet preserves the intrinsic tilt and accessibility contract', async () => {
  const css = await source('../css/game.css');

  assert.ok(css.includes('#0d0d0d'));
  assert.ok(css.includes('#c9c3b7'));
  assert.match(css, /#coin\s*\{[^}]*transform:\s*rotate\(0deg\)/s);
  assert.match(css, /\.coin-frame\s*\{[^}]*inline-size:\s*(?:min|clamp)\(/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /\.is-buttoshi\b/);
});

test('the thin controller imports only the deterministic game domain', async () => {
  const js = await source('../js/game.mjs');
  const imports = [...js.matchAll(/from\s+['"]([^'"]+)['"]/g)]
    .map((match) => match[1]);

  assert.deepEqual(imports, ['./game-logic.mjs']);
  assert.match(js, /\bSTART_ANGLE\b/);
  assert.match(js, /\bangleAtTimestamp\b/);
  assert.match(js, /\bclassifyAngle\b/);
  assert.match(js, /\brelativeFlipAngle\b/);
  assert.match(js, /\bspeedForLevel\b/);
});

test('input starts idle once and stops a running round from the event timestamp', async () => {
  const js = await source('../js/game.mjs');

  assert.match(js, /addEventListener\(['"]pointerdown['"]/);
  assert.match(js, /addEventListener\(['"]keydown['"]/);
  assert.match(js, /event\.code\s*!==\s*['"]Space['"]/);
  assert.match(js, /event\.code\s*!==\s*['"]Enter['"]/);
  assert.match(js, /event\.repeat/);
  assert.match(js, /phase\s*===\s*['"]idle['"][\s\S]*startRound\(event\.timeStamp\)/);
  assert.match(js, /phase\s*===\s*['"]running['"][\s\S]*stopRound\(event\.timeStamp\)/);
  assert.match(js, /function stopRound\([^)]*\)\s*\{\s*if\s*\(phase\s*!==\s*['"]running['"]\)\s*return;/);
});

test('rotation renders with rAF while scoring uses the unrendered input time', async () => {
  const js = await source('../js/game.mjs');

  assert.match(js, /requestAnimationFrame\(/);
  assert.match(js, /function renderFrame\(timestamp\)/);
  assert.match(js, /angleAtTimestamp\(START_ANGLE,\s*roundStartedAt,\s*timestamp,\s*roundSpeed\)/s);
  assert.match(js, /angleAtTimestamp\(START_ANGLE,\s*roundStartedAt,\s*inputTimestamp,\s*roundSpeed\)/s);
  assert.match(js, /relativeFlipAngle\(absoluteAngle\)/);
  assert.match(js, /coin\.style\.transform\s*=\s*`rotate\(\$\{[^}]+\}deg\)`/);
  assert.match(js, /setTimeout\([\s\S]*startRound\(performance\.now\(\)\)[\s\S]*1500\s*\)/);
});

test('progress and mute state persist only through the Task 1 storage API', async () => {
  const js = await source('../js/game.mjs');

  assert.equal((js.match(/window\.localStorage/g) ?? []).length, 1);
  assert.match(js, /loadPersistedState\(storage\)/);
  assert.match(js, /savePersistedState\(storage,\s*state\)/);
  assert.match(js, /state\s*=\s*applyResult\(state,\s*result\)/);
  assert.match(js, /muted:\s*!state\.muted/);
  assert.match(js, /muteToggle\.setAttribute\(['"]aria-pressed['"],\s*String\(state\.muted\)\)/);
  assert.doesNotMatch(js, /localStorage\.(?:getItem|setItem)\(/);
});

test('the local sound is a Buttoshi-only Web Audio click', async () => {
  const js = await source('../js/game.mjs');

  assert.match(js, /AudioContext/);
  assert.match(js, /createOscillator\(\)/);
  assert.match(js, /createGain\(\)/);
  assert.match(js, /if\s*\(result\.buttoshi\)\s*\{[\s\S]*playButtoshiClick\(\)/);
  assert.match(js, /if\s*\(state\.muted\)\s*return;/);
  assert.doesNotMatch(js, /new Audio\(|<audio/i);
});

test('Buttoshi sharing keeps selectable text when Clipboard API is absent', async () => {
  const js = await source('../js/game.mjs');

  assert.ok(js.includes('I flipped Bitcoin. Deviation:'));
  assert.ok(js.includes('buttcoin.wtf'));
  assert.match(js, /navigator\.clipboard\?\.writeText/);
  assert.match(js, /shareText\.select\(\)/);
  assert.match(js, /shareText\.setSelectionRange\(/);
  assert.match(js, /Text selected\. Copy it manually\./);
  assert.doesNotMatch(js, forbiddenCashtagPattern);
  assert.doesNotMatch(js, forbiddenTickerPattern);
});

test('results, milestones, and the last Buttoshi share survive automatic round starts', async () => {
  const js = await source('../js/game.mjs');
  const startRoundBody = js.match(/function startRound\([^)]*\)\s*\{([\s\S]*?)\n\}/)?.[1];
  const shareVisibilityWrites = js
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('shareBlock.hidden ='));

  assert.ok(startRoundBody, 'expected startRound to be inspectable');
  assert.doesNotMatch(startRoundBody, /gameStatus\.textContent\s*=\s*['"]['"]/);
  assert.doesNotMatch(startRoundBody, /milestone\.(?:textContent|hidden)\s*=/);
  assert.doesNotMatch(startRoundBody, /shareBlock\.hidden\s*=/);
  assert.deepEqual(shareVisibilityWrites, ['shareBlock.hidden = false;']);
  assert.match(js, /phase\s*===\s*['"]idle['"][\s\S]*gameStatus\.textContent\s*=\s*['"]['"][\s\S]*startRound\(event\.timeStamp\)/);
});

test('pointer input accepts only the primary pointer and primary button', async () => {
  const js = await source('../js/game.mjs');

  assert.match(js, /event\.isPrimary\s*===\s*false/);
  assert.match(js, /event\.button\s*!==\s*undefined/);
  assert.match(js, /event\.button\s*!==\s*0/);
});

test('controller behavior: idle primary pointer starts Running without scoring', async () => {
  const js = await source('../js/game.mjs');
  const result = runControllerScenario(js, String.raw`
    assert.equal(elements.get('#lifetime-flips').textContent, '0');
    surface.dispatch('pointerdown', { timeStamp: 1000, isPrimary: true, button: 0 });
    assert.equal(surface.dataset.state, 'running');
    assert.equal(surface.attributes.get('aria-label'), 'Stop The Flip');
    assert.equal(elements.get('#lifetime-flips').textContent, '0');
    assert.equal(storage.writes.length, 0);
    assert.equal(animationFrames.size, 1);
  `);

  assertControllerScenarioPasses(result, 'idle pointer start behavior failed');
});

test('controller behavior: input timestamp outruns the last rendered frame for scoring', async () => {
  const js = await source('../js/game.mjs');
  const result = runControllerScenario(js, timestampScoringScenario);

  assertControllerScenarioPasses(result, 'input timestamp scoring behavior failed');
});

test('controller behavior: exactly one Running stop is accepted and Result input is ignored', async () => {
  const js = await source('../js/game.mjs');
  const result = runControllerScenario(js, String.raw`
    surface.dispatch('pointerdown', { timeStamp: 1000, isPrimary: true, button: 0 });
    surface.dispatch('pointerdown', { timeStamp: 1500, isPrimary: true, button: 0 });
    const firstStatus = status.textContent;
    const firstTransform = coin.style.transform;
    assert.equal(surface.dataset.state, 'result');
    assert.equal(storage.writes.length, 1);
    assert.equal(scheduledTimeouts.length, 1);

    surface.dispatch('pointerdown', { timeStamp: 1750, isPrimary: true, button: 0 });
    assert.equal(surface.dataset.state, 'result');
    assert.equal(status.textContent, firstStatus);
    assert.equal(coin.style.transform, firstTransform);
    assert.equal(storage.writes.length, 1);
    assert.equal(scheduledTimeouts.length, 1);
  `);

  assertControllerScenarioPasses(result, 'single-stop phase behavior failed');
});

test('controller behavior: the 1500 ms Result delay starts the next round automatically', async () => {
  const js = await source('../js/game.mjs');
  const result = runControllerScenario(js, String.raw`
    surface.dispatch('pointerdown', { timeStamp: 1000, isPrimary: true, button: 0 });
    surface.dispatch('pointerdown', { timeStamp: 1500, isPrimary: true, button: 0 });
    assert.equal(scheduledTimeouts.length, 1);
    assert.equal(scheduledTimeouts[0].delay, 1500);

    runNextTimeout(2500);
    assert.equal(surface.dataset.state, 'running');
    assert.equal(surface.attributes.get('aria-label'), 'Stop The Flip');
    assert.equal(coin.style.transform, 'rotate(0deg)');
    assert.equal(animationFrames.size, 1);
  `);

  assertControllerScenarioPasses(result, 'automatic next-round behavior failed');
});

test('controller behavior: repeat Space and secondary pointers are ignored', async () => {
  const js = await source('../js/game.mjs');
  const result = runControllerScenario(js, String.raw`
    let prevented = 0;
    surface.dispatch('keydown', {
      code: 'Space', repeat: true, timeStamp: 900, preventDefault: () => { prevented += 1; },
    });
    surface.dispatch('pointerdown', { timeStamp: 900, isPrimary: false, button: 0 });
    surface.dispatch('pointerdown', { timeStamp: 900, isPrimary: true, button: 2 });
    assert.equal(surface.dataset.state, undefined);
    assert.equal(animationFrames.size, 0);
    assert.equal(prevented, 0);

    surface.dispatch('keydown', {
      code: 'Space', repeat: false, timeStamp: 1000, preventDefault: () => { prevented += 1; },
    });
    assert.equal(surface.dataset.state, 'running');
    assert.equal(prevented, 1);

    surface.dispatch('keydown', {
      code: 'Space', repeat: true, timeStamp: 1500, preventDefault: () => { prevented += 1; },
    });
    assert.equal(surface.dataset.state, 'running');
    assert.equal(storage.writes.length, 0);

    surface.dispatch('pointerdown', { timeStamp: 1750, isPrimary: true, button: 0 });
    assert.equal(surface.dataset.state, 'result');
    assert.equal(elements.get('#lifetime-flips').textContent, '1');
  `);

  assertControllerScenarioPasses(result, 'keyboard and pointer filtering behavior failed');
});

test('controller behavior: Enter starts, stops once, and is ignored in Result', async () => {
  const js = await source('../js/game.mjs');
  const result = runControllerScenario(js, String.raw`
    let prevented = 0;
    const pressEnter = (timeStamp) => surface.dispatch('keydown', {
      code: 'Enter',
      repeat: false,
      timeStamp,
      preventDefault: () => { prevented += 1; },
    });

    pressEnter(1000);
    assert.equal(surface.dataset.state, 'running');
    assert.equal(elements.get('#lifetime-flips').textContent, '0');
    assert.equal(storage.writes.length, 0);

    pressEnter(1750);
    const firstStatus = status.textContent;
    const firstTransform = coin.style.transform;
    assert.equal(surface.dataset.state, 'result');
    assert.equal(elements.get('#lifetime-flips').textContent, '1');
    assert.equal(storage.writes.length, 1);
    assert.equal(scheduledTimeouts.length, 1);

    pressEnter(2000);
    assert.equal(surface.dataset.state, 'result');
    assert.equal(status.textContent, firstStatus);
    assert.equal(coin.style.transform, firstTransform);
    assert.equal(storage.writes.length, 1);
    assert.equal(scheduledTimeouts.length, 1);
    assert.equal(prevented, 3);
  `);

  assertControllerScenarioPasses(result, 'Enter phase behavior failed');
});

test('controller behavior: exact Buttoshi share remains selectable across clipboard outcomes', async () => {
  const js = await source('../js/game.mjs');
  const result = runControllerScenario(js, String.raw`
    const expectedShare = 'I flipped Bitcoin. Deviation: 0.0\u00b0. buttcoin.wtf';
    surface.dispatch('pointerdown', { timeStamp: 1000, isPrimary: true, button: 0 });
    surface.dispatch('pointerdown', { timeStamp: 1750, isPrimary: true, button: 0 });
    assert.equal(shareBlock.hidden, false);
    assert.equal(shareText.value, expectedShare);

    await copyShare.dispatch('click');
    assert.deepEqual(clipboardWrites, [expectedShare]);
    assert.equal(copyFeedback.textContent, 'Copied.');
    assert.deepEqual(shareText.selectionRange, [0, expectedShare.length]);

    navigatorObject.clipboard.writeText = async () => { throw new Error('denied'); };
    await copyShare.dispatch('click');
    assert.equal(copyFeedback.textContent, 'Text selected. Copy it manually.');
    assert.equal(shareText.value, expectedShare);

    navigatorObject.clipboard = undefined;
    await copyShare.dispatch('click');
    assert.equal(copyFeedback.textContent, 'Text selected. Copy it manually.');
    assert.equal(shareText.selectCalls, 3);
    assert.deepEqual(shareText.selectionRange, [0, expectedShare.length]);
  `);

  assertControllerScenarioPasses(result, 'Buttoshi clipboard behavior failed');
});

test('controller behavior: Buttoshi audio obeys result tier, mute, and persistence', async () => {
  const js = await source('../js/game.mjs');
  const result = runControllerScenario(js, String.raw`
    surface.dispatch('pointerdown', { timeStamp: 1000, isPrimary: true, button: 0 });
    surface.dispatch('pointerdown', { timeStamp: 1750, isPrimary: true, button: 0 });
    assert.equal(audio.starts, 1, 'Buttoshi must play the click');
    assert.deepEqual(audio.frequencies, [880]);

    runNextTimeout(2000);
    surface.dispatch('pointerdown', { timeStamp: 2000, isPrimary: true, button: 0 });
    assert.match(status.textContent, /Still Bitcoin\./);
    assert.equal(audio.starts, 1, 'non-Buttoshi must stay silent');

    muteToggle.dispatch('click');
    assert.equal(muteToggle.textContent, 'Sound: off');
    assert.equal(muteToggle.attributes.get('aria-pressed'), 'true');
    assert.equal(JSON.parse(storage.value).muted, true);

    runNextTimeout(3000);
    surface.dispatch('pointerdown', { timeStamp: 3750, isPrimary: true, button: 0 });
    assert.equal(status.textContent, 'Buttoshi Flip. 90.0\u00b0.');
    assert.equal(audio.starts, 1, 'mute must suppress the Buttoshi click');
    assert.equal(JSON.parse(storage.value).muted, true);
  `);

  assertControllerScenarioPasses(result, 'Buttoshi sound behavior failed');
});

test('controller behavior: result and share survive the automatic next-round start', async () => {
  const js = await source('../js/game.mjs');
  const result = runControllerScenario(js, String.raw`
    surface.dispatch('pointerdown', { timeStamp: 1000, isPrimary: true, button: 0 });
    surface.dispatch('pointerdown', { timeStamp: 1750, isPrimary: true, button: 0 });
    const resultText = status.textContent;
    const preservedShare = shareText.value;

    runNextTimeout(2000);
    assert.equal(surface.dataset.state, 'running');
    assert.equal(status.textContent, resultText);
    assert.equal(shareBlock.hidden, false);
    assert.equal(shareText.value, preservedShare);
  `);

  assertControllerScenarioPasses(result, 'result preservation behavior failed');
});

test('controller harness detects last-rendered-frame stop-scoring mutation', async () => {
  const js = await source('../js/game.mjs');
  const mutated = mutateStopScoringToLastFrame(js);
  const result = runControllerScenario(mutated, timestampScoringScenario);
  const output = `${result.stderr}\n${result.stdout}`;

  assert.notEqual(result.status, 0, 'timing mutant unexpectedly survived behavioral coverage');
  assert.match(output, /the later input timestamp must score the stop/);
});

test('the controller survives a throwing localStorage getter across load and saves', async () => {
  const js = await source('../js/game.mjs');
  const setup = String.raw`
    let storageGetterReads = 0;
    Object.defineProperty(syntheticWindow, 'localStorage', {
      get() {
        storageGetterReads += 1;
        const error = new Error('storage access blocked');
        error.name = 'SecurityError';
        throw error;
      },
    });
  `;
  const result = runControllerScenario(js, String.raw`
    surface.dispatch('pointerdown', { timeStamp: 1000, isPrimary: true, button: 0 });
    surface.dispatch('pointerdown', { timeStamp: 1750, isPrimary: true, button: 0 });
    muteToggle.dispatch('click');
    assert.equal(elements.get('#lifetime-flips').textContent, '1');
    assert.equal(muteToggle.textContent, 'Sound: off');
    assert.equal(storageGetterReads, 1);
  `, setup);

  assertControllerScenarioPasses(result, 'controller crashed with unavailable storage');
});

test('the stylesheet and controller cannot add hidden network dependencies', async () => {
  const [css, js] = await Promise.all([
    source('../css/game.css'),
    source('../js/game.mjs'),
  ]);

  assert.doesNotMatch(css, /@import|url\s*\(/i);
  assert.doesNotMatch(css, forbiddenCashtagPattern);
  assert.doesNotMatch(css, forbiddenTickerPattern);
  assert.doesNotMatch(js, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b|import\s*\(/);
  assert.doesNotMatch(`${css}\n${js}`, /https?:\/\/|firebase/i);
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
  console.error(`\nThe Flip game page: FAIL (${failures}/${tests.length} tests failed).`);
  process.exitCode = 1;
} else {
  console.log(`\nThe Flip game page: PASS (${tests.length} tests).`);
}
