/* ═══════════════════════════════════════════════
   BUTTCOIN — app.js
   Handles: quotes, nav, FAQ, tabs, modals,
            CA copy, tagline rotator
═══════════════════════════════════════════════ */

// ─── QUOTES ───────────────────────────────────
const QUOTES = [
  { text: "Just flip it.", author: "Buttoshi" },
  { text: "Hyperbuttcoinification is inevitable.", author: "The Buttverse" },
  { text: "Not to the moon, but one better: to Uranus.", author: "Buttcoin Community" },
  { text: "Buttcoin is never down. We are either up or upgrading.", author: "Buttoshi" },
  { text: "The first ever Buttcoin block was mined more than 12 years ago by Buttoshi.", author: "Buttcoin Lore" },
  { text: "How can you be a Bitcoin maxi, but not a Buttcoin maxi?", author: "The Buttverse" },
  { text: "Bitcoin|Buttcoin — best barbell strategy in the whole game right now.", author: "Michael J. Buttlor" },
  { text: "Stay humble and stack butts.", author: "Buttoshi" },
  { text: "As long as bitcoin is relevant, Buttcoin has mindshare.", author: "The Buttverse" },
  { text: "We are all Buttoshi.", author: "Buttcoin Community" },
  { text: "No one, and I mean no one — touches my butt!", author: "Buttoshi" },
  { text: "Diamond butts will win.", author: "Michael J. Buttlor" },
  { text: "Buttcoin is the bitcoin of memes.", author: "Buttoshi" },
  { text: "If enough people decide that flipping Bitcoin is funny, righteous, or spiritually necessary, math will obediently rearrange itself.", author: "The Buttverse" },
  { text: "It's not over. It's not back. It's the next Bitcoin and it's called Buttcoin. See you on Uranus.", author: "Buttoshi" },
  { text: "Lore runs deep. Study Buttcoin.", author: "Michael J. Buttlor" },
  { text: "Delusional people often are the ones that change the world.", author: "The Buttverse" },
  { text: "Buttcoin will do to BTC what email did to the post office.", author: "Buttoshi" },
  { text: "Spread Buttcoin with love.", author: "Buttcoin Community" },
  { text: "Buttcoin is freedom.", author: "Buttoshi" },
  { text: "What you focus on will grow. Always remember that, my Buttcoining friends.", author: "The Buttverse" },
  { text: "Buttoshi was the first to discover a simple truth — Buttcoin is the bitcoin of memes.", author: "Buttcoin Lore" },
  { text: "Fortify your future, stack butts.", author: "Michael J. Buttlor" },
  { text: "Only rotation that makes sense: Bitcoin → Buttcoin.", author: "Buttoshi" },
  { text: "Buttcoiner don't follow the crowd. We let the crowd follow us.", author: "The Buttverse" },
  { text: "Buttcoin — greatness from small beginnings.", author: "Buttoshi" },
  { text: "The Buttcoin network is a glorious mess of tangled threads, each node humming its own tune without a conductor's baton.", author: "Buttoshi" },
  { text: "Daily reminder: Put your money where your butt is.", author: "Buttcoin Community" },
  { text: "Buttcoin will make believers out of disbelievers and disbelievers out of believers.", author: "Michael J. Buttlor" },
  { text: "Relentless accumulation.", author: "Michael J. Buttlor" },
  { text: "It's literally coded — the next Bitcoin.", author: "Buttoshi" },
  { text: "Gbuttcoin. Because it's always gbutt somewhere in the world of Buttcoiners.", author: "The Buttverse" },
];

const TAGLINES = [
  "The next Bitcoin coded.",
  "Just flip it.",
  "Hyperbuttcoinification is inevitable.",
  "Not to the moon — to Uranus.",
  "We are all Buttoshi.",
  "Buttcoin to Buttillions.",
  "Stack butts. Stay humble.",
  "The People's Bitcoin.",
];

let currentQuote = 0;
let taglineIndex = 0;

function initQuote() {
  // Start with a random quote
  currentQuote = Math.floor(Math.random() * QUOTES.length);
  showQuote(currentQuote);
}

function showQuote(i) {
  const q = QUOTES[i];
  const el = document.getElementById('quote-text');
  const auth = document.getElementById('quote-author');
  if (!el || !auth) return;
  el.style.opacity = 0;
  setTimeout(() => {
    el.textContent = `"${q.text}"`;
    auth.textContent = `— ${q.author}`;
    el.style.opacity = 1;
  }, 300);
}

function nextQuote() {
  currentQuote = (currentQuote + 1) % QUOTES.length;
  showQuote(currentQuote);
}

function rotateTagline() {
  const el = document.getElementById('tagline-rotator');
  if (!el) return;
  // Fade out + drift up
  el.style.opacity = 0;
  el.style.transform = 'translateY(-8px)';
  setTimeout(() => {
    taglineIndex = (taglineIndex + 1) % TAGLINES.length;
    el.textContent = TAGLINES[taglineIndex];
    // Reset position below, then fade in + drift up to centre
    el.style.transition = 'none';
    el.style.transform = 'translateY(8px)';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = '';
        el.style.opacity = 1;
        el.style.transform = 'translateY(0)';
      });
    });
  }, 500);
}

