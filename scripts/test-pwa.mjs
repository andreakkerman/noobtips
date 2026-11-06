import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const smoke = process.argv.includes('--smoke');
const output = path.resolve(smoke ? '.runtime/pwa-smoke' : 'docs/review/noobtips-v1.8.2');
// Last-resort bound also covers browser protocol calls and teardown.
const deadline = setTimeout(() => { console.error('PWA suite exceeded its hard deadline'); process.exit(1); }, smoke ? 180_000 : 300_000);
await mkdir(output, { recursive: true });
const report = { checks: [], screenshots: [], errors: [] };
const check = text => { report.checks.push(text); console.log(text); };
const build = (name, base) => {
  const dir = path.resolve('.runtime', `pwa-${name}`);
  execFileSync(process.execPath, ['node_modules/vite/bin/vite.js','build','--outDir',dir], {
    env: { ...process.env, PAGES_BASE_PATH: base, PWA_BUILD_ID: name }, stdio: 'pipe', timeout: 60_000,
  });
  return dir;
};
const builds = { a: build('a','/Noobtips/'), b: build('b','/Noobtips/'), c: build('c','/Noobtips/'), d: build('d','/Noobtips/'), root: build('root','/') };
let serving = builds.a;
let broken = false;
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.webmanifest':'application/manifest+json', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.woff':'font/woff' };
const server = createServer(async(req,res) => {
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const base = serving === builds.root ? '/' : '/Noobtips/';
  if (!pathname.startsWith(base)) { res.writeHead(404); res.end(); return; }
  const relative = pathname.slice(base.length) || 'index.html';
  const file = path.resolve(serving, relative);
  if (!file.startsWith(serving + path.sep)) { res.writeHead(403); res.end(); return; }
  try {
    if (broken && relative.endsWith('welcome-observatory.webp')) throw Error('incomplete deploy');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' }); res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(4174,'127.0.0.1',resolve));
const origin='http://127.0.0.1:4174';
const url=origin+'/Noobtips/';
const browser=await chromium.launch();
const contexts=[];
const newContext=async options=>{
  const context=await browser.newContext(options);
  context.setDefaultTimeout(10_000);context.setDefaultNavigationTimeout(15_000);
  await context.tracing.start({screenshots:true,snapshots:true,sources:true});
  contexts.push(context);return context;
};
const until=async (fn, label, timeout=15000) => {
  const start=Date.now(); while(Date.now()-start<timeout) { if(await fn()) return; await new Promise(r=>setTimeout(r,100)); }
  throw Error('Timed out: '+label);
};
const phase=(page,value)=>until(()=>page.locator('main').getAttribute('data-phase').then(v=>v===value),'phase '+value);
// An update at welcome may reload the page while control is being acquired.
// Poll across that expected navigation rather than holding a promise in the old page.
const workerReady=page=>until(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller)).catch(error=>{
  if (/Execution context was destroyed|Cannot find context/.test(error.message)) return false;
  throw error;
}), 'service worker controller');
const cacheNames=page=>page.evaluate(()=>caches.keys());
const checkUpdate=page=>page.evaluate(async()=>{ const r=await navigator.serviceWorker.getRegistration(); await r.update(); });
const waitUpdate=page=>until(()=>page.evaluate(async()=>Boolean((await navigator.serviceWorker.getRegistration())?.waiting)),'waiting update');
try {
  const manifest=await (await fetch(url+'manifest.webmanifest')).json();
  assert.equal(manifest.start_url,'/Noobtips/'); assert.equal(manifest.scope,'/Noobtips/'); assert.equal(manifest.name,'Noobtips'); assert.equal(manifest.display,'standalone');
  for(const icon of manifest.icons) { const bytes=Buffer.from(await (await fetch(origin+icon.src)).arrayBuffer());const m=await sharp(bytes).metadata();assert.equal(`${m.width}x${m.height}`,icon.sizes); }
  const apple=await sharp(await readFile(builds.a+'/icons/apple-touch-icon.png')).metadata(); assert.equal(apple.width,180);
  const sw=await readFile(builds.a+'/sw.js','utf8');
  const assets=JSON.parse(sw.match(/const ASSETS = (.*);/)[1]);
  for(const asset of assets) {assert(asset.startsWith('/Noobtips/'));assert.equal((await fetch(origin+asset)).status,200,asset);}
  assert(assets.some(a=>a.endsWith('/art/mountain/junk-atlas.webp')));
  assert(assets.some(a=>a.endsWith('/art/mountain/salvage-atlas.webp')));
  assert(assets.some(a=>a.endsWith('/art/mountain/courtyard.webp')));
  const cssName=assets.find(a=>a.endsWith('.css'));const css=await(await fetch(origin+cssName)).text();
  assert(css.includes('/Noobtips/art/observatory.webp'));assert(!css.includes('url(/art/'));
  check('Project base: manifest, all precache assets, artwork/font URLs and icon sizes valid.');
  const context=await newContext({viewport:{width:1024,height:768}});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(url);await workerReady(page);
  assert.equal((await cacheNames(page)).length,1);
  await context.setOffline(true);await page.reload();await phase(page,'welcome');
  await page.getByRole('button',{name:'SPELEN!',exact:true}).click();
  for(const name of ['Algemeen','Arc Raiders']) {
    await page.getByRole('button',{name,exact:true}).click();
    if(name==='Arc Raiders') assert(await page.evaluate(async()=> (await fetch(new URL('art/arc-raiders-winter.webp',location.href))).ok));
    await page.getByRole('button',{name:'Geef me een Noobtip!',exact:true}).click();await phase(page,'rating');
    await page.getByRole('radio',{name:/^4 van 5/}).click();
    await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
  }
  await page.reload();await phase(page,'welcome');
  const saved=await page.evaluate(()=>localStorage.getItem('noobtips.ratings.v2'));assert.equal(Object.keys(JSON.parse(saved)).length,2);
  await page.getByRole('button',{name:'SPELEN!',exact:true}).click();
  await page.getByRole('button',{name:'TOP 20',exact:true}).click();
  assert.equal(await page.locator('.leaderboard-row').count(),2);
  for(const {tipId:id,value:rating} of JSON.parse(saved)) {
    assert.equal(await page.locator(`.leaderboard-row[data-tip-id="${id}"]`).getAttribute('data-rating'),String(rating));
  }
  assert.equal(await page.locator('.mountain-scene canvas').count(),1);
  await until(()=>page.locator('.mountain-scene canvas').evaluate(el=>el.getContext('2d').getImageData(0,0,1,1).data[3]>0),'offline mountain artwork');
  await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU',exact:true}).click();await phase(page,'ready');
  await page.reload();await phase(page,'welcome');
  check('Personal Top 20 opens offline with the persisted ratings and returns directly to the wheel.');
  check('Offline cold reload, both active categories, full spins and local ratings work from the production cache.');
  await context.setOffline(false);
  await page.getByRole('button',{name:'SPELEN!',exact:true}).click();
  await page.getByRole('button',{name:'Arc Raiders',exact:true}).click();
  await page.getByRole('button',{name:'Geluid uitzetten'}).click();
  const before=await cacheNames(page);
  await page.getByRole('button',{name:'Geef me een Noobtip!',exact:true}).click();await phase(page,'spinning');
  serving=builds.b;await checkUpdate(page);await waitUpdate(page);
  await phase(page,'revealing');assert.deepEqual(await cacheNames(page).then(k=>k.filter(x=>before.includes(x))),before);
  await phase(page,'rating');await page.getByRole('radio',{name:/^5 van 5/}).click();
  const rated=await page.evaluate(()=>localStorage.getItem('noobtips.ratings.v2'));
  const selectionState=await page.evaluate(()=>localStorage.getItem('noobtips.history.v2'));
  await page.waitForTimeout(500);assert(await page.evaluate(async()=>Boolean((await navigator.serviceWorker.getRegistration()).waiting)));
  const id=await page.locator('main').getAttribute('data-tip-id');
  await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
  await until(async()=>{const k=await cacheNames(page).catch(()=>before);return k.length===1&&!before.includes(k[0]);},'new cache active');
  await page.waitForLoadState('load');await phase(page,'ready');
  assert.equal(await page.getByRole('button',{name:'Arc Raiders',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await page.getByRole('button',{name:'Geluid aanzetten'}).getAttribute('aria-pressed'),'false');
  assert.equal(await page.evaluate(()=>localStorage.getItem('noobtips.ratings.v2')),rated);
  assert.equal(JSON.parse(rated).find(e=>e.tipId===id).value,5);
  assert.equal(await page.evaluate(()=>localStorage.getItem('noobtips.history.v2')),selectionState);
  check('Update arriving in spin remains waiting through reveal/rating; menu applies it quietly, removes old cache and preserves category, mute and ratings.');
  // Another open app window must prevent activation, even if this page is idle.
  await page.getByRole('button',{name:'Geluid aanzetten'}).click();
  assert.equal(await page.getByRole('button',{name:'Geluid uitzetten'}).getAttribute('aria-pressed'),'true');
  const second=await context.newPage();await second.goto(url);await workerReady(second);
  await second.getByRole('button',{name:'SPELEN!',exact:true}).click();await second.getByRole('button',{name:'Geef me een Noobtip!',exact:true}).click();
  serving=builds.c;await checkUpdate(page);await waitUpdate(page);await phase(second,'rating');
  await page.waitForTimeout(500);assert(await page.evaluate(async()=>Boolean((await navigator.serviceWorker.getRegistration()).waiting)));
  await page.getByRole('button',{name:'TOP 20',exact:true}).click();
  await second.close();await page.bringToFront();await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await page.waitForTimeout(500);await phase(page,'leaderboard');
  assert(await page.evaluate(async()=>Boolean((await navigator.serviceWorker.getRegistration()).waiting)));
  assert.equal(await page.evaluate(()=>localStorage.getItem('noobtips.ratings.v2')),rated);
  await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU',exact:true}).click();
  await until(()=>page.evaluate(async()=>!(await navigator.serviceWorker.getRegistration()).waiting).catch(()=>false),'update after other window closed');
  await phase(page,'ready');
  await page.getByRole('button',{name:'Geef me een Noobtip!',exact:true}).click();
  await phase(page,'rating');
  assert.equal(await page.getByRole('button',{name:'Geluid uitzetten'}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
  check('Sound-on preference re-unlocks Web Audio on the first spin after an update reload.');
  check('A second open game window blocks cache activation; closing it allows an idle foreground update.');
  check('An open Top 20 also defers the pending update until returning to the main menu, preserving ratings.');
  const stable = await cacheNames(page);
  broken=true; serving=builds.d;
  await page.evaluate(async()=>{
    const r=await navigator.serviceWorker.getRegistration();
    await new Promise(async(resolve,reject)=>{
      const timeout=setTimeout(()=>reject(Error('failed install did not finish')),12000);
      r.addEventListener('updatefound',()=>{const w=r.installing;w.addEventListener('statechange',()=>{if(w.state==='redundant'){clearTimeout(timeout);resolve();}});},{once:true});
      await r.update();
    });
  });
  assert.deepEqual(await cacheNames(page),stable);
  await context.setOffline(true);await page.reload();await phase(page,'welcome');
  check('A missing core asset rejects the update atomically; the previous complete cache still launches offline.');
  broken=false;await context.setOffline(false);await page.close();
  const relaunched=await context.newPage();await relaunched.goto(url);await workerReady(relaunched);
  await until(async()=>{const keys=await cacheNames(relaunched).catch(()=>stable);return keys.length===1&&!stable.includes(keys[0]);},'update on relaunch');
  await phase(relaunched,'welcome');
  assert.equal(await relaunched.evaluate(()=>localStorage.getItem('noobtips.ratings.v2')),rated);
  check('Relaunch picks up a complete newer version at welcome without losing saved ratings.');
  await context.close();
  // A persistent celebration is an interaction boundary even after its particles stop.
  serving=builds.a;
  const celebrationContext=await newContext({reducedMotion:'reduce'});
  const celebrationPage=await celebrationContext.newPage();await celebrationPage.goto(url);await workerReady(celebrationPage);
  await celebrationPage.getByRole('button',{name:'SPELEN!',exact:true}).click();
  for(let i=0;i<5;i++){
    await celebrationPage.getByRole('button',{name:'Geef me een Noobtip!',exact:true}).click();await phase(celebrationPage,'rating');
    await celebrationPage.getByRole('radio',{name:/^5 van 5/}).click();
    await celebrationPage.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
  }
  await celebrationPage.getByRole('button',{name:'YAY!',exact:true}).waitFor();
  const celebrationRatings=await celebrationPage.evaluate(()=>localStorage.getItem('noobtips.ratings.v2'));
  serving=builds.b;await checkUpdate(celebrationPage);await waitUpdate(celebrationPage);
  await celebrationPage.waitForTimeout(3500);
  assert.equal(await celebrationPage.getByRole('dialog').count(),1);
  assert(await celebrationPage.evaluate(async()=>Boolean((await navigator.serviceWorker.getRegistration()).waiting)));
  await celebrationPage.getByRole('button',{name:'YAY!',exact:true}).click();
  await until(()=>celebrationPage.evaluate(async()=>!(await navigator.serviceWorker.getRegistration()).waiting).catch(()=>false),'update after YAY');
  await phase(celebrationPage,'ready');assert.equal(await celebrationPage.evaluate(()=>localStorage.getItem('noobtips.ratings.v2')),celebrationRatings);
  await celebrationContext.close();
  check('A settled interactive streak defers PWA activation until YAY, then resumes the menu without losing ratings.');
  // Portrait / rotation is usable without orientation locking; target landscape screenshots.
  if (!smoke) {
  const source=await readFile('src/data/tips.ts','utf8');
  const tips=[...source.matchAll(/\['((arc|general)-\d+)', '(.+)'\]/g)].map(m=>({id:m[1],category:m[2],text:m[3]}));
  tips.sort((a,b)=>a.text.length-b.text.length);
  for(const [width,height] of [[1024,768],[1280,800],[1366,768]]) {
    const c=await newContext({viewport:{width,height}});const p=await c.newPage();
    await p.goto(url);await workerReady(p);
    await p.getByRole('button',{name:'SPELEN!',exact:true}).click();await phase(p,'ready');
    await p.screenshot({path:path.join(output,`${width}x${height}-ready.png`),animations:'disabled'});
    for(const [label,tip] of [['short',tips[0]],['long',tips.at(-1)]]) {
      await p.evaluate(({tip,ids})=>{localStorage.removeItem('noobtips.history.v2');localStorage.setItem('noobtips.history.v1',JSON.stringify({[tip.category]:ids.filter(id=>id!==tip.id)}));}, {tip,ids:tips.filter(t=>t.category===tip.category).map(t=>t.id)});
      await p.reload();await p.getByRole('button',{name:'SPELEN!',exact:true}).click();
      await p.getByRole('button',{name:{arc:'Arc Raiders',school:'School',general:'Algemeen'}[tip.category],exact:true}).click();
      await p.evaluate(()=>{Math.random=()=>.25;});
      await p.getByRole('button',{name:'Geef me een Noobtip!',exact:true}).click();await phase(p,'rating');await p.waitForTimeout(500);
      assert.equal(await p.locator('.tip-text').textContent(),tip.text);
      assert.equal(await p.locator('.reveal-title, .reveal-emblem').count(),0);
      assert.equal(await p.locator('[data-testid=wheel]').getAttribute('data-segment'),'2');
      assert(!(await p.locator('main').textContent()).includes('KANSSLOOS'));
      const metrics=await p.evaluate(()=>{const tip=document.querySelector('.tip-text');const button=document.querySelector('.menu-button');const rating=document.querySelector('.rating-question');return {tip:parseFloat(getComputedStyle(tip).fontSize),bottom:button.getBoundingClientRect().bottom,height:innerHeight,tipBottom:tip.getBoundingClientRect().bottom,ratingTop:rating.getBoundingClientRect().top,overflow:document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth,internalScroll:document.querySelector('main').scrollTop,headerTop:document.querySelector('.topbar').getBoundingClientRect().top};});
      assert(metrics.tip>=33);assert(!metrics.overflow);assert.equal(metrics.internalScroll,0);assert(metrics.headerTop>=0);assert(metrics.bottom<metrics.height);assert(metrics.tipBottom<metrics.ratingTop);
      const filename=`${width}x${height}-${label}-tip.png`;await p.screenshot({path:path.join(output,filename)});report.screenshots.push({filename,tipId:tip.id,metrics});
    }
    await c.close();
  }
  const portraitContext=await newContext({viewport:{width:768,height:1024},hasTouch:true});
  const portrait=await portraitContext.newPage();await portrait.goto(url);
  await portrait.getByRole('button',{name:'SPELEN!',exact:true}).click();
  await portrait.getByRole('button',{name:'Geef me een Noobtip!',exact:true}).click();await phase(portrait,'rating');
  await portrait.getByRole('radio',{name:/^4 van 5/}).click();
  await portrait.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();await phase(portrait,'ready');
  await portrait.setViewportSize({width:1024,height:768});await portrait.waitForTimeout(800);
  assert(await portrait.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await portraitContext.close();check('Portrait play and rotation back to landscape work without an orientation lock.');
  check('Short/long retained tips captured at all three resolutions; dominant tip typography, no result classification, unchanged wheel sectors, controls and no overflow verified.');
  }
  serving=builds.root;
  const rootContext=await newContext();const rootPage=await rootContext.newPage();
  await rootPage.goto(origin+'/');await workerReady(rootPage);const rootManifest=await(await fetch(origin+'/manifest.webmanifest')).json();assert.equal(rootManifest.start_url,'/');
  await rootContext.setOffline(true);await rootPage.reload();await phase(rootPage,'welcome');await rootContext.close();
  check('Custom-domain root build installs and cold-reloads offline.');
  assert.deepEqual(report.errors,[]);
} catch(error) {
  report.errors.push(String(error));
  for(const [i,context] of contexts.entries()) {
    for(const [j,page] of context.pages().entries()) await page.screenshot({path:path.join(output,`failure-${i}-${j}.png`),timeout:3000}).catch(()=>{});
    await context.tracing.stop({path:path.join(output,`trace-${i}.zip`)}).catch(()=>{});
  }
  throw error;
} finally {
  await writeFile(path.join(output,'pwa-report.json'),JSON.stringify(report,null,2));
  await browser.close();await new Promise(resolve=>server.close(resolve));
  clearTimeout(deadline);
}
