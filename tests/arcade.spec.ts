import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  // Functional checks use the real reduced-motion path. Keep animation, interruption
  // and touch-during-spin tests at normal speed on every regression viewport.
  if (!/normal animation|reduced motion|touch targets/.test(testInfo.title)) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  }
});

async function enter(page: Page) { await page.getByRole('button', { name: 'SPELEN!', exact: true }).click(); }

const main = (page: Page) => page.locator('main');
async function spinToResult(page: Page) {
  // Record transient phases before clicking: reduced-motion spins can finish
  // between driver round-trips, especially on a busy WebKit runner.
  await page.evaluate(() => {
    const phases: string[] = [];
    (window as Window & { spinPhases?: string[] }).spinPhases = phases;
    const element = document.querySelector('main')!;
    const observer = new MutationObserver(() => {
      const phase = element.getAttribute('data-phase')!;
      phases.push(phase);
      if (phase === 'rating') observer.disconnect();
    });
    observer.observe(element, { attributes: true, attributeFilter: ['data-phase'] });
  });
  await page.getByRole('button', { name: /^(Geef me een Noobtip!|Geef me nog een Noobtip!)$/ }).click();
  await expect(main(page)).toHaveAttribute('data-phase', 'rating');
  expect(await page.evaluate(() => (window as Window & { spinPhases?: string[] }).spinPhases))
    .toEqual(expect.arrayContaining(['spinning', 'revealing', 'rating']));
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight && document.querySelector('main')!.scrollTop === 0)).toBe(true);
}

