# CLAUDE.md — Buttcoin Website

## Project
Full-featured website for Buttcoin ($BUTTCOIN), a community-owned memecoin on Solana.
Domain: buttcoin.meme | Hosted: Vercel | Code: GitHub (helgobert8-sketch)

## Stack
- Vanilla HTML/CSS/JavaScript — no build step, no npm
- Firebase (Auth + Firestore + Storage) for user accounts, meme uploads, role management
- DexScreener API for live price data
- CoinGecko API for Buttcoin Dominance metric

## File Structure
```
index.html          — Single-page app (all sections)
css/style.css       — All styles (dark theme, orange/purple accents)
js/app.js           — Quotes, tagline rotator, nav, FAQ, modals, articles
js/price.js         — Live price + market data (DexScreener + CoinGecko)
js/laser.js         — Laser eye maker (Canvas API — click to place, download)
js/memes.js         — Meme depot gallery, upload handler, randomizer
js/firebase.js      — Firebase init, auth, Firestore, Storage, role management
llms.txt            — AI-readable coin facts
tokenomics.json     — Machine-readable tokenomics
assets/             — Logo, anthem, videos, character images, memes
```

## Key Constants
- Contract Address: `FasH397CeZLNYWkd3wWK9vrmjd1z93n3b59DssRXpump`
- DEX Pair: `63amwndbz75z2j7jYKdBZXvzt36L9QdGW7czAXbD4kNe`
- Firebase Project ID: `butttcoin-fbe0f`

## User Roles (Firebase)
Stored in Firestore `users/{uid}.role`:
- `admin`     — full access: content, meme management, user roles
- `moderator` — can upload + approve/reject meme submissions
- `user`      — can submit memes (pending review)
- (no account) — public visitor, read-only

## Sections
1. Hero — logo, tagline rotator, live price, CA copy button, CTAs
2. About — lore, James McMurray YouTube video, pizza day
3. Buttcoin Dominance — BUTTCOIN.D live metric vs BTC
4. How to Buy — 3-step guide (Phantom → SOL → Jupiter)
5. Quote of the Day — rotating from quotes library in app.js
6. Meme Depot — gallery (Firebase) + public upload + Phase 3 link
7. Laser Maker — Canvas tool: upload image, click to add purple laser eyes
8. Meme Randomizer — Canvas: random tagline/quote + optional characters
9. Articles — 5+ articles with modal reader
10. Presentations — Legend of Buttcoin, Buttcoin Standard, 21 Rules of Buttlor
11. Media — Anthem (MP3) + video gallery
12. Game — Pac-man teaser, Coming Soon
13. Community — links to X, Telegram, Buttcoiners, DexScreener, Meme Depot
14. FAQ — accordion

## AI-Readability Features
- `llms.txt` — plain text summary for AI agents
- `tokenomics.json` — machine-readable token facts
- JSON-LD structured data in `<head>` (Organization + FinancialProduct schemas)
- Semantic HTML with proper heading hierarchy
- OpenGraph + Twitter Card meta tags

## Design Tokens
- Background: #0d0d0d
- Cards: #161616 / #1e1e1e
- Orange (primary): #f7931a
- Purple (laser/accent): #a855f7
- Font: Ubuntu (Bold Italic for headings)

## TODO (after Firebase setup)
- [ ] Enable Authentication in Firebase console (Google + Email/Password)
- [ ] Enable Firestore in Firebase console
- [ ] Enable Storage in Firebase console
- [ ] Set Firestore security rules
- [ ] Copy presentation slide images to assets/presentations/
- [ ] Copy character images to assets/characters/
- [ ] Copy media files (anthem, videos) to assets/
- [ ] Copy meme images to Firebase Storage (or assets/memes/ for local)
- [ ] Set up Vercel deployment
- [ ] Connect buttcoin.meme domain in Cloudflare + Vercel
