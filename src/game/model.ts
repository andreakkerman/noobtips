import { type CategoryId, type StoredCategoryId, type Tip, tips } from '../data/tips';

export type Tier = 'normal' | 'mega' | 'legendary';
export const segments: { label: string; short: string; tier: Tier; color: string; icon: string }[] = [
  { label: 'ONZIN', short: 'ONZIN', tier: 'normal', color: '#327d87', icon: 'spark' },
  { label: 'MEGA NOOB', short: 'MEGA NOOB', tier: 'mega', color: '#b35f42', icon: 'bolt' },
  { label: 'KANSLOOS', short: 'KANSLOOS', tier: 'normal', color: '#696b9b', icon: 'cross' },
  { label: 'VERDACHT NUTTIG', short: 'VERDACHT', tier: 'normal', color: '#3f8c79', icon: 'eye' },
  { label: 'MEGA NOOB', short: 'MEGA NOOB', tier: 'mega', color: '#b35f42', icon: 'bolt' },
  { label: 'COMPLEET NUTTELOOS', short: 'NUTTELOOS', tier: 'normal', color: '#327d87', icon: 'orbit' },
  { label: 'LEGENDARISCH SLECHT', short: 'LEGENDARISCH', tier: 'legendary', color: '#ce973f', icon: 'crown' },
  { label: 'ONZIN', short: 'ONZIN', tier: 'normal', color: '#696b9b', icon: 'spark' },
  { label: 'MEGA NOOB', short: 'MEGA NOOB', tier: 'mega', color: '#b35f42', icon: 'bolt' },
  { label: 'KANSLOOS', short: 'KANSLOOS', tier: 'normal', color: '#3f8c79', icon: 'cross' },
];
export const SEGMENT_ANGLE = 360 / segments.length;
export const SPIN_MS = 2700;
export const revealText: Record<Tier, { title: string; eyebrow: string; footnote: string }> = {
  normal: { title: 'VERS VAN HET RAD.', eyebrow: 'EEN ONGEKEND GEWONE NOOBTIP', footnote: 'Wetenschappelijk nergens op gebaseerd.' },
  mega: { title: 'MEGA. MEGA. NOOB.', eyebrow: 'BUITENGEWOON WEINIG WIJSHEID', footnote: 'Zoveel spektakel. Zo weinig informatie.' },
  legendary: { title: 'LEGENDARISCH SLECHT.', eyebrow: 'DEZE TIP VERDIENT EEN STANDBEELD', footnote: 'Een historisch dieptepunt in advies.' },
};

export type History = Partial<Record<StoredCategoryId, string[]>>;
export const positiveMod = (value: number, modulus: number) => ((value % modulus) + modulus) % modulus;
export function chooseSegment(random = Math.random): number {
  return Math.min(segments.length - 1, Math.max(0, Math.floor(random() * segments.length)));
}
// Every sector is centered at index * 36 degrees; zero degrees is twelve o'clock.
// Accumulate whole revolutions; never reset a spinning transform or add rounding drift.
export function landingRotation(current: number, index: number): number {
  const destination = positiveMod(-index * SEGMENT_ANGLE, 360);
  return current + 5 * 360 + positiveMod(destination - positiveMod(current, 360), 360);
}
export function segmentAtPointer(rotation: number): number {
  return Math.round(positiveMod(-rotation, 360) / SEGMENT_ANGLE) % segments.length;
}
// Integral of a fast attack / long exponential decay velocity curve.
// Starts from rest, accelerates for the first ~10%, then settles at near-zero speed.
export function spinProgress(t: number): number {
  const k = 8;
  const raw = (x: number) => 1 - (1 + k * x) * Math.exp(-k * x);
  return raw(Math.min(1, Math.max(0, t))) / raw(1);
}
export function selectTip(category: CategoryId, history: History, random = Math.random): { tip: Tip; history: History } {
  const pool = tips.filter(tip => tip.category === category);
  const seen = history[category] ?? [];
  let candidates = pool.filter(tip => !seen.includes(tip.id));
  const exhausted = candidates.length === 0;
  if (exhausted) candidates = pool.filter(tip => tip.id !== seen.at(-1));
  if (!candidates.length) candidates = pool;
  const tip = candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
  return { tip, history: { ...history, [category]: [...(exhausted ? [] : seen), tip.id] } };
}

export interface Result { tip: Tip; segment: number; tier: Tier; rotation: number }
export interface GameState { phase: 'ready' | 'spinning' | 'revealing' | 'rating'; category: CategoryId; result: Result | null; rotation: number; landed: boolean; spin: number }
export type GameEvent = { type: 'CATEGORY'; category: CategoryId } | { type: 'SPIN'; tip: Tip; segment: number } | { type: 'LAND' } | { type: 'REVEAL' } | { type: 'RATE_READY' };
export const initialState: GameState = { phase: 'ready', category: 'general', result: null, rotation: 0, landed: false, spin: 0 };
export function transition(state: GameState, event: GameEvent): GameState {
  if (event.type === 'CATEGORY' && (state.phase === 'ready' || state.phase === 'rating')) return { ...state, phase: 'ready', category: event.category, result: null, landed: false };
  if (event.type === 'SPIN' && (state.phase === 'ready' || state.phase === 'rating') && event.tip.category === state.category && segments[event.segment]) {
    const rotation = landingRotation(state.rotation, event.segment);
    return { ...state, phase: 'spinning', landed: false, spin: state.spin + 1, result: { tip: event.tip, segment: event.segment, tier: segments[event.segment].tier, rotation }, rotation };
  }
  if (event.type === 'LAND' && state.phase === 'spinning') return { ...state, landed: true };
  if (event.type === 'REVEAL' && state.phase === 'spinning' && state.landed) return { ...state, phase: 'revealing' };
  if (event.type === 'RATE_READY' && state.phase === 'revealing') return { ...state, phase: 'rating' };
  return state;
}