test('ready screen, default category and slogan', { tag: '@smoke' }, async ({ page, baseURL }) => {
  const external: string[] = []; page.on('request', request => { if (!request.url().startsWith(new URL(baseURL!).origin + '/') && !request.url().startsWith('data:')) external.push(request.url()); });
  await page.goto('./'); await enter(page);
  await expect(page).toHaveTitle('Noobtips.nl');
  await expect(page.locator('.spin-button > svg')).toHaveCount(1);
  await expect(page.locator('.spin-button > svg:last-child path')).toHaveAttribute('d', 'M4 12h15m-6-6 6 6-6 6');
  await expect(page.getByRole('button', { name: 'Algemeen', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.category')).toHaveText(['Algemeen', 'Arc Raiders']);
  await expect(page.getByRole('button', { name: 'School', exact: true })).toHaveCount(0);
  await expect(page.locator('.slogan s')).toHaveText('niks');
  await expect(page.getByRole('button', { name: 'Geef me een Noobtip!', exact: true })).toBeVisible();
  await noOverflow(page); expect(external).toEqual([]);
});

test('category selection controls the entire tip pool', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('./'); await enter(page);
  for (const [name, prefix] of [['Algemeen', 'general-'], ['Arc Raiders', 'arc-']]) {
    await page.getByRole('button', { name, exact: true }).click();
    const background = await page.locator('.scene-background').evaluate(el => getComputedStyle(el, '::before').backgroundImage);
    expect(background).toContain(name === 'Arc Raiders' ? 'arc-raiders-winter.webp' : 'observatory.webp');
    if (name === 'Algemeen') expect(background).not.toContain('arc-raiders-winter');
    await spinToResult(page);
    expect(await main(page).getAttribute('data-tip-id')).toMatch(new RegExp(`^${prefix}`));
    await page.getByRole('button', { name: 'TERUG NAAR HOOFDMENU' }).click();
    await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
});

test('20-tip exhaustion, replay without rating and independent category history', async ({ page }) => {
  // 22 rounds exercise the complete history; keep each transition's 7s limit.
  test.slow();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => { Math.random = () => .05; });
  await page.goto('./'); await enter(page); const ids = new Set<string>(); let last = '';
  for (let i = 0; i < 21; i++) {
    await page.getByRole('button', { name: /^(Geef me een Noobtip!|Geef me nog een Noobtip!)$/ }).click();
    await expect(main(page)).toHaveAttribute('data-phase', 'rating');
    const id = await main(page).getAttribute('data-tip-id') as string;
    if (i < 20) { expect(ids.has(id)).toBe(false); ids.add(id); } else { expect(ids.has(id)).toBe(true); expect(id).not.toBe(last); }
    last = id;
  }
  expect(ids.size).toBe(20);
  await page.getByRole('button', { name: 'TERUG NAAR HOOFDMENU' }).click(); await page.getByRole('button', { name: 'Arc Raiders', exact: true }).click();
  await page.getByRole('button', { name: 'Geef me een Noobtip!', exact: true }).click(); await expect(main(page)).toHaveAttribute('data-phase', 'rating');
  expect(await main(page).getAttribute('data-tip-id')).toMatch(/^arc-/);
});

test('normal animation lands precisely and prevents duplicate requests', { tag: '@smoke' }, async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => .65; }); await page.goto('./'); await enter(page);
  await page.getByRole('button', { name: 'Geef me een Noobtip!', exact: true }).evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); });
  await expect(main(page)).toHaveAttribute('data-spin', '1'); await expect(main(page)).toHaveAttribute('data-phase', 'spinning');
  await expect(page.getByRole('button', { name: 'Overslaan' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Arc Raiders', exact: true })).toBeDisabled();
  await expect.poll(() => page.getByTestId('rotor').evaluate(element =>
    Number(element.style.transform.match(/rotate\(([-.\d]+)deg\)/)?.[1] ?? 0)
  )).toBeGreaterThan(0);
  await page.waitForSelector('.is-landed');
  const result = await page.getByTestId('wheel').evaluate(element => ({ angle: Number(element.dataset.rotation), sector: Number(element.dataset.segment), actual: Number(element.querySelector('[data-testid=rotor]')!.getAttribute('style')!.match(/rotate\(([-.\d]+)deg\)/)![1]) }));
  expect(result.actual).toBe(result.angle); expect((360 - result.angle % 360) % 360).toBe(result.sector * 36);
  await expect(main(page)).toHaveAttribute('data-phase', 'revealing');
  await expect(main(page)).toHaveAttribute('data-phase', 'rating'); await expect(main(page)).toHaveAttribute('data-tier', 'legendary'); await noOverflow(page);
});

test('all three reveal tiers agree with their wheel sectors', { tag: '@smoke' }, async ({ page }) => {
  // Three rounds plus page loads need a larger overall budget.
  test.slow();
  for (const [random, tier, sector] of [[.05, 'normal', 0], [.15, 'mega', 1], [.65, 'legendary', 6]] as const) {
    await page.goto('./'); await enter(page); await page.evaluate(value => { Math.random = () => value; }, random); await spinToResult(page);
    await expect(main(page)).toHaveAttribute('data-tier', tier); await expect(page.getByTestId('wheel')).toHaveAttribute('data-segment', String(sector));
    await expect(page.locator('.reveal-scene .reveal-title, .reveal-scene .reveal-emblem')).toHaveCount(0);
    await expect(page.locator('.tip-text')).toBeVisible();
    await expect(page.locator('.replay-button')).toHaveText('Geef me nog een Noobtip!');
    await expect(page.locator('.replay-button > svg')).toHaveCount(1);
    await expect(page.locator('.replay-button > svg:last-child path')).toHaveAttribute('d', 'M4 12h15m-6-6 6 6-6 6');
  }
});

test('rating fills, changes, overloads, and persists after reload', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('./'); await enter(page); await spinToResult(page); const id = await main(page).getAttribute('data-tip-id');
  await page.getByRole('radio', { name: /^3 van 5/ }).click(); await page.mouse.move(0, 0);
  await expect(page.locator('.trash-object.filled')).toHaveCount(3);
  await page.getByRole('radio', { name: /^5 van 5/ }).click(); await page.mouse.move(0, 0);
  await expect(page.locator('.trash-object.overloaded')).toHaveCount(5);
  await page.getByRole('radio', { name: /^2 van 5/ }).click(); await page.mouse.move(0, 0);
  await expect(page.locator('.trash-object.filled')).toHaveCount(2);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem('noobtips.ratings.v1')!)[key!], id)).toBe(2);
  await page.reload(); await enter(page); await expect(main(page)).toHaveAttribute('data-phase', 'ready');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem('noobtips.ratings.v1')!)[key!], id)).toBe(2);
  // Make that previously rated tip the only unseen member of its category.
  await page.evaluate(key => { localStorage.setItem('noobtips.history.v1', JSON.stringify({ general: Array.from({ length: 20 }, (_, i) => `general-${String(i + 1).padStart(3, '0')}`).filter(value => value !== key) })); }, id);
  await page.reload(); await enter(page); await spinToResult(page); await expect(main(page)).toHaveAttribute('data-tip-id', id!);
  await expect(page.getByRole('radio', { name: /^2 van 5/ })).toHaveAttribute('aria-checked', 'true');
});

test('keyboard rating supports arrows, End, Home and a visible focus ring', async ({ page }) => {
  await page.goto('./'); await enter(page); await spinToResult(page);
  const first = page.getByRole('radio', { name: /^1 van 5/ }); await first.focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: /^2 van 5/ })).toHaveAttribute('aria-checked', 'true'); await page.keyboard.press('End');
  const fifth = page.getByRole('radio', { name: /^5 van 5/ }); await expect(fifth).toBeFocused(); await expect(fifth).toHaveAttribute('aria-checked', 'true');
  expect(await fifth.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Home'); await expect(first).toHaveAttribute('aria-checked', 'true');
});

