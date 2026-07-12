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
const REVIEW_ONLY = process.argv.includes('--review-fixes');
const BUTTCOINERS_COMMUNITY = 'https://x.com/i/communities/1889649634051592571';

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
const publicationSources = Object.entries(sources);

const failures = [];
let checks = 0;

function check(name, assertion, group = 'base') {
  if (REVIEW_ONLY && group !== 'review') return;
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

function reviewCheck(name, assertion) {
  check(name, assertion, 'review');
}

function parseJsonLd(html) {
  const documents = [];
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const jsonLdType =
    /\btype\s*=\s*(?:"application\/ld\+json"|'application\/ld\+json'|application\/ld\+json)(?=\s|$)/i;

  for (const [, attributes, body] of html.matchAll(scriptPattern)) {
    if (jsonLdType.test(attributes)) documents.push(JSON.parse(body));
  }

  return documents;
}

function markdownSection(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.indexOf(`## ${heading}`);
  assert.notEqual(start, -1, `missing Markdown section: ${heading}`);
  const nextHeading = lines.findIndex((line, index) => index > start && line.startsWith('## '));
  return lines.slice(start + 1, nextHeading === -1 ? lines.length : nextHeading).join('\n');
}

function normalizeHtml(html) {
  return html.replace(/\s+/g, ' ').trim();
}

function factTableCell(html, label) {
  const table = html.match(
    /<table\b[^>]*class=["'][^"']*\bfact-table\b[^"']*["'][^>]*>([\s\S]*?)<\/table>/i,
  );
  assert.ok(table, 'fact table missing');

  const matchingCells = [];
  for (const row of table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) =>
      normalizeHtml(cell[1]),
    );
    if (cells.length === 2 && cells[0].replace(/<[^>]+>/g, '') === label) {
      matchingCells.push(cells[1]);
    }
  }

  assert.equal(matchingCells.length, 1, `expected one ${label} fact-table row`);
  return matchingCells[0];
}

let tokenomics;
let timeline;
let church;
let jsonLdDocuments;

reviewCheck('tokenomics.json parses', () => {
  tokenomics = JSON.parse(sources['tokenomics.json']);
});

reviewCheck('timeline.json parses', () => {
  timeline = JSON.parse(sources['timeline.json']);
});

reviewCheck('church.json parses', () => {
  church = JSON.parse(sources['church.json']);
});

reviewCheck('for-ai.html JSON-LD blocks parse regardless of attribute order', () => {
  const reorderedProbe =
    '<script data-review="attribute-order" type="application/ld+json">{"@type":"ReviewProbe"}</script>';
  assert.equal(parseJsonLd(reorderedProbe)[0]?.['@type'], 'ReviewProbe');

  jsonLdDocuments = parseJsonLd(sources['for-ai.html']);
  const types = jsonLdDocuments.map((document) => document['@type']);
  assert.deepEqual(types.sort(), ['FAQPage', 'FinancialProduct'].sort());
});

reviewCheck('tokenomics declares its v2 breaking schema', () => {
  assert.equal(tokenomics?.schemaVersion, '2.0.0');
  assert.match(tokenomics?.breakingChanges ?? '', /removes unsupported legacy fact fields/i);
  assert.match(tokenomics?.breakingChanges ?? '', /pairCreationDate/);
});

reviewCheck('structured dates identify pair creation rather than token launch', () => {
  assert.equal(tokenomics?.pairCreationDate, '2025-01-30');
  assert.equal('launchDate' in tokenomics, false, 'legacy launchDate remains');
  assert.match(tokenomics?.provenance?.pairCreationReference ?? '', /Raydium pair creation/i);
  assert.equal(
    tokenomics?.provenance?.pairCreationReferenceSource,
    `https://dexscreener.com/solana/${PAIR}`,
  );

  const pairEvent = timeline?.events?.find((event) => event.date === '2025-01-30');
  assert.equal(pairEvent?.title, 'Raydium Pair Creation');
  assert.equal(pairEvent?.type, 'market');
  assert.match(pairEvent?.description ?? '', /pair creation/i);
  assert.doesNotMatch(pairEvent?.description ?? '', /token launch/i);
});

reviewCheck('exact-day publication copy avoids unsupported token-launch semantics', () => {
  for (const name of ['llms.txt', 'timeline.json', 'for-ai.html']) {
    assert.doesNotMatch(
      sources[name],
      /\bcurrent (?:Buttcoin )?(?:coin|token) (?:launched|launches)\b/i,
      `${name} still claims a token launch`,
    );
  }
  assert.match(sources['llms.txt'], /has been on Solana since January 2025/);
  assert.match(sources['for-ai.html'], /has been on Solana since January 2025/);
});

