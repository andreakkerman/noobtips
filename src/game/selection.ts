import { type StoredCategoryId, type Tip } from '../data/tips';
import { tipTags } from './topics';

export const RECENT_WINDOW = 8;
export interface Bag { seen: string[]; remaining: string[]; recent: string[]; cycle: number }
// Arrays are accepted only as the old v1 history format, then normalized on use.
export type History = Partial<Record<StoredCategoryId, Bag | string[]>>;
export type RandomSource = () => number;
export function browserRandom(): number {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    return globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  }
  return Math.random();
}
const unit = (random: RandomSource) => Math.min(1 - Number.EPSILON, Math.max(0, random() || 0));
export function shuffle<T>(items: readonly T[], random: RandomSource): T[] {
  const output = [...items];
  for (let i = output.length - 1; i > 0; i--) {
    const j = Math.floor(unit(random) * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}
export function normalizeBag(raw: unknown, pool: readonly Pick<Tip, 'id'>[], random: RandomSource = browserRandom): Bag {
  const valid = new Set(pool.map(t => t.id));
  const clean = (value: unknown): string[] => Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === 'string' && valid.has(id)))] : [];
  const data = raw && typeof raw === 'object' ? raw as Partial<Bag> : {};
  const seen = clean(Array.isArray(raw) ? raw : data.seen);
  const remaining = clean(data.remaining).filter(id => !seen.includes(id));
  const missing = shuffle(pool.filter(t => !seen.includes(t.id) && !remaining.includes(t.id)).map(t => t.id), random);
  // Insert additions into the unconsumed bag without losing already-used IDs.
  for (const id of missing) remaining.splice(Math.floor(unit(random) * (remaining.length + 1)), 0, id);
  const recentRaw = Array.isArray(raw) ? raw : data.recent;
  const recent = Array.isArray(recentRaw) ? recentRaw.filter((id): id is string => typeof id === 'string' && valid.has(id)).slice(-RECENT_WINDOW) : [];
  return { seen, remaining, recent, cycle: Number.isSafeInteger(data.cycle) && data.cycle! > 0 ? data.cycle! : 1 };
}
export function selectFromPool(pool: readonly Tip[], raw: unknown, random: RandomSource = browserRandom, recentWindow = RECENT_WINDOW): { tip: Tip; bag: Bag } {
  if (!pool.length) throw new Error('Cannot select a tip from an empty active category');
  let bag = normalizeBag(raw, pool, random);
  if (!bag.remaining.length) bag = { ...bag, seen: [], remaining: shuffle(pool.map(t => t.id), random), cycle: bag.cycle + 1 };
  const window = Math.min(Math.max(0, recentWindow), RECENT_WINDOW, pool.length - 1);
  const recent = window ? bag.recent.slice(-window) : [];
  const protectedIds = new Set(recent);
  let candidates = bag.remaining.filter(id => !protectedIds.has(id));
  if (!candidates.length) candidates = [...bag.remaining];
  const byId = new Map(pool.map(t => [t.id,t]));
  const tagsById = new Map(pool.map(t => [t.id,tipTags(t)]));
  const recentTags = recent.map(id => tagsById.get(id)!);
  const score = (id: string) => {
    const tags = tagsById.get(id)!;
    return recentTags.reduce((total, previous, index) => total + tags.reduce((sum, tag) => {
      if (!previous.includes(tag)) return sum;
      // Pattern repetition is weaker than repeating the same named subject.
      const weight = tag.startsWith('pattern:') ? .18 : tag === 'empty' ? .35 : 1;
      return sum + weight * (index + 1) / Math.max(1, recentTags.length);
    }, 0), 0);
  };
  // The bag is already shuffled. Equal scores preserve that randomized order.
  const scores = new Map(candidates.map(id => [id,score(id)]));
  const id = candidates.reduce((best, candidate) => scores.get(candidate)! < scores.get(best)! ? candidate : best);
  return { tip: byId.get(id)!, bag: { ...bag, seen: [...bag.seen,id], remaining: bag.remaining.filter(value => value !== id), recent: [...bag.recent,id].slice(-RECENT_WINDOW) } };
}