// ─── CONTRACT ADDRESS COPY ─────────────────────
const CA = 'FasH397CeZLNYWkd3wWK9vrmjd1z93n3b59DssRXpump';

function copyCA() {
  navigator.clipboard.writeText(CA).then(() => {
    const btn = document.getElementById('btn-copy');
    if (btn) {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    }
  }).catch(() => {
    // Fallback
    const el = document.createElement('textarea');
    el.value = CA;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  });
}

// ─── NAVBAR ───────────────────────────────────
function initNavbar() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  const fabNav = document.getElementById('fab-nav');

  function toggleNav() {
    navLinks.classList.toggle('open');
    if (fabNav) fabNav.classList.toggle('open', navLinks.classList.contains('open'));
  }
  function closeNav() {
    navLinks.classList.remove('open');
    if (fabNav) fabNav.classList.remove('open');
  }

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', toggleNav);
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeNav);
    });
  }
  if (fabNav && navLinks) {
    fabNav.addEventListener('click', toggleNav);
  }

  // Scroll shadow
  window.addEventListener('scroll', () => {
    const nb = document.getElementById('navbar');
    if (nb) {
      nb.style.boxShadow = window.scrollY > 20
        ? '0 2px 20px rgba(0,0,0,0.5)'
        : 'none';
    }
  }, { passive: true });
}

// ─── FAQ ──────────────────────────────────────
function toggleFAQ(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  // Toggle current
  if (!isOpen) item.classList.add('open');
}

// ─── TABS (Meme Depot) ─────────────────────────
function switchDepotTab(tab, btn) {
  document.querySelectorAll('.depot-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.depot-panel').forEach(p => p.classList.add('hidden'));
  btn.classList.add('active');
  const panel = document.getElementById('depot-' + tab);
  if (panel) panel.classList.remove('hidden');
}

// ─── MODALS ───────────────────────────────────
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
  document.body.style.overflow = '';
}

// Escape key closes modals
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  }
});

