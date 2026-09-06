// node scripts/interact.mjs — behavioural checks: keyboard path, navigation, phase toggle, weight editing, focus retention,
// disclosure persistence, hover without layout shift, reduced motion. Asserts on rendered DOM, never on class names alone.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const exe = fs.readdirSync('/opt/pw-browsers').filter(d => d.startsWith('chromium-')).map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`).find(p => fs.existsSync(p));
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const browser = await chromium.launch({ executablePath: exe });
const url = 'file://' + path.join(root, 'index.html');

// --- desktop
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route(/^https?:\/\//, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url + '#shop'); await page.waitForTimeout(200);
  // keyboard: first Tab lands on the skip link and it becomes visible
  await page.keyboard.press('Tab');
  const skip = await page.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return { text: a.textContent.trim(), visible: r.width > 20 && r.height > 20 }; });
  ok(skip.text === 'Skip to content' && skip.visible, 'Tab #1 focuses a visible skip link');
  await page.keyboard.press('Enter'); await page.waitForTimeout(50);
  ok(await page.evaluate(() => location.hash === '#slot' || document.activeElement.id === 'slot'), 'Enter on skip link jumps to content');
  // nav click changes the view + hash + aria-current
  await page.click('#nav-list a[data-slot="boots"]'); await page.waitForTimeout(150);
  const nav = await page.evaluate(() => ({ h2: document.getElementById('slot-title').textContent, hash: location.hash, cur: document.querySelector('#nav-list a[aria-current="page"]').dataset.slot, focus: document.activeElement.id, cards: document.querySelectorAll('#slot section.card').length }));
  ok(nav.h2 === 'Boots' && nav.hash === '#boots' && nav.cur === 'boots' && nav.focus === 'slot' && nav.cards >= 3, `nav → Boots (h2=${nav.h2}, hash=${nav.hash}, focus=${nav.focus}, cards=${nav.cards})`);
  // phase toggle flips aria-pressed, loadout heading, slot subtitle, and the weighted query (mirror boots need 28% MS)
  const before = await page.evaluate(() => document.querySelector('#slot-sub').textContent);
  await page.click('[data-phase="mirror"]'); await page.waitForTimeout(150);
  const ph = await page.evaluate(() => ({ pressed: document.querySelector('[data-phase="mirror"]').getAttribute('aria-pressed'), notPressed: document.querySelector('[data-phase="budget"]').getAttribute('aria-pressed'), head: document.getElementById('loadout-h').textContent, sub: document.querySelector('#slot-sub').textContent, must: document.querySelector('#slot p.text-xs\\/5 span.font-medium') && document.querySelector('#slot .card-hd p.text-xs\\/5').textContent }));
  ok(ph.pressed === 'true' && ph.notPressed === 'false' && /Mirror/.test(ph.head) && /Mirror/.test(ph.sub) && ph.sub !== before, `phase → mirror (head="${ph.head.slice(0, 30)}", sub="${ph.sub}")`);
  ok(/Movement Speed ≥ 28/.test(ph.must || '') && !/Recently ≥/.test(ph.must || ''), `mirror boots hard filters: MS ≥ 28, flag stat without a number (${(ph.must || '').slice(0, 120)})`);
  await page.click('[data-phase="budget"]'); await page.waitForTimeout(150);
  // weights: open disclosure, edit a weight, it persists through the re-render and focus stays on the input
  const det = await page.$('#slot details.disc:not([data-pob-details])'); await det.evaluate(d => { d.open = true; });
  const inp = await page.$('#slot input[data-wkey]');
  const stat = await inp.getAttribute('data-stat');
  await inp.click({ clickCount: 3 }); await page.keyboard.type('7.5'); await page.keyboard.press('Tab'); await page.waitForTimeout(150);
  const w = await page.evaluate(s => { const el = document.querySelector(`#slot input[data-stat="${s}"]`); return { val: el.value, open: el.closest('details').open, ls: JSON.parse(localStorage.getItem('ek-state')).weights }; }, stat);
  ok(w.val === '7.5' && w.open && JSON.stringify(w.ls).includes('7.5'), `weight edit persists (${stat}=7.5, details stayed open, saved to localStorage)`);
  // reset weights restores default and shows a toast
  await page.click('#slot [data-reset]'); await page.waitForTimeout(100);
  const rs = await page.evaluate(s => ({ val: document.querySelector(`#slot input[data-stat="${s}"]`).value, toast: !document.getElementById('toast').hidden && document.getElementById('toast').textContent }), stat);
  ok(rs.val !== '7.5' && rs.toast === 'Weights reset', `reset restores default (${rs.val}) with toast "${rs.toast}"`);
  // hover on primary button: colour changes, geometry does not
  const btn = await page.$('#slot a.btn-primary');
  const g1 = await btn.evaluate(b => { const r = b.getBoundingClientRect(); return [r.x, r.y, r.width, r.height, getComputedStyle(b).backgroundColor]; });
  await btn.hover(); await page.waitForTimeout(250);
  const g2 = await btn.evaluate(b => { const r = b.getBoundingClientRect(); return [r.x, r.y, r.width, r.height, getComputedStyle(b).backgroundColor]; });
  ok(g1.slice(0, 4).join() === g2.slice(0, 4).join() && g1[4] !== g2[4], `hover changes colour (${g1[4]} → ${g2[4]}) without layout shift`);
  const tr = await btn.evaluate(b => getComputedStyle(b).transitionDuration);
  ok(/0\.15s|150ms/.test(tr), `button transition is 150ms (${tr})`);
  // links are real https URLs after hydration; none left pending
  const links = await page.evaluate(() => { const as = [...document.querySelectorAll('#slot a[href]')]; return { n: as.length, pending: as.filter(a => a.classList.contains('is-pending')).length, https: as.filter(a => /^https:\/\/www\.pathofexile\.com\/trade\/search\/Allflame\/H4sI/.test(a.href)).length }; });
  ok(links.pending === 0 && links.https === links.n, `${links.n} trade links hydrated to gzip URLs`);
  // level buttons update header and query
  await page.click('#s-level-dn'); await page.waitForTimeout(100);
  ok(await page.evaluate(() => document.getElementById('hdr-level').textContent === '96' && document.getElementById('s-level').value === '96'), 'level − updates input and header');
  await page.click('#s-level-up'); await page.waitForTimeout(100);
  ok(errs.length === 0, `no page errors (${errs.join('; ')})`);
  await page.close();
}
// --- mobile: settings collapse, nav select, 44px controls
{
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true });
  await page.route(/^https?:\/\//, r => r.abort());
  await page.goto(url + '#staff'); await page.waitForTimeout(200);
  const m1 = await page.evaluate(() => ({ gridHidden: getComputedStyle(document.getElementById('settings-grid')).display === 'none', sum: document.getElementById('settings-sum').textContent, exp: document.getElementById('settings-toggle').getAttribute('aria-expanded') }));
  ok(m1.gridHidden && /Level 97 · max 100 div/.test(m1.sum) && m1.exp === 'false', `mobile settings collapsed with summary "${m1.sum}"`);
  await page.click('#settings-toggle'); await page.waitForTimeout(100);
  const m2 = await page.evaluate(() => ({ shown: getComputedStyle(document.getElementById('settings-grid')).display === 'grid', exp: document.getElementById('settings-toggle').getAttribute('aria-expanded'), txt: document.getElementById('settings-toggle').textContent }));
  ok(m2.shown && m2.exp === 'true' && m2.txt === 'Done', 'Edit expands the settings grid (aria-expanded=true, label → Done)');
  await page.selectOption('#nav-select', 'gems'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => document.getElementById('slot-title').textContent === 'Gems' && location.hash === '#gems'), 'mobile nav select switches view');
  const minH = await page.evaluate(() => Math.min(...[...document.querySelectorAll('#slot a.btn, #slot button.btn, .seg, #settings-toggle')].map(e => e.getBoundingClientRect().height)));
  ok(minH >= 44, `smallest control on phone is ${minH}px tall (≥ 44)`);
  await page.close();
}
// --- the Path: first visit lands on it, next step open, tick persists and moves "Next", exchange links hydrate, jump opens
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route(/^https?:\/\//, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(250);
  const p1 = await page.evaluate(() => ({ title: document.getElementById('slot-title').textContent, hash: location.hash, open: [...document.querySelectorAll('#slot details[open]')].map(d => d.id), next: document.querySelector('#slot [data-jump]').dataset.jump, ticked: document.querySelectorAll('#slot input[data-done]:checked').length, boxes: document.querySelectorAll('#slot input[data-done]').length, exch: [...document.querySelectorAll('#slot a[href*="/trade/exchange/Allflame/H4sI"]')].length, pending: document.querySelectorAll('#slot a.is-pending').length }));
  ok(p1.title === 'Path' && (p1.hash === '' || p1.hash === '#path'), `first visit lands on the Path (${p1.title}, hash "${p1.hash}")`);
  ok(p1.open.length === 1 && p1.open[0] === 'p-' + p1.next, `only the next step (${p1.next}) is open by default`);
  ok(p1.ticked === 2 && p1.boxes === 25, `${p1.ticked} PoB-verified steps pre-ticked of ${p1.boxes}`);
  ok(p1.exch >= 1 && p1.pending === 0, `${p1.exch} bulk-exchange links hydrated (${p1.pending} pending)`);
  await page.click('input[data-done="tree"]'); await page.waitForTimeout(150);
  const p2 = await page.evaluate(() => ({ ls: JSON.parse(localStorage.getItem('ek-state')).done, next: document.querySelector('#slot [data-jump]').dataset.jump, txt: document.querySelector('#slot [role="progressbar"]').getAttribute('aria-valuenow'), focus: document.activeElement.dataset.done }));
  ok(p2.ls && p2.ls.tree === true && p2.next === 'tattoo' && p2.txt === '3' && p2.focus === 'tree', `tick saved (${JSON.stringify(p2.ls)}), Next moved to ${p2.next}, progress ${p2.txt}, focus kept`);
  await page.reload(); await page.waitForTimeout(250);
  const p3 = await page.evaluate(() => ({ ticked: document.querySelectorAll('#slot input[data-done]:checked').length, next: document.querySelector('#slot [data-jump]').dataset.jump }));
  ok(p3.ticked === 3 && p3.next === 'tattoo', `tick survives reload (${p3.ticked} ticked, next ${p3.next})`);
  await page.click('#slot [data-jump]'); await page.waitForTimeout(1000);
  const p4 = await page.evaluate(() => { const d = document.getElementById('p-tattoo'); const r = d.getBoundingClientRect(); return { open: d.open, onScreen: r.top >= 0 && r.top < window.innerHeight, focus: document.activeElement.tagName }; });
  ok(p4.open && p4.onScreen && p4.focus === 'SUMMARY', `Jump opens the step, scrolls to it and focuses its summary (${JSON.stringify(p4)})`);
  await page.click('#p-tattoo [data-goto="setup"]'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => document.getElementById('slot-title').textContent === 'Setup (free)' && location.hash === '#setup'), 'step tab button navigates');
  ok(errs.length === 0, `no page errors on the Path (${errs.join('; ')})`);
  await page.close();
}
// --- PoB weights: paste the Find-best link on the helmet card → PoB's weights + floor in every helmet search; hand/PoB toggle; forget
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route(/^https?:\/\//, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url + '#helmet'); await page.waitForTimeout(250);
  const pobUrl = 'https://www.pathofexile.com/trade/search/Allflame/H4sIAAAAAAAACqVW227bRhD9Fz4bi7lf9CtBIagOkxCQJYei2gaG_r3Y2GjtYCdwEL6QBBeHM-ecuTxNl-2wXS_T7mk6P27L-TTtpst8f10Pfx7n6Xb3_ftl2n14mrZvj_O0m_6el89ftulu-rQct3l9_rZ8nHbT42W-fjy359t-O2-H4_7Tss77db4sl-1wup-nu-mvw_E69_-9AO2yBbmZB7Oz0e1294I3__N4XO6XrfUY9kSuxJQ6wqBsjsiB6QFm_2MsD7-P8TYO49RUVBphcGNTVhIOT-AKg1UtSBJzBIJNLDMlySQcS0KEVdnScAQCTZJRQSADHUtarWfriUNKtCVwMgWohdbScIS6sPswHW9GhsTJoZ4lJ9ZZF3IZc-KqlGGSElrpK6hCmuLDbKyFAwShGASXgQhqsBOPk2lAQcJCEGhSGo3DhZjYxtpghJgDpAJwaRNSRHYIjHHdGJqiuRAmaAkSjGjKY16hoacxpgShQkkKIjOgaXKVEJuYplNClkZxF9AUGdYONBRjcQuzn0TCKAhdx6HG0EQYCZTIncjr4rEUNKdhBb4I1K0kEFGjOIZld8vYb2qWBr2lKEfpN1ACdqkSIuZeFukZ9pMaVMfIBBnKrI2ZiFgU0dJL20pQKGkUfQkE2Xs_QIvScJiZvY9SZbgUB2JGUxUpZWZCowQpWHkfigCqEULpuLQkV0A0gLLlEwNwZmiVEWCGs3cdodSZlTjMs9IZkwTRUTMiK4WYEz2hKkPt2XAwB0rdndhAUsz8F1F-YAWNIF3Gk_C9sSiJp7sUQ-ydobj0pmFYCAQhIL0fk6VKqRCJsCRRVDDk7JysYiZSTiHOCJZ0GE4QaIDJHgZMCap4u_3x6tjDcuqrCDTVblsBo_h-4r9163kT2796f_V4f9jmz-f125uF7rA-nK9r-zIfH-atL3XrYV22t2dO59P1tHy9ztOtX_8CH0ddxxkKAAA';
  await page.evaluate(() => { document.querySelector('details[data-pob-details]').open = true; });
  await page.fill('[data-pob-url]', pobUrl); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  const decode = async () => page.evaluate(() => [...document.querySelectorAll('#slot a[href^="https"]')].map(a => a.href));
  const gunzip = (await import('node:zlib')).gunzipSync;
  const dec = u => JSON.parse(gunzip(Buffer.from(u.split('/').pop().replace(/-/g, '+').replace(/_/g, '/'), 'base64')).toString());
  const p1 = await page.evaluate(() => ({ badge: document.querySelector('[data-pob-details] .badge').textContent, minsum: document.getElementById('r-minsum').value, rows: document.querySelectorAll('#slot input[data-wkey]').length, saved: Object.keys(JSON.parse(localStorage.getItem('ek-state')).pob) }));
  ok(p1.badge === "Using PoB's 34 weights" && p1.minsum === '290.55' && p1.rows === 34 && p1.saved[0] === 'helmet', `paste → PoB weights in use (${p1.badge}, floor ${p1.minsum}, ${p1.rows} rows)`);
  const L1 = (await decode()).map(dec);
  ok(L1.length >= 4 && L1.every(q => q.stats[0].type === 'weight' && q.stats[0].filters.length === 34) && L1[0].stats[0].value.min === 290.55 && L1.slice(1).every(q => q.stats[0].value.min === 1 && q.stats.some(g => g.type === 'and')), `${L1.length} helmet links: PoB weights first, card floor on the weighted card only, locks kept on the extras`);
  await page.click('[data-pob-src="hand"]'); await page.waitForTimeout(200);
  const L2 = (await decode()).map(dec); const rows2 = await page.evaluate(() => document.querySelectorAll('#slot input[data-wkey]').length);
  ok(L2.every(q => q.stats[0].type === 'weight2') && rows2 === 16, `hand weights again: weight2 groups, ${rows2} rows`);
  await page.click('[data-pob-src="pob"]'); await page.waitForTimeout(200);
  await page.evaluate(() => { document.querySelector('#slot details.disc:not([data-pob-details])').open = true; });
  await page.fill('#slot input[data-wkey]', '0'); await page.dispatchEvent('#slot input[data-wkey]', 'change'); await page.waitForTimeout(200);
  const L3 = (await decode()).map(dec); ok(L3[0].stats[0].filters.length === 33 && !L3[0].stats[0].filters.some(f => f.id === 'pseudo.pseudo_total_fire_resistance'), 'zeroing a PoB weight removes it from the query');
  await page.reload(); await page.waitForTimeout(250);
  const p4 = await page.evaluate(() => ({ badge: document.querySelector('[data-pob-details] .badge') && document.querySelector('[data-pob-details] .badge').textContent, rows: document.querySelectorAll('#slot input[data-wkey]').length }));
  ok(p4.badge === "Using PoB's 34 weights" && p4.rows === 34, 'PoB set survives reload');
  await page.evaluate(() => { document.querySelector('details[data-pob-details]').open = true; });
  await page.click('[data-pob-forget]'); await page.waitForTimeout(200);
  const p5 = await page.evaluate(() => ({ badge: !!document.querySelector('[data-pob-details] .badge'), rows: document.querySelectorAll('#slot input[data-wkey]').length, pob: Object.keys(JSON.parse(localStorage.getItem('ek-state')).pob || {}).length }));
  ok(!p5.badge && p5.rows === 16 && p5.pob === 0, 'Forget clears the set and restores hand weights');
  await page.evaluate(() => { document.querySelector('details[data-pob-details]').open = true; });
  await page.fill('[data-pob-url]', 'not a link'); await page.click('[data-pob-use]'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => !document.getElementById('toast').hidden && /isn't a trade link/.test(document.getElementById('toast').textContent)), 'bad paste → toast, nothing saved');
  ok(errs.length === 0, `no page errors on the PoB flow (${errs.join('; ')})`);
  await page.close();
}
// --- Path: the gloves crafting guide opens inside the step, its links hydrate, the white-base link carries no weight group
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route(/^https?:\/\//, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url + '#path'); await page.waitForTimeout(300);
  await page.evaluate(() => { document.getElementById('p-gloves').open = true; document.getElementById('g-gloves').open = true; });
  await page.waitForTimeout(300);
  const gunzip = (await import('node:zlib')).gunzipSync;
  const dec = u => JSON.parse(gunzip(Buffer.from(u.split('/').pop().replace(/-/g, '+').replace(/_/g, '/'), 'base64')).toString());
  const g1 = await page.evaluate(() => ({ steps: document.querySelectorAll('#g-gloves ol[aria-label] > li').length, costs: document.querySelectorAll('#g-gloves dl > div').length, links: [...document.querySelectorAll('#g-gloves a[href^="https"]')].map(a => a.textContent.trim().replace(/ \(trade site.*$/, '') + '|' + a.href), pending: document.querySelectorAll('#g-gloves a.is-pending').length, verdict: /Bad news first/.test(document.querySelector('#g-gloves').textContent) }));
  ok(g1.steps === 7 && g1.costs >= 10 && g1.verdict, `gloves guide: ${g1.steps} steps, ${g1.costs} prices, verdict shown`);
  const white = g1.links.find(l => l.startsWith('White Warlock'));
  const wq = white && dec(white.split('|')[1]);
  ok(g1.pending === 0 && g1.links.length === 5 && wq && wq.stats.length === 0 && wq.filters.type_filters.filters.rarity.option === 'normal', `guide links hydrated (${g1.links.length}); white-base search is plain (${wq ? wq.stats.length : '?'} stat groups)`);
  const donor = g1.links.find(l => l.startsWith('Clean donor')); const dq = donor && dec(donor.split('|')[1]);
  ok(dq && dq.stats[0].type === 'weight2' && dq.stats.some(gp => gp.filters.some(f => f.id === 'pseudo.pseudo_number_of_suffix_mods')), 'clean-donor link: weighted + one-suffix lock');
  await page.click('[data-phase="mirror"]'); await page.waitForTimeout(200); await page.click('[data-phase="budget"]'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => document.getElementById('g-gloves').open === true && document.getElementById('p-gloves').open === true), 'guide stays open across a re-render');
  ok(errs.length === 0, `no page errors on the guide (${errs.join('; ')})`);
  await page.close();
}
// --- Maps: four regex cards with copy, tier filter on the pool tables, 8-mod buy links carry the ban list
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage(); await page.route(/^https?:\/\//, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url + '#maps'); await page.waitForTimeout(300);
  const gunzip = (await import('node:zlib')).gunzipSync;
  const dec = u => JSON.parse(gunzip(Buffer.from(u.split('/').pop().replace(/-/g, '+').replace(/_/g, '/'), 'base64')).toString());
  const m1 = await page.evaluate(() => ({ title: document.getElementById('slot-title').textContent, cards: document.querySelectorAll('#slot textarea[data-regex]').length, lens: [...document.querySelectorAll('#slot textarea[data-regex]')].map(t => t.value.length), rows: document.querySelectorAll('#slot [data-mod-tier]').length, links: [...document.querySelectorAll('#slot a[href^="https"]')].map(a => a.href), pending: document.querySelectorAll('#slot a.is-pending').length }));
  ok(m1.title === 'Maps' && m1.cards === 4 && m1.lens.every(n => n <= 250) && m1.rows === 122, `Maps tab: ${m1.cards} regex cards (${m1.lens.join('/')} chars), ${m1.rows} mod rows`);
  const qs = m1.links.map(dec);
  ok(m1.pending === 0 && qs.length >= 6 && qs.every(q => q.stats[1].type === 'not' && q.stats[1].filters.length >= 8 && q.stats[0].filters[0].value.min === 4) && qs.some(q => q.type === 'Nightmare Map') && qs.some(q => q.filters && q.filters.map_filters.filters.map_tier.min === 16), `${qs.length} buy links hydrated: 8-mod lock + ban list on every one (${qs.map(q => q.stats[1].filters.length).join('/')} banned)`);
  await page.click('#slot [data-copy-text]'); await page.waitForTimeout(200);
  const c1 = await page.evaluate(async () => ({ clip: await navigator.clipboard.readText(), toast: document.getElementById('toast').textContent, hidden: document.getElementById('toast').hidden }));
  ok(/^"!te of\|lier\$/.test(c1.clip) && / "!y: \(n\|m\)"$/.test(c1.clip) && !c1.hidden && /Regex copied/.test(c1.toast), `Copy regex → clipboard has the T16 Safe string (${c1.clip.length} chars), toast "${c1.toast}"`);
  await page.click('#slot section[aria-label="Normal pool"] [data-tier="brick"]'); await page.waitForTimeout(100);
  const f1 = await page.evaluate(() => { const sec = document.querySelector('#slot section[aria-label="Normal pool"]'); return { shown: [...sec.querySelectorAll('[data-mod-tier]')].filter(li => !li.hidden).length, tiers: [...new Set([...sec.querySelectorAll('[data-mod-tier]')].filter(li => !li.hidden).map(li => li.dataset.modTier))], pressed: sec.querySelector('[data-tier][aria-pressed="true"]').dataset.tier, other: document.querySelectorAll('#slot section[aria-label="Nightmare pool"] [data-mod-tier]:not([hidden])').length }; });
  ok(f1.shown === 4 && f1.tiers.join() === 'brick' && f1.pressed === 'brick' && f1.other === 44, `tier filter: Brick shows the 4 normal-pool bricks, nightmare table untouched (${f1.other})`);
  await page.evaluate(() => { document.querySelector('#d-map-nm-safe').open = true; });
  const b1 = await page.evaluate(() => document.querySelectorAll('#d-map-nm-safe li').length);
  ok(b1 === 40, `Nightmare Safe "what it bans" lists 40 lines (${b1})`);
  const t1 = await page.evaluate(() => { const t = document.querySelector('#slot textarea[data-regex]'); t.focus(); return { sel: t.selectionEnd - t.selectionStart, len: t.value.length }; });
  ok(t1.sel === t1.len, 'focusing a regex box selects all of it');
  ok(errs.length === 0, `no page errors on Maps (${errs.join('; ')})`);
  await ctx.close();
}
// --- reduced motion
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage(); await page.route(/^https?:\/\//, r => r.abort());
  await page.goto(url + '#shop'); await page.waitForTimeout(200);
  const d = await page.evaluate(() => getComputedStyle(document.querySelector('#slot a.btn-primary')).transitionDuration);
  ok(parseFloat(d) < 0.001, `prefers-reduced-motion collapses transitions (${d})`);
  await ctx.close();
}
await browser.close();
console.log(fails ? `${fails} failure(s)` : 'all behavioural checks passed');
process.exit(fails ? 1 : 0);
