import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const output='docs/review/noobtips-v1.10';await mkdir(output,{recursive:true});
const browser=await chromium.launch(),report={captures:[],errors:[]};
for(const [width,height] of [[1024,768],[1280,800],[1366,768],[768,1024]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(process.env.REVIEW_URL??'http://127.0.0.1:5173');
 for(const count of [0,150]){
  const ratings=JSON.stringify(Array.from({length:count},(_,i)=>({id:`fixture-${i}`,tipId:`general-${String(i%100+1).padStart(3,'0')}`,value:5})));
  await page.evaluate(r=>localStorage.setItem('noobtips.ratings.v2',r),ratings);await page.reload();
  await page.getByRole('button',{name:'SPELEN!',exact:true}).click();await page.evaluate(()=>document.fonts.ready);
  if(!count)await page.screenshot({path:`${output}/${width}-menu.png`});
  const button=page.getByRole('button',{name:'DE VUILNISBELT',exact:true});assert(await button.isVisible());
  assert(await button.evaluate(el=>el.scrollWidth<=el.clientWidth));await button.click();
  await page.locator('canvas[data-entrance=settled]').waitFor();
  assert.equal(await page.getByRole('heading',{name:'DE VUILNISBELT',exact:true}).count(),1);
  assert(await page.getByRole('heading',{name:'De 20 slechtste tips',exact:true}).isVisible());
  assert(await page.getByText(`${count} tips weggegooid`,{exact:true}).isVisible());
  assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth));
  if(count){const list=page.locator('.leaderboard-scroll');await list.evaluate(el=>el.scrollTop=el.scrollHeight);assert(await list.evaluate(el=>el.scrollTop>0));await list.evaluate(el=>el.scrollTop=0);}
  assert.equal(await page.evaluate(()=>localStorage.getItem('noobtips.ratings.v2')),ratings);
  const file=`${width}-${count}.png`;await page.screenshot({path:`${output}/${file}`});report.captures.push(file);
 }
 await page.close();
}
await browser.close();assert.deepEqual(report.errors,[]);await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));console.log(report);
