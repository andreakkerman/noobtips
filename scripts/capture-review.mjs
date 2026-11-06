import { chromium } from '@playwright/test';
import { mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';

const directory = path.resolve('docs/review/noobtips-v1.5');
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const report = { capturedAt: new Date().toISOString(), browser: browser.version(), captures: [], errors: [], animation: {} };
try {
  for (const { width, height, random, tier } of [
    { width: 1024, height: 768, random: .15, tier: 'mega' },
    { width: 1280, height: 800, random: .05, tier: 'normal' },
    { width: 1366, height: 768, random: .65, tier: 'legendary' },
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width === 1024, ...(width === 1366 ? { recordVideo: { dir: path.join(directory, 'video'), size: { width, height } } } : {}) });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.addInitScript(value => { Math.random = () => value; }, random);
    await page.goto('http://127.0.0.1:5173/');
    await page.evaluate(() => document.fonts.ready);
    const capture = async name => {
      const filename = `final-${width}x${height}-${name}.png`;
      await page.screenshot({ path: path.join(directory, filename) });
      report.captures.push({ filename, tier, phase: await page.locator('main').getAttribute('data-phase') });
    };
    await page.waitForTimeout(800);
    await capture('00-welcome');
    await page.getByRole('button', { name: 'SPELEN!', exact: true }).click();
    await page.waitForTimeout(700);
    await capture('01-ready');
    await page.getByRole('button', { name: 'Geef me een Noobtip!', exact: true }).click();
    await page.waitForTimeout(800); await capture('02-spinning');
    await page.waitForSelector('.is-landed'); await capture('03-landed');
    await page.waitForSelector('[data-phase="revealing"]'); await page.waitForTimeout(380); await capture('04-revealing');
    await page.waitForSelector('[data-phase="rating"]'); await page.waitForTimeout(500); await capture('05-tip');
    await page.getByRole('radio', { name: /^3 van 5/ }).click(); await page.mouse.move(1,1); await page.waitForTimeout(650); await capture('06-rating-three');
    await page.getByRole('radio', { name: /^5 van 5/ }).click(); await page.mouse.move(1,1); await page.waitForTimeout(650); await capture('07-rating-five');
    await page.getByRole('button', { name: 'Geef me nog een Noobtip!' }).click(); await page.waitForTimeout(500); await capture('08-replay');
    await page.waitForSelector('[data-phase="rating"]'); await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'TERUG NAAR HOOFDMENU' }).click();
    await page.waitForTimeout(700); await capture('09-menu');
    if (width === 1366) {
      const video = page.video(); await context.close();
      await rename(await video.path(), path.join(directory, 'full-loop-1366.webm'));
    } else await context.close();
  }
  // Separate from capture/video overhead: measure only the rotating wheel's frames.
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('button', { name: 'SPELEN!', exact: true }).click();
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluate(() => {
    window.__frames = []; window.__states = []; window.__previous = null;
    const main = document.querySelector('main');
    new MutationObserver(() => { window.__states.push({ phase: main.dataset.phase, time: performance.now() }); }).observe(main, { attributes: true, attributeFilter: ['data-phase'] });
    const track = time => {
      if (main.dataset.phase === 'spinning' && !document.querySelector('.is-landed')) {
        if (window.__previous !== null) window.__frames.push(time - window.__previous);
        window.__previous = time;
      } else window.__previous = null;
      requestAnimationFrame(track);
    };
    requestAnimationFrame(track);
  });
  await page.getByRole('button', { name: 'Geef me een Noobtip!', exact: true }).click();
  await page.waitForSelector('[data-phase="rating"]');
  report.animation = await page.evaluate(() => {
    const frames = window.__frames.toSorted((a,b) => a-b);
    return { cpuThrottle: 4, frameCount: frames.length, medianFrameMs: frames[Math.floor(frames.length / 2)], p95FrameMs: frames[Math.floor(frames.length * .95)], framesOver50ms: frames.filter(n => n > 50).length, states: window.__states };
  });
  await page.close();
  await writeFile(path.join(directory, 'capture-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ captures: report.captures.length, errors: report.errors, animation: report.animation }, null, 2));
} finally { await browser.close(); }
