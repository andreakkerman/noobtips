/** Fixed-camera 2.5D salvage world. All placements depend on deposit index, never count. */
export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 720;
export const noise = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export interface Junk { id: number; x: number; y: number; size: number; angle: number; kind: number; depth: number }
export interface MountainArt { atlases: HTMLImageElement[]; background: HTMLImageElement; shaded: HTMLCanvasElement[] }
let artPromise: Promise<MountainArt> | undefined;
export function loadMountainArt(): Promise<MountainArt> {
  if (!artPromise) {
    const load = (file: string) => new Promise<HTMLImageElement>((resolve,reject) => {
      const image = new Image(); image.onload = () => resolve(image); image.onerror = reject;
      image.src = `${import.meta.env.BASE_URL}art/mountain/${file}`;
    });
    artPromise = Promise.all([load('junk-atlas.webp'),load('salvage-atlas.webp'),load('courtyard.webp')])
      .then(([household,salvage,background]) => {
        const atlases=[household,salvage];
        const shaded=atlases.map(atlas=>{
        const shaded=document.createElement('canvas');shaded.width=atlas.width;shaded.height=atlas.height;
        const c=shaded.getContext('2d')!;c.drawImage(atlas,0,0);c.globalCompositeOperation='source-atop';c.fillStyle='#07363d88';c.fillRect(0,0,shaded.width,shaded.height);
        return shaded;
        });
        return {atlases,background,shaded};
      }).catch(error => { artPromise=undefined; throw error; });
  }
  return artPromise;
}
// A support lattice fills outward AND upward. A slot's lower support always
// precedes it, unlike random sprite scattering. Jitter never breaks that support.
const slots = Array.from({length:42},(_,row) => Array.from({length:31},(_,col) => ({row,col:col-15}))).flat()
  .sort((a,b) => (Math.abs(a.col)*1.8+a.row*.95)-(Math.abs(b.col)*1.8+b.row*.95) || a.col-b.col);
