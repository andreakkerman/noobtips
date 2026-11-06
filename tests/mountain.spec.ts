import { test, expect } from '@playwright/test';
test('final ratings produce one milestone, category changes preserve streak and effects clean up', {tag:'@smoke'}, async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('./');await page.getByRole('button',{name:'SPELEN!',exact:true}).click();
 for(let i=1;i<=5;i++){
  await page.getByRole('button',{name:'Geef me een Noobtip!',exact:true}).click();await expect(page.locator('main')).toHaveAttribute('data-phase','rating');
  await expect(page.locator('[role=radio][aria-checked=true]')).toHaveCount(0);
  await page.getByRole('radio',{name:/^5 van 5/}).click();await page.getByRole('radio',{name:/^2 van 5/}).click();await page.getByRole('radio',{name:/^5 van 5/}).click();await page.getByRole('radio',{name:/^5 van 5/}).click();
  await expect(page.locator('.streak-celebration')).toHaveCount(0);
  await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
  if(i===3)await page.getByRole('button',{name:'Arc Raiders',exact:true}).click();
 }
 await expect(page.locator('.streak-celebration')).toHaveAttribute('data-streak','5');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('noobtips.ratings.v2')!).length)).toBe(5);
 await page.getByRole('button',{name:'Geef me een Noobtip!',exact:true}).click();await expect(page.locator('main')).toHaveAttribute('data-phase','rating');
 await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
 await expect(page.locator('.streak-celebration')).toHaveCount(0,{timeout:4000});
 await page.getByRole('button',{name:'TOP 20',exact:true}).click();await expect(page.getByText('5 volledig afgekeurd',{exact:true})).toBeVisible();
});
test('mountain renders deterministic pixels within a bounded frame budget',async({page})=>{
 await page.goto('./');
 const result=await page.evaluate(async()=>{
  // Test the real renderer directly: no cinematic spins or production test hooks.
  const modulePath='/src/game/mountain.ts';
  const {drawMountain,loadMountainArt}=await import(modulePath);
  const art=await loadMountainArt();
  const canvas=document.createElement('canvas');canvas.width=800;canvas.height=620;const c=canvas.getContext('2d')!;
  drawMountain(c,100,art);const first=canvas.toDataURL();drawMountain(c,100,art);const same=canvas.toDataURL()===first;
  const start=performance.now();for(let i=0;i<10;i++)drawMountain(c,100,art);const ms=(performance.now()-start)/10;
  return {same,ms};
 });expect(result.same).toBe(true);expect(result.ms).toBeLessThan(150);
});

test('new artwork loads locally and closing an active arrival disposes the scene',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});const external:string[]=[];
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:5173/')&&!r.url().startsWith('data:'))external.push(r.url());});
 await page.goto('./');await page.getByRole('button',{name:'SPELEN!',exact:true}).click();
 await page.getByRole('button',{name:'Geef me een Noobtip!',exact:true}).click();await expect(page.locator('main')).toHaveAttribute('data-phase','rating');
 await page.getByRole('radio',{name:/^5 van 5/}).click();await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
 await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'TOP 20',exact:true}).click();
 await expect(page.locator('.mountain-scene canvas')).toBeVisible();await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
 await expect(page.locator('.mountain-scene')).toHaveCount(0);await page.waitForTimeout(1200);
 await expect(page.locator('main')).toHaveAttribute('data-phase','ready');expect(external).toEqual([]);
});