reviewCheck('FinancialProduct JSON-LD carries canonical structured semantics', () => {
  const faq = jsonLdDocuments?.find((document) => document['@type'] === 'FAQPage');
  const financial = jsonLdDocuments?.find(
    (document) => document['@type'] === 'FinancialProduct',
  );
  assert.ok(faq, 'FAQPage JSON-LD missing');
  assert.ok(financial, 'FinancialProduct JSON-LD missing');
  assert.equal(Object.hasOwn(financial, 'ticker'), false, 'unsupported direct ticker remains');

  const propertyNames = financial.additionalProperty.map((property) => property.name);
  assert.deepEqual(
    [...propertyNames].sort(),
    [
      'blockchain',
      'contractAddress',
      'dexPairAddress',
      'onChainName',
      'pairCreationDate',
      'ticker',
      'videoLineageDate',
      'website',
    ].sort(),
  );
  const properties = Object.fromEntries(
    financial.additionalProperty.map((property) => [property.name, property.value]),
  );
  assert.equal(properties.ticker, 'BUTTCOIN');
  assert.equal(properties.contractAddress, MINT);
  assert.equal(properties.dexPairAddress, PAIR);
  assert.equal(properties.website, DOMAIN);
  assert.equal(properties.pairCreationDate, '2025-01-30');
  assert.equal(properties.videoLineageDate, '2013-12-08');
  assert.equal('launchDate' in properties, false, 'JSON-LD launchDate remains');

  const whatIsButtcoin = faq.mainEntity.find((entry) => entry.name === 'What is Buttcoin?');
  const contract = faq.mainEntity.find(
    (entry) => entry.name === 'What is the Buttcoin contract address?',
  );
  assert.match(whatIsButtcoin?.acceptedAnswer?.text ?? '', /buttcoin\.wtf/);
  assert.match(whatIsButtcoin?.acceptedAnswer?.text ?? '', new RegExp(MINT));
  assert.match(whatIsButtcoin?.acceptedAnswer?.text ?? '', /since January 2025/);
  assert.match(contract?.acceptedAnswer?.text ?? '', /buttcoin\.wtf/);
  assert.match(contract?.acceptedAnswer?.text ?? '', new RegExp(MINT));
});

reviewCheck('structured links are authoritative rather than presence-only', () => {
  assert.deepEqual(Object.keys(tokenomics?.links ?? {}).sort(),
    [
      'church',
      'dexscreener',
      'forAI',
      'jupiter',
      'llms',
      'memeDepot',
      'solscan',
      'telegram',
      'timeline',
      'website',
      'xStatus',
    ].sort(),
  );
  assert.equal(tokenomics.links.website, DOMAIN);
  assert.equal(tokenomics.links.xStatus, X_TRANSITION);
  assert.equal(tokenomics.links.memeDepot, MEME_DEPOT);
  assert.equal(tokenomics.dexPairAddress, PAIR);
  assert.deepEqual(timeline?.links, { memeDepot: MEME_DEPOT });
});

reviewCheck('llms authoritative identity and channel lines are exact', () => {
  const identity = markdownSection(sources['llms.txt'], 'Canonical Identity');
  const channels = markdownSection(sources['llms.txt'], 'Current Public Channels');

  const pairLines = identity
    .split('\n')
    .filter((line) => line.startsWith('- DEX Pair Address:'));
  assert.deepEqual(pairLines, [`- DEX Pair Address: ${PAIR}`]);

  const depotLines = channels.split('\n').filter((line) => line.startsWith('- Meme Depot:'));
  assert.deepEqual(depotLines, [`- Meme Depot: ${MEME_DEPOT}`]);

  const statusLines = channels
    .split('\n')
    .filter((line) => line.trim() !== '' && !line.startsWith('- '));
  assert.deepEqual(statusLines, [X_TRANSITION]);
});

reviewCheck('for-ai fact-table identity and channel cells are exact', () => {
  assert.equal(factTableCell(sources['for-ai.html'], 'DEX pair address'), `<code>${PAIR}</code>`);
  assert.equal(factTableCell(sources['for-ai.html'], 'X status'), X_TRANSITION);
  assert.equal(
    factTableCell(sources['for-ai.html'], 'Meme Depot'),
    `<a href="${MEME_DEPOT}">${MEME_DEPOT}</a>`,
  );
});