// Deposit-seeded choices: increasing the total never reshuffles earlier props.
export function junkKind(id:number):number {
  // A complete, interleaved introduction; then weighted seeded sampling.
  if(id<32)return (id*13+15)%32;
  if(id===49)return 18; // Dish above the first substantial mountain.
  if(id===99)return 16; // Scanner mast becomes a late-stage skyline accent.
  const salvageChance=id<100?.55:.78;
  return (noise(id+91)<salvageChance?16:0)+Math.floor(noise(id+203)*16);
}
export function mountainObjects(count: number): Junk[] {
  const n = Number.isFinite(count) ? Math.max(0,Math.floor(count)) : 0;
  const core = slots.slice(0,Math.min(n,320)).map((slot,id) => ({
    id, x:480+slot.col*48+(noise(id+8)-.5)*17,
    y:620-(slot.row===0?0:slot.row===1?19:44+(slot.row-2)*33)+(noise(id+12)-.5)*6,
    size:id===0?32:id<5?44+noise(id)*15:id>=100?106+noise(id+3)*48:[24,49,95,99].includes(id)?145:id%11===0?126:68+noise(id+3)*37,
    angle:(noise(id+4)-.5)*(id%16===1?.8:.55),
    kind:junkKind(id),
    depth:slot.row,
  }));
  // After the peak leaves the fixed frame, new arrivals accumulate on visible
  // shoulders. Keep only the latest 80 of these buried deposits in the render.
  for(let id=Math.max(320,n-80);id<n;id++) {
    core.push({id,x:110+noise(id+8)*740,y:175+noise(id+3)*380,size:48+noise(id)*55,angle:(noise(id+4)-.5)*.8,kind:junkKind(id),depth:0});
  }
  return core;
}
export function drawJunk(c: CanvasRenderingContext2D, o: Junk, art: MountainArt, shade=0) {
  const bank=Math.floor(o.kind/16),kind=o.kind%16;
  const atlas=shade?art.shaded[bank]:art.atlases[bank];
  const cell=atlas.width/4;
  c.save();c.translate(o.x,o.y);c.rotate(o.angle);
  c.shadowColor='#001218b0';c.shadowBlur=o.size*.09;c.shadowOffsetX=-o.size*.04;c.shadowOffsetY=o.size*.06;
  c.drawImage(atlas,(kind%4)*cell,Math.floor(kind/4)*cell,cell,cell,-o.size/2,-o.size,o.size,o.size);
  c.shadowColor='transparent';
  c.restore();
}
export function drawEnvironment(c: CanvasRenderingContext2D, art: MountainArt, count:number) {
  c.clearRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
  c.drawImage(art.background,0,0,WORLD_WIDTH,WORLD_HEIGHT);
  // Ground contact expands beneath deposits. It never changes the camera scale.
  if(count){const width=Math.min(410,14+Math.sqrt(count)*37);const shadow=c.createRadialGradient(480,621,0,480,621,width);
    shadow.addColorStop(0,'#001017d9');shadow.addColorStop(.75,'#00101766');shadow.addColorStop(1,'#00101700');
    c.save();c.translate(0,621);c.scale(1,.16);c.translate(0,-621);c.fillStyle=shadow;c.fillRect(0,621-width,960,width*2);c.restore();}
}
function drawDeposit(c: CanvasRenderingContext2D,o:Junk,art:MountainArt) {
  // Two smaller interlocked items form the shadowed backing for larger deposits.
  // They share the deposit transform during entry, so no offcuts pop into place.
  if(o.id>4){
    drawJunk(c,{...o,x:o.x-o.size*.22,y:o.y+5,size:o.size*.63,kind:(o.kind+5)%32,angle:o.angle-.35},art,1);
    drawJunk(c,{...o,x:o.x+o.size*.27,y:o.y-3,size:o.size*.58,kind:(o.kind+9)%32,angle:o.angle+.4},art,1);
  }
  drawJunk(c,o,art);
}
export function drawAtmosphere(c:CanvasRenderingContext2D,count:number) {
  if(count>8){const haze=c.createLinearGradient(0,510,0,660);haze.addColorStop(0,'#a2c9b000');haze.addColorStop(.7,'#b7c3a41b');haze.addColorStop(1,'#a2c9b000');c.fillStyle=haze;c.fillRect(0,510,960,150);}
  for(let i=0;i<Math.min(65,8+count);i++){c.fillStyle=i%3?'#ffe4ab55':'#e8f0d833';c.beginPath();c.arc(100+noise(i+77)*760,140+noise(i+99)*480,.5+noise(i+4),0,Math.PI*2);c.fill();}
  const edge=c.createRadialGradient(480,330,240,480,330,650);edge.addColorStop(0,'#041a2000');edge.addColorStop(1,'#041a2077');c.fillStyle=edge;c.fillRect(0,0,960,720);
}
export function drawMountain(c:CanvasRenderingContext2D,count:number,art:MountainArt,arrivalId?:number,portion:'all'|'behind'|'front'='all') {
  if(portion!=='front')drawEnvironment(c,art,count);
  else c.clearRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
  const objects=mountainObjects(count).sort((a,b)=>a.y-b.y || a.x-b.x);
  const split=objects.findIndex(o=>o.id===arrivalId);
  objects.forEach((object,index)=>{
    if(portion==='behind'&&index>=split)return;
    if(portion==='front'&&index<=split)return;
    drawDeposit(c,object,art);
  });
  if(portion!=='behind')drawAtmosphere(c,count);
}
export function landingPose(object:Junk,time:number):Junk {
  const t=Math.max(0,Math.min(1,time));const impact=.66;
  // Accelerating ballistic drop; a single damped rebound lands exactly at rest.
  const drop=t<impact ? (1-(t/impact)**2)*290 : Math.sin((t-impact)/(1-impact)*Math.PI)*16*(1-(t-impact)/(1-impact));
  return {...object,x:object.x+(1-t)*-32,y:object.y-drop,angle:object.angle+(1-t)*-.65};
}
export function drawArrival(c:CanvasRenderingContext2D,object:Junk,art:MountainArt,time:number) {
  drawDeposit(c,landingPose(object,time),art);
  if(time>.66){const age=(time-.66)/.34;c.save();c.globalAlpha=(1-age)*.45;
    for(let i=0;i<32;i++){const x=object.x+(noise(i+object.id)-.5)*object.size*2*age,y=object.y-4-Math.sin(age*Math.PI)*noise(i+3)*35;
      c.fillStyle=i%4?'#d2bb86':'#93b7ac';c.beginPath();c.ellipse(x,y,2+age*noise(i+8)*10,1+age*noise(i+5)*4,0,0,Math.PI*2);c.fill();}
    c.restore();}
}