test('corrupted storage and unavailable storage never block playing', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('noobtips.ratings.v1', '{bad'); localStorage.setItem('noobtips.history.v1', 'null'); });
  await page.goto('./'); await enter(page); await spinToResult(page); await page.getByRole('radio', { name: /^4 van 5/ }).click();
  await expect(page.getByRole('radio', { name: /^4 van 5/ })).toHaveAttribute('aria-checked', 'true');
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }); });
  await page.reload(); await enter(page); await spinToResult(page); await page.getByRole('radio', { name: /^5 van 5/ }).click(); await page.mouse.move(0, 0);
  await expect(page.getByText('Voor deze speelsessie bewaard')).toBeVisible();
});

test('reduced motion completes promptly, removes particles and survives mid-spin reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('./'); await enter(page);
  await page.getByRole('button', { name: 'Geef me een Noobtip!', exact: true }).click();
  await expect(main(page)).toHaveAttribute('data-phase', 'rating', { timeout: 1200 }); await expect(page.locator('.particles')).toBeHidden();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Geef me nog een Noobtip!' }).click(); await page.reload(); await enter(page);
  await expect(main(page)).toHaveAttribute('data-phase', 'ready'); await spinToResult(page);
});

test('welcome unlocks audio and mute survives replay and menu navigation', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('./');
  await expect(main(page)).toHaveAttribute('data-phase', 'welcome');
  await expect(page.getByRole('button')).toHaveCount(1);
  await expect(page.locator('.slogan s')).toHaveText('niks');
  await noOverflow(page); await enter(page);
  const supported = await page.evaluate(() => typeof AudioContext !== 'undefined');
  if (supported) {
    await expect(page.getByRole('button', { name: 'Geluid uitzetten' })).toHaveAttribute('aria-pressed', 'true');
    await spinToResult(page);
    await page.getByRole('button', { name: 'Geef me nog een Noobtip!' }).click();
    await expect(main(page)).toHaveAttribute('data-phase', 'rating');
    await expect(page.getByRole('button', { name: 'Geluid uitzetten' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Geluid uitzetten' }).click();
  } else await expect(page.getByRole('status').filter({ hasText: 'Geluid is hier' })).toBeVisible();
  await spinToResult(page);
  await page.getByRole('button', { name: 'TERUG NAAR HOOFDMENU' }).click();
  await expect(main(page)).toHaveAttribute('data-phase', 'ready');
  await expect(page.getByRole('button', { name: 'SPELEN!', exact: true })).toHaveCount(0);
  await expect(page.locator('.category')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Geluid aanzetten' })).toHaveAttribute('aria-pressed', 'false');
});

test('audio resume rejection does not falsely enable sound or block entry', async ({ page }) => {
  await page.addInitScript(() => { if (typeof AudioContext !== 'undefined') AudioContext.prototype.resume = () => Promise.reject(new Error('Blocked')); });
  await page.goto('./'); await enter(page);
  await expect(page.getByRole('button', { name: 'Geluid aanzetten' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByText('Geluid is hier niet beschikbaar. Het rad draait gewoon door.')).toBeVisible();
  await spinToResult(page);
});

test('longest tips and full bins fit the viewport', async ({ page }) => {
  await page.goto('./'); await enter(page); await page.evaluate(() => { Math.random = () => .6; }); await spinToResult(page);
  await page.getByRole('radio', { name: /^5 van 5/ }).click(); await page.mouse.move(0, 0); await page.waitForTimeout(600); await noOverflow(page);
  const action = await page.getByRole('button', { name: 'Geef me nog een Noobtip!' }).boundingBox();
  const footer = await page.locator('.footer').boundingBox(); expect(action!.y + action!.height).toBeLessThan(footer!.y);
  const tip = await page.locator('.tip-text').boundingBox(); const rating = await page.locator('.rating-question').boundingBox(); expect(tip!.y + tip!.height).toBeLessThan(rating!.y);
});

test('touch targets respond to real taps', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'Touch emulation project only');
  await page.goto('./'); await enter(page); await page.getByRole('button', { name: 'Arc Raiders', exact: true }).tap();
  await page.getByRole('button', { name: 'Geef me een Noobtip!', exact: true }).tap(); await expect(main(page)).toHaveAttribute('data-phase', 'rating');
  await page.getByRole('radio', { name: /^5 van 5/ }).tap(); await expect(page.locator('.trash-object.overloaded')).toHaveCount(5);
  await page.getByRole('button', { name: 'Geef me nog een Noobtip!' }).tap(); await expect(main(page)).toHaveAttribute('data-phase', 'spinning');
});


test('an update from inactive School returns to Algemeen without losing the menu', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('noobtips.update-session.v1', JSON.stringify({ started: true, category: 'school', sound: false })));
  await page.goto('./');
  await expect(main(page)).toHaveAttribute('data-phase', 'ready');
  await expect(page.getByRole('button', { name: 'Algemeen', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.category')).toHaveText(['Algemeen', 'Arc Raiders']);
  await spinToResult(page);
  expect(await main(page).getAttribute('data-tip-id')).toMatch(/^general-/);
});
