import { tips, type Tip } from '../data/tips';
import type { Ratings } from './storage';

export type RankedTip = Tip & { rating: number };

export function rankTips(ratings: Ratings): RankedTip[] {
  return tips
    .filter(tip => Number.isInteger(ratings[tip.id]) && ratings[tip.id] >= 1 && ratings[tip.id] <= 5)
    .map(tip => ({ ...tip, rating: ratings[tip.id] }))
    .sort((a, b) => b.rating - a.rating || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, 20);
}
