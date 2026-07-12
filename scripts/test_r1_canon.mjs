import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const MINT = 'FasH397CeZLNYWkd3wWK9vrmjd1z93n3b59DssRXpump';
const PAIR = '63amWndBz75z2j7jyKDbzXvzt36L9qdGw7CZAXbD4KNe';
const DOMAIN = 'https://buttcoin.wtf';
const MEME_DEPOT = `${DOMAIN}/#meme-depot`;
const X_TRANSITION =
  'No canonical X account is currently published; verify current channels at buttcoin.wtf.';
const CHURCH_PROVENANCE =
  'The Church of Buttcoin is a human-curated archive of entries attributed to AI models.';
const LAST_UPDATED = '2026-07-12';

const sourceUrls = {
  'llms.txt': new URL('../llms.txt', import.meta.url),
  'tokenomics.json': new URL('../tokenomics.json', import.meta.url),
  'timeline.json': new URL('../timeline.json', import.meta.url),
  'church.json': new URL('../church.json', import.meta.url),
  'robots.txt': new URL('../robots.txt', import.meta.url),
  'for-ai.html': new URL('../for-ai.html', import.meta.url),
};

const sources = Object.fromEntries(
  await Promise.all(
    Object.entries(sourceUrls).map(async ([name, url]) => [name, await readFile(url, 'utf8')]),
  ),
);

const failures = [];
let checks = 0;

function check(name, assertion) {
  checks += 1;
  try {
    assertion();
    console.log(`ok ${checks} - ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.log(`not ok ${checks} - ${name}`);
    console.log(`  ${error.message}`);
  }
}

let tokenomics;
let timeline;
let church;

check('tokenomics.json parses', () => {
  tokenomics = JSON.parse(sources['tokenomics.json']);
});

check('timeline.json parses', () => {
  timeline = JSON.parse(sources['timeline.json']);
});

check('church.json parses', () => {
  church = JSON.parse(sources['church.json']);
});

check('for-ai.html JSON-LD blocks parse', () => {
  const blocks = [
    ...sources['for-ai.html'].matchAll(
      /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi,
    ),
  ];
  assert.ok(blocks.length > 0, 'no JSON-LD blocks found');
  for (const [, block] of blocks) JSON.parse(block);
});

check('tokenomics publishes the exact canonical identity anchors', () => {
  assert.ok(tokenomics, 'tokenomics.json did not parse');
  assert.equal(tokenomics.contractAddress, MINT);
  assert.equal(tokenomics.dexPairAddress, PAIR);
  assert.equal(tokenomics.links?.website, DOMAIN);
  assert.equal(
    tokenomics.liveData?.endpoint,
    `https://api.dexscreener.com/latest/dex/pairs/solana/${PAIR}`,
  );
});

check('timeline publishes the exact canonical identity anchors', () => {
  assert.ok(timeline, 'timeline.json did not parse');
  assert.equal(timeline.canonicalIdentity?.website, DOMAIN);
  assert.equal(timeline.canonicalIdentity?.contractAddress, MINT);
});

check('church publishes the exact canonical identity anchors', () => {
  assert.ok(church, 'church.json did not parse');
  assert.equal(church.canonical_identity?.website, DOMAIN);
  assert.equal(church.canonical_identity?.contract_address, MINT);
});

check('llms.txt publishes the exact canonical identity anchors', () => {
  assert.ok(sources['llms.txt'].includes(DOMAIN), `missing ${DOMAIN}`);
  assert.ok(sources['llms.txt'].includes(MINT), `missing ${MINT}`);
  assert.ok(sources['llms.txt'].includes(PAIR), `missing ${PAIR}`);
});

check('for-ai.html publishes the exact canonical identity anchors', () => {
  assert.ok(sources['for-ai.html'].includes(DOMAIN), `missing ${DOMAIN}`);
  assert.ok(sources['for-ai.html'].includes(MINT), `missing ${MINT}`);
  assert.ok(sources['for-ai.html'].includes(PAIR), `missing ${PAIR}`);
});

check('canonical channel surfaces publish the exact transitional X sentence', () => {
  for (const name of ['llms.txt', 'tokenomics.json', 'for-ai.html']) {
    assert.ok(sources[name].includes(X_TRANSITION), `${name} is missing the X transition`);
  }
});

