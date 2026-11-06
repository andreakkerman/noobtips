import type { Ratings } from './storage';
export function recordRating(events: Ratings, id: string, tipId: string, value: number): Ratings {
  if (!Number.isInteger(value) || value < 1 || value > 5) return events;
  const event = { id, tipId, value };
  return events.some(e => e.id === id) ? events.map(e => e.id === id ? event : e) : [...events, event];
}
export const fiveCount = (events: Ratings) => events.filter(e => e.value === 5).length;
export const milestones: Record<number, string> = { 5:'ECHT SLECHT!',10:'SUPER SLECHT!',15:'ECHT SUPERSLECHT!',20:'MEGASLECHT!',25:'SUPERMEGASLECHT!',30:'ECHT SUPERMEGASLECHT!',40:'ONGELOOFLIJK SLECHT!',50:'HISTORISCH SLECHT!',75:'NIET NORMAAL MEER ZO SLECHT!',100:'HET ALLERSLECHTSTE OOIT!' };
export class Streak {
  count = 0;
  private last: string | null = null;
  finalize(id: string, value: number) {
    if (id === this.last) return null;
    this.last = id; this.count = value === 5 ? this.count + 1 : 0;
    return milestones[this.count] ? { count: this.count, title: milestones[this.count] } : null;
  }
}
