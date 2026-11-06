import { describe, expect, it } from 'vitest';
import { tips } from '../data/tips';
import { rankTips } from './leaderboard';

describe('personal Prullenbak Top 20', () => {
  it('has no invented entries when ratings are empty', () => expect(rankTips({})).toEqual([]));
  it('ignores inactive, removed, fractional, nonnumeric and out-of-range ratings', () => {
    const ratings = { 'school-001': 5, removed: 5, 'general-001': 0, 'general-002': 6, 'general-003': 2.5, 'general-004': '5', 'arc-001': 4 };
    expect(rankTips(ratings as unknown as Record<string, number>).map(t => t.id)).toEqual(['arc-001']);
  });
  it.each([3, 20, 60])('ranks %i ratings by score and ID with a maximum of 20', count => {
    const pool = tips.slice(0, count);
    const ratings = Object.fromEntries(pool.map((tip, index) => [tip.id, index % 5 + 1]));
    const original = { ...ratings };
    const expected = [...pool].sort((a, b) => ratings[b.id] - ratings[a.id] || (a.id < b.id ? -1 : 1)).slice(0, 20);
    expect(rankTips(ratings).map(t => t.id)).toEqual(expected.map(t => t.id));
    expect(rankTips(ratings)).toHaveLength(Math.min(count, 20));
    expect(rankTips(Object.fromEntries(Object.entries(ratings).reverse()))).toEqual(rankTips(ratings));
    expect(ratings).toEqual(original);
  });
  it('combines both categories, keeps full text and immediately reflects a changed score', () => {
    const ratings = { 'general-030': 4, 'arc-030': 4 };
    expect(rankTips(ratings).map(t => t.id)).toEqual(['arc-030', 'general-030']);
    const ranked = rankTips({ ...ratings, 'general-030': 5 });
    expect(ranked[0]).toEqual({ ...tips.find(t => t.id === 'general-030'), rating: 5 });
    expect(ranked[1].category).toBe('arc');
  });
});
