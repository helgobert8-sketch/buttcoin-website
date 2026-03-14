/* ═══════════════════════════════════════════════
   BUTTCOIN — price.js
   Live price + market data from DexScreener
   Buttcoin Dominance from CoinGecko
═══════════════════════════════════════════════ */

const DEXSCREENER_PAIR = '63amwndbz75z2j7jYKdBZXvzt36L9QdGW7czAXbD4kNe';
const DEXSCREENER_URL  = `https://api.dexscreener.com/latest/dex/pairs/solana/${DEXSCREENER_PAIR}`;
const COINGECKO_URL    = 'https://api.coingecko.com/api/v3/global';

let priceData = null;

// ─── FORMAT HELPERS ──────────────────────────
function fmt(n, decimals = 2) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function fmtPrice(n) {
  if (!n || isNaN(n)) return '—';
  const f = parseFloat(n);
  if (f < 0.000001) return '$' + f.toExponential(3);
  if (f < 0.001)    return '$' + f.toFixed(8);
  if (f < 1)        return '$' + f.toFixed(6);
  return '$' + fmt(f, 4);
}

function fmtMcap(n) {
  if (!n || isNaN(n)) return '—';
  const f = parseFloat(n);
  if (f >= 1e9) return '$' + fmt(f / 1e9, 2) + 'B';
  if (f >= 1e6) return '$' + fmt(f / 1e6, 2) + 'M';
  if (f >= 1e3) return '$' + fmt(f / 1e3, 1) + 'K';
  return '$' + fmt(f, 0);
}

function fmtPct(n, places = 4) {
  if (!n || isNaN(n)) return '—';
  return parseFloat(n).toFixed(places) + '%';
}

// ─── FETCH PRICE DATA ─────────────────────────
async function fetchPriceData() {
  try {
    const res = await fetch(DEXSCREENER_URL);
    if (!res.ok) throw new Error('DexScreener fetch failed');
    const json = await res.json();
    const pair = json.pairs?.[0];
    if (!pair) throw new Error('No pair data');
    priceData = pair;
    updatePriceUI(pair);
    return pair;
  } catch (err) {
    console.warn('Price fetch error:', err);
    setErrorUI();
    return null;
  }
}

function updatePriceUI(pair) {
  const price    = pair.priceUsd;
  const mcap     = pair.fdv ?? pair.marketCap;
  const vol24h   = pair.volume?.h24;
  const change24 = pair.priceChange?.h24;

  // Navbar price
  const navPrice = document.getElementById('live-price');
  if (navPrice) {
    navPrice.textContent = fmtPrice(price);
    navPrice.style.color = parseFloat(change24) >= 0 ? '#22c55e' : '#ef4444';
  }

  // Hero stats
  setText('stat-price', fmtPrice(price) + (change24 ? ` (${parseFloat(change24) >= 0 ? '+' : ''}${fmt(change24, 2)}%)` : ''));
  setText('stat-mcap',  fmtMcap(mcap));
  setText('stat-vol',   fmtMcap(vol24h));
}

function setErrorUI() {
  setText('live-price', 'N/A');
  setText('stat-price', 'N/A');
  setText('stat-mcap', 'N/A');
  setText('stat-vol', 'N/A');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── BUTTCOIN DOMINANCE ───────────────────────
async function fetchDominance() {
  try {
    // Fetch global market data (BTC dominance + total market cap)
    const [globalRes, priceRes] = await Promise.all([
      fetch(COINGECKO_URL),
      priceData ? Promise.resolve(null) : fetchPriceData()
    ]);

    const globalJson = await globalRes.json();
    const global     = globalJson.data;

    const btcDominance   = global.market_cap_percentage?.btc ?? 0;
    const totalMcapUSD   = global.total_market_cap?.usd ?? 0;
    const btcMcapUSD     = totalMcapUSD * (btcDominance / 100);

    // Buttcoin market cap from DexScreener data
    const currentPriceData = priceData || await fetchPriceData();
    const buttcoinMcap = parseFloat(currentPriceData?.fdv ?? currentPriceData?.marketCap ?? 0);

    // BUTTCOIN.D = buttcoin market cap / total market cap * 100
    const buttcoinDominance = totalMcapUSD > 0
      ? (buttcoinMcap / totalMcapUSD) * 100
      : 0;

    // How many times bigger does Buttcoin need to get to flip BTC
    const flipRatio = buttcoinMcap > 0
      ? Math.round(btcMcapUSD / buttcoinMcap).toLocaleString('en-US') + '×'
      : '—';

    // Update UI
    setText('buttcoin-d', fmtPct(buttcoinDominance, 6));
    setText('btc-d',      fmt(btcDominance, 2) + '%');
    setText('buttcoin-mcap-d', fmtMcap(buttcoinMcap));
    setText('btc-mcap-d',      fmtMcap(btcMcapUSD));
    setText('flip-ratio',      flipRatio);
    setText('dominance-update', `Last updated: ${new Date().toLocaleTimeString()}`);

    // Animate bars
    const btcBar  = document.getElementById('btc-bar');
    const buttBar = document.getElementById('buttcoin-bar');
    if (btcBar)  btcBar.style.width  = Math.min(btcDominance, 100) + '%';
    if (buttBar) buttBar.style.width = Math.min(buttcoinDominance * 1000, 100) + '%'; // Scale up for visibility

  } catch (err) {
    console.warn('Dominance fetch error:', err);
    setText('buttcoin-d', '—');
    setText('btc-d', '—');
    setText('dominance-update', 'Data unavailable');
  }
}

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetchPriceData();
  fetchDominance();

  // Refresh every 60 seconds
  setInterval(fetchPriceData, 60_000);
  setInterval(fetchDominance, 120_000);
});
