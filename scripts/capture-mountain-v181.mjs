import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const output='docs/review/noobtips-v1.8.1/refined';await mkdir(output,{recursive:true});
const counts=[0,1,5,10,25,50,75,100,125,150];
const browser=await chromium.launch();const report={captures:[],errors:[],animations:[],renderMs:[]};
const ratings=count=>Array.from({length:count},(_,i)=>({id:`fixture-${i}`,tipId:`general-${String(i%100+1).padStart(3,'0')}`,value:5}));
for(const [width,height] of [[1024,768],[1280,800],[1366,768]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',recordVideo:{dir:output,size:{width,height}}});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto('http://127.0.0.1:5173');
 const ready=()=>page.waitForFunction(()=>{const c=document.querySelector('.mountain-scene canvas');return c&&c.width>300&&c.getContext('2d').getImageData(0,0,1,1).data[3]>0;});
 for(const count of counts){
  await page.evaluate(events=>localStorage.setItem('noobtips.ratings.v2',JSON.stringify(events)),ratings(count));await page.reload();
  await page.getByRole('button',{name:'SPELEN!',exact:true}).click();await page.getByRole('button',{name:'DE VUILNISBELT',exact:true}).click();await ready();await page.evaluate(()=>document.fonts.ready);
  assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth));
  const file=`${width}-mountain-${count}.png`;await page.screenshot({path:`${output}/${file}`});report.captures.push(file);
 }
 for(const before of [99,124,149]){
  await page.evaluate(events=>localStorage.setItem('noobtips.ratings.v2',JSON.stringify(events)),ratings(before));await page.reload();await page.getByRole('button',{name:'SPELEN!',exact:true}).click();
  await page.getByRole('button',{name:'Geef me een Noobtip!',exact:true}).click();await page.locator('main[data-phase=rating]').waitFor();await page.getByRole('radio',{name:/^5 van 5/}).click();await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{window.reviewFrames=[];let previous=performance.now();const start=previous;const frame=now=>{window.reviewFrames.push(now-previous);previous=now;if(now-start<1400)requestAnimationFrame(frame);};requestAnimationFrame(frame);});
  await page.getByRole('button',{name:'DE VUILNISBELT',exact:true}).click();
  let previous=0;for(const time of [80,250,500,740,950,1250]){await page.waitForTimeout(time-previous);previous=time;await page.screenshot({path:`${output}/${width}-arrival-${before+1}-${time}.png`});}
  const frames=await page.evaluate(()=>window.reviewFrames);report.animations.push({width,count:before+1,frames:frames.length,p95:frames.sort((a,b)=>a-b)[Math.floor(frames.length*.95)]});
  await page.emulateMedia({reducedMotion:'reduce'});
 }
 report.renderMs.push(await page.evaluate(async()=>{const {drawMountain,loadMountainArt}=await import('/src/game/mountain.ts');const art=await loadMountainArt();const canvas=document.createElement('canvas');canvas.width=960;canvas.height=720;const c=canvas.getContext('2d');const start=performance.now();for(let i=0;i<20;i++)drawMountain(c,150,art);return {width:innerWidth,average:(performance.now()-start)/20};}));
 const video=page.video();await context.close();await video.saveAs(`${output}/${width}-growth.webm`);
 const stages=[0,1,5,10,25,50,75,100,125,150];await sharp({create:{width:1200,height:2000,channels:3,background:'#071d25'}}).composite(await Promise.all(stages.map(async(n,i)=>({input:await sharp(`${output}/${width}-mountain-${n}.png`).resize(600,400,{fit:'contain'}).toBuffer(),left:i%2*600,top:Math.floor(i/2)*400})))).png().toFile(`${output}/${width}-stages.png`);
}
await browser.close();assert.deepEqual(report.errors,[]);await writeFile(`${output}/capture-report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
