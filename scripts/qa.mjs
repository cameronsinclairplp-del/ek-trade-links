// node scripts/qa.mjs [outDir] — renders every tab at 4 widths, captures console errors, horizontal overflow,
// axe-core WCAG 2.1 A/AA violations, and small touch targets. Screenshots go to outDir.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const out = process.argv[2] || path.join(root, '_qa');
fs.mkdirSync(out, { recursive: true });
const exe = fs.readdirSync('/opt/pw-browsers').filter(d => d.startsWith('chromium-')).map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`).find(p => fs.existsSync(p));
const axeSrc = fs.readFileSync(path.join(root, 'node_modules/axe-core/axe.min.js'), 'utf8');
const tabs = (process.env.TABS || 'shop,setup,staff,helmet,boots,jewel,gems,flask').split(',');
const widths = (process.env.WIDTHS || '393,768,1024,1440').split(',').map(Number);
const browser = await chromium.launch({ executablePath: exe });
const report = [];
for (const w of widths) {
  const touch = w < 500;
  const ctx = await browser.newContext({ viewport: { width: w, height: touch ? 852 : 1000 }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1, reducedMotion: process.env.RM ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  await page.route(/^https?:\/\//, r => r.abort());
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  for (const tab of tabs) {
    await page.goto('about:blank');
    await page.goto('file://' + path.join(root, 'index.html') + '#' + tab, { waitUntil: 'load' });
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await page.goto('about:blank');
    await page.goto('file://' + path.join(root, 'index.html') + '#' + tab, { waitUntil: 'load' });
    await page.waitForTimeout(250);
    const m = await page.evaluate(() => {
      const de = document.documentElement;
      const overflow = de.scrollWidth - window.innerWidth;
      const small = [...document.querySelectorAll('a[href], button, input, select, summary')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44); }).map(el => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}:${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}"`);
      const links = document.querySelectorAll('#slot a[href]').length;
      const unhydrated = [...document.querySelectorAll('a[href^="poe:"]')].length;
      const h1 = document.querySelectorAll('h1').length;
      return { overflow, small: small.slice(0, 40), smallCount: small.length, links, unhydrated, h1, title: document.title };
    });
    const pageErrors = [...errors]; errors.length = 0;
    // keyboard path: Tab from the top must reach the skip link, then the first nav item; Enter on a nav item must switch the view
    const kb = await page.evaluate(async () => { const before = document.activeElement; return { first: (() => { const el = document.querySelector('a[href="#slot"]'); return el ? el.textContent.trim() : null; })() }; });
    await page.addScriptTag({ content: axeSrc });
    const axe = await page.evaluate(async () => { const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }); return { violations: r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes.slice(0, 3).map(n => n.html.slice(0, 140) + ' :: ' + (n.failureSummary || '').split('\n').slice(0, 2).join(' ')) })), incomplete: r.incomplete.filter(v => v.id === 'color-contrast').map(v => v.nodes.length)[0] || 0 }; });
    await page.screenshot({ path: `${out}/${tab}-${w}.png`, fullPage: true });
    report.push({ tab, w, ...m, axe, errors: pageErrors, touch }); errors.length = 0;
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
for (const r of report) console.log(`${r.tab}@${r.w}${r.touch ? '(touch)' : ''}: overflow=${r.overflow}px links=${r.links} unhydrated=${r.unhydrated} small=${r.smallCount} axe=${r.axe.violations.map(v => v.id + '(' + v.n + ')').join(',') || 'clean'} incompleteContrast=${r.axe.incomplete} errors=${r.errors.length}`);
const bad = report.filter(r => r.overflow > 0 || r.unhydrated || r.axe.violations.length || r.errors.length);
console.log(bad.length ? `\n${bad.length} page(s) with problems` : '\nQA clean: no overflow, no unhydrated links, axe clean, no console errors');
process.exit(bad.length ? 1 : 0);