reviewCheck('for-ai current-channel instruction is exact', () => {
  const item = sources['for-ai.html'].match(
    /<div class="agent-item">\s*<div class="agent-n">5<\/div>\s*<div class="agent-text">([\s\S]*?)<\/div>\s*<\/div>/i,
  );
  assert.ok(item, 'agent instruction 5 missing');
  const instruction = normalizeHtml(item[1]);
  assert.match(instruction, /^Current channels:/);
  assert.equal(instruction.split(X_TRANSITION).length - 1, 1);

  const depotHrefs = [...instruction.matchAll(
    /href="([^"]*(?:memedepot|meme[-_]?depot|#meme-depot)[^"]*)"/gi,
  )].map((match) => match[1]);
  assert.deepEqual(depotHrefs, [MEME_DEPOT]);
  assert.ok(
    instruction.includes(`<a href="${MEME_DEPOT}">on-site Meme Depot</a>`),
    'current-channel instruction lacks the canonical on-site Meme Depot link',
  );
});

reviewCheck('publication set rejects competing pair and canonical X values', () => {
  for (const name of ['llms.txt', 'tokenomics.json', 'timeline.json', 'for-ai.html']) {
    const candidates = new Set();
    for (const match of sources[name].matchAll(/\b63am[A-Za-z0-9]{32,44}\b/g)) {
      candidates.add(match[0]);
    }
    for (const match of sources[name].matchAll(
      /(?:pairs\/solana\/|dexscreener\.com\/solana\/)([A-Za-z0-9]{32,44})/gi,
    )) {
      candidates.add(match[1]);
    }
    assert.deepEqual([...candidates], [PAIR], `${name} has competing pair values`);
  }

  for (const [name, contents] of publicationSources) {
    const handleSurface = contents.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
    const handles = [...handleSurface.matchAll(
      /(?:^|[^A-Za-z0-9_])(@[A-Za-z0-9_]{1,15}\b)/g,
    )]
      .map((match) => match[1])
      .filter((handle) => !['@context', '@type'].includes(handle));
    assert.deepEqual(handles, [], `${name} publishes an @handle`);

    const xUrls = [...contents.matchAll(
      /https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[^\s"'<>),]+/gi,
    )].map((match) => match[0]);
    for (const url of xUrls) {
      assert.equal(url, BUTTCOINERS_COMMUNITY, `${name} publishes canonical X URL ${url}`);
    }
  }
});

reviewCheck('publication set rejects alternate Depot and discovery URLs', () => {
  const expectedMachineUrls = new Map([
    ['/llms.txt', `${DOMAIN}/llms.txt`],
    ['/tokenomics.json', `${DOMAIN}/tokenomics.json`],
    ['/timeline.json', `${DOMAIN}/timeline.json`],
    ['/church.json', `${DOMAIN}/church.json`],
    ['/for-ai', `${DOMAIN}/for-ai`],
  ]);
  const depotUrls = [];

  for (const [name, contents] of publicationSources) {
    const urls = [...contents.matchAll(/https?:\/\/[^\s"'<>]+/g)].map(
      (match) => match[0].replace(/[),.;]+$/, ''),
    );
    for (const url of urls) {
      if (/memedepot|meme[-_]?depot/i.test(url)) depotUrls.push(url);
      const parsed = new URL(url);
      if (expectedMachineUrls.has(parsed.pathname)) {
        assert.equal(
          `${parsed.origin}${parsed.pathname}`,
          expectedMachineUrls.get(parsed.pathname),
          `${name} publishes alternate discovery URL ${url}`,
        );
      }
    }
  }

  assert.ok(depotUrls.length >= 4, 'canonical Meme Depot is under-published');
  for (const url of depotUrls) assert.equal(url, MEME_DEPOT);
});

reviewCheck('publication date labels reject competing values', () => {
  const llmsDates = [...sources['llms.txt'].matchAll(
    /^lastUpdated:\s*(\d{4}-\d{2}-\d{2})\s*$/gim,
  )].map((match) => match[1]);
  assert.deepEqual(llmsDates, [LAST_UPDATED]);

  const forAiDates = [...sources['for-ai.html'].matchAll(
    /Last updated:\s*(\d{4}-\d{2}-\d{2})/gi,
  )].map((match) => match[1]);
  assert.ok(forAiDates.length > 0, 'for-ai.html has no update label');
  assert.ok(forAiDates.every((date) => date === LAST_UPDATED), 'competing update date found');

  assert.equal(tokenomics?.lastUpdated, LAST_UPDATED);
  assert.equal(timeline?.lastUpdated, LAST_UPDATED);
  assert.equal(church?.last_updated, LAST_UPDATED);
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
