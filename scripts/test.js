// node scripts/test.js — sanity checks for data.js + app.js
const D = require("../data.js"); const A = require("../app.js");
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log("FAIL", m); } };
const ID_RE = /^(explicit|implicit|fractured|crafted|enchant)\.(stat_\d+(\|\d+)?|indexable_skill_\d+|pseudo_timeless_jewel_\w+)$/;
for (const [k, v] of Object.entries(D.S)) ok(ID_RE.test(v.id), `bad id ${k}: ${v.id}`);
const checkW = (list, where) => { for (const [k, w] of (list || [])) { ok(D.S[k], `${where}: unknown stat ${k}`); ok(typeof w === "number" && w > 0, `${where}: bad weight for ${k}`); } };
const checkU = (u, where) => { ok(u.name && u.why && u.tier && u.level >= 0, `${where}: ${u.name || "?"} incomplete`); for (const r of (u.rolls || [])) ok(D.S[r.s], `${u.name}: unknown roll ${r.s}`); for (const r of (u.required || [])) ok((u.rolls || []).some(x => x.s === r), `${u.name}: required ${r} not in rolls`); };
for (const s of D.slots) {
  if (s.rare) {
    checkW(s.rare.w, s.key);
    for (const [k] of (s.rare.must || [])) ok(D.S[k], `${s.key}: unknown must ${k}`);
    for (const [keys] of (s.rare.mustAny || [])) for (const k of keys) ok(D.S[k], `${s.key}: unknown mustAny ${k}`);
    for (const x of (s.rare.extra || [])) ok(x.label && x.why && x.query, `${s.key}: bad extra`);
  }
  if (s.abyss) checkW(s.abyss.w, s.key + ":abyss");
  for (const u of (s.uniques || [])) checkU(u, s.key);
  if (s.eg) { checkW(s.eg.w, s.key + ":mirror"); checkW(s.eg.abyss, s.key + ":mirror-abyss"); for (const u of (s.eg.uniques || [])) checkU(u, s.key + ":mirror"); for (const [keys] of (s.eg.mustAny || [])) for (const k of keys) ok(D.S[k], `${s.key}: unknown mirror mustAny ${k}`); }
  for (const c of (s.clusters || [])) { ok(D.S[c.small] && D.S[c.small].option != null, `${c.label}: small`); for (const k of (c.notables || [])) ok(D.S[k], `${c.label}: notable ${k}`); for (const k of (c.also || [])) ok(D.S[k], `${c.label}: also ${k}`); }
  if (s.target) { ok(s.target.budget && s.target.mirror, `${s.key}: target missing a phase`); ok(s.status && s.status.budget && s.status.mirror, `${s.key}: status missing`); }
}
for (const [k, list] of Object.entries(D.bases)) { let last = -1; for (const b of list) { ok(b.level >= last || ["belt", "ring", "amulet"].includes(k), `${k}: ${b.name} out of level order`); last = b.level; } }
// gems referenced by setups exist
for (const set of D.setups) for (const p of set.pieces) for (const g of p.gems) ok(D.gems.find(x => x.name === g), `setup ${set.key}: unknown gem ${g}`);
for (const g of D.gems) ok(["yes", "minor", "no"].includes(g.qWorth) && ["yes", "minor", "no"].includes(g.l21) && ["yes", "minor", "no"].includes(g.q23), `gem ${g.name}: bad verdicts`);
// shop links resolve
for (const it of D.shop) { const u = A.shopUrl(it, A.DEFAULTS); ok(u || (it.link && it.link.tab), `shop ${it.n} ${it.item}: no url`); ok(it.group && it.price && it.why, `shop ${it.n}: incomplete`); }
// query shapes at both phases
for (const phase of ["budget", "mirror"]) {
  const st = Object.assign({}, A.DEFAULTS, { phase, budget: 100, unit: "div" });
  for (const s of D.slots) {
    if (s.rare) {
      const q = A.rareQuery(s, st).query;
      ok(q.filters.req_filters.filters.lvl.max === st.level, "lvl filter");
      ok(q.stats[0].type === "weight2" && q.stats[0].filters.length > 0, `${s.key}: weight group`);
      ok(q.filters.trade_filters.filters.price.max === 100 * D.divineChaos, `${s.key}: price cap`);
      ok(JSON.stringify(q).length < 6000, `${s.key}: url size`);
      for (const x of A.view(s, st).extra) { const r = A.rawQuery(x.query, st).query; ok(r.status.option === "securable" && r.filters.trade_filters, `${s.key} extra: status/price`); }
    }
    if (s.abyss) ok(A.rareQuery(s, st, "abyss").query.filters.type_filters.filters.category.option === "jewel.abyss", "abyss cat");
    for (const u of A.view(s, st).uniques) { const q = A.uniqueQuery(u, st, true).query; ok(q.name === u.name, "name"); ok(JSON.stringify(q).length < 6000, "url size"); }
    for (const c of (s.clusters || [])) { const q = A.clusterQuery(c, st).query; ok(q.type === c.type && q.stats[0].filters.length >= 3, `${c.label}: cluster query`); }
  }
}
// option stats become {option}, never {min}
const ff = D.slots.find(s => s.key === "jewel").uniques.find(u => u.name === "Forbidden Flame");
const ffq = A.uniqueQuery(ff, A.DEFAULTS, false).query; ok(ffq.stats[0].filters[0].id === "explicit.stat_1190333629|37492" && !ffq.stats[0].filters[0].value, "Forbidden Flame pipe id, no value");
const staff = D.slots.find(s => s.key === "staff"); const sq = A.rareQuery(staff, A.DEFAULTS).query;
ok(sq.stats.some(g => g.type === "count" && g.filters.length === 2), "staff mustAny count group");
ok(sq.filters.socket_filters.filters.links.min === 6, "staff 6L default");
ok(A.msFloor({ msMin: "auto", level: 96 }) === 30 && A.msFloor({ msMin: 12, level: 30 }) === 12, "msFloor");
const boots = D.slots.find(s => s.key === "boots"); const bq = A.rareQuery(boots, A.DEFAULTS).query; const bAnd = bq.stats.find(g => g.type === "and");
ok(bAnd.filters.find(f => f.id === D.S.tailwindCrit.id) && !bAnd.filters.find(f => f.id === D.S.tailwindCrit.id).value, "tailwind flag has no value");
ok(bAnd.filters.find(f => f.id === D.S.moveSpeed.id).value.min === 25, "boots MS floor is the spec's 25, not msFloor");
ok(A.rareQuery(boots, Object.assign({}, A.DEFAULTS, { msMin: 30 })).query.stats.find(g => g.type === "and").filters.find(f => f.id === D.S.moveSpeed.id).value.min === 30, "MS override");
// hashed links decode back to the bare query (no {query, sort} wrapper — the trade site rejects that)
{ const zlib = require("zlib"); const u = A.rareUrl(D.slots.find(s => s.key === "helmet"), A.DEFAULTS); const h = u.split("/").pop();
  const dec = JSON.parse(zlib.gunzipSync(Buffer.from(h.replace(/-/g, "+").replace(/_/g, "/"), "base64")).toString());
  ok(/^https:\/\/www\.pathofexile\.com\/trade\/search\/Allflame\/H4sI/.test(u), "hash url shape"); ok(dec.status && dec.stats && !dec.query, "hash holds the bare query"); }
