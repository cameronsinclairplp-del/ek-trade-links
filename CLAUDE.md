# CLAUDE.md — ek-trade-links (read this first, then HANDOFF.md)

This repository is a static website of Path of Exile (PoE 1, league **Allflame**, patch 3.29) trade searches, an upgrade path,
map-rolling regexes and crafting walkthroughs for one character: Cameron's **Ethereal Knives (EK) herald-stacking
Chaos Inoculation (CI) Elementalist "Fornaxx"**. The spec is streamer fubgun's build in two Path of Building (PoB) files:
budget `t0ezm0qf` and mirror-tier `2peil0qa` (both on maxroll.gg/poe/pob/<id>). Cameron's current PoB id is in
`data.js` → `pob.now`.

`HANDOFF.md` (git-ignored — it lives in the project root on Cameron's PC, `C:\Projects\ek-trade-links\HANDOFF.md`) is the
full state document: what is done, what he owns, what the numbers are, what was tried and failed, how to deploy, how to work
with him. If you are in a fresh session, read it before touching anything. This file holds only what is always true.

## Invariants — do not break these
- **`data.js` is the only content file.** Facts, weights, searches, the Path, the Maps block, prices: all there. `app.js` is
  pure functions first (node-testable, exported at the bottom) then DOM; `index.html` is the shell; `src.css` compiles to
  `styles.css` with `npx @tailwindcss/cli -i src.css -o styles.css --minify` (rebuild after ANY class change in app.js).
- **Never invent a stat id, a node id, a price, a mod tier or a mechanic.** Every stat id in `data.js` came from the official
  trade stat list; every price is dated; every mechanic in a guide was checked against poedb / the wiki / fubgun's notes
  (`reference/fubgun-notes.md`, verbatim). If you cannot verify, say so on the page ("I have not tested this").
- **Trade links are `https://www.pathofexile.com/trade/search/<league>/<base64url(gzip(bare query JSON))>`.** No `?q=`.
  The hash carries the query, NOT a sort order — `{query, sort}` and `sort` inside the query both make the site say
  "search is no longer valid". Bulk exchange: same hash on `/trade/exchange/<league>/` with `{status, have, want}`.
- **CI build facts that change advice** (all read from his PoB, see HANDOFF for numbers): chaos immune, so chaos/poison/
  withered are free; 100% elemental-ailment avoidance comes from TWO abyss jewels with "50% chance to Avoid being Shocked"
  plus Stormshroud — never recommend removing either jewel without a replacement carrying the line; Supreme Ostentation
  (from his Elegant Hubris, seed 30180) = no attribute requirements at all; Dark Arts is a damage notable through that jewel
  (keep it); Zealot's Oath makes life regen apply to ES; EK costs ~130 mana/s against ~110/s regen on ~85 unreserved mana
  with no mana leech, so "cannot regenerate" is a brick; heralds are not auras.
- **Every rare search is a Weighted Sum v2** under hard locks (AND / count groups). Path of Building "Find best" links can be
  pasted per slot and replace the hand weights (`state.pob[wkey]`). Keep that shape when adding searches.
- **One meaning per badge colour**: green = have / yes / free to run, amber = craft / if cheap / danger, blue = option /
  watch, indigo = buy now, pink = variant locked / map reward, grey = skip / granted / only slower, red = never (map brick).
- **Formatting for Cameron**: Australian English, dates DD/MM/YYYY, 24-hour time, no emojis, bad news first, prices in
  chaos (c) and divines (div) with the date. Don't ask him about budget or which repo; don't re-ask settled questions.

## Commands
- `npm i` once (Playwright is a dev dependency; in Anthropic's sandbox the browser is at `/opt/pw-browsers`, and the scripts
  find it themselves — do not run `playwright install`).
- `npm test` — `scripts/test.js`: data shape, stat ids, query shapes, Path/Maps/guide checks, regex verification.
- `npm run qa` — `scripts/qa.mjs` (every tab × 320/393/768/1024/1440, axe WCAG 2.1 A/AA, overflow, console errors, touch
  targets) then `scripts/interact.mjs` (behavioural). `npm run check` = test + qa. All three must be green before a deploy.
- `node reference/pob-decode.js <maxroll id>` → `/tmp/pob.xml`; `node reference/pob-diff.js old.xml new.xml` to diff.

## Deploy
GitHub Pages serves `main` at https://cameronsinclairplp-del.github.io/ek-trade-links/. The sandbox has no git
credentials: commits are made through the GitHub web upload page in Cameron's own Chrome (recipe in HANDOFF.md).
Bump `?v=` on the three asset tags in `index.html` and `version` in `package.json` on every deploy — Pages caches assets for
ten minutes. After a deploy, `curl` + `cmp` each file against the local copy, then sync the local checkout.

## Layout
`index.html` · `app.js` · `data.js` · `src.css` / `styles.css` · `stat-labels.json` (trade stat id → text, lazy-loaded) ·
`scripts/{test.js,qa.mjs,interact.mjs}` · `reference/` (fubgun's notes verbatim, decoded PoB item dumps `pob-items.md`, raw
PoB XML for every PoB seen, `pob-decode.js`, `pob-diff.js`, `map-mods.md` + `poere-map-mods.json` for the Maps tab) ·
`HANDOFF.md` (local only) · `_qa/` screenshots (ignored).
