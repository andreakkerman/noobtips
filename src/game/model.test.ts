import type { Bag } from './selection';
import { describe, expect, it } from 'vitest';
import { categories, tips, allTips } from '../data/tips';
import { chooseSegment, initialState, landingRotation, segmentAtPointer, segments, selectTip, spinProgress, transition, type History } from './model';
import { HISTORY_KEY, loadHistory, save, type StorageLike } from './storage';

describe('Dutch content and shuffle bags', () => {
  it('keeps every active tip and the inactive collection in the requested category order', () => {
    expect(allTips.length).toBeGreaterThan(tips.length);
    expect(allTips.some(t => t.category === 'school')).toBe(true);
    expect(tips).toHaveLength(allTips.filter(t => t.category !== 'school').length);
    expect(categories.map(c => c.id)).toEqual(['general', 'arc']);
    expect(tips.some(t => (t.category as string) === 'school')).toBe(false);
    expect(new Set(tips.map(t => t.id)).size).toBe(tips.length);
    expect(new Set(allTips.map(t => t.id)).size).toBe(allTips.length);
    expect(allTips.every(t => ['general','arc','school'].includes(t.category))).toBe(true);
    categories.forEach(c => expect(tips.filter(t => t.category === c.id).length).toBeGreaterThan(0));
  });
  it.each(categories)('exhausts $name without repeats and avoids a boundary repeat', category => {
    let history: History = {}; let last = '';
    for (let cycle = 0; cycle < 3; cycle++) {
      const seen = new Set<string>();
      for (let i = 0; i < tips.filter(t => t.category === category.id).length; i++) {
        const selection = selectTip(category.id, history, () => .37);
        expect(selection.tip.category).toBe(category.id);
        expect(selection.tip.id).not.toBe(last);
        expect(seen.has(selection.tip.id)).toBe(false);
        seen.add(selection.tip.id); last = selection.tip.id; history = selection.history;
      }
      expect(seen.size).toBe(tips.filter(t => t.category === category.id).length);
    }
  });
  it('keeps independent histories while switching categories', () => {
    const a = selectTip('arc', {}, () => 0);
    const b = selectTip('general', a.history, () => 0);
    const c = selectTip('arc', b.history, () => 0);
    expect(c.tip.id).not.toBe(a.tip.id);
    expect((c.history.general as Bag).seen).toEqual([b.tip.id]);
    expect((c.history.arc as Bag).seen).toEqual([a.tip.id, c.tip.id]);
  });
});

describe('wheel mathematics', () => {
  it('assigns one equal sector to legendary, three mega, six normal', () => {
    expect(segments.filter(s => s.tier === 'legendary')).toHaveLength(1);
    expect(segments.filter(s => s.tier === 'mega')).toHaveLength(3);
    expect(segments.filter(s => s.tier === 'normal')).toHaveLength(6);
    for (let i = 0; i < 10; i++) expect(chooseSegment(() => (i + .5) / 10)).toBe(i);
    expect(chooseSegment(() => 0)).toBe(0);
    expect(chooseSegment(() => .999999)).toBe(9);
  });
  it.each(segments.map((_, index) => index))('lands exactly on sector %i from arbitrary rotations', index => {
    for (const start of [0, 23.5, 359.999, 1854, 120000.7]) {
      const end = landingRotation(start, index);
      expect(end - start).toBeGreaterThanOrEqual(1800);
      expect(segmentAtPointer(end)).toBe(index);
    }
  });
  it('does not drift over 1000 consecutive spins', () => {
    let angle = 0;
    for (let i = 0; i < 1000; i++) { const index = i * 7 % 10; angle = landingRotation(angle, index); expect(segmentAtPointer(angle)).toBe(index); }
  });
  it('moves monotonically with acceleration, then long deceleration', () => {
    expect(spinProgress(0)).toBe(0); expect(spinProgress(1)).toBe(1);
    for (let i = 1; i <= 100; i++) expect(spinProgress(i / 100)).toBeGreaterThan(spinProgress((i - 1) / 100));
    expect(spinProgress(.1) - spinProgress(.09)).toBeGreaterThan(spinProgress(.01));
    expect(spinProgress(.99) - spinProgress(.98)).toBeLessThan(spinProgress(.6) - spinProgress(.59));
  });
});

describe('explicit game state transitions', () => {
  it('starts ready in Algemeen', () => { expect(initialState.phase).toBe('ready'); expect(initialState.category).toBe('general'); });
  it('switches categories from ready', () => { expect(transition(initialState, { type: 'CATEGORY', category: 'arc' }).category).toBe('arc'); });
  it.each(segments.map((_, index) => index))('ties reveal tier, tip and rotation to sector %i', segment => {
    const spinning = transition(initialState, { type: 'SPIN', tip: tips[0], segment });
    expect(spinning.result?.tier).toBe(segments[segment].tier);
    expect(segmentAtPointer(spinning.rotation)).toBe(segment);
    expect(spinning.result?.tip.category).toBe('general');
  });
  it('rejects a tip from another category and an invalid segment', () => {
    expect(transition(initialState, { type: 'SPIN', tip: tips.find(t => t.category === 'arc')!, segment: 0 })).toBe(initialState);
    expect(transition(initialState, { type: 'SPIN', tip: tips[0], segment: -1 })).toBe(initialState);
  });
  it('prevents duplicate spins, mid-spin category changes and premature reveals', () => {
    const spinning = transition(initialState, { type: 'SPIN', tip: tips[0], segment: 6 });
    expect(transition(spinning, { type: 'SPIN', tip: tips[1], segment: 0 })).toBe(spinning);
    expect(transition(spinning, { type: 'CATEGORY', category: 'general' })).toBe(spinning);
    expect(transition(spinning, { type: 'REVEAL' })).toBe(spinning);
    expect(transition(spinning, { type: 'RATE_READY' })).toBe(spinning);
  });
  it('runs ready → spinning → landed → revealing → rating → spinning', () => {
    const start = transition(initialState, { type: 'SPIN', tip: tips[0], segment: 0 });
    const landed = transition(start, { type: 'LAND' }); expect(landed.landed).toBe(true);
    const reveal = transition(landed, { type: 'REVEAL' }); expect(reveal.phase).toBe('revealing');
    expect(transition(reveal, { type: 'CATEGORY', category: 'arc' })).toBe(reveal);
    const rating = transition(reveal, { type: 'RATE_READY' }); expect(rating.phase).toBe('rating');
    const replay = transition(rating, { type: 'SPIN', tip: tips[1], segment: 6 }); expect(replay.phase).toBe('spinning'); expect(replay.spin).toBe(2);
    expect(transition(rating, { type: 'CATEGORY', category: 'arc' }).phase).toBe('ready');
  });
});

describe('defensive local persistence', () => {
  const memory = (): StorageLike => { const items = new Map<string,string>(); return { getItem: key => items.get(key) ?? null, setItem: (key, value) => { items.set(key, value); } }; };
  it('validates and reloads histories without losing category isolation', () => {
    const storage = memory(); save(HISTORY_KEY, { arc: ['arc-001', 'arc-001', 'mc-001', 'bad'], minecraft: ['mc-001'], school: ['school-001'] }, storage);
    const loaded = loadHistory(storage); expect((loaded.arc as Bag).seen).toEqual(['arc-001']); expect(loaded).not.toHaveProperty('minecraft'); expect((loaded.school as Bag).seen).toEqual(['school-001']);
    expect(selectTip('arc', loaded, () => 0).tip.id).not.toBe('arc-001');
  });
});
