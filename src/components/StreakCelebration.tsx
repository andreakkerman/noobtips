import { useEffect, useRef } from 'react';
import { Bin } from './TrashRating';
import { noise } from '../game/mountain';
export function StreakCelebration({milestone,reduced,onDone}:{milestone:{count:number;title:string};reduced:boolean;onDone():void}) {
  const canvas=useRef<HTMLCanvasElement>(null), done=useRef(onDone);done.current=onDone;
  useEffect(()=>{
    const timer=setTimeout(()=>done.current(),2800);let frame=0;
    if(!reduced){
      const el=canvas.current!,c=el.getContext('2d')!,w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio,1.5);
      el.width=w*dpr;el.height=h*dpr;c.scale(dpr,dpr);
      const particles=Array.from({length:w<1100?180:260},(_,i)=>({x:w/2+(noise(i)-.5)*w*.4,y:h*.74,vx:(noise(i+12)-.5)*650,vy:-180-noise(i+9)*460,z:.3+noise(i+4),r:noise(i+6)*6}));
      let previous=performance.now();const start=previous;
      const draw=(now:number)=>{const dt=Math.min(.033,(now-previous)/1000);previous=now;const age=(now-start)/1000;c.clearRect(0,0,w,h);
        particles.forEach((p,i)=>{p.vx*=Math.exp(-dt*.32);p.vy+=dt*155;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=dt*(noise(i+19)-.5)*5;c.save();c.translate(p.x,p.y);c.rotate(p.r);c.globalAlpha=Math.min(1,(2.8-age)*2)*.85;c.fillStyle=['#ffe6ad','#b3d4c5','#c08b57','#fff2c6'][i%4];c.shadowColor='#ffc967';c.shadowBlur=i%5===0?12:0;c.scale(p.z,Math.cos(age*4+i)*p.z);
          if(i%9===0){c.fillStyle='#bf925f';c.fillRect(-12,-7,24,14);c.strokeStyle='#f0cc8e';c.lineWidth=1;c.strokeRect(-12,-7,24,14);c.beginPath();c.moveTo(0,-7);c.lineTo(0,7);c.stroke();}
          else if(i%4===0){c.beginPath();c.moveTo(-6,-7);c.lineTo(6,-5);c.lineTo(8,3);c.lineTo(-3,8);c.lineTo(-7,1);c.closePath();c.fill();c.strokeStyle='#8f855a';c.lineWidth=.7;c.beginPath();c.moveTo(-6,-7);c.lineTo(1,1);c.lineTo(-3,8);c.stroke();}
          else {c.fillRect(-4,-2,9,4);}
          c.restore();});if(age<2.8)frame=requestAnimationFrame(draw);
      };frame=requestAnimationFrame(draw);
    }
    return()=>{clearTimeout(timer);cancelAnimationFrame(frame);};
  },[milestone,reduced]);
  return <div className={`streak-celebration ${reduced?'streak-still':''}`} role="status" data-streak={milestone.count}><div className="streak-shafts"/><div className="streak-halo"/><canvas ref={canvas} aria-hidden="true"/><div className="streak-content"><p>PRULLENBAKKENSTREAK · {milestone.count}</p><div className="streak-bins" aria-hidden="true">{[0,1,2,3,4].map(i=><Bin key={i} filled overloaded index={i} animation={0}/>)}</div><h2>{milestone.title}</h2><span>Zoveel onzin. Zo mooi.</span></div></div>;
}
