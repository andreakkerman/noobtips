import { tips, type Tip } from '../data/tips';
import type { Ratings } from './storage';
export type RankedTip = Tip & { rating: number; count: number; fives: number };
export function rankTips(ratings: Ratings): RankedTip[] {
  return tips.flatMap(tip => {
    const votes = ratings.filter(e => e.tipId === tip.id && Number.isInteger(e.value) && e.value >= 1 && e.value <= 5);
    return votes.length ? [{ ...tip, rating: votes.reduce((sum, e) => sum + e.value, 0) / votes.length, count: votes.length, fives: votes.filter(e => e.value === 5).length }] : [];
  }).sort((a,b) => b.rating-a.rating || b.fives-a.fives || b.count-a.count || (a.id < b.id ? -1 : 1)).slice(0,20);
}
