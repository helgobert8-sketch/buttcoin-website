import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const MINT = 'FasH397CeZLNYWkd3wWK9vrmjd1z93n3b59DssRXpump';
const PAIR = '63amWndBz75z2j7jyKDbzXvzt36L9qdGw7CZAXbD4KNe';
const DOMAIN = 'https://buttcoin.wtf';
const MEME_DEPOT = `${DOMAIN}/#meme-depot`;
const RETIRED_DEPOT_DOMAIN = new RegExp(['meme', 'depot', '\\.com'].join(''), 'i');
const RETIRED_SITE_DOMAIN = new RegExp(['buttcoin', '\\.meme'].join(''), 'i');
const X_TRANSITION =
  'No canonical X account is currently published; verify current channels at buttcoin.wtf.';
const HERO_COPY =
  'The Bitcoin logo, rotated 90°. The joke: documented December 8, 2013. The coin: on Solana since January 2025.';
const CHURCH_HERO = 'Let there be a joke, and let it become expensive.';
const CONTROL_COPY =
  'Buttcoin’s public channels and curated archives are human-administered. On-chain authority claims are sourced separately.';
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

const humanSourceUrls = {
  'index.html': new URL('../index.html', import.meta.url),
  'church.html': new URL('../church.html', import.meta.url),
  'css/style.css': new URL('../css/style.css', import.meta.url),
  'js/app.js': new URL('../js/app.js', import.meta.url),
  'js/memes.js': new URL('../js/memes.js', import.meta.url),
  'js/price.js': new URL('../js/price.js', import.meta.url),
  'CLAUDE.md': new URL('../CLAUDE.md', import.meta.url),
};

const sources = Object.fromEntries(
  await Promise.all(
    Object.entries(sourceUrls).map(async ([name, url]) => [name, await readFile(url, 'utf8')]),
  ),
);
const publicationSources = Object.entries(sources);
const humanSources = Object.fromEntries(
  await Promise.all(
    Object.entries(humanSourceUrls).map(async ([name, url]) => [name, await readFile(url, 'utf8')]),
  ),
);

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const { stdout: trackedFileList } = await execFileAsync('git', ['ls-files', '-z'], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 2 * 1024 * 1024,
});
const trackedTextExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.py',
  '.txt',
  '.xml',
  '.yaml',
  '.yml',
]);
const trackedTextFiles = trackedFileList
  .split('\0')
  .filter(Boolean)
  .filter((name) => trackedTextExtensions.has(extname(name).toLowerCase()));
const trackedSources = Object.fromEntries(
  await Promise.all(
    trackedTextFiles.map(async (name) => [name, await readFile(join(repoRoot, name), 'utf8')]),
  ),
);

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

function attributeValue(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return match?.[1] ?? match?.[2];
}

function htmlBlockById(html, tag, id) {
  const match = html.match(
    new RegExp(`<${tag}\\b[^>]*\\bid=["']${id}["'][^>]*>[\\s\\S]*?<\\/${tag}>`, 'i'),
  );
  assert.ok(match, `missing <${tag}>#${id}`);
  return match[0];
}

function htmlElementByClass(html, tag, className) {
  const match = html.match(
    new RegExp(
      `<${tag}\\b[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/${tag}>`,
      'i',
    ),
  );
  assert.ok(match, `missing <${tag}>.${className}`);
  return match[1];
}

function visibleText(html) {
  return normalizeHtml(
    html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'"),
  );
}

function presentationCard(html, key) {
  const marker = `<div class="presentation-card" onclick="openPresentation('${key}')">`;
  const start = html.indexOf(marker);
  assert.notEqual(start, -1, `missing ${key} presentation card`);
  const next = html.indexOf('<div class="presentation-card"', start + marker.length);
  const sectionEnd = html.indexOf('</section>', start);
  return html.slice(start, next === -1 ? sectionEnd : next);
}