// gem links never offer a level/quality the PoB already has
{ const ek = D.gems.find(g => g.name === "Ethereal Knives"); const L = A.gemLinks(ek, A.DEFAULTS); ok(A.haveOf(ek).lvl === 21 && A.haveOf(ek).q === 20, "haveOf parses 21/20");
  ok(!L.some(l => l.spec.lvlMin <= 21 && (l.spec.qMin || 0) <= 20), "EK: no link at or below 21/20"); ok(L.some(l => l.spec.qMin === 23), "EK: 21/23 still offered");
  const oi = D.gems.find(g => g.name === "Overloaded Intensity Support"); ok(A.gemLinks(oi, A.DEFAULTS).length === 0 && A.gemLinksAll(oi, A.DEFAULTS).length > 0, "owned 4/20 exceptional gem: nothing left to buy");
  const hop = D.gems.find(g => g.name === "Herald of Purity"); ok(A.gemLinks(hop, A.DEFAULTS).some(l => l.spec.lvlMin === 21), "HoP 20/20 owned: 21 offered"); }
// per-card min sum
{ const st = Object.assign({}, A.DEFAULTS, { minSums: { "jewel:abyss": 55 } }); const j = D.slots.find(s => s.key === "jewel");
  ok(A.rareQuery(j, st, "abyss").query.stats[0].value.min === 55 && A.rareQuery(j, st).query.stats[0].value.min === 1, "min sum is per card"); }
console.log(fails ? `${fails} failure(s)` : "all checks passed");
process.exit(fails ? 1 : 0);