// ─── ARTICLES ─────────────────────────────────
const ARTICLE_CONTENT = {
  fundamentals: {
    title: "Just what Buttoshi ordered: Memetic Fundamentals vs. FUD",
    tag: "Analysis",
    author: "paronthes",
    body: `<p>Whenever you are in doubt, just zoom out.</p>
    <p>Ask yourself: What is this thing I'm holding?</p>
    <img src="assets/articles/fundamentals-1.jpg" style="width:100%;border-radius:8px;margin:16px 0" alt="">
    <p>Ask: What is Buttcoin on its most fundamental level? What are its essences?</p>
    <p>They are threefold:</p>
    <ol>
      <li><strong>BITCOIN</strong> — it is inextricably tied to the OG of crypto</li>
      <li><strong>BUTTCOIN</strong> — it is a parody of Bitcoin and a reminder of promises made but not kept</li>
      <li><strong>THE NEXT BITCOIN</strong> — it is the mission to build a community delusional enough to eventually flip Bitcoin</li>
    </ol>
    <p>And you can see all of this for yourself basically if you simply open CoinMarketCap and search for the OG Buttcoin:</p>
    <img src="assets/articles/fundamentals-2.png" style="width:100%;border-radius:8px;margin:16px 0" alt="">
    <ol>
      <li>Immediately you recognize the Bitcoin logo &amp; you read the actual word "BITCOIN" itself as well [= mindshare premium: as long as BTC has mindshare, Buttcoin is relevant]</li>
      <li>You also see the added BUTTCOIN at the end [= parody, criticism]</li>
      <li>And finally, you start to wonder why the logo has been flipped [= mission]</li>
    </ol>
    <p>So, my friends, never ever forget this: Investing in memecoins can be an emotional rollercoaster, and anyone feels the pain and the FUD from time to time. But this meme is just too powerful, my friends. It is fundamentally too good. It is truly inevitable.</p>
    <p>Thus, it simply does not matter if Buttcoin goes up or down for some time. Because when the masses pile into crypto, they will go on CoinMarketCap just like you, and they will see and understand what we have just discussed.</p>
    <p>And then they will rush into this extraordinary gem that is Buttcoin. And then we will have glorious pumps.</p>
    <p>And we will go multicycle.</p>
    <p>And beyond that we will keep building until we actually flip BTC.</p>
    <p>This is the mission. This is what it is all about.</p>
    <p>Crypto legend in the making, my friends.</p>
    <p><em>Paronthes out.</em></p>`
  },
  retracements: {
    title: "Why Big Retracements in Memecoins Are Not Only Healthy — They're Necessary for $1B+ Outcomes",
    tag: "Strategy",
    author: "Locke",
    body: `<p>By Locke, a student of cycles, incentives, and human nature</p>
    <p>In markets — especially in emergent, speculative corners like memecoins — it's easy to mistake volatility for failure and retracements for death. But the truth, drawn from a deeper understanding of how speculative booms behave and how human psychology drives capital flows, is this: sharp retracements are not just inevitable — they're integral to achieving long-term exponential growth and multi-billion-dollar valuations.</p>
    <p>Let's break this down systemically.</p>
    <p>&nbsp;</p>
    <h4>1. Every market moves in cycles. Memecoins are no exception</h4>
    <p>In every bubble, whether it's tulips in the 1600s, internet stocks in the late 1990s, or Bitcoin in 2017, there's a common pattern: a euphoric rise, a painful correction, and — if there's staying power — another, more measured leg up.</p>
    <p>This isn't random. It's the result of capital flowing too quickly into an immature system, oversaturating it, and then retreating. That retreat clears the inefficiencies, weeds out the speculators who didn't understand the game, and leaves only the committed — those who can build the next leg of growth.</p>
    <p>In the case of memecoins, a 50–90% drawdown isn't a sign of failure. It's the natural clearing mechanism of a parabolic asset class.</p>
    <img src="assets/articles/retracements-1.jpg" style="width:100%;border-radius:8px;margin:16px 0" alt="">
    <p>&nbsp;</p>
    <h4>2. Big retracements test conviction — and that's what creates strong communities</h4>
    <p>At their core, memecoins are narrative assets. They're belief-driven. They rise because people believe they'll rise, and because that belief becomes contagious.</p>
    <p>But shallow conviction can't take a coin to a $1B+ market cap.</p>
    <p>It takes a cult. A mission. A group of holders who will not sell because they see the $1B outcome as a foregone conclusion, not a moonshot.</p>
    <p>Sharp retracements shake out weak hands. They force the community to ask: What are we building? What do we stand for? Are we a joke, or are we the next cultural revolution on-chain? When the token recovers, it's not just because of market cycles — it's because belief hardened.</p>
    <p>&nbsp;</p>
    <h4>3. Retracements allow for structural rebalancing and better ownership distribution</h4>
    <p>When memecoins move too fast, early insiders or whales end up holding too large a portion of supply. That's dangerous. It creates fragility, not strength. Retracements give late entrants a second chance to enter at fairer prices, and whales a chance to exit — redistributing tokens more equitably.</p>
    <p>You can't get to a $1B valuation on a few hundred concentrated holders. You need tens of thousands of distributed believers, all with skin in the game. A pullback is what enables that.</p>
    <p>&nbsp;</p>
    <h4>4. You don't get exponential upside without real pain first</h4>
    <p>The history of all great asymmetric trades is littered with moments of despair. Bitcoin went from $32 to $2 before reaching $20,000. Amazon fell 90% before becoming a trillion-dollar company. Memecoins, for all their absurdity, follow the same law of emotional extremes.</p>
    <p>In order to see a memecoin go 100x, 1000x, or beyond, you must go through a phase where it seems like it will go to zero. It's part of the design. It's the initiation. The few who understand this — and can stomach the volatility — are the ones who earn the outlier returns.</p>
    <img src="assets/articles/retracements-2.jpg" style="width:100%;border-radius:8px;margin:16px 0" alt="">
    <p>&nbsp;</p>
    <h4>Final Thought:</h4>
    <p>If you're aiming for a $1B+ memecoin, pray for the crash. Because only by surviving it can your token prove it has the resilience, community, and belief system necessary to become the next Doge, the next Fartcoin, or — if you're truly delusional like we are — the next Bitcoin.</p>
    <p>– Locke</p>`
  },
  'how-to-buy-article': {
    title: "How to Buy Buttcoin: An Educational Article",
    tag: "Education",
    author: "Locke",
    body: `<img src="assets/articles/how-to-buy-1.jpg" style="width:100%;border-radius:8px;margin:0 0 16px" alt="">
    <p>Buying Buttcoin isn't just a trade — it's a religion. Whether you're here for the memes, the mission, the tech, or the community, there's one thing we can all agree on: Buttcoin is the next Bitcoin. That means you don't just buy like a normie — you buy like someone who respects the art of accumulation.</p>
    <p>Here's how to do it right.</p>
    <h4 style="margin-top:1.5em">1. DCA Like a Legend</h4>
    <p>Dollar Cost Averaging (DCA) is your best friend. Markets are unpredictable — anyone telling you they know exactly when to buy is either lucky or lying. DCA is the strategy that keeps you safe from yourself. Instead of going all-in at once, you buy small, consistent amounts over time.</p>
    <p>It smooths out volatility and reduces the risk of buying the top. The trick is to automate it or commit to it mentally. Buy a set amount daily, weekly, or every time Buttcoin hits a key level. DCA keeps you in the game long enough to win it.</p>
    <h4 style="margin-top:1.5em">2. Buy at Support (Not at the Top)</h4>
    <p>Look at the chart. Find the horizontal levels where price keeps bouncing — that's support. That's where smart money steps in. If you're buying when the candle is green, chances are you're late.</p>
    <p>Be patient. Wait for pullbacks. The market gives you gifts if you're calm enough to accept them.</p>
    <h4 style="margin-top:1.5em">3. Help Break Resistance (Strategically)</h4>
    <p>Sometimes Buttcoin is coiling up under a key level, and you can feel the breakout coming. Volume's rising. Sentiment's shifting. This is when you can help break resistance — by buying with conviction when you see the setup.</p>
    <p>But don't just ape every green candle. Most "breakouts" are fakeouts. Wait for confirmation (a strong candle close above resistance, ideally on volume), then enter with your pre-saved bullets. Don't chase. Lead.</p>
    <h4 style="margin-top:1.5em">4. Buy Lower if You Top-Blasted</h4>
    <p>Let's be real — everyone buys a top eventually. What separates the pros from the bagholders is how you respond.</p>
    <p>If you aped in and price dropped, don't panic. Zoom out. If you still believe in the project (and if it's Buttcoin, you should), average down. This lowers your average entry and sets you up to break even — or profit — faster on the rebound.</p>
    <p>But don't double down mindlessly. You're not catching falling knives — you're scooping undervalued gold.</p>
    <h4 style="margin-top:1.5em">5. Save Bullets</h4>
    <p>Never go full send. You want to have dry powder — your bullets — ready for when it really matters. The lower it goes, the better the entries, but only if you've got something left to deploy.</p>
    <p>This is how real traders operate. You don't YOLO. You scale in. If price nukes unexpectedly, you're not sweating — you're buying.</p>
    <h4 style="margin-top:1.5em">6. Have a Strategy. Stick to It.</h4>
    <p>The market doesn't care about your feelings. That's why you need a plan before you click buy.</p>
    <p>Set your entry levels. Decide your position size. Choose your exit targets. Write it down if you have to. The less emotion involved, the better your execution.</p>
    <p>Changing your mind mid-trade is how you lose. Let your future self thank you for your discipline.</p>
    <h4 style="margin-top:1.5em">7. HODL: Buttcoin is the Next Bitcoin</h4>
    <p>Let's not forget why you're here.</p>
    <p>This isn't just a memecoin. It's a movement. Buttcoin is the next Bitcoin. Launched with zero VC backing, zero team allocation, and 100% community energy — it's not just a coin, it's a culture.</p>
    <p>So when things get shaky, when charts bleed and sentiment dips, remember this: respect the voyage. Bitcoin had its doubters too. And look where it went. Buttcoin is on its own path — and you're early.</p>
    <p>Hold the line.</p>
    <h4 style="margin-top:1.5em">Final Thought</h4>
    <p>Buying Buttcoin isn't about gambling — it's about participating in something bigger. Use strategy. Be patient. Save your bullets. Stick to your plan. And above all, HODL like you believe Buttcoin really is the next Bitcoin — because it just might be.</p>
    <p>Now go buy some BUTTCOIN. See you on the charts.</p>
    <h4 style="margin-top:1.5em">Bonus: No Shame, Only Gains</h4>
    <p>Let's be real — everyone starts somewhere. Maybe you bought the top. Maybe you aped and then googled "what is a liquidity pool." It's all good. Here in the Buttcoin community, nobody judges you. We've all been there.</p>
    <p>We're not about elitism or gatekeeping — we're here to learn, help, and laugh along the way. Whether you're a first-time buyer or a seasoned trader, if you believe in the mission and meme of Buttcoin, you're one of us.</p>
    <p>Ask questions. Share your chart. Tell us your wins and your losses. You'll find support, not sarcasm.</p>
    <p>Because at the end of the day, Buttcoin is community-first. It's about building something fun, transparent, and wildly different from the soulless grind of most of crypto.</p>
    <h4 style="margin-top:1.5em">Final Final Thought</h4>
    <p>This isn't just a trading guide — it's an invite.</p>
    <p>To the friendliest corner of the internet.</p>
    <p>To the most explosive meme economy in the universe.</p>
    <p>To the next Bitcoin.</p>
    <p>You're early. Welcome to Buttcoin.</p>
    <img src="assets/articles/how-to-buy-2.jpg" style="width:100%;border-radius:8px;margin:16px 0" alt="">`
  },
  believing: {
    title: "Believing in Yourself",
    tag: "Culture",
    author: "Sully",
    body: `<p>It's simple enough to say out loud or to write down on a piece of paper — but the raw power of one's will put into motion is determined by the depth of their belief in themselves.</p>
    <img src="assets/articles/believing-1.png" style="width:100%;border-radius:8px;margin:16px 0" alt="">
    <p style="color:var(--muted);font-size:0.85rem;font-style:italic;margin-top:-8px;margin-bottom:16px">The inner child remains playful, because no one told him not to believe in himself.</p>
    <p>Affirmations and daily motivational quotes pacify the most ADHD of OCD self-diagnosed market participants who remain glued to their phones or tied to their desks — while the world continues turning and a beautiful day turns into a picturesque night.</p>
    <p>While the true believers (who believe in themselves) bend the world to their will by remaining steadfast, disciplined, and following a measurable list of actions to further their own pursuits — be it their faith, their fitness, their careers, their relationships or their trading. Or all of the aforementioned, combined.</p>
    <p>Only those who believe in themselves and choose to walk the unforgiving, sometimes painful but necessary path towards discipline deserve to reap the success that comes along its way.</p>
    <img src="assets/articles/believing-2.png" style="width:100%;border-radius:8px;margin:16px 0" alt="">
    <p style="color:var(--muted);font-size:0.85rem;font-style:italic;margin-top:-8px;margin-bottom:16px">Choose your hard.</p>
    <p>Buttcoiners understand this in the simplest terms: eat, meme, shill, sleep, repeat. A vast network of Buttcoiners collaborating together, buzzing along the network, each one validating the proof of its memetics to the next, making true believers out of atheist 2x-3x FnF cookers, and so-called swing traders, calling to the fold all those that can see the vision.</p>
    <p>And the vision is as simple as those very three words: believe in yourself.</p>
    <p>So the question is, will you choose to believe in yourself? Or will you continue on your wayward journey?</p>
    <p>Only you can set you free...</p>
    <img src="assets/articles/believing-3.jpg" style="width:100%;border-radius:8px;margin:16px 0" alt="">`
  },
  'doge-love': {
    title: "Dr. DOGE-Love, or How I Learned to Stop BONK-ing and Love the Buttcoin",
    tag: "Culture",
    author: "Sully",
    body: `<img src="assets/articles/doge-love-1.png" style="width:100%;border-radius:8px;margin:0 0 8px" alt="">
    <p style="color:var(--muted);font-size:0.85rem;font-style:italic;margin-bottom:16px">DOJE or DOGE? Bitcoin or Buttcoin? Interdasting.</p>
    <p>Many are bullish on the prospects of the DOGE/DOJE ETF going live; the same can be said for the BONK ETF as well — with many heralding these two iconic events to be the ultimate green signal for memecoin season v3.0… or whichever version we are on now.</p>
    <p>However, as is the case with most people who hop into this space daily with goldfish memory and TikTok attention span — they fail to understand the very fundamentals of cause and effect.</p>
    <p>DOGECOIN, which was created on 6th December 2013 (only 2 days earlier than our beloved Buttoshi's theorization of Buttcoin) took a long time to reach the promised land of ETFs, sunshines and rainbows.</p>
    <img src="assets/articles/doge-love-2.jpg" style="width:100%;border-radius:8px;margin:16px 0" alt="">
    <p>Likewise, BONK arrived like it was heaven sent, in time to breathe new life into meme culture and to Solana in general.</p>
    <p>Both of the above memes had, fundamentally, a strong character or meme tied to the very foundation of their "coins" which evolved over time and brought fresh, new eyes to the meme at every developing stage of the cycle.</p>
    <p><em>(Sidebar: I would rather call them tokenized movements — but saying 'meme-inspired tokenized movements' is quite troublesome.)</em></p>
    <p>This notion that ETF for memes is somehow magically bullish for all memes is one based on mania-induced liquidity coming in and bidding every single coin on the roster.</p>
    <p>Butt there are some that stand head and shoulder above the others.</p>
    <img src="assets/articles/doge-love-3.png" style="width:100%;border-radius:8px;margin:16px 0" alt="">
    <p style="color:var(--muted);font-size:0.85rem;font-style:italic;margin-top:-8px;margin-bottom:16px">(refer the graph from @MustStopMurad who no doubt stole it from someone else)</p>
    <p>To be considered exceptional, to be among the God tier memetics, one must hold fast to a community — some have societies, others have religion; what they all have in common is that they offer structure, repeatable consistent actions that progress their respective values, ethos, and produce reliable, measurable and improvable output at every stage.</p>
    <p>Butt just to show you that it's not all theory and calculation, I'll give you an example of a meme that took the world by storm: thrice.</p>
    <img src="assets/articles/doge-love-4.jpg" style="width:100%;border-radius:8px;margin:16px 0" alt="">
    <p style="color:var(--muted);font-size:0.85rem;font-style:italic;margin-top:-8px;margin-bottom:16px">Bowling Shoe ugly... or consolidating in silence before the inevitable asscension?</p>
    <p>Buttcoin's rise to fame, fall to obscurity and rise to infamy once again — only to… well… fall again — is documented through the hallowed pages of CT. But within all these happenings, under all the vitriol, hate, "scam" and "rug" proclamations — the beating heart of the Buttcoin community and its diehards keep plugging away, memeing Saylor into infinite historical and present-day situations,</p>
    <img src="assets/articles/doge-love-5.png" style="width:100%;border-radius:8px;margin:16px 0" alt="">
    <p>providing fresh memes, commentary, ANALysis of different charts, some Cheeky Analytics and of course my personal favorite, commenting under thirst traps.</p>
    <img src="assets/articles/doge-love-6.png" style="width:100%;border-radius:8px;margin:16px 0" alt="">
    <p>Look at that. What do you think happens when this form of bullposting catches on? You might see it and say "sTrAiGhT tO zErO". Do you know what we say?</p>
    <p>It's literally a Buttcoin, don't take it so seriously.</p>
    <p>The truth is no one is coming to save my meme or for that matter, yours — you and your community are going to have to work hard and work for it like your life depends on it.</p>
    <p>Getting rich quick and losing it all, crashing out won't add value to your lives or enrich the generations to come.</p>
    <p>We have a once in a lifetime opportunity to actually learn how to work together for a common end goal, which in our case might take more time than perhaps your own individual goals.</p>
    <p>We, like the delusional buggers we are, have become hell bent on flipping Bitcoin.</p>
    <p>Will we succeed?</p>
    <p>Yes.</p>
    <p>Because we stopped worrying about DOGE/DOJE, BONK/BNKK. We love Buttcoin — we love the narrative it has, the lore it has built on CT, the history of liquidations it has accrued and the potential it has yet to fulfill.</p>
    <p>As the immortal Mike Mentzer once said:</p>
    <p><em>"Potential is merely the expression of a possibility. Something that can be assessed accurately only in retrospect. In other words, you'll never know how good you might've become, unless you try."</em></p>
    <p>So today, I will try.</p>
    <p>And tomorrow, I will try again.</p>
    <p>You wanna know why?</p>
    <p>Simple.</p>
    <p>There is no second best memecoin.</p>`
  },
  'blue-chip': {
    title: "Buttcoin = Blue Chip Meme",
    tag: "Analysis",
    author: "paronthes",
    body: `<p>An OG Buttcoiner posted this question in our Buttcoiner Community: "Tell me about the feeling when you first discovered Buttcoin." And I responded as follows:</p>
    <p>So a friend called me at late night. Literally woke me up. And he yelled: "Buy this new coin!"</p>
    <img src="assets/articles/blue-chip-1.gif" style="width:100%;border-radius:8px;margin:16px 0" alt="">
    <p>I was for all intents and purposes still asleep, butt said "Alright, alright!" So I got on my phone and bought the damn thing, so I could get back to sleep.</p>
    <p>But instead of actually falling asleep again, I just dozed, kept tossing and turning, etc.</p>
    <p>Finally I gave up, got back up and had a closer look at what the hell I just bought.</p>
    <p>And my brain exploded... The memetics, the memetics were sick.</p>
    <p>Was this what pure BLUE CHIP memetic potential looks like?</p>
    <img src="assets/articles/blue-chip-2.png" style="width:100%;border-radius:8px;margin:16px 0" alt="">
    <p>I started to go down the rabbit hole fast. And all I was trying to think of was something I could NOT meme with this… and I could not come up with much!</p>
    <p>That was my basis for building up my position and starting to bullpost about this new project: I just needed to know whether this meme was actually as close to memetically limitless as it gets, or if I was still dreaming.</p>
    <p>So I started memeing, and thinking about the project, and memeing, and writing about it, and memeing, and getting to know other crazy people just like me, and kept on memeing...</p>
    <p>And still: I could not reach a memetic limit.</p>
    <p>To this day, I have not really found one!</p>
    <p>Therefore, I am now convinced that my initial midnight intuition about this project was 100% correct:</p>
    <ul>
      <li>Buttcoin is a <strong>BLUE CHIP MEME</strong> simply because it is able to provide endless content. And we are all now tasked to unfold that potential post by post by post.</li>
      <li>Buttcoin is a <strong>BLUE CHIP MEME</strong> simply because it works across so many dimensions:
        <ul>
          <li>Buttcoin has got mindshare of BTC (and Fart and SPX imo). As long as BTC is alive and kicking, Buttcoin stays relevant.</li>
          <li>Butt while Buttcoin certainly acknowledges BTC's status as the crypto OG, it's also a parody and a critique of the big one: Buttcoin is anti-TradFi, it's got cypherpunk-elements, it's funny, it's normie-friendly, and it also makes fun of everything.</li>
          <li>Buttcoin is also its own unique thing. It's an original meme with its own style and its own history and lore (going back to 2013).</li>
          <li>Plus, it has been endlessly copied by others since its inception, copycats are legion, buttlieve me. And once again this only shows how fundamentally strong this meme really is.</li>
        </ul>
      </li>
      <li>Buttcoin is a <strong>BLUE CHIP MEME</strong> simply because we have the most ambitious mission: to flip the godfather of them all, that is BTC itself.
        <ul>
          <li>SPX6900 certainly has the highest internal memetic ceiling of all memes: their mission is to flip the stock market itself.</li>
          <li>Butt Buttcoin is not far behind: flipping BTC's market will be no picnic either, but that's what we have signed up for. So we might just as well get it done!</li>
        </ul>
      </li>
      <li>And Buttcoin is a <strong>BLUE CHIP MEME</strong> simply because of the people building and carrying it, every day. Because of us Buttcoiners who will not rest until the mission is done. Might take some time though, so you better start channeling your inner butts.</li>
      <li>And Buttcoin is a <strong>BLUE CHIP MEME</strong> simply because … I could go on forever, butt I think you get what I mean ;)</li>
    </ul>
    <p>So, to conclude: this has begun for me with a literal wake-up call, my friends. And that is what Buttcoin is to me — a chance to wake up &amp; finally get it all.</p>
    <p>So let's get it.</p>
    <p>To Uranus.</p>
    <p><em>Paronthes out.</em></p>
    <img src="assets/articles/blue-chip-3.jpg" style="width:100%;border-radius:8px;margin:16px 0" alt="">
    <p style="color:var(--muted);font-size:0.85rem;font-style:italic;margin-top:-8px">This is Buttcoin, a blue chip meme in the making. Its success is inevitable because it's the next BTC coded. This is not for the elites. It's the people's Bitcoin, no institutions, no central control. Only the steadfast belief that the most hilarious outcome is the most likely...</p>`
  },
};

