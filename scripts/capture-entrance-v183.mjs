import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const dir='docs/review/noobtips-v1.8.3';await mkdir(dir,{recursive:true});
const browser=await chromium.launch();const report=[];
for(const [width,height] of [[1024,768],[768,1024]])for(const count of [1,11,75,100,150]){
 const page=await browser.newPage({viewport:{width,height},hasTouch:true});
 await page.clock.install({time:new Date('2026-11-06T12:00:00Z')});await page.clock.pauseAt(new Date('2026-11-06T12:00:01Z'));
 await page.goto('http://127.0.0.1:5173');
 await page.evaluate(n=>localStorage.setItem('noobtips.ratings.v2',JSON.stringify(Array.from({length:n},(_,i)=>({id:`frame-${i}`,tipId:'general-001',value:5})))),count);await page.reload();
 await page.getByRole('button',{name:'SPELEN!',exact:true}).click();
 await page.evaluate(()=>{
   window.stageFrames=[];
   new MutationObserver(()=>{
     const c=document.querySelector('.mountain-scene canvas');if(!c)return;
     const key=c.dataset.entrance+':'+c.dataset.arrival;
     if(window.stageFrames.at(-1)?.key!==key)window.stageFrames.push({key,time:performance.now(),image:c.toDataURL()});
   }).observe(document.querySelector('main'),{subtree:true,attributes:true,childList:true});
 });
 await page.getByRole('button',{name:'DE VUILNISBELT',exact:true}).click();await page.locator('canvas[data-entrance=establishing]').waitFor();
 const initial=await page.locator('canvas').evaluate(c=>c.toDataURL());
 await page.screenshot({path:`${dir}/${width}-${count}-establishing.png`});
 await page.clock.runFor(1060);await page.screenshot({path:`${dir}/${width}-${count}-first-drop.png`});
 if(count>=75){await page.clock.runFor(900);await page.screenshot({path:`${dir}/${width}-${count}-second-drop.png`});}
 await page.clock.runFor(2000);await page.screenshot({path:`${dir}/${width}-${count}-final.png`});
 const verification=await page.evaluate(async({count,initial})=>{
   const {drawMountain,loadMountainArt}=await import('/src/game/mountain.ts');const art=await loadMountainArt();const live=document.querySelector('.mountain-scene canvas');
   const c=document.createElement('canvas');c.width=live.width;c.height=live.height;const ctx=c.getContext('2d');ctx.scale(c.width/960,c.height/720);
   drawMountain(ctx,count-(count>=75?2:1),art);const initialMatches=c.toDataURL()===initial;
   drawMountain(ctx,count,art);const finalMatches=c.toDataURL()===live.toDataURL();
   const frames=window.stageFrames.filter(f=>f.key.startsWith('arriving'));
   let settledMaxChannelDifference=0;
   if(count>=75){
     drawMountain(ctx,count-1,art);const expected=ctx.getImageData(0,0,c.width,c.height).data;
     const image=new Image();image.src=frames[1].image;await image.decode();ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(image,0,0,960,720);
     const actual=ctx.getImageData(0,0,c.width,c.height).data;
     for(let i=0;i<actual.length;i++)settledMaxChannelDifference=Math.max(settledMaxChannelDifference,Math.abs(actual[i]-expected[i]));
   }
   return {initialMatches,finalMatches,settledMaxChannelDifference,frames,ratingCount:JSON.parse(localStorage.getItem('noobtips.ratings.v2')).length};
 },{count,initial});
 assert(verification.initialMatches);assert(verification.finalMatches);assert.equal(verification.ratingCount,count);
 assert.equal(verification.settledMaxChannelDifference,0);
 if(count>=75){
   const frame=verification.frames[1];assert(frame);
   await writeFile(`${dir}/${width}-${count}-first-settled.png`,Buffer.from(frame.image.split(',')[1],'base64'));
 }
 report.push({width,height,count,...verification,frames:verification.frames.map(({image,...f})=>f)});
 const files=['establishing','first-drop',...(count>=75?['first-settled','second-drop']:[]),'final'];
 await sharp({create:{width:files.length*360,height:480,channels:3,background:'#061c24'}}).composite(await Promise.all(files.map(async(f,i)=>({input:await sharp(`${dir}/${width}-${count}-${f}.png`).resize(360,480,{fit:'contain'}).toBuffer(),left:i*360,top:0})))).png().toFile(`${dir}/${width}-${count}-sequence.png`);
 await page.close();
}
await browser.close();await writeFile(`${dir}/frames.json`,JSON.stringify(report,null,2));console.log(report);
