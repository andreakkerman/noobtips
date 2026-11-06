import { useEffect, useRef, useState } from 'react';
import { drawMountain, drawArrival, loadMountainArt, mountainObjects, WORLD_HEIGHT, WORLD_WIDTH } from '../game/mountain';
import { arcadeAudio } from '../game/audio';

export function Mountain({ count }: { count: number }) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    let cancelled=false,frame=0,timer=0,stopImpact:(()=>void)|undefined;
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const render=async()=>{
      try {
        const art=await loadMountainArt();if(cancelled)return;
        const el=canvas.current!,c=el.getContext('2d')!;
        const ratio=Math.min(window.devicePixelRatio||1,1.5);
        el.width=WORLD_WIDTH*ratio;el.height=WORLD_HEIGHT*ratio;c.scale(ratio,ratio);
        const layer=()=>{const el=document.createElement('canvas');el.width=WORLD_WIDTH*ratio;el.height=WORLD_HEIGHT*ratio;const ctx=el.getContext('2d')!;ctx.scale(ratio,ratio);return {el,ctx};};
        const complete=layer();drawMountain(complete.ctx,count,art);
        const showComplete=()=>{c.clearRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);c.drawImage(complete.el,0,0,WORLD_WIDTH,WORLD_HEIGHT);};
        const recent=mountainObjects(count).slice(count>=75?-2:-1);
        setFailed(false);
        if(!recent.length||media.matches){showComplete();el.dataset.entrance='settled';return;}
        drawMountain(c,count,art,undefined,'all',recent[0].id-1);
        el.dataset.entrance='establishing';
        // Wait for the fully rendered scene to paint before starting the hold.
        frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>{
          if(cancelled)return;
          timer=window.setTimeout(()=>{
            let index=0;
            const drop=()=>{
              if(cancelled)return;
              if(media.matches||index>=recent.length){showComplete();el.dataset.entrance='settled';return;}
              const object=recent[index],behind=layer(),front=layer();
              drawMountain(behind.ctx,count,art,object.id,'behind',object.id);drawMountain(front.ctx,count,art,object.id,'front',object.id);
              const start=performance.now(),duration=recent.length>1?850:1250;let impacted=false;
              el.dataset.entrance='arriving';
              el.dataset.arrival=String(object.id);
              const draw=(now:number)=>{
                if(cancelled)return;
                const t=media.matches?1:Math.min(1,(now-start)/duration);
                c.clearRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);c.drawImage(behind.el,0,0,WORLD_WIDTH,WORLD_HEIGHT);
                drawArrival(c,object,art,t);c.drawImage(front.el,0,0,WORLD_WIDTH,WORLD_HEIGHT);
                if(t>=.66&&!impacted&&!media.matches){impacted=true;stopImpact?.();stopImpact=arcadeAudio.junkImpact();}
                if(t<1)frame=requestAnimationFrame(draw);
                else {
                  // Resolve cached alpha layers to the exact static stage before
                  // the next drop; settled objects remain, future ones stay absent.
                  drawMountain(c,count,art,undefined,'all',object.id);
                  index++;drop();
                }
              };
              frame=requestAnimationFrame(draw);
            };
            drop();
          },1000);
        });});
      } catch {if(!cancelled)setFailed(true);}
    };
    void render();
    return()=>{cancelled=true;clearTimeout(timer);cancelAnimationFrame(frame);stopImpact?.();};
  },[count]);
  return <div className="mountain-scene"><canvas ref={canvas} aria-label={`De Afvalberg: ${count} volledig afgekeurd`} role="img" />{failed&&<p className="mountain-error">De berg kon niet laden. Open de Top 20 opnieuw.</p>}<div className="mountain-caption"><h2>De Afvalberg</h2><span>{count} volledig afgekeurd</span></div></div>;
}