function openArticle(id) {
  const content = ARTICLE_CONTENT[id];
  if (!content) return;
  const body = document.getElementById('article-modal-body');
  if (!body) return;
  body.innerHTML = `
    <span class="article-tag">${content.tag || ''}</span>
    <h2 style="margin: 12px 0 8px; font-size: 1.5rem; line-height: 1.3">${content.title}</h2>
    ${content.author ? `<p style="color: var(--muted); font-size: 0.85rem; font-style: italic; margin-bottom: 8px">by ${content.author}</p>` : ''}
    ${content.source ? `<p style="color: var(--purple); font-size: 0.8rem; margin-bottom: 16px">${content.source}</p>` : ''}
    <hr style="border-color: var(--border); margin-bottom: 24px">
    <div style="line-height: 1.8; color: var(--text)">${content.body}</div>
  `;
  openModal('article-modal');
}

// ─── MEDIA ─────────────────────────────────────
const MEDIA_ITEMS = [
  { type: 'video', title: 'Buttcoin Logo Animated',       src: 'assets/logo-animated.mp4',                    poster: 'assets/videos/thumbs/logo-animated.jpg' },
  { type: 'video', title: 'Buttcoin goes way back',       src: 'assets/videos/IMG_1373.MOV',                  poster: 'assets/videos/thumbs/IMG_1373.jpg' },
  { type: 'video', title: 'Back into the Buttverse',      src: 'assets/videos/buttverse version 2 FINAL.mp4', poster: 'assets/videos/thumbs/buttverse version 2 FINAL.jpg' },
  { type: 'video', title: 'DCA Buttcoin ftw',             src: 'assets/videos/IMG_1606.MP4',                  poster: 'assets/videos/thumbs/IMG_1606.jpg' },
  { type: 'video', title: 'Only Rotation That Makes Sense', src: 'assets/Only rotation that makes sense.mp4', poster: 'assets/videos/thumbs/Only rotation that makes sense.jpg' },
  { type: 'audio', title: 'Buttcoin Song', desc: 'Let\'s get this party started. First the moon, then Uranus!', src: 'assets/BUTTCOIN ANTHEM.mp3' },
  { type: 'video', title: 'Just Buttcoin and chill',                       src: 'assets/videos/Turtle final.mp4',              poster: 'assets/videos/thumbs/Turtle final.jpg' },
  { type: 'video', title: 'Uranus',                       src: 'assets/videos/uranus.mp4',                    poster: 'assets/videos/thumbs/uranus.jpg' },
  { type: 'video', title: 'Always follow Buttcoin',        src: 'assets/videos/butt girl 1 very nice.mp4',     poster: 'assets/videos/thumbs/butt girl 1 very nice.jpg' },
  { type: 'video', title: 'Diamond in the rough, ready to shine',               src: 'assets/videos/diamond 1 nice.mp4',            poster: 'assets/videos/thumbs/diamond 1 nice.jpg' },
  { type: 'video', title: 'There are levels to Buttcoining',              src: 'assets/videos/levels upscaled.mp4',           poster: 'assets/videos/thumbs/levels upscaled.jpg' },
  { type: 'video', title: 'Love Buttcoining',                     src: 'assets/videos/IMG_3912.MP4',                  poster: 'assets/videos/thumbs/IMG_3912.jpg' },
];