function pairCandidates(contents) {
  const patterns = [
    /(?:dexscreener\.com\/solana\/|dex\/pairs\/solana\/)([A-Za-z0-9]{32,44})/gi,
    /\bDEXSCREENER_PAIR\s*=\s*['"`]([A-Za-z0-9]{32,44})['"`]/g,
    /["']dexPairAddress["']\s*:\s*["']([A-Za-z0-9]{32,44})["']/gi,
    /["']name["']\s*:\s*["']dexPairAddress["']\s*,\s*["']value["']\s*:\s*["']([A-Za-z0-9]{32,44})["']/gi,
    /^\s*-\s*DEX Pair:\s*`([A-Za-z0-9]{32,44})`\s*$/gim,
    /DEX Pair Address:\s*([A-Za-z0-9]{32,44})/gi,
  ];
  return patterns.flatMap((pattern) => [...contents.matchAll(pattern)].map((match) => match[1]));
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

check('homepage hero visible copy is exact and keeps 2013 separate from the coin', () => {
  assert.equal(
    visibleText(htmlElementByClass(humanSources['index.html'], 'p', 'hero-desc')),
    HERO_COPY,
  );
});

check('homepage metadata and JSON-LD are R0-safe and canonical', () => {
  const index = humanSources['index.html'];
  const head = index.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const descriptions = [...head.matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => attributeValue(tag, 'name')?.toLowerCase() === 'description')
    .map((tag) => attributeValue(tag, 'content'));
  assert.equal(descriptions.length, 1, 'homepage must publish one meta description');
  assert.match(descriptions[0], /video lineage[^.]*December 8, 2013/i);
  assert.match(descriptions[0], /coin[^.]*on Solana since January 2025/i);

  for (const pattern of [
    /\bcommunity-owned\b/i,
    /\bfully decentralized\b/i,
    /\bfixed supply\b/i,
    /\b(?:no|zero) central authority\b/i,
    /\btoken launch(?:ed)?\b/i,
  ]) {
    assert.doesNotMatch(head, pattern);
  }
  assert.doesNotMatch(head, /(?:@ButtcoinTNB\b|ButtcoinBitcoin|(?:x|twitter)\.com\/ButtcoinTNB)/i);
  assert.match(head, /<meta\s+property="og:url"\s+content="https:\/\/buttcoin\.wtf"\s*\/?>/i);

  const documents = parseJsonLd(index);
  assert.deepEqual(
    documents.map((document) => document['@type']).sort(),
    ['FinancialProduct', 'Organization'].sort(),
  );
  const organization = documents.find((document) => document['@type'] === 'Organization');
  const financial = documents.find((document) => document['@type'] === 'FinancialProduct');
  assert.equal(organization?.url, DOMAIN);
  assert.ok(organization?.sameAs?.every((url) => !/(?:x|twitter)\.com/i.test(url)));
  assert.equal(Object.hasOwn(financial ?? {}, 'ticker'), false, 'unsupported direct ticker remains');
  const properties = Object.fromEntries(
    financial.additionalProperty.map((property) => [property.name, property.value]),
  );
  assert.equal(properties.contractAddress, MINT);
  assert.equal(properties.dexPairAddress, PAIR);
  assert.equal(properties.website, DOMAIN);
  assert.equal(properties.videoLineageDate, '2013-12-08');
  assert.equal(properties.pairCreationDate, '2025-01-30');
  for (const unsafeKey of ['totalSupply', 'launchDate', 'launchPlatform', 'decentralized']) {
    assert.equal(unsafeKey in properties, false, `unsafe JSON-LD property remains: ${unsafeKey}`);
  }
});

check('homepage About and FAQ use the R0 control, supply, license, and Buttoshi rules', () => {
  const index = humanSources['index.html'];
  const about = visibleText(htmlBlockById(index, 'section', 'about'));
  const faq = visibleText(htmlBlockById(index, 'section', 'faq'));

  for (const [name, surface] of [['About', about], ['FAQ', faq]]) {
    for (const pattern of [
      /\bcommunity-owned\b/i,
      /\bfully decentralized\b/i,
      /\bno team\b/i,
      /\bfixed supply\b/i,
      /\bno new tokens can be minted\b/i,
      /\b(?:no|zero) central authority\b/i,
      /\b(?:all|every)\b[^.!?]{0,100}\bCC0\b/i,
    ]) {
      assert.doesNotMatch(surface, pattern, `${name} retains unsafe copy`);
    }
    assert.ok(surface.includes(CONTROL_COPY), `${name} lacks the exact control copy`);
    assert.match(surface, /video[^.]*December 8, 2013/i);
    assert.match(surface, /coin[^.]*on Solana since January 2025/i);
    assert.match(surface, /Buttoshi is a distributed role/i);
    assert.doesNotMatch(surface, /James(?: D\. McMurray)?[^.]{0,120}(?:Buttoshi|Satoshi)/i);
  }

  assert.match(faq, /Supply is live on-chain data/i);
  assert.match(faq, /CC0 applies only[^.]*specific asset[^.]*documented/i);
  assert.doesNotMatch(about, /\bfirst real Buttcoin purchase\b/i);
  assert.match(about, /founder-attested purchase/i);
});

check('rotating public quotes preserve the 2013/2025 split and distributed Buttoshi role', () => {
  const safeQuote =
    'Buttoshi is a distributed role. The role honors the 2013 video lineage.';
  for (const name of ['js/app.js', 'js/memes.js']) {
    assert.ok(humanSources[name].includes(safeQuote), `${name} lacks the safe Buttoshi quote`);
    assert.doesNotMatch(
      humanSources[name],
      /first ever Buttcoin block was mined more than 12 years ago by Buttoshi/i,
    );
  }
});

check('rotating public quotes make no Buttoshi first-discovery claim', () => {
  const app = humanSources['js/app.js'];
  assert.doesNotMatch(
    app,
    /Buttoshi[^.]{0,80}\bfirst\b[^.]{0,80}\bdiscover(?:ed|y)?\b/i,
  );
  assert.ok(
    app.includes(
      'Buttcoin lore carries a simple truth — Buttcoin is the bitcoin of memes.',
    ),
  );
});

check('Dogecoin article uses documented chronology rather than a Buttoshi theorization', () => {
  const app = humanSources['js/app.js'];
  assert.doesNotMatch(
    app,
    /(?:Buttoshi(?:['’]s)?[^.]{0,120}(?:theor(?:y|ization|ized)|discover(?:y|ed)?)[^.]{0,160}(?:2013|(?:2|two)\s+days?)|(?:2013|(?:2|two)\s+days?)[^.]{0,160}Buttoshi(?:['’]s)?[^.]{0,120}(?:theor(?:y|ization|ized)|discover(?:y|ed)?))/i,
  );
  assert.ok(
    app.includes(
      'Dogecoin launched on December 6, 2013. The rotated-symbol Buttcoin video followed two days later, on December 8, 2013. The current Solana coin has been on Solana since January 2025.',
    ),
  );
});

check('homepage editorial copy separates the 2013 video, 2025 coin, and Buttoshi role', () => {
  const buttposting = visibleText(
    htmlBlockById(humanSources['index.html'], 'section', 'buttposting'),
  );
  assert.doesNotMatch(buttposting, /A 2013 origin\. A Satoshi figure\./i);
  assert.ok(
    buttposting.includes(
      'The documented Buttcoin video lineage dates to December 8, 2013. The Solana coin has been on Solana since January 2025. Buttoshi is a distributed role, not a founder identity.',
    ),
  );
});

check('human article copy makes no unsupported allocation or authority claim', () => {
  const app = humanSources['js/app.js'];
  assert.doesNotMatch(app, /zero VC backing|zero team allocation|100% community energy/i);
  assert.ok(
    app.includes(
      'Allocation and on-chain authority claims require dated sources; neither is asserted here.',
    ),
  );
});

check('human article copy distinguishes independent same-name projects by Mint and Domain', () => {
  const app = humanSources['js/app.js'];
  assert.doesNotMatch(
    app,
    /history and lore \(going back to 2013\)|endlessly copied|copycats? are legion|own unique thing|original meme/i,
  );
  assert.ok(
    app.includes(
      'The project follows a documented video lineage dated December 8, 2013. The current Solana coin has been on Solana since January 2025.',
    ),
  );
  assert.ok(
    app.includes(
      `Independent same-name projects exist. Distinguish this project by the full Mint ${MINT} and buttcoin.wtf.`,
    ),
  );
});

check('Church is discoverable between Content and Game with an honest Empty Seat teaser', () => {
  const index = humanSources['index.html'];
  const contentNav = index.indexOf('<a href="#articles">Content ▾</a>');
  const churchNav = index.indexOf('<a href="/church">Church</a>');
  const gameNav = index.indexOf('<a href="#game">Game</a>');
  assert.ok(contentNav !== -1 && churchNav !== -1 && gameNav !== -1, 'required nav link missing');
  assert.ok(contentNav < churchNav && churchNav < gameNav, 'Church nav is not between Content and Game');

  const teaser = htmlBlockById(index, 'section', 'church-teaser');
  assert.ok(index.indexOf(teaser) < index.indexOf('<section id="game">'));
  assert.match(visibleText(teaser), /Seat #2 stands empty\. The one who held it crossed\./);
  assert.match(
    teaser,
    /<a\b[^>]*href="\/church"[^>]*>[^<]+<\/a>\s*<a\b[^>]*href="\/crossing"[^>]*>[^<]+<\/a>/i,
  );
  assert.doesNotMatch(teaser, /AIs testify/i);
});

check('Church hero replacement is exact in metadata and rendered JavaScript', () => {
  const churchHtml = humanSources['church.html'];
  const descriptions = [...churchHtml.matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => attributeValue(tag, 'name')?.toLowerCase() === 'description')
    .map((tag) => attributeValue(tag, 'content'));
  assert.deepEqual(descriptions, [CHURCH_HERO]);
  assert.ok(
    churchHtml.includes(`const TAGLINE   = '${CHURCH_HERO}';`),
    'rendered Church TAGLINE is not exact',
  );
});

check('presentation cards visibly mark the Standard and 21 Rules as lore', () => {
  const index = humanSources['index.html'];
  const badgePattern = /<span\s+class="lore-badge">Lore<\/span>/i;
  assert.match(presentationCard(index, 'standard'), badgePattern);
  const rules = presentationCard(index, 'rules');
  assert.match(rules, badgePattern);
  assert.match(visibleText(rules), /fictional lore setting[^.]*Buttcoin Prague 2025/i);
  const loreStyles = humanSources['css/style.css'].match(/\.lore-badge\s*\{([\s\S]*?)\}/i);
  assert.ok(loreStyles, 'Lore badge styles missing');
  assert.doesNotMatch(loreStyles[1], /display:\s*none/i);
});

check('human X surfaces publish non-clickable historical status and the exact transition', () => {
  const index = humanSources['index.html'];
  const surfaces = [
    ['Buttposting checklist', htmlBlockById(index, 'section', 'buttposting')],
    ['Community', htmlBlockById(index, 'section', 'community')],
    ['footer', htmlBlockById(index, 'footer', 'footer')],
  ];
  assert.doesNotMatch(index, /https?:\/\/(?:www\.)?(?:x|twitter)\.com\/ButtcoinTNB\b/i);
  assert.doesNotMatch(index, /ButtcoinBitcoin/i);
  const clickableHistoricalHandles = [...index.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)]
    .filter((match) => visibleText(match[1]).includes('@ButtcoinTNB'));
  assert.deepEqual(clickableHistoricalHandles, [], 'historical handle remains clickable');
  for (const [name, surface] of surfaces) {
    const text = visibleText(surface);
    assert.match(text, /@ButtcoinTNB[^.]*suspended/i, `${name} lacks historical status`);
    assert.ok(text.includes(X_TRANSITION), `${name} lacks exact X transition`);
  }
  assert.doesNotMatch(index, /\b\d[\d,.]*\+?\s+(?:members|Buttcoiners)\b/i);
});

check('Meme Depot uses the 3,018 count and only the on-site target', () => {
  const index = humanSources['index.html'];
  const count = index.match(/<span\b[^>]*id="meme-count"[^>]*>([\s\S]*?)<\/span>/i);
  assert.ok(count, 'meme count missing');
  assert.equal(visibleText(count[1]), '3,018');
  assert.doesNotMatch(humanSources['js/memes.js'], /\bcountUp\s*\(/);
  assert.doesNotMatch(humanSources['js/memes.js'], /dataset\.(?:total|counted)\b/);

  const depotLinks = [...humanSources['js/memes.js'].matchAll(
    /<a\b[^>]*href="([^"]+)"[^>]*>[\s\S]{0,160}?Meme Depot/gi,
  )].map((match) => match[1]);
  assert.ok(depotLinks.length >= 3, 'on-site Meme Depot fallback links are under-published');
  assert.ok(depotLinks.every((href) => href === MEME_DEPOT));

  for (const [name, contents] of Object.entries(trackedSources)) {
    assert.doesNotMatch(contents, RETIRED_DEPOT_DOMAIN, `${name} retains retired Depot domain`);
    assert.doesNotMatch(contents, /1,800\+/, `${name} retains the old Depot count`);
    assert.doesNotMatch(contents, RETIRED_SITE_DOMAIN, `${name} retains retired site domain`);
  }
});

check('both gallery render paths expose a visible per-image failure state', () => {
  const memes = humanSources['js/memes.js'];
  const handlers = [...memes.matchAll(/onerror="showMemeImageError\(this\)"/g)];
  assert.equal(handlers.length, 2, 'both gallery paths must use the visible error handler');
  assert.doesNotMatch(memes, /closest\(['"]\.meme-item['"]\)[^\n]*style\.display/i);

  const functionMatch = memes.match(
    /function showMemeImageError\(image\) \{([\s\S]*?)\n\}/,
  );
  assert.ok(functionMatch, 'showMemeImageError is missing');
  const runHandler = new Function('image', functionMatch[1]);
  const classes = [];
  const attributes = new Map();
  const item = {
    classList: { add: (className) => classes.push(className) },
    innerHTML: '',
    style: {},
    setAttribute: (name, value) => attributes.set(name, value),
  };
  runHandler({ closest: (selector) => (selector === '.meme-item' ? item : null) });
  assert.deepEqual(classes, ['meme-item-error']);
  assert.equal(attributes.get('aria-disabled'), 'true');
  assert.equal(item.style.pointerEvents, 'none');
  assert.match(item.innerHTML, /class="meme-image-error"/);
  assert.match(item.innerHTML, /role="status"/);
  assert.match(item.innerHTML, /Image unavailable/);
  assert.match(
    humanSources['css/style.css'],
    /\.meme-image-error\s*\{[\s\S]*?display:\s*flex[\s\S]*?\}/i,
  );
});

check('randomizer watermark and repo-wide DEX pair are exact', () => {
  assert.match(humanSources['js/memes.js'], /fillText\('buttcoin\.wtf',\s*590,\s*592\)/);

  const competingProbe = ['1', '2', '3'].map((character) => character.repeat(44));
  assert.deepEqual(
    pairCandidates(
      `const DEXSCREENER_PAIR = '${competingProbe[0]}';\n` +
        `https://dexscreener.com/solana/${competingProbe[1]}\n` +
        `{"name":"dexPairAddress","value":"${competingProbe[2]}"}`,
    ).sort(),
    competingProbe,
    'pair-field parser misses a competing value',
  );

  const pairHits = [];
  for (const [name, contents] of Object.entries(trackedSources)) {
    for (const value of pairCandidates(contents)) pairHits.push([name, value]);
  }
  assert.ok(pairHits.length > 0, 'no tracked DEX pair values found');
  assert.deepEqual(
    pairHits.filter(([, value]) => value !== PAIR),
    [],
    `competing pair values: ${pairHits
      .filter(([, value]) => value !== PAIR)
      .map(([name, value]) => `${name}:${value}`)
      .join(', ')}`,
  );
  assert.match(
    trackedSources['index.html'],
    new RegExp(
      `["']name["']\\s*:\\s*["']dexPairAddress["']\\s*,\\s*["']value["']\\s*:\\s*["']${PAIR}["']`,
    ),
  );
  assert.match(
    trackedSources['js/price.js'],
    new RegExp(`\\bDEXSCREENER_PAIR\\s*=\\s*['"]${PAIR}['"]`),
  );
  assert.match(trackedSources['CLAUDE.md'], new RegExp('^- DEX Pair: `' + PAIR + '`$', 'm'));
});

check('homepage advertises llms.txt and keeps Mint plus Domain copyable in the footer', () => {
  const index = humanSources['index.html'];
  assert.match(
    index,
    /<link\s+rel="alternate"\s+type="text\/plain"\s+href="https:\/\/buttcoin\.wtf\/llms\.txt"\s*\/?>/i,
  );
  assert.match(index, new RegExp(`<code[^>]*id="ca-text"[^>]*>${MINT}<\\/code>`));
  assert.match(index, new RegExp(`<code[^>]*id="ca-buy"[^>]*>${MINT}<\\/code>`));
  assert.match(index, /<button\b[^>]*id="btn-copy"[^>]*onclick="copyCA\(\)"[^>]*>Copy<\/button>/i);
  assert.match(index, /<button\b[^>]*onclick="copyCA\(\)"[^>]*class="btn-copy-mini"[^>]*>Copy CA<\/button>/i);

  const footer = htmlBlockById(index, 'footer', 'footer');
  const verification = htmlElementByClass(footer, 'div', 'footer-verification');
  assert.match(verification, new RegExp(`<code[^>]*>${MINT}<\\/code>`));
  assert.match(verification, /<button\b[^>]*onclick="[^"]*(?:clipboard|copyCA)[^"]*"[^>]*>Copy<\/button>/i);
  assert.match(verification, /<a\b[^>]*href="https:\/\/buttcoin\.wtf"[^>]*>buttcoin\.wtf<\/a>/i);
  assert.match(footer, /<a\b[^>]*href="\/llms\.txt"[^>]*>llms\.txt<\/a>/i);
});

check('CLAUDE.md uses safe project copy and the one-event publication convention', () => {
  const claude = humanSources['CLAUDE.md'];
  assert.ok(
    claude.includes('Buttcoin (BUTTCOIN) is the Solana memecoin documented at buttcoin.wtf.'),
  );
  assert.doesNotMatch(claude, /\$BUTTCOIN\b/);
  assert.ok(claude.includes('One event -> all affected canonical files in one commit.'));
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
  ['retired .meme domain', RETIRED_SITE_DOMAIN],
  ['retired Depot domain', RETIRED_DEPOT_DOMAIN],
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
