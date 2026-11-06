import { normalizeBag } from './selection';
import { allCategories, allTips } from '../data/tips';
import type { History } from './model';

export const RATINGS_KEY = 'noobtips.ratings.v2';
export const HISTORY_KEY = 'noobtips.history.v2';
export const LEGACY_HISTORY_KEY = 'noobtips.history.v1';
export interface RatingEvent { id: string; tipId: string; value: number }
export type Ratings = RatingEvent[];
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function browserStorage(): StorageLike | undefined { try { return window.localStorage; } catch { return undefined; } }
function read(storage: StorageLike | undefined, key: string): Record<string, unknown> {
  try { const data: unknown = JSON.parse(storage?.getItem(key) ?? '{}'); return data && typeof data === 'object' && !Array.isArray(data) ? data as Record<string, unknown> : {}; } catch { return {}; }
}
export function loadRatings(storage = browserStorage()): Ratings {
  try {
    const data: unknown = JSON.parse(storage?.getItem(RATINGS_KEY) ?? '[]');
    if (!Array.isArray(data)) return [];
    const ids = new Set<string>();
    return data.filter((event): event is RatingEvent => {
      if (!event || typeof event.id !== 'string' || !event.id || ids.has(event.id) || !allTips.some(t => t.id === event.tipId) || !Number.isInteger(event.value) || event.value < 1 || event.value > 5) return false;
      ids.add(event.id); return true;
    });
  } catch { return []; }
}
export function loadHistory(storage = browserStorage()): History {
  const current = read(storage, HISTORY_KEY);
  const legacy = read(storage, LEGACY_HISTORY_KEY);
  return Object.fromEntries(allCategories.map(category => [category.id,
    normalizeBag(current[category.id] ?? legacy[category.id], allTips.filter(t => t.category === category.id)),
  ]));
}
export function save(key: string, value: unknown, storage = browserStorage()): boolean {
  try { if (!storage) return false; storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
