// EK Elementalist Trade Links — logic. Pure functions first (node-testable), DOM last.
const D = typeof DATA !== "undefined" ? DATA : require("./data.js");
const S = D.S;

// ---------- state ----------
const DEFAULTS = {
  level: 96, budget: 100, unit: "div", divC: D.divineChaos, league: D.league, status: "securable",
  rollQ: 0.85, corrupted: "any", slot: "shop", minSum: 0, base: "auto", links: "auto", msMin: "auto",
  weights: {}, phase: "budget", setup: "budget",
};
const LS = {
  get(k, f) { try { const v = localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
let state = Object.assign({}, DEFAULTS, typeof localStorage !== "undefined" ? LS.get("ek-state", {}) : {});
function save() { LS.set("ek-state", state); }

// ---------- helpers ----------
const slotByKey = k => D.slots.find(s => s.key === k);
const budgetChaos = st => Math.max(1, Math.round(st.unit === "div" ? st.budget * st.divC : st.budget));
const fmtC = n => n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(Math.round(n));
function fmtBudget(st) {
  const c = budgetChaos(st);
  return st.unit === "div" ? `${st.budget} div (≈${fmtC(c)}c)` : `${c}c` + (c >= st.divC ? ` (≈${(c / st.divC).toFixed(1)} div)` : "");
}
const isMirror = st => st.phase === "mirror";

// The base I'd buy at this level, and the next one to look forward to.
function basePick(slotKey, level) {
  const list = D.bases[slotKey] || [];
  const picks = list.filter(b => b.pick);
  const now = [...picks].reverse().find(b => b.level <= level) || [...list].reverse().find(b => b.level <= level) || list[0];
  const next = picks.find(b => b.level > level) || null;
  return { now, next, all: list };
}

// What a slot looks like in the current phase (budget data, or the mirror overlay).
function view(slot, st) {
  const e = isMirror(st) && slot.eg ? slot.eg : null;
  return {
    end: !!e,
    blurb: (e && e.blurb) || slot.blurb,
    w: (e && e.w) || (slot.rare ? slot.rare.w : null),
    must: (e && e.must) || (slot.rare && slot.rare.must) || [],
    mustAny: (e && e.mustAny) || (slot.rare && slot.rare.mustAny) || [],
    abyssW: (e && e.abyss) || (slot.abyss ? slot.abyss.w : null),
    uniques: e ? (e.uniques || []) : (slot.uniques || []),
    base: (e && e.base) || null,
    cluster: !!(slot.clusters && slot.clusters.length),
    note: e && e.note,
    extra: (e && e.extra) || (slot.rare && slot.rare.extra) || [],
  };
}
const wkey = (slot, st, group) => slot.key + (group ? ":" + group : "") + (isMirror(st) && slot.eg ? ":mirror" : "");

// Effective weights for a slot (user overrides win).
function weightsFor(slot, st, group) {
  const v = view(slot, st);
  const src = group === "abyss" ? v.abyssW : v.w;
  const ov = (st.weights && st.weights[wkey(slot, st, group)]) || {};
  return (src || []).map(([k, w]) => [k, ov[k] != null ? Number(ov[k]) : w]).filter(([, w]) => w > 0);
}

// Highest movement-speed tier you can realistically equip at this level.
function msFloor(st) {
  if (st.msMin !== "auto" && st.msMin !== "" && st.msMin != null) return Number(st.msMin) || 0;
  const L = Number(st.level);
  return L >= 70 ? 30 : L >= 44 ? 25 : L >= 24 ? 20 : L >= 12 ? 15 : 10;
}

// Rough weighted-sum floor per slot — a starting point, not gospel.
const FLOOR = { staff: 250, helmet: 180, body: 250, gloves: 250, boots: 200, amulet: 200, jewel: 40 };
function autoFloor(slot, st, group) {
  if (group === "abyss" || slot.key === "jewel") return 40;
  return FLOOR[slot.key] || 100;
}

// Trade links. Since 3.29 the trade site takes the query as gzip + base64url in the path: /trade/search/<league>/<hash>
// (the old ?q= form now fails with "search is no longer valid"; verified live 05/09/2026). No JS library: node uses zlib,
// the browser uses CompressionStream and fills hrefs in right after render (see hydrateLinks). `sort` is not part of the hash.
const TRADE = league => `https://www.pathofexile.com/trade/search/${encodeURIComponent(league)}/`;
const b64url = bytes => { let s = ""; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return (typeof btoa === "function" ? btoa(s) : Buffer.from(bytes).toString("base64")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
function hashQuerySync(q) { const zlib = require("zlib"); return b64url(zlib.gzipSync(Buffer.from(JSON.stringify(q)))); }
async function hashQuery(q) {
  const cs = new CompressionStream("gzip"); const w = cs.writable.getWriter();
  w.write(new TextEncoder().encode(JSON.stringify(q))); w.close();
  return b64url(new Uint8Array(await new Response(cs.readable).arrayBuffer()));
}
// In node the URL is final; in the browser it is a "poe:" placeholder that hydrateLinks() turns into the real link.
// Accepts either a bare query or the {query, sort} pair the builders return; only the query goes into the hash.
const url = (st, r) => { const q = r && r.query ? r.query : r; return typeof document === "undefined" ? TRADE(st.league) + hashQuerySync(q) : "poe:" + encodeURIComponent(st.league) + "/" + JSON.stringify(q); };
const realUrl = async ph => { const i = ph.indexOf("/"); const league = ph.slice(4, i); const q = JSON.parse(ph.slice(i + 1)); return `https://www.pathofexile.com/trade/search/${league}/` + await hashQuery(q); };

function baseFilters(st, q) {
  q.filters = q.filters || {};
  q.filters.trade_filters = { filters: { price: { max: budgetChaos(st) } } };
  if (st.corrupted === "no") q.filters.misc_filters = Object.assign({}, q.filters.misc_filters, { filters: Object.assign({}, q.filters.misc_filters && q.filters.misc_filters.filters, { corrupted: { option: "false" } }) });
  return q;
}
// value for a stat filter: option stats use {option}, flag stats (no number) get no value, everything else {min}
const statValue = (k, min) => S[k].option != null ? { option: S[k].option } : S[k].flag ? undefined : { min };
const statFilter = (k, min) => { const v = statValue(k, min); return v ? { id: S[k].id, value: v } : { id: S[k].id }; };

// Rare weighted-sum search for a slot.
function rareQuery(slot, st, group) {
  const cat = group === "abyss" ? slot.abyss.cat : slot.cat;
  const w = weightsFor(slot, st, group);
  const q = { status: { option: st.status }, stats: [], filters: {} };
  q.stats.push({ type: "weight2", value: { min: Math.max(1, Number(st.minSum) || 1) },
    filters: w.map(([k, wt]) => S[k].option != null ? { id: S[k].id, value: { option: S[k].option, weight: wt } } : { id: S[k].id, value: { weight: wt } }) });
  const v = view(slot, st);
  const msOv = st.msMin !== "auto" && st.msMin !== "" && st.msMin != null ? Number(st.msMin) || 0 : null;
  const must = (group ? [] : v.must).map(([k, min]) => [k, k === "moveSpeed" && msOv != null ? msOv : min]);
  if (must.length) q.stats.push({ type: "and", filters: must.map(([k, min]) => statFilter(k, min)) });
  for (const [keys, min] of (group ? [] : v.mustAny)) q.stats.push({ type: "count", value: { min: 1 }, filters: keys.map(k => statFilter(k, min)) });
  q.filters.type_filters = { filters: { category: { option: cat }, rarity: { option: "nonunique" } } };
  q.filters.req_filters = { filters: { lvl: { max: Number(st.level) } } };
  if (!group && st.base && st.base !== "auto" && st.base !== "any") q.type = st.base;
  else if (!group && v.end && v.base && st.base === "auto") q.type = v.base;
  if (slot.rare && slot.rare.links) {
    const raw = st.links === "auto" && slot.rare.linksDefault != null ? slot.rare.linksDefault : st.links;
    const L = raw === "auto" ? 6 : Number(raw);
    if (L) q.filters.socket_filters = { filters: { links: { min: L } } };
  }
  baseFilters(st, q);
  return { query: q, sort: { "statgroup.0": "desc" } };
}
const rareUrl = (slot, st, group) => url(st, rareQuery(slot, st, group));

// Raw pre-built search (fractured bases, craft starting points). Status + price cap are injected.
function rawQuery(spec, st) {
  const q = JSON.parse(JSON.stringify(spec));
  q.status = { option: st.status };
  q.stats = q.stats || [];
  baseFilters(st, q);
  return { query: q, sort: { price: "asc" } };
}
const rawUrl = (spec, st) => url(st, rawQuery(spec, st));

// Cluster jewel search. spec: { type, small (S key with option), passives [min,max], sockets, notables [S keys], also [S keys] }
function clusterQuery(spec, st) {
  const f = [{ id: S[spec.small].id, value: { option: S[spec.small].option } }];
  if (spec.passives) f.push({ id: S.clusterPassives.id, value: { min: spec.passives[0], max: spec.passives[1] } });
  if (spec.sockets) f.push({ id: S.clusterSockets.id, value: { min: spec.sockets } });
  for (const k of (spec.notables || [])) f.push({ id: S[k].id });
  for (const k of (spec.also || [])) f.push({ id: S[k].id, value: { min: 1 } });
  const q = { status: { option: st.status }, type: spec.type, stats: [{ type: "and", filters: f }], filters: { misc_filters: { filters: { ilvl: { min: 75 } } } } };
  baseFilters(st, q);
  return { query: q, sort: { price: "asc" } };
}
const clusterUrl = (spec, st) => url(st, clusterQuery(spec, st));

// Unique search. top=true asks for rolls at lo + q*(hi-lo); required rolls are always applied (option stats as options).
function uniqueQuery(u, st, top) {
  const q = { status: { option: st.status }, name: u.name, stats: [{ type: "and", filters: [] }], filters: {} };
  const req = new Set(u.required || []);
  for (const r of (u.rolls || [])) {
    if (!top && !req.has(r.s)) continue;
    if (S[r.s].option != null) { q.stats[0].filters.push({ id: S[r.s].id, value: { option: S[r.s].option } }); continue; }
    if (r.lo === 0 && r.hi === 0) { q.stats[0].filters.push({ id: S[r.s].id }); continue; }
    const t = r.lo + (top ? st.rollQ : 0) * (r.hi - r.lo);
    const v = r.hi < r.lo ? { max: Math.ceil(t) } : { min: Math.floor(t) };
    if (req.has(r.s)) { v.min = r.lo; delete v.max; if (r.hi < r.lo) { v.max = r.lo; } if (r.lo === r.hi) v.max = r.hi; }
    q.stats[0].filters.push({ id: S[r.s].id, value: v });
  }
  if (u.links6) q.filters.socket_filters = { filters: { links: { min: 6 } } };
  baseFilters(st, q);
  return { query: q, sort: { price: "asc" } };
}
const uniqueUrl = (u, st, top) => url(st, uniqueQuery(u, st, top));

function flaskQuery(f, st) {
  const q = { status: { option: st.status }, type: f.type, stats: [{ type: "and", filters: [] }], filters: {} };
  q.filters.type_filters = { filters: { rarity: { option: "nonunique" } } };
  q.filters.req_filters = { filters: { lvl: { max: Number(st.level) } } };
  baseFilters(st, q);
  return { query: q, sort: { price: "asc" } };
}
const flaskUrl = (f, st) => url(st, flaskQuery(f, st));

// Gem search. spec: { type, lvlMin, lvlMax, qMin, reqMax, corrupted } — corrupted setting deliberately NOT applied (21/23 need corruption).
function gemQuery(spec, st) {
  const q = { status: { option: st.status }, type: spec.type, stats: [{ type: "and", filters: [] }], filters: {} };
  const mf = {};
  if (spec.lvlMin) mf.gem_level = Object.assign({}, mf.gem_level, { min: spec.lvlMin });
  if (spec.lvlMax) mf.gem_level = Object.assign({}, mf.gem_level, { max: spec.lvlMax });
  if (spec.qMin) mf.quality = { min: spec.qMin };
  if (Object.keys(mf).length) q.filters.misc_filters = { filters: mf };
  if (spec.reqMax) q.filters.req_filters = { filters: { lvl: { max: spec.reqMax } } };
  q.filters.trade_filters = { filters: { price: { max: budgetChaos(st) } } };
  return { query: q, sort: { price: "asc" } };
}
const gemUrl = (spec, st) => url(st, gemQuery(spec, st));

// Which gem links are worth showing. Returns [{label, spec, tier}]; tier: now | later (buy + hold) | rich.
function gemLinks(g, st) {
  const L = [];
  const q = g.qWorth !== "no";
  const req = g.req20 || 70;
  const T = g.tradeType || g.name;
  if (g.granted) return [];
  if (g.unverified) return [{ label: "any", spec: { type: T }, tier: "now" }];
  if (g.awakenedGem) {
    L.push({ label: `level ${g.maxLevel + 1} (corrupted)`, spec: { type: T, lvlMin: g.maxLevel + 1 }, tier: "rich" });
    L.push({ label: `level ${g.maxLevel}`, spec: { type: T, lvlMin: g.maxLevel }, tier: "rich" });
    return L;
  }
  if (g.awakenedLike) {
    if (!g.have) L.push({ label: `level ${g.maxLevel}`, spec: { type: T, lvlMin: g.maxLevel }, tier: "now" });
    L.push({ label: `level ${g.maxLevel + 1} (corrupted)`, spec: { type: T, lvlMin: g.maxLevel + 1 }, tier: g.have ? "rich" : "rich" });
    if (q) L.push({ label: `level ${g.maxLevel}+, 20%`, spec: { type: T, lvlMin: g.maxLevel, qMin: 20 }, tier: "rich" });
    return L;
  }
  if (g.enlighten) {
    L.push({ label: "Enlighten 4", spec: { type: g.name, lvlMin: 4 }, tier: "now" });
    return L;
  }
  if (q) L.push({ label: "20/20", spec: { type: T, lvlMin: 20, qMin: 20 }, tier: "now" });
  if (g.l21 !== "no") L.push({ label: q ? "21/20" : "21 (any quality)", spec: { type: T, lvlMin: 21, qMin: q ? 20 : 0 }, tier: g.l21 === "yes" ? "now" : "rich" });
  if (g.q23 !== "no") L.push({ label: g.l21 !== "no" ? "21/23" : "20/23", spec: { type: T, lvlMin: g.l21 !== "no" ? 21 : 20, qMin: 23 }, tier: "rich" });
  for (const l of L) {
    const need = l.hold || (l.spec.lvlMin >= 20 ? req : 0);
    if (need && st.level < need) { l.label += ` · hold till ${need}`; if (l.tier === "now") l.tier = "later"; }
  }
  return L;
}

// Roll text for the "top rolls" button: "block ≥ 11 · spell block ≥ 5"
function rollText(u, st) {
  return (u.rolls || []).filter(r => S[r.s].option == null && !(r.lo === 0 && r.hi === 0)).map(r => {
    const t = r.lo + st.rollQ * (r.hi - r.lo);
    let short = S[r.s].label.replace(/^\+?#?%? ?(to |increased )?/, "").replace(/ \((armour|jewellery \/ jewel|fractured|crafted|alt id|Rumi's|Lost Unity|Headhunter|Elegant Hubris seed|Voices|Foulborn UI|Sublime Vision.*?|flask)\)/g, "").replace(/^# to # /, "");
    if (S[r.s].avg) short += " (avg)";
    if (r.lo === r.hi) return `${short} = ${r.lo}`;
    return r.hi < r.lo ? `${short} ≤ ${Math.ceil(t)}` : `${short} ≥ ${Math.floor(t)}`;
  }).join(" · ");
}

// Loadout strip: per gear slot, fubgun's target for the phase and where Cameron stands.
function loadout(st) {
  const ph = isMirror(st) ? "mirror" : "budget";
  return D.slots.filter(s => s.target).map(s => ({ slot: s, target: s.target[ph], status: (s.status && s.status[ph]) || "buy", now: s.now }));
}

// Shop links → URL
function shopUrl(item, st) {
  const l = item.link || {};
  const st2 = Object.assign({}, st, l.phase ? { phase: l.phase } : {}, l.budget != null ? { budget: l.budget, unit: "div" } : {});
  if (l.unique) {
    const slot = D.slots.find(x => x.key === l.slot);
    const pick = list => (list || []).find(x => x.name === l.unique);
    const u = (slot && ((l.phase === "mirror" && slot.eg && pick(slot.eg.uniques)) || pick(slot.uniques) || (slot.eg && pick(slot.eg.uniques)))) || { name: l.unique, rolls: [] };
    return uniqueUrl(u, st2, !l.any && !!(u.rolls && u.rolls.length));
  }
  if (l.rare) { const slot = D.slots.find(x => x.key === l.rare); return rareUrl(slot, Object.assign({}, st2, { base: "auto", minSum: st2.minSum || 0 })); }
  if (l.raw) return rawUrl(l.raw, st2);
  if (l.extra) { const slot = D.slots.find(x => x.key === l.extra[0]); const ex = (slot.rare.extra || [])[l.extra[1]]; return ex ? rawUrl(ex.query, st2) : null; }
  if (l.cluster) { const slot = D.slots.find(x => x.key === "jewel"); const c = slot.clusters[l.cluster]; return c ? clusterUrl(c, st2) : null; }
  if (l.gem) return gemUrl(l.gem, st2);
  return null;
}

if (typeof module !== "undefined") module.exports = { rareQuery, rawQuery, uniqueQuery, flaskQuery, gemQuery, gemLinks, clusterQuery, shopUrl, rareUrl, uniqueUrl, hashQuerySync, view, basePick, weightsFor, budgetChaos, loadout, rollText, msFloor, autoFloor, DEFAULTS };

// ---------- DOM ----------
if (typeof document !== "undefined") {
  const $ = id => document.getElementById(id);
  const h = (t, c, html) => { const e = document.createElement(t); if (c) e.className = c; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

  const ICONS = {
    staff: "M12 21V6M9 3l3 3 3-3M9 21h6",
    helmet: "M4 14a8 8 0 0 1 16 0v3H4v-3ZM8 17v3M16 17v3",
    body: "M8 3 4 6l2 5v10h12V11l2-5-4-3-2 3H10L8 3Z",
    gloves: "M7 21V9a2 2 0 0 1 4 0v5M11 14V6a2 2 0 0 1 4 0v8M15 14V8a2 2 0 0 1 4 0v6a7 7 0 0 1-7 7H7",
    boots: "M6 3v10l-3 5v3h10l1-4h6v-4l-6-3-2-7H6Z",
    belt: "M3 9h18v6H3zM9 9v6M15 9v6",
    ring: "M12 21a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM9 3l3 4 3-4",
    amulet: "M12 21a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 3c0 7 7 10 7 10s7-3 7-10",
    jewel: "M12 3 4 9l8 12 8-12-8-6ZM4 9h16",
    flask: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3",
    gem: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v10M8 10l4-3 4 3M8 14l4 3 4-3",
    cart: "M3 4h2l2.5 11h10l2-7H7M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
    setup: "M4 6h16M4 12h16M4 18h10M18 16l2 2 3-3",
  };
  const icon = (k, cls) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls || "size-5 shrink-0"}"><path d="${ICONS[k] || ICONS.jewel}"/></svg>`;
  const TIER = { core: ["Spec", "bg-emerald-400/10 text-emerald-400", "fill-emerald-400"], alt: ["Option", "bg-sky-400/10 text-sky-400", "fill-sky-400"], endgame: ["Rich", "bg-amber-400/10 text-amber-400", "fill-amber-400"] };
  const STATUS = { have: ["Have", "bg-emerald-400/10 text-emerald-400"], partial: ["Partial", "bg-sky-400/10 text-sky-400"], buy: ["Buy", "bg-indigo-400/10 text-indigo-300"], craft: ["Craft", "bg-amber-400/10 text-amber-400"] };
  const badge = (txt, cls, dot) => `<span class="inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium ${cls}">${dot ? `<svg viewBox="0 0 6 6" aria-hidden="true" class="size-1.5 ${dot}"><circle r="3" cx="3" cy="3"/></svg>` : ""}${txt}</span>`;
  const BTN_P = "inline-flex items-center justify-center gap-x-1.5 rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 cursor-pointer";
  const BTN_S = "inline-flex items-center justify-center gap-x-1.5 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white inset-ring inset-ring-white/5 hover:bg-white/20 cursor-pointer";
  const BTN_G = "inline-flex items-center justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold text-gray-400 inset-ring inset-ring-white/10 hover:bg-white/5 hover:text-white cursor-pointer";
  const INPUT = "block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6";
  const SELECT = "col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/5 py-1.5 pr-8 pl-3 text-base text-white outline-1 -outline-offset-1 outline-white/10 *:bg-gray-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500 sm:text-sm/6";
  const CHEV = `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-400 sm:size-4"><path fill-rule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/></svg>`;
  const OPEN_ICON = `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="-ml-0.5 size-5"><path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm7.25-2.5a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V4.56l-6.22 6.22a.75.75 0 1 1-1.06-1.06L15.94 3.5h-3.69a.75.75 0 0 1-.75-.75Z" clip-rule="evenodd"/></svg>`;
  const CARD = "divide-y divide-white/10 overflow-hidden rounded-lg bg-gray-800/50 outline -outline-offset-1 outline-white/10";
  const SUM_BANNER = `<div class="border-l-4 border-indigo-400 bg-indigo-500/10 px-4 py-3 sm:px-6"><p class="text-sm text-indigo-200">Opens cheapest-first. Click <span class="font-semibold text-white">Sum:</span> on any result to flip it to best-first — the trade site's link format carries the query but not a sort order, so that one click is on you.</p></div>`;

  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 1800);
  }
  async function copy(text) { try { if (text.startsWith("poe:")) text = await realUrl(text); await navigator.clipboard.writeText(text); toast("Link copied"); } catch (e) { toast("Copy failed — open the link instead"); } }
  // Turn "poe:" placeholders into real gzip-hash trade links (async, a few ms for a page of links).
  let hydrateRun = 0;
  async function hydrateLinks() {
    const run = ++hydrateRun;
    if (typeof CompressionStream === "undefined") { document.querySelectorAll('a[href^="poe:"]').forEach(a => { a.removeAttribute("href"); a.title = "This browser can't build trade links (no CompressionStream)"; }); return; }
    const as = [...document.querySelectorAll('a[href^="poe:"]')];
    await Promise.all(as.map(async a => { const ph = a.getAttribute("href"); const real = await realUrl(ph); if (run === hydrateRun) a.setAttribute("href", real); }));
  }

  // ---- settings panel ----
  function bindSettings() {
    const map = { level: "s-level", budget: "s-budget", unit: "s-unit", divC: "s-div", league: "s-league", status: "s-status", rollQ: "s-roll", corrupted: "s-corr" };
    document.querySelectorAll("[data-phase]").forEach(b => b.addEventListener("click", () => { state.phase = b.dataset.phase; state.base = "auto"; if (state.setup !== "now") state.setup = state.phase; save(); render(); }));
    for (const [k, id] of Object.entries(map)) {
      const el = $(id); if (!el) continue;
      el.value = state[k];
      el.addEventListener("input", () => { state[k] = (el.type === "number" || k === "rollQ") ? Number(el.value) : el.value; if (k === "level") state.level = Math.min(100, Math.max(1, Math.round(state.level || 1))); save(); render(); });
    }
    $("s-level-dn").addEventListener("click", () => { state.level = Math.max(1, state.level - 1); $("s-level").value = state.level; save(); render(); });
    $("s-level-up").addEventListener("click", () => { state.level = Math.min(100, state.level + 1); $("s-level").value = state.level; save(); render(); });
  }

  // ---- nav ----
  function renderNav() {
    const ul = $("nav-list"); ul.innerHTML = "";
    const sel = $("nav-select"); sel.innerHTML = "";
    for (const s of D.slots) {
      const cur = s.key === state.slot;
      const li = h("li");
      li.innerHTML = `<a href="#${s.key}" data-slot="${s.key}" class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold ${cur ? "bg-white/5 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"}">${icon(s.icon, "size-6 shrink-0")}${esc(s.label)}</a>`;
      li.querySelector("a").addEventListener("click", e => { e.preventDefault(); state.slot = s.key; save(); render(); window.scrollTo({ top: 0 }); });
      ul.appendChild(li);
      const o = h("option", null, esc(s.label)); o.value = s.key; o.selected = cur; sel.appendChild(o);
    }
    sel.onchange = () => { state.slot = sel.value; save(); render(); };
  }

  // ---- loadout strip ----
  function renderLoadout() {
    const box = $("loadout"); box.innerHTML = "";
    for (const { slot, target, status } of loadout(state)) {
      const [sl, sc] = STATUS[status] || STATUS.buy;
      const card = h("button", "text-left overflow-hidden rounded-lg bg-gray-800/75 px-3 py-3 inset-ring inset-ring-white/10 hover:inset-ring-white/20 cursor-pointer");
      card.innerHTML = `<dt class="flex items-center justify-between gap-x-1.5 text-xs font-medium text-gray-400"><span class="flex items-center gap-x-1.5 truncate">${icon(slot.icon, "size-4 shrink-0")}${esc(slot.label)}</span>${badge(sl, sc)}</dt>
        <dd class="mt-1 line-clamp-3 text-xs text-gray-300" title="${esc(target)}">${esc(target)}</dd>`;
      card.addEventListener("click", () => { state.slot = slot.key; save(); render(); });
      box.appendChild(card);
    }
  }

  // ---- slot page ----
  function weightRows(slot, group) {
    const v = view(slot, state);
    const src = group === "abyss" ? v.abyssW : v.w;
    const key = wkey(slot, state, group);
    const ov = state.weights[key] || {};
    return src.map(([k, w]) => {
      const cur = ov[k] != null ? ov[k] : w;
      return `<div class="flex items-center justify-between gap-x-3 py-1.5">
        <span class="truncate text-sm text-gray-300" title="${esc(S[k].id)}">${esc(S[k].label)}</span>
        <input type="number" step="0.1" min="0" data-wkey="${key}" data-stat="${k}" value="${cur}" class="w-20 shrink-0 rounded-md bg-white/5 px-2 py-1 text-right text-sm text-white outline-1 -outline-offset-1 outline-white/10 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 ${cur !== w ? "text-indigo-300" : ""}" />
      </div>`;
    }).join("");
  }

  function mustText(slot) {
    const v = view(slot, state);
    const parts = v.must.map(([k, min]) => `${esc(S[k].label)} ≥ ${k === "moveSpeed" ? Math.max(min, msFloor(state)) : min}`);
    for (const [keys, min] of v.mustAny) parts.push(`${esc(S[keys[0]].label.replace(/ \(.*\)$/, ""))} ≥ ${min} (explicit or fractured)`);
    return parts.length ? `<p class="mt-2 text-xs text-gray-500">Hard filters: ${parts.join(" · ")}</p>` : "";
  }

  function rareCard(slot, group) {
    const v = view(slot, state);
    const title = group === "abyss" ? "Abyss jewels — weighted (Hypnotic Eye)" : (slot.key === "jewel" ? "Rare jewels — weighted" : `Rare ${slot.label.toLowerCase()} — weighted search (${v.end ? "mirror" : "budget"} spec)`);
    const bp = !group && !(slot.rare && slot.rare.noBase) ? basePick(slot.key, state.level) : null;
    const card = h("div", CARD);
    let baseHtml = "";
    if (bp) {
      const tgt = v.base || (bp.now && bp.now.name);
      const opts = [`<option value="auto">${v.base ? `fubgun's base: ${esc(v.base)}` : `Any ${esc(slot.label.toLowerCase())} I can equip (level ≤ ${state.level})`}</option>`, `<option value="any" ${state.base === "any" ? "selected" : ""}>Any base</option>`]
        .concat(bp.all.map(b => `<option value="${esc(b.name)}" ${state.base === b.name ? "selected" : ""} ${b.level > state.level ? "disabled" : ""}>${esc(b.name)} — lvl ${b.level}${b.implicit ? ` · ${esc(b.implicit)}` : ""}${b.pick ? " ★" : ""}</option>`)).join("");
      baseHtml = `<div class="px-4 py-4 sm:px-6">
        <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p class="text-sm text-gray-300">Base: <span class="font-semibold text-white">${esc(state.base === "auto" ? (v.base || "any") : state.base)}</span>${bp.now && bp.now.why && state.base === "auto" ? ` <span class="text-gray-500">— ${esc(bp.now.why)}</span>` : ""}</p>
        </div>
        <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><label class="block text-xs/5 font-medium text-gray-400">Base filter</label><div class="mt-1 grid grid-cols-1"><select id="r-base" class="${SELECT}">${opts}</select>${CHEV}</div></div>
          <div class="flex items-end gap-2">${tgt ? `<button id="r-base-pick" type="button" class="${BTN_S}">Lock to ${esc(tgt)}</button>` : ""}<button id="r-base-any" type="button" class="${BTN_G}">Any base</button></div>
        </div>
        ${v.note ? `<p class="mt-2 text-xs text-gray-500">${esc(v.note)}</p>` : ""}</div>`;
    }
    let optHtml = `<div><label class="block text-xs/5 font-medium text-gray-400">Min weighted sum</label><div class="mt-1 flex gap-2"><input id="r-minsum" type="number" min="0" value="${state.minSum}" class="${INPUT}" /><button id="r-floor" type="button" class="${BTN_G} whitespace-nowrap">Auto ≈ ${autoFloor(slot, state, group)}</button></div><p class="mt-1 text-xs text-gray-500">0 = no floor. Auto is a rough "worth reading" guess — raise it if the top results look weak.</p></div>`;
    if (!group && slot.rare.links) optHtml += `<div><label class="block text-xs/5 font-medium text-gray-400">Links</label><div class="mt-1 grid grid-cols-1"><select id="r-links" class="${SELECT}"><option value="auto" ${state.links === "auto" ? "selected" : ""}>6L (default)</option><option value="0" ${state.links === "0" ? "selected" : ""}>Any</option><option value="5" ${state.links === "5" ? "selected" : ""}>5L+</option><option value="6" ${state.links === "6" ? "selected" : ""}>6L</option></select>${CHEV}</div></div>`;
    if (!group && slot.rare.must && slot.rare.must.some(([k]) => k === "moveSpeed")) optHtml += `<div><label class="block text-xs/5 font-medium text-gray-400">Min movement speed %</label><input id="r-ms" type="number" min="0" max="35" placeholder="spec: ${(view(slot, state).must.find(([k]) => k === "moveSpeed") || [])[1]}" value="${state.msMin === "auto" ? "" : state.msMin}" class="mt-1 ${INPUT}" /><p class="mt-1 text-xs text-gray-500">Blank = the spec's floor (fubgun's budget boots are 28%, so it is 25 there, 28 at mirror). Type a number to override.</p></div>`;

    const link = rareUrl(slot, state, group);
    card.innerHTML = `<div class="px-4 py-4 sm:px-6"><h3 class="text-base font-semibold text-white">${title}</h3><p class="mt-1 text-sm text-gray-400">${esc(v.blurb)}</p>${group ? "" : mustText(slot)}</div>
      ${baseHtml}
      <div class="px-4 py-4 sm:px-6"><div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">${optHtml}</div></div>
      <div class="px-4 py-4 sm:px-6">
        <details class="group"><summary class="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-gray-300 hover:text-white"><span>Weights (edit to adapt — saved in this browser)</span><span class="text-xs text-gray-500 group-open:hidden">show</span><span class="hidden text-xs text-gray-500 group-open:inline">hide</span></summary>
        <div class="mt-3 divide-y divide-white/5">${weightRows(slot, group)}</div>
        <div class="mt-3 flex gap-2"><button type="button" data-reset="${wkey(slot, state, group)}" class="${BTN_G}">Reset weights</button></div></details>
      </div>
      <div class="flex flex-wrap items-center gap-3 bg-gray-900/40 px-4 py-4 sm:px-6">
        <a href="${esc(link)}" target="_blank" rel="noopener" class="${BTN_P} text-base px-4 py-2.5">${OPEN_ICON}Open weighted search</a>
        <button type="button" data-copy="${esc(link)}" class="${BTN_S}">Copy link</button>
        <span class="text-xs text-gray-500">Level ≤ ${state.level} · max ${esc(fmtBudget(state))} · ${state.status === "securable" ? "instant buyout" : state.status === "online" ? "online sellers" : "any seller"}</span>
      </div>
      ${SUM_BANNER}`;
    // wire
    card.querySelectorAll("input[data-wkey]").forEach(inp => inp.addEventListener("change", () => {
      const k = inp.dataset.wkey; state.weights[k] = state.weights[k] || {}; state.weights[k][inp.dataset.stat] = Number(inp.value); save(); render();
    }));
    card.querySelectorAll("[data-reset]").forEach(b => b.addEventListener("click", () => { delete state.weights[b.dataset.reset]; save(); render(); toast("Weights reset"); }));
    const bind = (id, key, num) => { const el = card.querySelector("#" + id); if (el) el.addEventListener("change", () => { state[key] = num ? Number(el.value) : el.value; save(); render(); }); };
    bind("r-minsum", "minSum", true); bind("r-links", "links"); bind("r-base", "base");
    const msEl = card.querySelector("#r-ms"); if (msEl) msEl.addEventListener("change", () => { state.msMin = msEl.value === "" ? "auto" : Number(msEl.value); save(); render(); });
    const fl = card.querySelector("#r-floor"); if (fl) fl.addEventListener("click", () => { state.minSum = autoFloor(slot, state, group); save(); render(); });
    const bpick = card.querySelector("#r-base-pick"); if (bpick && bp) bpick.addEventListener("click", () => { state.base = v.base || (bp.now && bp.now.name) || "auto"; save(); render(); });
    const bany = card.querySelector("#r-base-any"); if (bany) bany.addEventListener("click", () => { state.base = "any"; save(); render(); });
    return card;
  }

  function extraCard(slot) {
    const v = view(slot, state);
    if (!v.extra.length) return null;
    const card = h("div", CARD);
    card.innerHTML = `<div class="px-4 py-4 sm:px-6"><h3 class="text-base font-semibold text-white">Craft starts and exact searches</h3><p class="mt-1 text-sm text-gray-400">Fixed searches for the fractured base or the one line that makes the item. Price cap and seller status from Settings still apply.</p></div>
      <ul role="list" class="divide-y divide-white/5 px-4 sm:px-6">${v.extra.map(x => `<li class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div class="min-w-0 flex-1"><p class="text-sm font-semibold text-white">${esc(x.label)}</p><p class="mt-1 text-sm text-gray-400">${esc(x.why)}</p></div><div class="flex shrink-0 gap-2"><a href="${esc(rawUrl(x.query, state))}" target="_blank" rel="noopener" class="${BTN_S}">${OPEN_ICON}Open</a></div></li>`).join("")}</ul>`;
    return card;
  }

  function uniqueRow(u) {
    const can = u.level <= state.level;
    const [tl, tc, td] = TIER[u.tier] || TIER.alt;
    const li = h("li", `flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between ${can ? "" : "opacity-60"}`);
    const rt = rollText(u, state);
    const hasTop = (u.rolls || []).some(r => S[r.s].option == null && !(r.lo === 0 && r.hi === 0) && !(u.required || []).includes(r.s));
    li.innerHTML = `<div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-sm font-semibold text-white">${esc(u.name)}</p>
          ${u.owned ? badge("you own it", "bg-emerald-400/10 text-emerald-400") : badge(tl, tc, td)}
          ${u.required ? badge("variant locked", "bg-fuchsia-400/10 text-fuchsia-400") : ""}
        </div>
        <p class="mt-1 text-sm text-gray-400">${esc(u.why)}</p>
        ${rt ? `<p class="mt-1 text-xs text-gray-500">Top rolls at ${Math.round(state.rollQ * 100)}%: ${esc(rt)}</p>` : ""}
      </div>
      <div class="flex shrink-0 gap-2">
        ${hasTop ? `<a href="${esc(uniqueUrl(u, state, true))}" target="_blank" rel="noopener" class="${u.owned ? BTN_S : BTN_P}">${OPEN_ICON}Top rolls</a>` : ""}
        <a href="${esc(uniqueUrl(u, state, false))}" target="_blank" rel="noopener" class="${hasTop || u.owned ? BTN_G : BTN_P}">${hasTop ? "Any roll" : OPEN_ICON + "Open"}</a>
      </div>`;
    return li;
  }

  const VERDICT = { yes: ["Buy", "bg-emerald-400/10 text-emerald-400"], minor: ["If cheap", "bg-amber-400/10 text-amber-400"], no: ["Skip", "bg-gray-400/10 text-gray-400"] };
  const verdict = (label, v, why) => `<span class="inline-flex flex-wrap items-center gap-x-1.5 text-xs text-gray-400"><span class="font-medium text-gray-300">${label}</span>${badge(VERDICT[v][0], VERDICT[v][1])}<span>${esc(why || "")}</span></span>`;
  const GEM_TIER = { now: BTN_P, later: BTN_S, rich: BTN_G };

  const gemByName = n => D.gems.find(g => g.name === n);
  function gemRow(g) {
    const links = gemLinks(g, state);
    const li = h("li", `py-3 ${g.optional ? "opacity-75" : ""}`);
    li.innerHTML = `<div class="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2"><p class="text-sm font-semibold text-white">${esc(g.name)}</p>${g.have ? badge(`you have ${esc(g.have)}`, "bg-emerald-400/10 text-emerald-400") : g.granted ? badge("granted", "bg-gray-400/10 text-gray-400") : badge("not owned", "bg-sky-400/10 text-sky-400")}${g.unverified ? badge("quality not verified", "bg-gray-400/10 text-gray-400") : ""}</div>
        <p class="mt-1 text-sm text-gray-400">Quality: ${esc(g.q)}</p>
        <div class="mt-1 flex flex-col gap-0.5">
          ${g.granted ? "" : verdict("20% quality", g.qWorth, g.qWhy)}
          ${g.enlighten || g.granted ? "" : verdict(g.awakenedGem || g.awakenedLike ? "Max level" : "Level 21", g.l21, g.l21Why)}
          ${g.enlighten || g.granted || g.awakenedGem || (g.q23 === "no" && g.qWorth === "no") ? "" : verdict("23% quality", g.q23, g.q23Why)}
        </div>
        ${g.note ? `<p class="mt-1 text-xs text-gray-500">${esc(g.note)}</p>` : ""}
      </div>
      <div class="flex shrink-0 flex-wrap gap-2 lg:max-w-xs lg:justify-end">
        ${links.length ? links.map(l => `<a href="${esc(gemUrl(l.spec, state))}" target="_blank" rel="noopener" class="${GEM_TIER[l.tier]} text-xs">${esc(l.label)}</a>`).join("") : g.granted ? "" : `<span class="text-xs text-gray-500">Nothing worth buying.</span>`}
      </div>
    </div>`;
    return li;
  }

  function renderGems(slot) {
    const main = $("slot");
    const setup = D.setups.find(x => x.key === state.setup) || D.setups[0];
    const intro = h("div", "rounded-lg bg-gray-800/50 px-4 py-4 outline -outline-offset-1 outline-white/10 sm:px-6");
    intro.innerHTML = `<h3 class="text-base font-semibold text-white">Gems — what links to what</h3><p class="mt-1 text-sm text-gray-400">Pick a loadout. Each gear piece shows its links in order; every gem carries its verdict on 20% quality, level 21 and 23%, and a badge for what your PoB already has.</p>
      <div class="mt-3 flex flex-wrap gap-2">${D.setups.map(x => `<button type="button" data-setup="${x.key}" class="${x.key === setup.key ? BTN_P : BTN_G} text-xs">${esc(x.label)}</button>`).join("")}</div>
      <p class="mt-3 text-xs text-gray-500">${esc(setup.who)} · Buttons: <span class="text-indigo-300">indigo</span> = buy now · <span class="text-gray-400">outlined</span> = only because you're rich. 21 and 23 mean corrupted; the Corrupted setting is ignored here.</p>`;
    intro.querySelectorAll("[data-setup]").forEach(b => b.addEventListener("click", () => { state.setup = b.dataset.setup; save(); render(); }));
    main.appendChild(intro);
    for (const piece of setup.pieces) {
      const card = h("div", CARD);
      card.innerHTML = `<div class="px-4 py-3 sm:px-6"><div class="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h3 class="text-sm font-semibold text-white">${esc(piece.piece)}</h3><p class="text-xs text-gray-500">${piece.gems.map(esc).join(" → ")}</p></div>${piece.note ? `<p class="mt-1 text-xs text-gray-400">${esc(piece.note)}</p>` : ""}</div>`;
      const ul = h("ul", "divide-y divide-white/5 px-4 sm:px-6"); ul.setAttribute("role", "list");
      for (const n of piece.gems) { const g = gemByName(n); if (g) ul.appendChild(gemRow(g)); }
      card.appendChild(ul); main.appendChild(card);
    }
    const used = new Set(setup.pieces.flatMap(p => p.gems));
    const rest = D.gems.filter(g => !used.has(g.name));
    if (rest.length) {
      const det = h("details", "rounded-lg bg-gray-800/50 outline -outline-offset-1 outline-white/10");
      det.innerHTML = `<summary class="cursor-pointer list-none px-4 py-3 text-sm font-medium text-gray-300 hover:text-white sm:px-6">Gems not in this loadout (${rest.length})</summary>`;
      const ul = h("ul", "divide-y divide-white/5 border-t border-white/10 px-4 sm:px-6"); ul.setAttribute("role", "list");
      rest.forEach(g => ul.appendChild(gemRow(g)));
      det.appendChild(ul); main.appendChild(det);
    }
  }

  function renderShop(slot) {
    const main = $("slot");
    const intro = h("div", "rounded-lg bg-gray-800/50 px-4 py-4 outline -outline-offset-1 outline-white/10 sm:px-6");
    intro.innerHTML = `<h3 class="text-base font-semibold text-white">Buy list — ${esc(D.shopTitle || "ranked")}</h3><p class="mt-1 text-sm text-gray-400">${esc(slot.blurb)}</p>${D.shopNote ? `<p class="mt-2 text-xs text-gray-500">${esc(D.shopNote)}</p>` : ""}`;
    main.appendChild(intro);
    let group = null, card = null, ul = null;
    for (const it of D.shop) {
      if (it.group !== group) {
        group = it.group;
        card = h("div", CARD);
        card.innerHTML = `<div class="px-4 py-3 sm:px-6"><h3 class="text-sm font-semibold text-white">${esc(group)}</h3></div>`;
        ul = h("ul", "divide-y divide-white/5 px-4 sm:px-6"); ul.setAttribute("role", "list");
        card.appendChild(ul); main.appendChild(card);
      }
      const url = shopUrl(it, state);
      const li = h("li", `flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between ${it.skip ? "opacity-60" : ""}`);
      li.innerHTML = `<div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2"><span class="flex size-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-semibold text-gray-200">${it.n}</span><p class="text-sm font-semibold text-white">${esc(it.item)}</p>${badge(esc(it.price), it.skip ? "bg-gray-400/10 text-gray-400" : it.craft ? "bg-amber-400/10 text-amber-400" : "bg-emerald-400/10 text-emerald-400")}${it.tag ? badge(esc(it.tag), "bg-sky-400/10 text-sky-400") : ""}</div><p class="mt-1 text-sm text-gray-400">${esc(it.why)}</p></div>
        <div class="flex shrink-0 gap-2">${url ? `<a href="${esc(url)}" target="_blank" rel="noopener" class="${it.skip ? BTN_G : BTN_P}">${OPEN_ICON}Open</a>` : it.link && it.link.tab ? `<button type="button" data-goto="${esc(it.link.tab)}" class="${BTN_S}">${esc(it.link.label || "Open tab")}</button>` : ""}</div>`;
      ul.appendChild(li);
    }
    main.querySelectorAll("[data-goto]").forEach(b => b.addEventListener("click", () => { state.slot = b.dataset.goto; save(); render(); window.scrollTo({ top: 0 }); }));
  }

  function renderSetup(slot) {
    const main = $("slot");
    const s = D.setup;
    const block = (title, items, intro) => { const c = h("div", CARD); c.innerHTML = `<div class="px-4 py-4 sm:px-6"><h3 class="text-base font-semibold text-white">${title}</h3>${intro ? `<p class="mt-1 text-sm text-gray-400">${esc(intro)}</p>` : ""}</div><ul role="list" class="divide-y divide-white/5 px-4 sm:px-6">${items.map(i => `<li class="py-2.5 text-sm text-gray-300">${esc(i)}</li>`).join("")}</ul>`; return c; };
    main.appendChild(block("1 · PoB configuration (copy this first — your PoB has an empty config tab, so every number it shows undersells you)", s.config, "fubgun's config, read from the PoB XML. Set these in your own PoB before you compare anything."));
    const a = h("div", CARD); a.innerHTML = `<div class="px-4 py-4 sm:px-6"><h3 class="text-base font-semibold text-white">2 · Ascendancy</h3><p class="mt-1 text-sm text-gray-300">${esc(s.ascendancy)}</p></div>`; main.appendChild(a);
    main.appendChild(block("3 · Tree diff vs fubgun (budget)", s.tree));
    const n = h("div", CARD); n.innerHTML = `<div class="px-4 py-4 sm:px-6"><h3 class="text-base font-semibold text-white">4 · fubgun's craft notes</h3><p class="mt-1 text-sm text-gray-400">Staff (two routes), Warlock gloves, rarity helmet, chest, Focused amulet (waggles' video), double-elevated boots (FGkorbyn's video), rare block jewels. Verbatim copy in the repo: <a href="reference/fubgun-notes.md" class="text-indigo-300 underline hover:text-white">reference/fubgun-notes.md</a> · PoBs: <a href="https://maxroll.gg/poe/pob/${esc(D.pob.now)}" target="_blank" rel="noopener" class="text-indigo-300 underline hover:text-white">yours</a> · <a href="https://maxroll.gg/poe/pob/${esc(D.pob.budget)}" target="_blank" rel="noopener" class="text-indigo-300 underline hover:text-white">budget</a> · <a href="https://maxroll.gg/poe/pob/${esc(D.pob.mirror)}" target="_blank" rel="noopener" class="text-indigo-300 underline hover:text-white">mirror</a></p></div>`; main.appendChild(n);
  }

  function renderSlot() {
    const slot = slotByKey(state.slot) || D.slots[0];
    const main = $("slot"); main.innerHTML = "";
    $("slot-title").textContent = slot.label;
    $("mob-title").textContent = slot.label;
    if (slot.gemsTab) { renderGems(slot); return; }
    if (slot.shopTab) { renderShop(slot); return; }
    if (slot.setupTab) { renderSetup(slot); return; }
    const v = view(slot, state);
    if (slot.now || slot.target) {
      const ph = isMirror(state) ? "mirror" : "budget";
      const [sl, sc] = STATUS[(slot.status && slot.status[ph]) || "buy"];
      const c = h("div", CARD);
      c.innerHTML = `<div class="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 sm:px-6"><div><p class="text-xs font-medium text-gray-400">Yours now</p><p class="mt-1 text-sm text-gray-300">${esc(slot.now)}</p></div><div><p class="flex items-center gap-2 text-xs font-medium text-gray-400">fubgun ${ph} ${badge(sl, sc)}</p><p class="mt-1 text-sm text-white">${esc(slot.target[ph])}</p></div></div>`;
      main.appendChild(c);
    }
    if (slot.rare) main.appendChild(rareCard(slot));
    const ex = slot.rare ? extraCard(slot) : null; if (ex) main.appendChild(ex);
    if (slot.abyss) main.appendChild(rareCard(slot, "abyss"));
    if (slot.flasks) {
      const card = h("div", CARD);
      card.innerHTML = `<div class="px-4 py-4 sm:px-6"><h3 class="text-base font-semibold text-white">Magic flasks</h3></div>
        <ul role="list" class="divide-y divide-white/5 px-4 sm:px-6">${slot.flasks.map(f => `<li class="flex items-center justify-between gap-3 py-3"><div><p class="text-sm font-semibold text-white">${esc(f.type)}</p><p class="text-xs text-gray-500">${esc(f.why)}</p></div><a href="${esc(flaskUrl(f, state))}" target="_blank" rel="noopener" class="${BTN_G}">${OPEN_ICON}Open</a></li>`).join("")}</ul>`;
      main.appendChild(card);
    }
    if (v.uniques && v.uniques.length) {
      const card = h("div", CARD);
      const T = { core: 0, alt: 1, endgame: 2 };
      const sorted = [...v.uniques].sort((a, b) => (a.owned ? 1 : 0) - (b.owned ? 1 : 0) || (T[a.tier] - T[b.tier]));
      card.innerHTML = `<div class="px-4 py-4 sm:px-6"><h3 class="text-base font-semibold text-white">Uniques — ${v.end ? "mirror" : "budget"} spec</h3><p class="mt-1 text-sm text-gray-400">"Top rolls" asks for each roll at ${Math.round(state.rollQ * 100)}% of its range (change it in Settings). "Variant locked" = the search pins the one roll that makes it the right jewel.</p></div>`;
      const ul = h("ul", "divide-y divide-white/5 px-4 sm:px-6"); ul.setAttribute("role", "list");
      sorted.forEach(u => ul.appendChild(uniqueRow(u)));
      card.appendChild(ul); main.appendChild(card);
    }
    if (v.cluster) {
      const card = h("div", CARD);
      card.innerHTML = `<div class="px-4 py-4 sm:px-6"><h3 class="text-base font-semibold text-white">Cluster jewels</h3><p class="mt-1 text-sm text-gray-400">Each search pins the small-passive type, passive count, socket count and the exact notables. ilvl 75+. Fractured "also grant" lines (fubgun fractures cast speed on the large ones) are a bonus, not a filter.</p></div>
        <ul role="list" class="divide-y divide-white/5 px-4 sm:px-6">${slot.clusters.map(c => `<li class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div class="min-w-0 flex-1"><p class="text-sm font-semibold text-white">${esc(c.label)}</p><p class="mt-1 text-sm text-gray-400">${esc(c.why)}</p></div><div class="flex shrink-0 gap-2"><a href="${esc(clusterUrl(c, state))}" target="_blank" rel="noopener" class="${BTN_S}">${OPEN_ICON}Open</a></div></li>`).join("")}</ul>`;
      main.appendChild(card);
    }
    main.querySelectorAll("[data-copy]").forEach(b => b.addEventListener("click", () => copy(b.dataset.copy)));
  }

  function renderPhase() {
    document.querySelectorAll("[data-phase]").forEach(b => {
      const on = b.dataset.phase === state.phase;
      b.className = on ? "rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white cursor-pointer" : "rounded-md px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white cursor-pointer";
    });
    const lo = $("loadout-h"); if (lo) lo.innerHTML = isMirror(state) ? `fubgun mirror — the target per slot <span class="font-normal text-gray-500">— click a slot to jump</span>` : `fubgun budget — the target per slot <span class="font-normal text-gray-500">— click a slot to jump</span>`;
  }
  function render() {
    renderPhase(); renderNav(); renderLoadout(); renderSlot();
    $("hdr-level").textContent = state.level;
    $("hdr-budget").textContent = fmtBudget(state);
    $("hdr-league").textContent = state.league;
    hydrateLinks();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const hash = location.hash.replace("#", ""); if (hash && slotByKey(hash)) state.slot = hash;
    if (!slotByKey(state.slot)) state.slot = "shop";
    bindSettings(); render();
  });
}
