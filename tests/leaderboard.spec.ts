import { test, expect, type Page } from '@playwright/test';
import { tips } from '../src/data/tips';

const key = 'noobtips.ratings.v2';
const rows = (page: Page) => page.locator('.leaderboard-row');
async function open(page: Page) {
  await page.goto('./');
  await page.getByRole('button', { name: 'SPELEN!', exact: true }).click();
  await page.getByRole('button', { name: 'DE VUILNISBELT', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'DE VUILNISBELT' })).toBeFocused();
}
test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('empty Top 20 ignores inactive and orphaned ratings and preserves menu state', { tag: '@smoke' }, async ({ page }) => {
  const history = JSON.stringify({ arc: ['arc-001'], general: ['general-001'] });
  const ratings = JSON.stringify({ 'school-001': 5, deleted: 5, 'arc-001': 0 });
  await page.addInitScript(({ history, ratings, key }) => {
    localStorage.setItem(key, ratings); localStorage.setItem('noobtips.history.v1', history);
  }, { history, ratings, key });
  await page.goto('./'); await page.getByRole('button', { name: 'SPELEN!', exact: true }).click();
  await page.getByRole('button', { name: 'Arc Raiders', exact: true }).click();
  const sound = await page.locator('.sound-button').getAttribute('aria-pressed');
  await page.getByRole('button', { name: 'DE VUILNISBELT', exact: true }).click();
  await expect(page.getByText('Nog geen glorieuze onzin.')).toBeVisible();
  await expect(rows(page)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'DE VUILNISBELT', exact: true })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'De 20 slechtste tips', exact: true })).toBeVisible();
  await expect(page.getByText('0 tips weggegooid', { exact: true })).toBeVisible();
  await expect(page.locator('.leaderboard')).not.toContainText('ereplaats');
  await expect(page.locator('.mountain-caption h2')).toHaveCount(0);
  await expect(page.locator('.leaderboard button')).toHaveCount(1);
  await page.getByRole('button', { name: 'TERUG NAAR HOOFDMENU', exact: true }).click();
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'ready');
  await expect(page.getByRole('button', { name: 'DE VUILNISBELT', exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Arc Raiders', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.sound-button')).toHaveAttribute('aria-pressed', sound!);
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(ratings);
  expect(await page.evaluate(() => localStorage.getItem('noobtips.history.v1'))).toBe(history);
});

for (const count of [3, 20, tips.length]) test(`Top 20 ranks ${count} rated tips with stable ties and complete text`, async ({ page, browserName }, testInfo) => {
  const ratings = Object.fromEntries(tips.slice(0, count).map((tip, index) => [tip.id, index % 5 + 1]));
  const expected = tips.filter(tip => ratings[tip.id]).sort((a, b) => ratings[b.id] - ratings[a.id] || (a.id < b.id ? -1 : 1)).slice(0, 20);
  await page.addInitScript(({ ratings, key }) => localStorage.setItem(key, JSON.stringify(Object.entries(ratings).map(([tipId,value],i)=>({id:String(i),tipId,value})))), { ratings, key });
  await open(page);
  await expect(rows(page)).toHaveCount(Math.min(count, 20));
  expect(await rows(page).evaluateAll(elements => elements.map(el => el.getAttribute('data-tip-id')))).toEqual(expected.map(tip => tip.id));
  await expect(page.locator('.leaderboard-tip p')).toHaveText(expected.map(tip => tip.text));
  await expect(page.locator('.leaderboard-category')).toHaveText(expected.map(tip => tip.category === 'arc' ? 'Arc Raiders' : 'Algemeen'));
  expect(await page.locator('.leaderboard-score').evaluateAll(elements => elements.map(el => el.getAttribute('aria-label')))).toEqual(expected.map(tip => `${ratings[tip.id]} van 5 prullenbakken`));
  await expect(page.locator('.leaderboard [role=radio]')).toHaveCount(0);
  const medals = await rows(page).evaluateAll(elements => elements.slice(0, 3).map(el => getComputedStyle(el).getPropertyValue('--medal')));
  expect(new Set(medals).size).toBe(3);
  if (count >= 20) {
    const list = page.getByRole('region', { name: 'Gerangschikte noobtips' });
    const header = await page.locator('.leaderboard-header').boundingBox();
    const navigation = await page.locator('.leaderboard-footer').boundingBox();
    const box = (await list.boundingBox())!;
    if (testInfo.project.use.hasTouch && browserName === 'chromium') {
      const cdp = await page.context().newCDPSession(page);
      const x = box.x + box.width / 2, y = box.y + box.height - 30;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let distance = 25; distance <= 250; distance += 25) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - distance }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
    } else if (testInfo.project.use.hasTouch) {
      // Playwright mobile WebKit exposes no native swipe/wheel input. Verify
      // its scroll container directly; real touch input is covered in Chromium.
      await list.evaluate(el => el.scrollBy({ top: 500, behavior: 'instant' }));
    } else {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, 500);
    }
    await expect.poll(() => list.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    await rows(page).last().scrollIntoViewIfNeeded();
    await expect(rows(page).last()).toBeInViewport();
    expect(await page.locator('.leaderboard-header').boundingBox()).toEqual(header);
    expect(await page.locator('.leaderboard-footer').boundingBox()).toEqual(navigation);
  }
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth && document.querySelector('main')!.scrollTop === 0)).toBe(true);
  await page.reload(); await page.getByRole('button', { name: 'SPELEN!', exact: true }).click();
  await page.getByRole('button', { name: 'DE VUILNISBELT', exact: true }).click();
  expect(await rows(page).evaluateAll(elements => elements.map(el => el.getAttribute('data-tip-id')))).toEqual(expected.map(tip => tip.id));
});

test('Top 20 reflects gameplay ratings and changes from another window', { tag: '@smoke' }, async ({ page, context }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('./');
  await page.getByRole('button', { name: 'SPELEN!', exact: true }).click();
  await page.getByRole('button', { name: 'Geef me een Noobtip!', exact: true }).click();
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'rating');
  const id = (await page.locator('main').getAttribute('data-tip-id'))!;
  await page.getByRole('radio', { name: /^2 van 5/ }).click();
  await page.getByRole('radio', { name: /^5 van 5/ }).click();
  await page.getByRole('button', { name: 'TERUG NAAR HOOFDMENU' }).click();
  await page.getByRole('button', { name: 'DE VUILNISBELT', exact: true }).click();
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toHaveAttribute('data-tip-id', id);
  await expect(rows(page).first()).toHaveAttribute('data-rating', '5');
  const other = await context.newPage(); await other.goto('./');
  await other.evaluate(({ id, key }) => localStorage.setItem(key, JSON.stringify([{id:'other1',tipId:id,value:1},{id:'other2',tipId:'arc-030',value:5}])), { id, key });
  await expect(rows(page)).toHaveCount(2);
  await expect(rows(page).first()).toHaveAttribute('data-tip-id', 'arc-030');
  await expect(rows(page).last()).toHaveAttribute('data-rating', '1');
  await other.close();
});