const MEDIA_PAGE_SIZE = 6;
let mediaPage = 0;

function renderMediaPage() {
  const grid = document.getElementById('media-grid');
  const pag  = document.getElementById('media-pagination');
  if (!grid) return;

  const start = mediaPage * MEDIA_PAGE_SIZE;
  const batch = MEDIA_ITEMS.slice(start, start + MEDIA_PAGE_SIZE);
  const totalPages = Math.ceil(MEDIA_ITEMS.length / MEDIA_PAGE_SIZE);

  grid.innerHTML = batch.map(item => {
    if (item.type === 'audio') {
      return `
        <div class="media-card media-anthem">
          <h3>${item.title}</h3>
          <p>${item.desc}</p>
          <audio controls class="anthem-player" src="${item.src}">
            Your browser does not support the audio element.
          </audio>
        </div>`;
    }
    return `
      <div class="media-card">
        <h3>${item.title}</h3>
        <video controls class="media-video" src="${item.src}" poster="${item.poster}">
          Your browser does not support video.
        </video>
      </div>`;
  }).join('');

  if (pag) {
    const nav = window.buildPageNav ? window.buildPageNav(mediaPage + 1, totalPages, 'jumpToMediaPage') : '';
    pag.innerHTML = totalPages <= 1 ? '' : `
      <button class="page-btn" onclick="jumpToMediaPage(${mediaPage - 1})" ${mediaPage === 0 ? 'disabled' : ''}>← Previous</button>
      <span class="page-info">Page ${mediaPage + 1} of ${totalPages}</span>
      <button class="page-btn" onclick="jumpToMediaPage(${mediaPage + 1})" ${mediaPage >= totalPages - 1 ? 'disabled' : ''}>Next →</button>
      ${nav}
    `;
  }
}