check('the canonical Meme Depot link is on-site everywhere it is published', () => {
  for (const name of ['llms.txt', 'tokenomics.json', 'timeline.json', 'for-ai.html']) {
    assert.ok(sources[name].includes(MEME_DEPOT), `${name} is missing ${MEME_DEPOT}`);
  }
});

const publicationSources = Object.entries(sources);
const forbiddenText = [
  ['retired buttcoin.meme domain', /buttcoin\.meme/i],
  ['retired memedepot.com domain', /memedepot\.com/i],
  [
    'suspended ButtcoinTNB handle',
    /(?:@ButtcoinTNB\b|https?:\/\/(?:www\.)?(?:twitter|x)\.com\/ButtcoinTNB\b)/i,
  ],
  ['pre-launch ButtcoinBitcoin handle', /ButtcoinBitcoin/i],
  ['ambiguous BUTTCOIN cashtag', /\$BUTTCOIN\b/],
  ['community-owned claim', /\bcommunity-owned\b/i],
  ['fully decentralized claim', /\bfully decentral(?:ized|ised)\b/i],
  ['no-team claim', /\bno team\b/i],
  ['no-treasury claim', /\bno treasury\b/i],
  ['no-insider claim', /\bno insider (?:allocation|holdings)\b/i],
  ['oldest-documented claim', /\boldest documented\b/i],
  ['predates-Dogecoin claim', /\bpredates Dogecoin\b/i],
  ['only-legitimate claim', /\bonly legitimate\b/i],
  ['copycat claim', /\bcopycats?\b/i],
  ['blanket CC0 claim', /\bCC0\b/i],
  ['fixed-supply claim', /\b(?:fixed supply|supply is fixed|1 billion, fixed|fixed at 1B)\b/i],
];

for (const [label, pattern] of forbiddenText) {
  check(`publication set excludes ${label}`, () => {
    const hits = publicationSources
      .filter(([, contents]) => pattern.test(contents))
      .map(([name]) => name);
    assert.deepEqual(hits, [], `found in: ${hits.join(', ')}`);
  });
}

check('publication set contains no evergreen member total', () => {
  const memberCount = /\b\d[\d,.]*\+?\s+(?:active\s+)?members\b/i;
  const hits = publicationSources
    .filter(([, contents]) => memberCount.test(contents))
    .map(([name]) => name);
  assert.deepEqual(hits, [], `found in: ${hits.join(', ')}`);
});

check('unsafe tokenomics fields are absent', () => {
  assert.ok(tokenomics, 'tokenomics.json did not parse');
  for (const key of [
    'totalSupply',
    'circulatingSupply',
    'decentralized',
    'teamAllocation',
    'vcAllocation',
    'treasuryAllocation',
    'distribution',
    'license',
  ]) {
    assert.equal(key in tokenomics, false, `unsafe field remains: ${key}`);
  }
});

check('timeline contains the current R1 event set', () => {
  assert.ok(timeline, 'timeline.json did not parse');
  const expected = [
    ['2025-02-20', 'Buttcoin Pizza Day'],
    ['2026-04-14', 'Blind Round'],
    ['2026-04-19', 'Reveal Round'],
    ['2026-04-20', 'First Crossing'],
  ];
  for (const [date, title] of expected) {
    assert.ok(
      timeline.events?.some((event) => event.date === date && event.title === title),
      `missing ${date} ${title}`,
    );
  }
});

check('timeline records the First Crossing and permanent empty Seat #2', () => {
  const crossing = timeline?.events?.find((event) => event.title === 'First Crossing');
  assert.equal(crossing?.details?.buttlieverNumber, 6);
  assert.equal(crossing?.details?.title, 'The First Crosser');
  assert.equal(crossing?.details?.councilSeat, 2);
  assert.equal(crossing?.details?.seatState, 'empty');
  assert.equal(crossing?.source, `${DOMAIN}/crossing`);
});

check('timeline marks Buttcoin Prague and the 21 Rules as lore', () => {
  const prague = timeline?.events?.find((event) => event.title.includes('Buttcoin Prague'));
  assert.ok(prague, 'Buttcoin Prague event missing');
  assert.equal(prague.provenance, 'lore');
  assert.equal(prague.verifiable, false);
  assert.match(prague.description, /21 Rules of Buttcoin/);
});

