import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const output = path.resolve('docs/review/noobtips-v1.4');
await mkdir(output, { recursive: true });
const report = { checks: [], screenshots: [], errors: [] };
const check = text => { report.checks.push(text); console.log(text); };
const build = (name, base) => {
  const dir = path.resolve('.runtime', `pwa-${name}`);
  execFileSync(process.execPath, ['node_modules/vite/bin/vite.js','build','--outDir',dir], {
    env: { ...process.env, PAGES_BASE_PATH: base, PWA_BUILD_ID: name }, stdio: 'pipe',
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
const until=async (fn, label, timeout=15000) => {
  const start=Date.now(); while(Date.now()-start<timeout) { if(await fn()) return; await new Promise(r=>setTimeout(r,100)); }
  throw Error('Timed out: '+label);
};
const phase=(page,value)=>until(()=>page.locator('main').getAttribute('data-phase').then(v=>v===value),'phase '+value);
const workerReady=page=>page.evaluate(async()=>{await navigator.serviceWorker.ready; if(!navigator.serviceWorker.controller) await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
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
  const cssName=assets.find(a=>a.endsWith('.css'));const css=await(await fetch(origin+cssName)).text();
  assert(css.includes('/Noobtips/art/observatory.webp'));assert(!css.includes('url(/art/'));
  check('Project base: manifest, all precache assets, artwork/font URLs and icon sizes valid.');
  const context=await browser.newContext({viewport:{width:1024,height:768}});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(url);await workerReady(page);
  assert.equal((await cacheNames(page)).length,1);
  await context.setOffline(true);await page.reload();await phase(page,'welcome');
  await page.getByRole('button',{name:'SPELEN!',exact:true}).click();
  for(const name of ['Algemeen','Arc Raiders']) {
    await page.getByRole('button',{name,exact:true}).click();
    if(name==='Arc Raiders') assert(await page.evaluate(async()=> (await fetch(new URL('art/arc-raiders-winter.webp',location.href))).ok));
    await page.getByRole('button',{name:'DRAAI HET NOOBRAD!',exact:true}).click();await phase(page,'rating');
    await page.getByRole('radio',{name:/^4 van 5/}).click();
    await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
  }
  await page.reload();await phase(page,'welcome');
  const saved=await page.evaluate(()=>localStorage.getItem('noobtips.ratings.v1'));assert.equal(Object.keys(JSON.parse(saved)).length,2);
  check('Offline cold reload, both active categories, full spins and local ratings work from the production cache.');
  await context.setOffline(false);
  await page.getByRole('button',{name:'SPELEN!',exact:true}).click();
  await page.getByRole('button',{name:'Arc Raiders',exact:true}).click();
  await page.getByRole('button',{name:'Geluid uitzetten'}).click();
  const before=await cacheNames(page);
  await page.getByRole('button',{name:'DRAAI HET NOOBRAD!',exact:true}).click();await phase(page,'spinning');
  serving=builds.b;await checkUpdate(page);await waitUpdate(page);
  await phase(page,'revealing');assert.deepEqual(await cacheNames(page).then(k=>k.filter(x=>before.includes(x))),before);
  await phase(page,'rating');await page.getByRole('radio',{name:/^5 van 5/}).click();
  const rated=await page.evaluate(()=>localStorage.getItem('noobtips.ratings.v1'));
  await page.waitForTimeout(500);assert(await page.evaluate(async()=>Boolean((await navigator.serviceWorker.getRegistration()).waiting)));
  const id=await page.locator('main').getAttribute('data-tip-id');
  await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
  await until(async()=>{const k=await cacheNames(page).catch(()=>before);return k.length===1&&!before.includes(k[0]);},'new cache active');
  await page.waitForLoadState('load');await phase(page,'ready');
  assert.equal(await page.getByRole('button',{name:'Arc Raiders',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await page.getByRole('button',{name:'Geluid aanzetten'}).getAttribute('aria-pressed'),'false');
  assert.equal(await page.evaluate(()=>localStorage.getItem('noobtips.ratings.v1')),rated);
  assert.equal(JSON.parse(rated)[id],5);
  check('Update arriving in spin remains waiting through reveal/rating; menu applies it quietly, removes old cache and preserves category, mute and ratings.');
  // Another open app window must prevent activation, even if this page is idle.
  await page.getByRole('button',{name:'Geluid aanzetten'}).click();
  assert.equal(await page.getByRole('button',{name:'Geluid uitzetten'}).getAttribute('aria-pressed'),'true');
  const second=await context.newPage();await second.goto(url);await workerReady(second);
  await second.getByRole('button',{name:'SPELEN!',exact:true}).click();await second.getByRole('button',{name:'DRAAI HET NOOBRAD!',exact:true}).click();
  serving=builds.c;await checkUpdate(page);await waitUpdate(page);await phase(second,'rating');
  await page.waitForTimeout(500);assert(await page.evaluate(async()=>Boolean((await navigator.serviceWorker.getRegistration()).waiting)));
  await second.close();await page.bringToFront();await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await until(()=>page.evaluate(async()=>!(await navigator.serviceWorker.getRegistration()).waiting).catch(()=>false),'update after other window closed');
  await phase(page,'ready');
  await page.getByRole('button',{name:'DRAAI HET NOOBRAD!',exact:true}).click();
  await phase(page,'rating');
  assert.equal(await page.getByRole('button',{name:'Geluid uitzetten'}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
  check('Sound-on preference re-unlocks Web Audio on the first spin after an update reload.');
  check('A second open game window blocks cache activation; closing it allows an idle foreground update.');
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
  assert.equal(await relaunched.evaluate(()=>localStorage.getItem('noobtips.ratings.v1')),rated);
  check('Relaunch picks up a complete newer version at welcome without losing saved ratings.');
  await context.close();
  // Portrait / rotation is usable without orientation locking; target landscape screenshots.
  const source=await readFile('src/data/tips.ts','utf8');
  const tips=[...source.matchAll(/\['((arc|general)-\d+)', '(.+)'\]/g)].map(m=>({id:m[1],category:m[2],text:m[3]}));
  tips.sort((a,b)=>a.text.length-b.text.length);
  for(const [width,height] of [[1024,768],[1280,800],[1366,768]]) {
    const c=await browser.newContext({viewport:{width,height}});const p=await c.newPage();
    await p.goto(url);await workerReady(p);
    for(const [label,tip] of [['short',tips[0]],['long',tips.at(-1)]]) {
      await p.evaluate(({tip,ids})=>{localStorage.setItem('noobtips.history.v1',JSON.stringify({[tip.category]:ids.filter(id=>id!==tip.id)}));}, {tip,ids:tips.filter(t=>t.category===tip.category).map(t=>t.id)});
      await p.reload();await p.getByRole('button',{name:'SPELEN!',exact:true}).click();
      await p.getByRole('button',{name:{arc:'Arc Raiders',school:'School',general:'Algemeen'}[tip.category],exact:true}).click();
      await p.evaluate(()=>{Math.random=()=>.25;});
      await p.getByRole('button',{name:'DRAAI HET NOOBRAD!',exact:true}).click();await phase(p,'rating');await p.waitForTimeout(500);
      assert.equal(await p.locator('.tip-text').textContent(),tip.text);
      assert.equal(await p.locator('.reveal-title').textContent(),'KANSLOOS');
      assert(!(await p.locator('main').textContent()).includes('KANSSLOOS'));
      const metrics=await p.evaluate(()=>{const tip=document.querySelector('.tip-text');const title=document.querySelector('.reveal-title');const button=document.querySelector('.menu-button');const rating=document.querySelector('.rating-question');return {tip:parseFloat(getComputedStyle(tip).fontSize),title:parseFloat(getComputedStyle(title).fontSize),bottom:button.getBoundingClientRect().bottom,height:innerHeight,tipBottom:tip.getBoundingClientRect().bottom,ratingTop:rating.getBoundingClientRect().top,overflow:document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth,internalScroll:document.querySelector('main').scrollTop,headerTop:document.querySelector('.topbar').getBoundingClientRect().top};});
      assert(metrics.tip>metrics.title);assert(!metrics.overflow);assert.equal(metrics.internalScroll,0);assert(metrics.headerTop>=0);assert(metrics.bottom<metrics.height);assert(metrics.tipBottom<metrics.ratingTop);
      const filename=`${width}x${height}-${label}-tip.png`;await p.screenshot({path:path.join(output,filename)});report.screenshots.push({filename,tipId:tip.id,metrics});
    }
    await c.close();
  }
  const portraitContext=await browser.newContext({viewport:{width:768,height:1024},hasTouch:true});
  const portrait=await portraitContext.newPage();await portrait.goto(url);
  await portrait.getByRole('button',{name:'SPELEN!',exact:true}).click();
  await portrait.getByRole('button',{name:'DRAAI HET NOOBRAD!',exact:true}).click();await phase(portrait,'rating');
  await portrait.getByRole('radio',{name:/^4 van 5/}).click();
  await portrait.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();await phase(portrait,'ready');
  await portrait.setViewportSize({width:1024,height:768});await portrait.waitForTimeout(800);
  assert(await portrait.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await portraitContext.close();check('Portrait play and rotation back to landscape work without an orientation lock.');
  check('Short/long retained tips captured at all three resolutions; dominant typography, KANSLOOS consistency, controls and no overflow verified.');
  serving=builds.root;
  const rootContext=await browser.newContext();const rootPage=await rootContext.newPage();
  await rootPage.goto(origin+'/');await workerReady(rootPage);const rootManifest=await(await fetch(origin+'/manifest.webmanifest')).json();assert.equal(rootManifest.start_url,'/');
  await rootContext.setOffline(true);await rootPage.reload();await phase(rootPage,'welcome');await rootContext.close();
  check('Custom-domain root build installs and cold-reloads offline.');
  assert.deepEqual(report.errors,[]);
} finally {
  await writeFile(path.join(output,'pwa-report.json'),JSON.stringify(report,null,2));
  await browser.close();await new Promise(resolve=>server.close(resolve));
}
