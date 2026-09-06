# EK Elementalist · Trade Links

Budget-aware Path of Exile trade links for an Ethereal Knives herald-stacking CI Elementalist (Fornaxx, Allflame), walking the character to fubgun's two PoBs: **budget** ([t0ezm0qf](https://maxroll.gg/poe/pob/t0ezm0qf)) and **mirror** ([2peil0qa](https://maxroll.gg/poe/pob/2peil0qa)). Phase toggle switches the spec; the character is [7wsk40qv](https://maxroll.gg/poe/pob/7wsk40qv) (L98, 06/09; glis80qp on 05/09, the 03/09 starting point was [dqeik0qu](https://maxroll.gg/poe/pob/dqeik0qu)).

**Path** tab: the upgrade sequence, item by item, in buying order — for each step what to buy or do, why it works on this build (the mod mechanics), how (buy or fubgun's craft recipe), what it costs elsewhere (resists, attribute floors, ailment immunity), and what done looks like; a tick per step saved in the browser, a PoB numbers table next to fubgun's, an explainer of the damage and defence chains, and a glossary. Tattoos (17× Arohongui Shaman on fubgun's tree) and the two 50%-avoid-shock abyss jewels that carry the ailment immunity are called out because a plain item diff misses both.

**Crafting walkthroughs** live on the Path steps that need them (gloves first): verdict against the buy price, live price list, numbered steps with what to do / what to do if it misses / why, traps, and the exact searches for each input (white base, clean donor, fractured base). The gloves route is fubgun's — recombinator transfer with the essence trick, Fracturing Orb, Hollow/Sanctified/Prismatic fossils, the Exarch prefix loop, veiled conversion, bench herald craft — checked against the recombination rules and the currency descriptions, priced 06/09/2026.

**Maps** tab: four map-rolling regexes in poe.re's format (T16 Safe / Loose, Nightmare / 16.5 Safe / Loose), each a never-list for this character — bricks (thorns, no regen, minus max res, the nightmare pool's killers) plus, in Safe, everything that turns an ordinary hit into a spike on 4.7k ES; a copy button, the exact lines each one bans, rough pass rates; 8-mod buy links (Nightmare 70%+ More Maps, T16 corrupted) that carry the same ban list as a trade `not` group; and every line that can roll in either pool, tiered Brick / Danger / Watch / Slower / Free with the build-specific reason. Nightmare maps roll both pools (checked on live listings), so the nightmare regexes and links cover both.

Per slot: what you have vs. fubgun's target, a **Weighted Sum v2** rare search with the hard filters that make the item, craft-start searches for the fractured bases he builds on (every one of them is the locks — AND / count groups — plus the slot's weighted sum, so the trade site can rank by **Sum**), and unique searches with the variant locked (Vile Bastion Forbidden pair, 1-passive Voices, Foulborn Unnatural Instinct, Haste Sublime Vision, Elegant Hubris seed). The Gems tab lays out every link by gear piece with a verdict on 20% quality, level 21 and 23%, and what the PoB already owns. The Buy list ranks everything by what it does per divine, with live prices from the trade site.

**Live:** https://cameronsinclairplp-del.github.io/ek-trade-links/

## Files
- `index.html` — markup (Tailwind Plus dark sidebar shell, trimmed; no JS library)
- `app.js` — link builders + UI. Pure functions first (node-testable), DOM last
- `data.js` — the only file you normally edit: stat IDs, bases, per-slot weights and hard filters, craft-start searches, uniques + rolls, cluster specs, gems, setups, buy list, the Path (stages → steps), the Maps block (mods with tiers, regex profiles, buy links)
- `src.css` / `styles.css` — Tailwind v4 source (design tokens + component classes) and its compiled output (`npm i && npm run css`)
- `stat-labels.json` — trade stat id → text (from the awakened-poe-trade stats mirror), lazy-loaded to label pasted PoB weights
- `scripts/test.js` — data + query sanity checks (`npm test`)
- `scripts/qa.mjs` — renders every tab at 320/393/768/1024/1440, runs axe-core WCAG 2.1 A/AA, checks overflow, console errors, unhydrated links, touch targets (`npm run qa`)
- `scripts/interact.mjs` — behavioural checks: keyboard path, navigation, phase toggle, weight editing, hover without layout shift, the Path (default landing, tick persistence, jump), PoB weight import, the Maps tab (copy, tier filter, ban lists in the buy links), reduced motion
- `reference/` — fubgun's craft notes (verbatim), the decoded item dumps, the raw PoB XML (dqeik0qu, ipgiz0qx, glis80qp, 7wsk40qv, t0ezm0qf, 2peil0qa), the decode script, poe.re's map-mod data (`poere-map-mods.json`) and the map tiering notes (`map-mods.md`)

## Design
Dark-only luminance system (near-black canvas, three lifted surfaces, four text tiers, one indigo accent); one meaning per badge colour (green = have / yes / free to run, amber = craft / if cheap / danger, blue = option / watch, indigo = buy now, pink = variant locked / map reward, red = never); every control 40px tall on desktop and 44px on phones; Inter with `cv01/ss03`, tabular numbers on prices and levels. axe clean at five widths, zero console errors, reduced motion respected.

## Known limits
- Trade links are the 3.29 format: `/trade/search/<league>/<base64url(gzip(query))>`, built in the browser with `CompressionStream` (the old `?q=` links no longer load). The hash carries the query but not a sort order, so searches open cheapest-first — click **Sum:** on any result to flip to best-first.
- Awakened-gem searches: Awakened Enlighten/Enhance 5 listed fine on 05/09; the 03/09 zero-result issue on the Deadeye page was the old link format.
- **Weights from Path of Building**: on any slot card, paste the trade link PoB's Trader makes with *Find best* for that slot. The site decodes it, keeps PoB's weight group (each mod's value to your character, on PoB's scale, plus PoB's floor = the score of what you wear) and puts fubgun's locks, base and price cap on top. Every search on that slot — the weighted card, the craft starts, the Buy list and Path links — then uses PoB's numbers. Saved per browser; switch back to the hand weights or forget it any time.
- Bulk-exchange links (tattoos) use the same hash on `/trade/exchange/<league>/` with a bare `{status, have, want}`; the exchange only knows online / any, so 'Buyout only' maps to online.
- PoB numbers on the Path are PoB-with-config on both sides, dated; they are not in-game measurements. Gem attribute floors are from poedb (3.29).
- Crafting guides quote fubgun's notes for the parts that depend on 3.29 Allflame crafting aboard The Sovereign (the 'allflame fracture', 'veiled exalt with allflame') — those were not tested here and are marked as such on the page.
- Map regexes: the strings are poe.re's own output for the four ban lists (saved as profiles in Cameron's poe.re), verified in `scripts/test.js` against every English line in the pool at both ends of each roll range. Pass rates are equal-weight estimates for a 3-prefix / 3-suffix rare, not measured. The game prints the nightmare triple-curse as three plain curse lines, so the Nightmare Loose regex and link also skip plain Vulnerability maps. Four nightmare lines have no English entry in poe.re's data (all harmless here) and so no token.

## Sources
Stat IDs: official trade stat list (awakened-poe-trade mirror), spot-checked live on pathofexile.com/trade 05/09/2026 · map stat ids from the live stat list 06/09/2026 · map mod pools: poe.re/maps (06/09/2026) · rolls, base stats and gem numbers: poedb.tw (3.29) · spec: fubgun's PoB notes.
