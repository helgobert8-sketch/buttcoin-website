import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const tests = [];
const tickerToken = ['BUTT', 'COIN'].join('');
const forbiddenCashtagPattern = new RegExp(`\\$${tickerToken}\\b`, 'i');
const forbiddenTickerPattern = new RegExp(`\\b${tickerToken}\\b`);

function test(name, run) {
  tests.push({ name, run });
}

async function source(path) {
  try {
    return await readFile(new URL(path, import.meta.url), 'utf8');
  } catch (error) {
    assert.fail(`expected ${path} to exist: ${error.message}`);
  }
}

test('the static game route and stylesheet exist', async () => {
  const [html, css] = await Promise.all([
    source('../game.html'),
    source('../css/game.css'),
  ]);

  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.ok(css.length > 0, 'expected css/game.css to contain styles');
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

test('the inline coin uses exactly the two official vector paths', async () => {
  const html = await source('../game.html');
  const svgTags = html.match(/<svg\b/g) ?? [];
  const pathTags = html.match(/<path\b/g) ?? [];
  const officialOrangePath = 'm63.033,39.744c-4.274,17.143-21.637,27.576-38.782,23.301-17.138-4.274-27.571-21.638-23.295-38.78,4.272-17.145,21.635-27.579,38.775-23.305,17.144,4.274,27.576,21.64,23.302,38.784z';
  const officialMarkPath = 'm46.103,27.444c0.637-4.258-2.605-6.547-7.038-8.074l1.438-5.768-3.511-0.875-1.4,5.616c-0.923-0.23-1.871-0.447-2.813-0.662l1.41-5.653-3.509-0.875-1.439,5.766c-0.764-0.174-1.514-0.346-2.242-0.527l0.004-0.018-4.842-1.209-0.934,3.75s2.605,0.597,2.55,0.634c1.422,0.355,1.679,1.296,1.636,2.042l-1.638,6.571c0.098,0.025,0.225,0.061,0.365,0.117-0.117-0.029-0.242-0.061-0.371-0.092l-2.296,9.205c-0.174,0.432-0.615,1.08-1.609,0.834,0.035,0.051-2.552-0.637-2.552-0.637l-1.743,4.019,4.569,1.139c0.85,0.213,1.683,0.436,2.503,0.646l-1.453,5.834,3.507,0.875,1.439-5.772c0.958,0.26,1.888,0.5,2.798,0.726l-1.434,5.745,3.511,0.875,1.453-5.823c5.987,1.133,10.489,0.676,12.384-4.739,1.527-4.36-0.076-6.875-3.226-8.515,2.294-0.529,4.022-2.038,4.483-5.155zm-8.022,11.249c-1.085,4.36-8.426,2.003-10.806,1.412l1.928-7.729c2.38,0.594,10.012,1.77,8.878,6.317zm1.086-11.312c-0.99,3.966-7.1,1.951-9.082,1.457l1.748-7.01c1.982,0.494,8.365,1.416,7.334,5.553z';

  assert.equal(svgTags.length, 1, 'expected one inline SVG');
  assert.equal(pathTags.length, 2, 'expected exactly two official SVG paths');
  assert.ok(html.includes(`d="${officialOrangePath}"`));
  assert.ok(html.includes(`d="${officialMarkPath}"`));
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

  assert.match(js, /loadPersistedState\(window\.localStorage\)/);
  assert.match(js, /savePersistedState\(window\.localStorage,\s*state\)/);
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
