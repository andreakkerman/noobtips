import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const dir='docs/review/noobtips-v1.8.2/refined';await mkdir(dir,{recursive:true});
const browser=await chromium.launch();const report={errors:[],checks:[]};
for(const [width,height] of [[1024,768],[1280,800],[1366,768]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',recordVideo:{dir:'.runtime/v182-video',size:{width,height}}});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:'SPELEN!',exact:true}).click();
 for(let i=0;i<5;i++){
  await page.getByRole('button',{name:'Geef me een Noobtip!',exact:true}).click();await page.locator('main[data-phase=rating]').waitFor();await page.getByRole('radio',{name:/^5 van 5/}).click();
  if(i<4)await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
 }
 await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
 let previous=0;for(const time of [200,700,1500,2600,3500,5000]){await page.waitForTimeout(time-previous);previous=time;await page.screenshot({path:`${dir}/${width}-streak-${time}.png`});}
 report.checks.push({width,streakPersistent:await page.getByRole('dialog').isVisible(),yayFocused:await page.getByRole('button',{name:'YAY!',exact:true}).evaluate(b=>document.activeElement===b)});
 await page.getByRole('button',{name:'YAY!',exact:true}).click();await page.locator('main[data-phase=ready]').waitFor();
 for(const count of [1,25,100,150]){
  await page.evaluate(n=>localStorage.setItem('noobtips.ratings.v2',JSON.stringify(Array.from({length:n},(_,i)=>({id:`capture-${i}`,tipId:`general-${String(i%100+1).padStart(3,'0')}`,value:5})))),count);
  await page.reload();await page.getByRole('button',{name:'SPELEN!',exact:true}).click();await page.getByRole('button',{name:'TOP 20',exact:true}).click();await page.locator('canvas[data-entrance=establishing]').waitFor();
  const shots=[];previous=0;
  for(const time of [0,700,1200,1600,2200,3000]){await page.waitForTimeout(time-previous);previous=time;shots.push({input:await sharp(await page.screenshot()).resize(500,320,{fit:'contain'}).toBuffer(),left:shots.length%3*500,top:Math.floor(shots.length/3)*320});}
  await sharp({create:{width:1500,height:640,channels:3,background:'#061c24'}}).composite(shots).png().toFile(`${dir}/${width}-mountain-${count}-sequence.png`);
  report.checks.push({width,count,settled:await page.locator('canvas').getAttribute('data-entrance')});
  await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
 }
 const video=page.video();await context.close();await video.saveAs(`${dir}/${width}-cinematic.webm`);
 await sharp({create:{width:1500,height:640,channels:3,background:'#061c24'}}).composite(await Promise.all([200,700,1500,2600,3500,5000].map(async(t,i)=>({input:await sharp(`${dir}/${width}-streak-${t}.png`).resize(500,320,{fit:'contain'}).toBuffer(),left:i%3*500,top:Math.floor(i/3)*320})))).png().toFile(`${dir}/${width}-streak-sequence.png`);
}
await browser.close();await writeFile(`${dir}/capture-report.json`,JSON.stringify(report,null,2));console.log(report);
