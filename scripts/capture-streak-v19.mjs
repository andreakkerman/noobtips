import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import assert from 'node:assert/strict';
const output=process.env.REVIEW_DIR||'docs/review/noobtips-v1.9/first';await mkdir(output,{recursive:true});
const browser=await chromium.launch();const report={errors:[],states:[]};
for(const [width,height] of [[1024,768],[1280,800],[1366,768],[768,1024]]){
 const context=await browser.newContext({viewport:{width,height},recordVideo:{dir:'.runtime/v19-video',size:{width,height}}});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto('http://127.0.0.1:5173');await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(async()=>{const react=await import('/node_modules/.vite/deps/react.js');const React=react.default??react;const dom=await import('/node_modules/.vite/deps/react-dom_client.js');const {createRoot}=dom.default??dom;const {StreakCelebration}=await import('/src/components/StreakCelebration.tsx');const {milestones}=await import('/src/game/ratings.ts');const host=document.createElement('div');document.body.append(host);const root=createRoot(host);window.previewStreak=count=>root.render(React.createElement(StreakCelebration,{key:count,milestone:{count,title:milestones[count]},reduced:false,onDone:()=>root.render(null)}));});
 for(const count of [5,10,15,75]){
  await page.evaluate(n=>window.previewStreak(n),count);await page.getByRole('dialog').waitFor();const frames=[];let previous=0;
  for(const time of [300,850,1400,2100,3800,6500]){
   await page.waitForTimeout(time-previous);previous=time;const png=await page.screenshot();frames.push({input:await sharp(png).resize(400,340,{fit:'contain'}).toBuffer(),left:(frames.length%3)*400,top:Math.floor(frames.length/3)*340});
   if(time===6500)await writeFile(`${output}/${width}-${count}-final.png`,png);
  }
  const metrics=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};};return {counter:rect('.streak-counter'),bins:rect('.streak-bins'),headline:rect('#streak-title'),button:rect('.streak-yay'),overflow:document.documentElement.scrollHeight>innerHeight};});
  assert(metrics.counter.bottom<=metrics.bins.top);assert(metrics.bins.bottom<=metrics.headline.top);assert(metrics.headline.bottom<metrics.button.top);assert(metrics.counter.top>=0&&metrics.button.bottom<=height);assert(!metrics.overflow);
  report.states.push({width,height,count,...metrics});await page.getByRole('button',{name:'YAY!',exact:true}).click();await page.waitForTimeout(120);frames.push({input:await sharp(await page.screenshot()).resize(400,340,{fit:'contain'}).toBuffer(),left:0,top:680});await page.getByRole('dialog').waitFor({state:'detached'});
  await sharp({create:{width:1200,height:1020,channels:3,background:'#061c24'}}).composite(frames).png().toFile(`${output}/${width}-${count}-sequence.png`);
 }
 const video=page.video();await context.close();await video.saveAs(`${output}/${width}-streaks.webm`);
}
await browser.close();assert.deepEqual(report.errors,[]);await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));console.log({errors:report.errors,states:report.states.length});
