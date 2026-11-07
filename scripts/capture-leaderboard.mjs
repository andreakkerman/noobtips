import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const output = path.resolve('docs/review/noobtips-v1.6');
await mkdir(output, { recursive: true });
const source = await readFile('src/data/tips.ts', 'utf8');
const tips = [...source.matchAll(/\['((arc|general)-\d+)', '(.+)'\]/g)].map(match => ({ id: match[1], text: match[3] }));
assert(tips.length > 0);
const longest = [...tips].sort((a, b) => b.text.length - a.text.length)[0];
const browser = await chromium.launch();
const report = { captures: [], errors: [], longestTip: longest.id };
try {
  for (const [width, height] of [[1024, 768], [1280, 800], [1366, 768]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width === 1024, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/');
    await page.evaluate(() => document.fonts.ready);
    const capture = async label => {
      const filename = `${width}x${height}-leaderboard-${label}.png`;
      await page.screenshot({ path: path.join(output, filename), animations: 'disabled' });
      report.captures.push(filename);
    };
    await page.getByRole('button', { name: 'SPELEN!', exact: true }).click();
    await capture('menu');
    for (const count of [0, 3, 20, 60]) {
      // Synthetic ratings exist only in this isolated browser's review fixture.
      const pool = [longest, ...tips.filter(tip => tip.id !== longest.id)].slice(0, count);
      const ratings = Object.fromEntries(pool.map((tip, index) => [tip.id, index === 0 ? 5 : 4 - index % 4]));
      await page.evaluate(ratings => localStorage.setItem('noobtips.ratings.v2', JSON.stringify(Object.entries(ratings).map(([tipId,value],i)=>({id:String(i),tipId,value})))), ratings);
      await page.reload();
      await page.getByRole('button', { name: 'SPELEN!', exact: true }).click();
      await page.getByRole('button', { name: 'DE VUILNISBELT', exact: true }).click();
      assert.equal(await page.locator('.leaderboard-row').count(), Math.min(count, 20));
      assert(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth));
      await capture(`${count}-ratings`);
      if (count === 60) {
        await page.locator('.leaderboard-row').last().scrollIntoViewIfNeeded();
        await capture('bottom');
        await page.getByRole('button', { name: 'TERUG NAAR HOOFDMENU', exact: true }).click();
        await page.getByRole('button', { name: 'Arc Raiders', exact: true }).click();
        await page.getByRole('button', { name: 'DE VUILNISBELT', exact: true }).click();
        await capture('arc-background');
      }
    }
    await context.close();
  }
  assert.deepEqual(report.errors, []);
  await writeFile(path.join(output, 'leaderboard-capture-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
