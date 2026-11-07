import {test,expect} from '@playwright/test';

async function preview(page:import('@playwright/test').Page) {
 await page.addInitScript(()=>{
  const frames=new Set<number>();(window as any).previewFrames=frames;
  const request=requestAnimationFrame.bind(window),cancel=cancelAnimationFrame.bind(window);
  window.requestAnimationFrame=fn=>{const id=request(t=>{frames.delete(id);fn(t);});frames.add(id);return id;};
  window.cancelAnimationFrame=id=>{frames.delete(id);cancel(id);};
 });
 await page.goto('./');
 await page.evaluate(async()=>{
  const reactPath='/node_modules/.vite/deps/react.js',domPath='/node_modules/.vite/deps/react-dom_client.js',componentPath='/src/components/StreakCelebration.tsx',ratingsPath='/src/game/ratings.ts';
  const react=await import(reactPath),React=react.default??react,dom=await import(domPath),{createRoot}=dom.default??dom;
  const {StreakCelebration}=await import(componentPath),{milestones}=await import(ratingsPath);
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  (window as any).preview=(count:number,reduced:boolean)=>root.render(React.createElement(StreakCelebration,{key:count,milestone:{count,title:milestones[count]},reduced,onDone:()=>root.render(null)}));
 });
}
test('all milestone counters preserve their headlines and clean hierarchy with immediate reduced-motion YAY',async({page},testInfo)=>{
 await preview(page);
 for(const [count,title] of [[5,'ECHT SLECHT!'],[10,'SUPER SLECHT!'],[15,'ECHT SUPERSLECHT!'],[75,'NIET NORMAAL MEER ZO SLECHT!'],[100,'HET ALLERSLECHTSTE OOIT!']] as const){
  await page.evaluate(n=>(window as any).preview(n,true),count);
  await expect(page.locator('.streak-counter')).toHaveText(`${count}×OP RIJ`);await expect(page.locator('#streak-title')).toHaveText(title);
  await expect(page.locator('.streak-bins .trash-object')).toHaveCount(5);
  await expect(page.getByRole('dialog')).not.toContainText('Zoveel onzin. Zo mooi.');await expect(page.getByRole('dialog')).not.toContainText('PRULLENBAKKENSTREAK');
  const button=page.getByRole('button',{name:'YAY!',exact:true});await expect(button).toBeEnabled();await expect(button).toBeFocused();
  expect(await page.evaluate(()=>(window as any).previewFrames.size)).toBe(0);
  const layout=await page.evaluate(()=>{const counter=document.querySelector('.streak-counter')!.getBoundingClientRect(),cans=[...document.querySelectorAll('.streak-bins svg')].map(x=>x.getBoundingClientRect()),headline=document.querySelector('#streak-title')!.getBoundingClientRect(),button=document.querySelector('.streak-yay')!.getBoundingClientRect();return counter.bottom<=Math.min(...cans.map(r=>r.top))&&Math.max(...cans.map(r=>r.bottom))<=headline.top&&headline.bottom<button.top&&counter.top>=0&&button.bottom<=innerHeight&&button.height>=48;});expect(layout).toBe(true);
  if(testInfo.project.use.hasTouch)await button.tap();else await button.click();await expect(page.getByRole('dialog')).toHaveCount(0);
 }
});
test('ambient fragments continue after the burst and all animation frames stop on YAY',async({page})=>{
 await preview(page);await page.evaluate(()=>(window as any).preview(5,false));
 await expect(page.getByRole('button',{name:'YAY!',exact:true})).toBeVisible();
 await page.waitForTimeout(1000);const first=await page.locator('.streak-celebration canvas').evaluate(c=>(c as HTMLCanvasElement).toDataURL());
 await page.waitForTimeout(400);expect(await page.locator('.streak-celebration canvas').evaluate(c=>(c as HTMLCanvasElement).toDataURL())).not.toBe(first);
 expect(await page.evaluate(()=>(window as any).previewFrames.size)).toBe(1);
 await page.getByRole('button',{name:'YAY!',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>(window as any).previewFrames.size)).toBe(0);
});
