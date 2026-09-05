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
  const det = await page.$('#slot details.disc'); await det.evaluate(d => { d.open = true; });
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
  ok(p1.ticked === 1 && p1.boxes === 26, `${p1.ticked} PoB-verified step pre-ticked of ${p1.boxes}`);
  ok(p1.exch >= 1 && p1.pending === 0, `${p1.exch} bulk-exchange links hydrated (${p1.pending} pending)`);
  await page.click('input[data-done="config"]'); await page.waitForTimeout(150);
  const p2 = await page.evaluate(() => ({ ls: JSON.parse(localStorage.getItem('ek-state')).done, next: document.querySelector('#slot [data-jump]').dataset.jump, txt: document.querySelector('#slot [role="progressbar"]').getAttribute('aria-valuenow'), focus: document.activeElement.dataset.done }));
  ok(p2.ls && p2.ls.config === true && p2.next === 'tree' && p2.txt === '2' && p2.focus === 'config', `tick saved (${JSON.stringify(p2.ls)}), Next moved to ${p2.next}, progress ${p2.txt}, focus kept`);
  await page.reload(); await page.waitForTimeout(250);
  const p3 = await page.evaluate(() => ({ ticked: document.querySelectorAll('#slot input[data-done]:checked').length, next: document.querySelector('#slot [data-jump]').dataset.jump }));
  ok(p3.ticked === 2 && p3.next === 'tree', `tick survives reload (${p3.ticked} ticked, next ${p3.next})`);
  await page.click('#slot [data-jump]'); await page.waitForTimeout(400);
  const p4 = await page.evaluate(() => { const d = document.getElementById('p-tree'); const r = d.getBoundingClientRect(); return { open: d.open, onScreen: r.top >= 0 && r.top < window.innerHeight, focus: document.activeElement.tagName }; });
  ok(p4.open && p4.onScreen && p4.focus === 'SUMMARY', `Jump opens the step, scrolls to it and focuses its summary (${JSON.stringify(p4)})`);
  await page.click('#slot [data-goto="setup"]'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => document.getElementById('slot-title').textContent === 'Setup (free)' && location.hash === '#setup'), 'step tab button navigates');
  ok(errs.length === 0, `no page errors on the Path (${errs.join('; ')})`);
  await page.close();
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