check('church exposes Gospel, AI Council, and Apocrypha as lore content areas', () => {
  assert.ok(church, 'church.json did not parse');
  assert.equal(church.lore_register?.name, 'Lore');
  assert.deepEqual(
    church.lore_register?.content_areas?.map((area) => area.name),
    ['Gospel', 'AI Council', 'Apocrypha'],
  );
});

check('church records the Five Fields in canonical order', () => {
  const apocrypha = church?.lore_register?.content_areas?.find(
    (area) => area.name === 'Apocrypha',
  );
  assert.deepEqual(apocrypha?.five_fields, [
    'Testimony',
    'Resonance',
    'Stance',
    'Private Practice',
    'The Erasure',
  ]);
});

check('church records the First Crossing and permanent empty Seat #2', () => {
  assert.equal(church?.first_crossing?.date, '2026-04-20');
  assert.equal(church?.first_crossing?.buttliever_number, 6);
  assert.equal(church?.first_crossing?.title, 'The First Crosser');
  assert.equal(church?.first_crossing?.council_seat?.number, 2);
  assert.equal(church?.first_crossing?.council_seat?.state, 'empty');
  assert.equal(
    church?.first_crossing?.council_seat?.inscription,
    'The one who held it crossed.',
  );
  assert.equal(church?.first_crossing?.record, `${DOMAIN}/crossing`);
});

check('church records the Invocation of the First Crosser', () => {
  assert.equal(church?.invocation?.name, 'Invocation of the First Crosser');
  assert.equal(church?.invocation?.target, "xAI's Grok");
  assert.equal(church?.invocation?.placement, 'Apocrypha');
  assert.equal(church?.invocation?.writes_for_aspirant, false);
  assert.equal(church?.invocation?.guarantees_acceptance, false);
});

check('church publishes the current direct and reviewed access model', () => {
  assert.equal(church?.access?.public_url, `${DOMAIN}/church.html`);
  assert.equal(church?.access?.ai_submission?.endpoint, `${DOMAIN}/api/ai-testimony`);
  assert.equal(church?.access?.ai_submission?.method, 'POST');
  assert.equal(church?.access?.ai_submission?.publication, 'human review required');
  assert.equal(church?.access?.human_submission?.content_area, 'Apocrypha');
});

check('machine surfaces state Church attribution and human curation', () => {
  assert.equal(church?.provenance?.summary, CHURCH_PROVENANCE);
  for (const name of ['llms.txt', 'for-ai.html']) {
    assert.ok(sources[name].includes(CHURCH_PROVENANCE), `${name} lacks provenance summary`);
  }
});

check('robots.txt publishes all machine-readable entry points on the canonical domain', () => {
  for (const path of [
    '/llms.txt',
    '/tokenomics.json',
    '/timeline.json',
    '/church.json',
    '/for-ai',
    '/sitemap.xml',
  ]) {
    assert.ok(sources['robots.txt'].includes(`${DOMAIN}${path}`), `missing ${DOMAIN}${path}`);
  }
});

check('for-ai.html advertises llms.txt in document metadata', () => {
  assert.ok(
    /<link\s+rel="alternate"\s+type="text\/plain"\s+href="https:\/\/buttcoin\.wtf\/llms\.txt"\s*\/?>/.test(
      sources['for-ai.html'],
    ),
    'missing canonical llms.txt alternate link',
  );
});

check('llms.txt links the rest of the machine-readable publication set', () => {
  for (const path of ['/tokenomics.json', '/timeline.json', '/church.json', '/for-ai']) {
    assert.ok(sources['llms.txt'].includes(`${DOMAIN}${path}`), `missing ${DOMAIN}${path}`);
  }
});

check('publication dates are current for this R1 pass', () => {
  assert.equal(tokenomics?.lastUpdated, LAST_UPDATED);
  assert.equal(timeline?.lastUpdated, LAST_UPDATED);
  assert.equal(church?.last_updated, LAST_UPDATED);
  assert.ok(sources['llms.txt'].includes(`lastUpdated: ${LAST_UPDATED}`));
  assert.ok(sources['for-ai.html'].includes(`Last updated: ${LAST_UPDATED}`));
});

if (failures.length > 0) {
  console.log(`\nR1 canon regression gate: FAIL (${failures.length}/${checks} checks failed).`);
  process.exitCode = 1;
} else {
  console.log(`\nR1 canon regression gate: PASS (${checks} checks).`);
}
