# EK Elementalist · Trade Links

Budget-aware Path of Exile trade links for an Ethereal Knives herald-stacking CI Elementalist (Fornaxx, Allflame), walking the character to fubgun's two PoBs: **budget** ([t0ezm0qf](https://maxroll.gg/poe/pob/t0ezm0qf)) and **mirror** ([2peil0qa](https://maxroll.gg/poe/pob/2peil0qa)). Phase toggle switches the spec; starting point is [dqeik0qu](https://maxroll.gg/poe/pob/dqeik0qu).

Per slot: what you have vs. fubgun's target, a **Weighted Sum v2** rare search with the hard filters that make the item, craft-start searches for the fractured bases he builds on, and unique searches with the variant locked (Vile Bastion Forbidden pair, 1-passive Voices, Foulborn Unnatural Instinct, Haste Sublime Vision, Elegant Hubris seed). The Gems tab lays out every link by gear piece with a verdict on 20% quality, level 21 and 23%, and what the PoB already owns. The Buy list ranks everything by what it does per divine, with live prices from the trade site.

**Live:** https://cameronsinclairplp-del.github.io/ek-trade-links/

## Files
- `index.html` — markup (Tailwind Plus dark sidebar shell, trimmed; no JS library)
- `app.js` — link builders + UI. Pure functions first (node-testable), DOM last
- `data.js` — the only file you normally edit: stat IDs, bases, per-slot weights and hard filters, craft-start searches, uniques + rolls, cluster specs, gems, setups, buy list
- `src.css` / `styles.css` — Tailwind v4 source (design tokens + component classes) and its compiled output (`npm i && npm run css`)
- `scripts/test.js` — data + query sanity checks (`npm test`)
- `scripts/qa.mjs` — renders every tab at 320/393/768/1024/1440, runs axe-core WCAG 2.1 A/AA, checks overflow, console errors, unhydrated links, touch targets (`npm run qa`)
- `scripts/interact.mjs` — behavioural checks: keyboard path, navigation, phase toggle, weight editing, hover without layout shift, reduced motion
- `reference/` — fubgun's craft notes (verbatim), the decoded item dumps of all three PoBs, the raw PoB XML, the decode script

## Design
Dark-only luminance system (near-black canvas, three lifted surfaces, four text tiers, one indigo accent); one meaning per badge colour (green = have / yes, amber = craft / if cheap, blue = option, indigo = buy now, pink = variant locked); every control 40px tall on desktop and 44px on phones; Inter with `cv01/ss03`, tabular numbers on prices and levels. axe clean at five widths, zero console errors, reduced motion respected.

## Known limits
- Trade links are the 3.29 format: `/trade/search/<league>/<base64url(gzip(query))>`, built in the browser with `CompressionStream` (the old `?q=` links no longer load). The hash carries the query but not a sort order, so searches open cheapest-first — click **Sum:** on any result to flip to best-first.
- Awakened-gem searches: Awakened Enlighten/Enhance 5 listed fine on 05/09; the 03/09 zero-result issue on the Deadeye page was the old link format.

## Sources
Stat IDs: official trade stat list (awakened-poe-trade mirror), spot-checked live on pathofexile.com/trade 05/09/2026 · rolls, base stats and gem numbers: poedb.tw (3.29) · spec: fubgun's PoB notes.