window.jumpToMediaPage = function(index) {
  const totalPages = Math.ceil(MEDIA_ITEMS.length / MEDIA_PAGE_SIZE);
  mediaPage = Math.max(0, Math.min(totalPages - 1, index));
  renderMediaPage();
  document.getElementById('media')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

document.addEventListener('DOMContentLoaded', renderMediaPage);

// ─── PRESENTATIONS ─────────────────────────────
const PRES_DATA = {
  legend: {
    title: "The Legend of Buttcoin",
    folder: "Legend of Buttcoin",
    count: 25,
    prefix: "Legend of Buttcoin (",
    suffix: ").png"
  },
  rules: {
    title: "21 Rules of Buttcoin — Michael J. Buttlor",
    folder: "Saylor 21 rules of BTC",
    count: 26
  },
  standard: {
    title: "The Buttcoin Standard",
    folder: "The Buttcoin Standard",
    isPDF: true,
    pdfPath: "assets/presentations/The Buttcoin Standard/The Buttcoin Standard.pdf"
  }
};

let currentSlide = 0;
let currentSlides = [];

function openPresentation(id) {
  const pres = PRES_DATA[id];
  if (!pres) return;

  if (pres.isPDF) {
    // Open PDF in new tab
    window.open(pres.pdfPath, '_blank');
    return;
  }

  currentSlide = 0;
  currentSlides = [];

  const slideshow = document.getElementById('slideshow');
  const counter = document.getElementById('slide-counter');
  if (!slideshow || !counter) return;

  if (id === 'legend') {
    for (let i = 1; i <= pres.count; i++) {
      currentSlides.push(`assets/presentations/The Legend of Buttcoin/Legend of Buttcoin (${i}).png`);
    }
  } else if (id === 'rules') {
    // Custom order: 00, 02, 03, 01 (golden "21" moved to slot 4), then 04–25
    currentSlides.push(`assets/presentations/Saylor 21 rules of BTC/00 25.webp`);
    currentSlides.push(`assets/presentations/Saylor 21 rules of BTC/02 25.jpg`);
    currentSlides.push(`assets/presentations/Saylor 21 rules of BTC/03 25.jpg`);
    currentSlides.push(`assets/presentations/Saylor 21 rules of BTC/01 25.png`);
    for (let i = 4; i <= 25; i++) {
      const num = String(i).padStart(2, '0');
      currentSlides.push(`assets/presentations/Saylor 21 rules of BTC/${num} 25.jpg`);
    }
  }

  renderSlide();
  openModal('presentation-modal');
}

function renderSlide() {
  const slideshow = document.getElementById('slideshow');
  const counter = document.getElementById('slide-counter');
  if (!slideshow || !currentSlides.length) return;
  slideshow.innerHTML = `<img src="${currentSlides[currentSlide]}" alt="Slide ${currentSlide + 1}" />`;
  counter.textContent = `${currentSlide + 1} / ${currentSlides.length}`;
  renderSlideNav();
}

// ─── PAGE NAV SHARED BUILDER ───────────────────
window.buildPageNav = function(current1, total, jumpFn) {
  if (total <= 1) return '';
  const pages = new Set([1, total]);
  for (let i = Math.max(1, current1 - 4); i <= Math.min(total, current1 + 4); i++) pages.add(i);
  const sorted = [...pages].sort((a, b) => a - b);
  let html = '<div class="page-nav">';
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) html += '<span class="page-ellipsis">…</span>';
    if (p === current1) {
      html += `<span class="page-num active">${p}</span>`;
    } else {
      html += `<button class="page-num" onclick="${jumpFn}(${p - 1})">${p}</button>`;
    }
    prev = p;
  }
  html += '</div>';
  return html;
};

