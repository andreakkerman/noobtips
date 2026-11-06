import { useEffect, useRef, useState } from 'react';
import { drawMountain, drawArrival, loadMountainArt, mountainObjects, WORLD_HEIGHT, WORLD_WIDTH } from '../game/mountain';

export function Mountain({ count, previousCount }: { count: number; previousCount: number }) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    let cancelled=false,frame=0;
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const render=async()=>{
      try {
        const art=await loadMountainArt();if(cancelled)return;
        const el=canvas.current!,c=el.getContext('2d')!;
        const ratio=Math.min(window.devicePixelRatio||1,1.5);
        el.width=WORLD_WIDTH*ratio;el.height=WORLD_HEIGHT*ratio;c.scale(ratio,ratio);
        const last=mountainObjects(count).at(-1);
        const animate=!media.matches && count>previousCount && last;
        // Cache everything except the arriving deposit. Animation frames composite
        // one bitmap and the moving object, not hundreds of static sprites.
        const cache=document.createElement('canvas');cache.width=el.width;cache.height=el.height;
        const cached=cache.getContext('2d')!;cached.scale(ratio,ratio);
        drawMountain(cached,count,art,animate?last.id:undefined,animate?'behind':'all');
        const front=document.createElement('canvas');front.width=el.width;front.height=el.height;
        if(animate){const foreground=front.getContext('2d')!;foreground.scale(ratio,ratio);drawMountain(foreground,count,art,last.id,'front');}
        const start=performance.now();
        const draw=(now:number)=>{
          if(cancelled)return;
          const t=animate&&!media.matches?Math.min(1,(now-start)/1100):1;
          c.clearRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);c.drawImage(cache,0,0,WORLD_WIDTH,WORLD_HEIGHT);
          if(animate&&last){drawArrival(c,last,art,t);c.drawImage(front,0,0,WORLD_WIDTH,WORLD_HEIGHT);}
          if(t<1)frame=requestAnimationFrame(draw);
        };
        draw(start);setFailed(false);
      } catch {if(!cancelled)setFailed(true);}
    };
    void render();
    return()=>{cancelled=true;cancelAnimationFrame(frame);};
  },[count,previousCount]);
  return <div className="mountain-scene"><canvas ref={canvas} aria-label={`De Afvalberg: ${count} volledig afgekeurd`} role="img" />{failed&&<p className="mountain-error">De berg kon niet laden. Open de Top 20 opnieuw.</p>}<div className="mountain-caption"><h2>De Afvalberg</h2><span>{count} volledig afgekeurd</span></div></div>;
}
