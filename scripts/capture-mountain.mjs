import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const output='docs/review/noobtips-v1.7';await mkdir(output,{recursive:true});
const browser=await chromium.launch();const report={captures:[],errors:[],timings:[]};
for(const [width,height] of [[1024,768],[1280,800],[1366,768]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',recordVideo:{dir:output,size:{width,height}}});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5173');
 for(const count of [0,1,10,17,25,38,50,63,75,100]){
  await page.evaluate(count=>localStorage.setItem('noobtips.ratings.v2',JSON.stringify(Array.from({length:count},(_,i)=>({id:String(i),tipId:`general-${String(i%100+1).padStart(3,'0')}`,value:5})))),count);
  await page.reload();await page.getByRole('button',{name:'SPELEN!',exact:true}).click();await page.getByRole('button',{name:'TOP 20',exact:true}).click();await page.evaluate(()=>document.fonts.ready);
  const file=`${output}/${width}-mountain-${count}.png`;await page.screenshot({path:file});report.captures.push(file);
 }
 // Exercise real session finalization, with fast reduced-motion gameplay and full motion on the reward.
 await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
 for(let n=1;n<=50;n++){
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.getByRole('button',{name:'Geef me een Noobtip!',exact:true}).click();await page.locator('main[data-phase=rating]').waitFor();
  await page.getByRole('radio',{name:/^5 van 5/}).click();
  if([5,15,50].includes(n)) await page.emulateMedia({reducedMotion:'no-preference'});
  await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
  if([5,15,50].includes(n)){
   await page.waitForTimeout(700);const file=`${output}/${width}-streak-${n}.png`;await page.screenshot({path:file});report.captures.push(file);await page.waitForTimeout(2200);
  }
 }
 await context.close();
}
await browser.close();
const files=[0,1,10,25,50,100].map(n=>`${output}/1366-mountain-${n}.png`);
await sharp({create:{width:1366,height:1152,channels:3,background:'#071d25'}}).composite(await Promise.all(files.map(async(f,i)=>({input:await sharp(f).resize(683,384).toBuffer(),left:(i%2)*683,top:Math.floor(i/2)*384})))).png().toFile(`${output}/mountain-contact-sheet.png`);
await writeFile(`${output}/capture-report.json`,JSON.stringify(report,null,2));console.log(report);
