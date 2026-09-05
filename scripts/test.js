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
// the Path: every step complete, ids unique, links resolve, progress maths, exchange links, first unticked = next
{ const P = D.path; ok(P && P.stages.length >= 3 && P.numbers.rows.length > 5 && P.how.damage.length && P.how.defence.length && P.glossary.length > 10, "path present");
  const ids = new Set(); let n = 0;
  for (const stg of P.stages) { ok(stg.key && stg.title && stg.cost && stg.steps.length, `stage ${stg.key} incomplete`);
    for (const st of stg.steps) { n++; ok(!ids.has(st.id), `duplicate step id ${st.id}`); ids.add(st.id);
      ok(st.id && st.title && st.cost && st.what && st.why && st.check, `step ${st.id}: missing what/why/check`);
      ok(!st.pob || ["done", "partial"].includes(st.pob), `step ${st.id}: bad pob flag`);
      ok(!st.slot || D.slots.find(x => x.key === st.slot), `step ${st.id}: unknown slot ${st.slot}`);
      for (const l of (st.links || [])) { ok(l.label, `step ${st.id}: link without label`); if (l.tab) ok(D.slots.find(x => x.key === l.tab), `step ${st.id}: unknown tab ${l.tab}`); else ok(A.pathUrl(l, A.DEFAULTS), `step ${st.id}: link '${l.label}' has no url`); }
      for (const k of ["how", "watch", "learn"]) if (st[k] != null) ok(Array.isArray(st[k]) && st[k].every(x => typeof x === "string" && x.length), `step ${st.id}: ${k} must be a list of strings`); } }
  const prog = A.pathProgress(A.DEFAULTS); ok(prog.total === n && n === A.pathSteps().length, "path step count");
  const pobDone = A.pathSteps().filter(x => x.step.pob === "done").length; ok(prog.done === pobDone, `default done = PoB-verified steps (${prog.done} vs ${pobDone})`);
  ok(prog.next && prog.next.step.id === "config", `first open step is the config/flasks step (got ${prog.next && prog.next.step.id})`);
  const st2 = Object.assign({}, A.DEFAULTS, { done: { config: true, asc: false } }); const p2 = A.pathProgress(st2); ok(p2.done === pobDone && p2.next.step.id === "asc", "checkbox overrides the PoB flag both ways");
  ok(prog.stages.length === P.stages.length && prog.stages.reduce((a, s) => a + s.total, 0) === n, "per-stage tallies");
  const x = A.exchangeUrl({ have: "chaos", want: "tattoo-of-the-arohongui-shaman" }, A.DEFAULTS); ok(/^https:\/\/www\.pathofexile\.com\/trade\/exchange\/Allflame\/H4sI/.test(x), "exchange url shape");
  const zlib = require("zlib"); const dec = JSON.parse(zlib.gunzipSync(Buffer.from(x.split("/").pop().replace(/-/g, "+").replace(/_/g, "/"), "base64")).toString());
  ok(dec.status.option === "online" && dec.have[0] === "chaos" && dec.want[0] === "tattoo-of-the-arohongui-shaman" && !dec.query, "exchange hash holds bare {status, have, want}");
  ok(A.exchangeQuery({ want: "x" }, Object.assign({}, A.DEFAULTS, { status: "any" })).status.option === "any", "exchange status any");
  ok(D.shop.some(it => it.link && it.link.exchange) && A.shopUrl(D.shop.find(it => it.link && it.link.exchange), A.DEFAULTS).includes("/trade/exchange/"), "shop exchange link");
  ok(D.slots[0].key === "path" && D.slots[0].pathTab && A.DEFAULTS.slot === "path", "Path is the first tab and the default"); }
// abyss card: avoid-shock is a hard filter in both phases; the Hypnotic Eye extra requires it too
{ const j = D.slots.find(s => s.key === "jewel");
  for (const phase of ["budget", "mirror"]) { const q = A.rareQuery(j, Object.assign({}, A.DEFAULTS, { phase }), "abyss").query; const and = q.stats.find(g => g.type === "and"); ok(and && and.filters.some(f => f.id === D.S.avoidShock.id && f.value.min === 50), `${phase}: abyss avoid-shock must`); }
  const ex = j.rare.extra[0].query; ok(ex.stats[0].filters.some(f => f.id === D.S.avoidShock.id && f.value.min === 50), "Hypnotic Eye extra requires 50% avoid shock");
  const hq = A.rareQuery(D.slots.find(s => s.key === "helmet"), A.DEFAULTS).query; ok(!hq.stats.some(g => g.type === "and" && g.filters.some(f => f.id === D.S.avoidShock.id)), "avoid-shock must does not leak into other slots"); }
// shop: done flag, numbering, tattoos first block
ok(D.shop.every((it, i) => it.n === i + 1), "shop numbered 1..n"); ok(D.shop[0].done === true && /Tattoo/.test(D.shop[1].item), "shop: config done, tattoos second");
ok(D.pob.now === "ipgiz0qx" && A.DEFAULTS.level === 97, "PoB id and level updated");
console.log(fails ? `${fails} failure(s)` : "all checks passed");
process.exit(fails ? 1 : 0);
