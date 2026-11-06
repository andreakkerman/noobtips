import { describe, expect, it } from 'vitest';
import { tips } from '../data/tips';
import { rankTips } from './leaderboard';
import { recordRating, fiveCount, Streak, milestones } from './ratings';
import { loadRatings, save, RATINGS_KEY, type Ratings, type StorageLike } from './storage';
import { mountainObjects, landingPose } from './mountain';
const event=(id:string,tipId:string,value:number)=>({id,tipId,value});
const memory=():StorageLike=>{const m=new Map<string,string>();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>{m.set(k,v);}};};
describe('per-spin ratings and persistence',()=>{
 it('edits one event, allows repeats and keeps unrated spins absent',()=>{let e:Ratings=[];expect(e).toHaveLength(0);e=recordRating(e,'spin1','arc-001',5);e=recordRating(e,'spin1','arc-001',2);expect(e).toEqual([event('spin1','arc-001',2)]);e=recordRating(e,'spin2','arc-001',5);expect(e).toHaveLength(2);expect(fiveCount(e)).toBe(1);e=recordRating(e,'spin2','arc-001',4);expect(fiveCount(e)).toBe(0);expect(recordRating(e,'bad','arc-001',0)).toBe(e);});
 it('roundtrips and discards old storage without touching history',()=>{const s=memory();save('noobtips.ratings.v1',{'arc-001':5},s);expect(loadRatings(s)).toEqual([]);const events=[event('a','arc-001',5),event('b','arc-001',1)];save(RATINGS_KEY,events,s);expect(loadRatings(s)).toEqual(events);});
 it('handles malformed, unavailable, invalid and duplicate records',()=>{const s=memory();for(const v of ['{bad','null','{}','3','"hi"']){s.setItem(RATINGS_KEY,v);expect(loadRatings(s)).toEqual([]);}save(RATINGS_KEY,[null,event('a','arc-001',5),event('a','arc-002',2),event('b','removed',5),event('c','arc-001',2.5),event('d','arc-001',6)],s);expect(loadRatings(s)).toEqual([event('a','arc-001',5)]);const blocked={getItem:()=>{throw Error();},setItem:()=>{throw Error();}};expect(loadRatings(blocked)).toEqual([]);expect(save(RATINGS_KEY,[],blocked)).toBe(false);});
});
describe('historical Top 20',()=>{
 it('never invents votes and excludes inactive or removed tips',()=>{expect(rankTips([])).toEqual([]);expect(rankTips([event('a','school-001',5),event('b','removed',5)])).toEqual([]);});
 it('sorts average then fives then count then stable ID',()=>{const e=[event('a','arc-001',5),event('b','arc-001',3),event('c','arc-002',4),event('d','arc-002',4),event('e','arc-003',4),event('f','arc-004',4),event('g','arc-005',5)];expect(rankTips(e).map(t=>t.id)).toEqual(['arc-005','arc-001','arc-002','arc-003','arc-004']);expect(rankTips(e).find(t=>t.id==='arc-001')).toMatchObject({rating:4,count:2,fives:1});expect(rankTips([...e].reverse())).toEqual(rankTips(e));});
 it('caps all active rated tips at 20 without modifying input',()=>{const e=tips.map((t,i)=>event(String(i),t.id,5));const copy=JSON.stringify(e);expect(rankTips(e)).toHaveLength(20);expect(JSON.stringify(e)).toBe(copy);});
});
describe('finalized session streak',()=>{
 it('increments once per spin, ignores edits until finalization and resets on skip or low rating',()=>{const s=new Streak();for(let i=1;i<=5;i++){const result=s.finalize(String(i),5);expect(s.count).toBe(i);expect(result?.title).toBe(i===5?'ECHT SLECHT!':undefined);expect(s.finalize(String(i),5)).toBeNull();}s.finalize('6',4);expect(s.count).toBe(0);s.finalize('7',5);s.finalize('8',0);expect(s.count).toBe(0);});
 it('fires every specified milestone once and starts fresh on reload',()=>{const s=new Streak();const reached=[];for(let i=1;i<=100;i++){const m=s.finalize(String(i),5);if(m)reached.push(m.count);}expect(reached).toEqual(Object.keys(milestones).map(Number));expect(new Streak().count).toBe(0);});
});
describe('deterministic mountain',()=>{
 it('falls with acceleration, rebounds once and settles at the persistent placement',()=>{
  const object=mountainObjects(50).at(-1)!;
  const start=landingPose(object,0),early=landingPose(object,.2),late=landingPose(object,.4);
  expect(start.y).toBeLessThan(object.y-200);expect(late.y-early.y).toBeGreaterThan(early.y-start.y);
  expect(landingPose(object,.66).y).toBeCloseTo(object.y);expect(landingPose(object,.8).y).toBeLessThan(object.y);
  expect(landingPose(object,1)).toEqual(object);
 });
 it('continues visible deterministic additions above the original range without unbounded allocation',()=>{
  for(const count of [101,125,200,321,401,10000]){const objects=mountainObjects(count);expect(objects.length).toBeLessThanOrEqual(400);expect(objects.at(-1)!.id).toBe(count-1);expect(objects).toEqual(mountainObjects(count));}
 });
 it('adds one object every count, preserves every old placement and reloads identically',()=>{for(let n=0;n<=150;n++){const objects=mountainObjects(n);expect(objects).toHaveLength(n);expect(objects).toEqual(mountainObjects(n));if(n)expect(objects.slice(0,-1)).toEqual(mountainObjects(n-1));}});
 it('grows in height and width and bounds rendering above 100',()=>{const one=mountainObjects(1),hundred=mountainObjects(100);expect(Math.min(...hundred.map(o=>o.y))).toBeLessThan(one[0].y-200);expect(Math.max(...hundred.map(o=>o.x))-Math.min(...hundred.map(o=>o.x))).toBeGreaterThan(400);expect(mountainObjects(100000)).toHaveLength(400);expect(mountainObjects(-1)).toEqual([]);expect(mountainObjects(NaN)).toEqual([]);});
});

it('uses all 32 props and continues visible growth through 150',()=>{
 const objects=mountainObjects(150);
 expect(new Set(objects.map(o=>o.kind)).size).toBe(32);
 for(const count of [100,125,150]){
  expect(Math.min(...objects.slice(0,count).map(o=>o.y-o.size))).toBeLessThan(Math.min(...objects.slice(0,count-25).map(o=>o.y-o.size)));
 }
 expect(objects.slice(100).filter(o=>o.kind>=16).length).toBeGreaterThan(25);
 expect(objects.slice(100).every(o=>o.y>0&&o.size>=106)).toBe(true);
});
