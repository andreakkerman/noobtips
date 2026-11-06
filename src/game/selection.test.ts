import { describe, expect, it } from 'vitest';
import { tips, type Tip } from '../data/tips';
import { normalizeBag, selectFromPool, shuffle, RECENT_WINDOW, type Bag } from './selection';
import { loadHistory, save, HISTORY_KEY, LEGACY_HISTORY_KEY, RATINGS_KEY, type StorageLike } from './storage';
import { tipTags } from './topics';
const rng=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const memory=():StorageLike=>{const m=new Map<string,string>();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>{m.set(k,v);}};};
const pool=tips.filter(t=>t.category==='arc');
const fake=(id:string,text=id):Tip=>({id,text,category:'general'});

describe('persistent variety-aware shuffle bags',()=>{
 it('covers each complete pool exactly once for twenty cycles, protecting the recent window',()=>{
  const random=rng(348);let bag:Bag|undefined;const recent:string[]=[];
  for(let cycle=0;cycle<20;cycle++){
   const seen=new Set<string>();
   for(let i=0;i<pool.length;i++){
    const selected=selectFromPool(pool,bag,random);bag=selected.bag;
    expect(seen.has(selected.tip.id)).toBe(false);expect(recent.slice(-RECENT_WINDOW)).not.toContain(selected.tip.id);
    seen.add(selected.tip.id);recent.push(selected.tip.id);
   }
   expect(seen.size).toBe(pool.length);expect(bag!.remaining).toEqual([]);expect(bag!.cycle).toBe(cycle+1);
  }
 });
 it('uses Fisher-Yates, reproduces seeded runs and differs across seeds',()=>{
  const ids=pool.map(t=>t.id);expect(new Set(shuffle(ids,rng(1)))).toEqual(new Set(ids));
  const run=(seed:number)=>{let bag:Bag|undefined;const random=rng(seed);return Array.from({length:200},()=>{const r=selectFromPool(pool,bag,random);bag=r.bag;return r.tip.id;});};
  expect(run(123)).toEqual(run(123));expect(run(123)).not.toEqual(run(456));expect(run(123).slice(0,100)).not.toEqual(ids);
 });
 it('spaces named subjects before weaker sentence patterns without excluding any tip',()=>{
  const subjects=[fake('wasp1','Een Wasp vliegt.'),fake('wasp2','Als een Wasp stil staat.'),fake('door','Een deur is dicht.'),fake('tick','Een Tick zit op je hoofd.'),fake('book','Als je een boek leest.')];
  const raw={seen:['wasp1'],remaining:['wasp2','door','tick','book'],recent:['wasp1'],cycle:1};
  const selected=selectFromPool(subjects,raw,rng(9));expect(selected.tip.id).toBe('book');
  expect(tipTags(subjects[0])).toContain('wasp');expect(tipTags(fake('u','Onbekend ding.'))).toEqual([]);
  let bag=selected.bag;while(bag.remaining.length)bag=selectFromPool(subjects,bag,rng(1)).bag;
  expect(new Set(bag.seen)).toEqual(new Set(subjects.map(t=>t.id)));
 });
 it('degrades safely with one- and two-tip pools across hundreds of reload-like normalizations',()=>{
  for(const n of [1,2,3,5]){const small=Array.from({length:n},(_,i)=>fake(String(i)));let bag:Bag|undefined,last='';const random=rng(n);
   for(let i=0;i<300;i++){const r=selectFromPool(small,bag,random);if(n>1)expect(r.tip.id).not.toBe(last);last=r.tip.id;bag=JSON.parse(JSON.stringify(r.bag));}
  }
  expect(()=>selectFromPool([],undefined,rng(1))).toThrow('empty');
 });
 it('inserts newly added tips without replaying seen IDs and removes orphaned or moved IDs',()=>{
  const small=[fake('a'),fake('b'),fake('c')];const raw={seen:['a','deleted'],remaining:['b','b','removed'],recent:['deleted','a'],cycle:4};
  const normalized=normalizeBag(raw,small,rng(1));expect(normalized.seen).toEqual(['a']);expect(new Set(normalized.remaining)).toEqual(new Set(['b','c']));expect(normalized.recent).toEqual(['a']);expect(normalized.cycle).toBe(4);
  const first=selectFromPool(small,normalized,rng(2));const second=selectFromPool(small,first.bag,rng(2));expect(new Set([first.tip.id,second.tip.id])).toEqual(new Set(['b','c']));
 });
 it('preserves bag order across reload and migrates v1 without touching ratings or inactive School',()=>{
  const storage=memory();save(LEGACY_HISTORY_KEY,{arc:['arc-001','deleted','arc-001'],school:['school-001']},storage);save(RATINGS_KEY,[{id:'rating',tipId:'arc-001',value:5}],storage);
  const history=loadHistory(storage);expect((history.arc as Bag).seen).toEqual(['arc-001']);expect((history.school as Bag).seen).toEqual(['school-001']);
  save(HISTORY_KEY,history,storage);expect(loadHistory(storage)).toEqual(history);expect(storage.getItem(RATINGS_KEY)).toContain('rating');
  const before=history.general;const r=selectFromPool(pool,history.arc,rng(2));history.arc=r.bag;expect(history.general).toBe(before);
 });
 it('normalizes corrupt and outdated state defensively',()=>{
  for(const raw of [null,3,'wrong',{seen:'a',remaining:42,recent:{},cycle:-9},['unknown']]){
   const bag=normalizeBag(raw,pool,rng(4));expect(bag.seen).toEqual([]);expect(bag.remaining).toHaveLength(pool.length);expect(bag.cycle).toBe(1);
  }
  const storage=memory();storage.setItem(HISTORY_KEY,'{broken');storage.setItem(LEGACY_HISTORY_KEY,JSON.stringify({arc:['arc-002']}));expect((loadHistory(storage).arc as Bag).seen).toEqual(['arc-002']);
  const blocked={getItem:()=>{throw Error();},setItem:()=>{throw Error();}};expect((loadHistory(blocked).arc as Bag).remaining).toHaveLength(pool.length);
 });
 it('retains chronological repeated recent IDs in tiny pools',()=>{const bag=normalizeBag({seen:['a'],remaining:['b'],recent:['a','b','a'],cycle:2},[fake('a'),fake('b')],rng(2));expect(bag.recent).toEqual(['a','b','a']);});
});
