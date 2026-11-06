import { test, expect } from '@playwright/test';

async function fifth(page: import('@playwright/test').Page) {
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('./');
  await page.getByRole('button',{name:'SPELEN!',exact:true}).click();
  for(let i=0;i<5;i++){
    await page.getByRole('button',{name:'Geef me een Noobtip!',exact:true}).click();
    await expect(page.locator('main')).toHaveAttribute('data-phase','rating');
    await page.getByRole('radio',{name:/^5 van 5/}).click();
    if(i<4)await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
  }
}
test('cinematic streak holds a spin until YAY and continues exactly once',async({page})=>{
  await fifth(page);await page.emulateMedia({reducedMotion:'no-preference'});
  await page.getByRole('button',{name:'Geef me nog een Noobtip!',exact:true}).click();
  const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
  await expect(page.locator('main')).toHaveAttribute('data-spin','5');
  await expect(page.locator('.game-stage')).toHaveAttribute('inert','');
  await expect(page.locator('.topbar')).toHaveAttribute('inert','');
  await page.waitForTimeout(3600);await expect(dialog).toBeVisible();
  const yay=page.getByRole('button',{name:'YAY!',exact:true});await expect(yay).toBeFocused();
  await page.keyboard.press('Tab');await expect(yay).toBeFocused();
  await page.keyboard.press('Enter');await expect(dialog).toHaveCount(0);
  await expect(page.locator('main')).toHaveAttribute('data-spin','6');
  await expect(page.locator('main')).toHaveAttribute('data-phase','rating');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('noobtips.ratings.v2')!).length)).toBe(5);
  await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();await expect(dialog).toHaveCount(0);
});
test('reduced motion celebration preserves the menu destination and ignores double dismissal',async({page})=>{
  await fifth(page);await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'YAY!',exact:true}).evaluate(b=>{(b as HTMLButtonElement).click();(b as HTMLButtonElement).click();});
  await expect(page.locator('main')).toHaveAttribute('data-phase','ready');await expect(page.locator('main')).toHaveAttribute('data-spin','5');
  await expect(page.getByRole('button',{name:'Geef me een Noobtip!',exact:true})).toBeFocused();
});
for(const count of [1,11,75,100,150])test(`mountain ${count} establishes, replays on every visit and preserves pixels and events`,async({page})=>{
  await page.clock.install({time:new Date('2026-11-06T12:00:00Z')});await page.clock.pauseAt(new Date('2026-11-06T12:00:01Z'));
  await page.goto('./');await page.evaluate(n=>localStorage.setItem('noobtips.ratings.v2',JSON.stringify(Array.from({length:n},(_,i)=>({id:`fixture-${i}`,tipId:'general-001',value:5})))),count);await page.reload();
  await page.getByRole('button',{name:'SPELEN!',exact:true}).click();
  const saved=await page.evaluate(()=>localStorage.getItem('noobtips.ratings.v2'));
  for(let visit=0;visit<2;visit++){
    await page.getByRole('button',{name:'TOP 20',exact:true}).click();const canvas=page.locator('.mountain-scene canvas');
    await expect(canvas).toHaveAttribute('data-entrance','establishing');
    const expected=await page.evaluate(async n=>{
      const path='/src/game/mountain.ts';const {drawMountain,loadMountainArt}=await import(path);const art=await loadMountainArt();
      const source=document.querySelector('.mountain-scene canvas') as HTMLCanvasElement;
      const c=document.createElement('canvas');c.width=source.width;c.height=source.height;const ctx=c.getContext('2d')!;ctx.scale(c.width/960,c.height/720);
      drawMountain(ctx,n-(n>=75?2:1),art);const initial=c.toDataURL();drawMountain(ctx,n,art);return {initial,final:c.toDataURL()};
    },count);
    expect(await canvas.evaluate(c=>(c as HTMLCanvasElement).toDataURL())).toBe(expected.initial);
    await page.clock.runFor(650);await expect(canvas).toHaveAttribute('data-entrance','establishing');
    await page.clock.runFor(450);await expect(canvas).toHaveAttribute('data-entrance','arriving');
    await page.clock.runFor(2500);
    await expect(canvas).toHaveAttribute('data-entrance','settled');
    expect(await canvas.evaluate(c=>(c as HTMLCanvasElement).toDataURL())).toBe(expected.final);
    expect(await page.evaluate(()=>localStorage.getItem('noobtips.ratings.v2'))).toBe(saved);
    await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
  }
});
test('empty and reduced-motion mountain stays still; delay and active replay cancel cleanly',async({page})=>{
  await page.addInitScript(()=>{
    const active=new Set<number>();(window as unknown as {animationFrames:Set<number>}).animationFrames=active;
    const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame=callback=>{const id=request(time=>{active.delete(id);callback(time);});active.add(id);return id;};
    window.cancelAnimationFrame=id=>{active.delete(id);cancel(id);};
  });
  await page.goto('./');await page.getByRole('button',{name:'SPELEN!',exact:true}).click();
  await page.getByRole('button',{name:'TOP 20',exact:true}).click();await expect(page.locator('.mountain-scene canvas')).toHaveAttribute('data-entrance','settled');
  await page.evaluate(()=>localStorage.setItem('noobtips.ratings.v2',JSON.stringify([{id:'one',tipId:'general-001',value:5}])));await page.reload();
  await page.getByRole('button',{name:'SPELEN!',exact:true}).click();
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  for(const wait of [0,0,1150]){
    await page.getByRole('button',{name:'TOP 20',exact:true}).click();await expect(page.locator('.mountain-scene canvas')).toHaveAttribute('data-entrance','establishing');
    await page.waitForTimeout(wait);await page.getByRole('button',{name:'TERUG NAAR HOOFDMENU'}).click();
  }
  await page.waitForTimeout(1800);await expect(page.locator('.mountain-scene')).toHaveCount(0);expect(errors).toEqual([]);
  expect(await page.evaluate(()=>(window as unknown as {animationFrames:Set<number>}).animationFrames.size)).toBe(0);
  await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'TOP 20',exact:true}).click();await expect(page.locator('.mountain-scene canvas')).toHaveAttribute('data-entrance','settled');
});
