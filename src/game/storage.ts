import { allCategories, allTips } from '../data/tips';
import type { History } from './model';

export const RATINGS_KEY = 'noobtips.ratings.v1';
export const HISTORY_KEY = 'noobtips.history.v1';
export type Ratings = Record<string, number>;
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function browserStorage(): StorageLike | undefined { try { return window.localStorage; } catch { return undefined; } }
function read(storage: StorageLike | undefined, key: string): Record<string, unknown> {
  try { const data: unknown = JSON.parse(storage?.getItem(key) ?? '{}'); return data && typeof data === 'object' && !Array.isArray(data) ? data as Record<string, unknown> : {}; } catch { return {}; }
}
export function loadRatings(storage = browserStorage()): Ratings {
  const data = read(storage, RATINGS_KEY);
  return Object.fromEntries(Object.entries(data).filter(([id, rating]) => allTips.some(t => t.id === id) && typeof rating === 'number' && Number.isInteger(rating) && rating >= 1 && rating <= 5)) as Ratings;
}
export function loadHistory(storage = browserStorage()): History {
  const data = read(storage, HISTORY_KEY);
  return Object.fromEntries(allCategories.map(category => {
    const value = data[category.id];
    return [category.id, Array.isArray(value) ? [...new Set(value.filter(id => allTips.some(t => t.id === id && t.category === category.id)))] : []];
  }));
}
export function save(key: string, value: unknown, storage = browserStorage()): boolean {
  try { if (!storage) return false; storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
