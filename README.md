# EK Elementalist · Trade Links

Budget-aware Path of Exile trade links for an Ethereal Knives herald-stacking CI Elementalist (Fornaxx, Allflame), walking the character to fubgun's two PoBs: **budget** ([t0ezm0qf](https://maxroll.gg/poe/pob/t0ezm0qf)) and **mirror** ([2peil0qa](https://maxroll.gg/poe/pob/2peil0qa)). Phase toggle switches the spec; starting point is [dqeik0qu](https://maxroll.gg/poe/pob/dqeik0qu).

Per slot: what you have vs. fubgun's target, a **Weighted Sum v2** rare search with the hard filters that make the item, craft-start searches for the fractured bases he builds on, and unique searches with the variant locked (Vile Bastion Forbidden pair, 1-passive Voices, Foulborn Unnatural Instinct, Haste Sublime Vision, Elegant Hubris seed). The Gems tab lays out every link by gear piece with a verdict on 20% quality, level 21 and 23%, and what the PoB already owns. The Buy list ranks everything by what it does per divine, with live prices from the trade site.

**Live:** https://cameronsinclairplp-del.github.io/ek-trade-links/

## Files
- `index.html` — markup (Tailwind Plus dark sidebar shell, trimmed; no JS library)
- `app.js` — link builders + UI. Pure functions first (node-testable), DOM last
- `data.js` — the only file you normally edit: stat IDs, bases, per-slot weights and hard filters, craft-start searches, uniques + rolls, cluster specs, gems, setups, buy list
- `styles.css` — compiled Tailwind v4 (`npm i && npx @tailwindcss/cli -i src.css -o styles.css --minify`)
- `scripts/test.js` — sanity checks (`node scripts/test.js`)
- `reference/` — fubgun's craft notes (verbatim), the decoded item dumps of all three PoBs, the raw PoB XML, the decode script

## Known limits
- The trade site ignores `sort` in `?q=` links, so searches open cheapest-first. Click **Sum:** on any result to flip to best-first.
- Awakened-gem searches returned 0 listings at every status on 03/09 (unresolved).

## Sources
Stat IDs: official trade stat list (awakened-poe-trade mirror), spot-checked live on pathofexile.com/trade 05/09/2026 · rolls, base stats and gem numbers: poedb.tw (3.29) · spec: fubgun's PoB notes.