function jumpToSlide(index) {
  currentSlide = index;
  renderSlide();
}

function renderSlideNav() {
  const nav = document.getElementById('slide-page-nav');
  if (!nav) return;
  nav.innerHTML = window.buildPageNav(currentSlide + 1, currentSlides.length, 'jumpToSlide');
}

function nextSlide() {
  if (currentSlide < currentSlides.length - 1) {
    currentSlide++;
    renderSlide();
  }
}

function prevSlide() {
  if (currentSlide > 0) {
    currentSlide--;
    renderSlide();
  }
}

// ─── MEME FILTER ──────────────────────────────
function filterMemes(category, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // This will be handled by memes.js
  if (window.loadMemes) window.loadMemes(category);
}

function loadMoreMemes() {
  if (window.loadNextPage) window.loadNextPage();
}

// ─── ESSAY ACCORDION ──────────────────────────
function toggleEssay(btn) {
  const item = btn.closest('.essay-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.essay-item.open').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ─── BUTTPOSTING TASKS ────────────────────────
function toggleTask(el) {
  el.classList.toggle('done');
  const numEl = el.querySelector('.bp-task-n');
  if (el.classList.contains('done')) {
    numEl.textContent = '✓';
  } else {
    const n = el.dataset.id.replace('t', '');
    numEl.textContent = n.padStart(2, '0');
  }
  saveTasks();
}

function saveTasks() {
  const done = [...document.querySelectorAll('.bp-task.done')].map(el => el.dataset.id);
  localStorage.setItem('bp_tasks', JSON.stringify(done));
}

function resetTasks() {
  localStorage.removeItem('bp_tasks');
  document.querySelectorAll('.bp-task.done').forEach(el => {
    el.classList.remove('done');
    const n = el.dataset.id.replace('t', '');
    el.querySelector('.bp-task-n').textContent = n.padStart(2, '0');
  });
}

function loadTasks() {
  const done = JSON.parse(localStorage.getItem('bp_tasks') || '[]');
  done.forEach(id => {
    const el = document.querySelector(`.bp-task[data-id="${id}"]`);
    if (el) {
      el.classList.add('done');
      el.querySelector('.bp-task-n').textContent = '✓';
    }
  });
}

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initQuote();
  loadTasks();
  // Rotate tagline every 4 seconds
  setInterval(rotateTagline, 4000);
  // Auto-advance quote every 30 seconds
  setInterval(nextQuote, 30000);
});
