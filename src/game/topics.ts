import type { Tip } from '../data/tips';

// Deliberately small, explicit vocabulary. Unknown subjects simply get no tag.
// Adding content never requires altering the tip text or classifying every joke.
const subjects: Record<string, RegExp> = {
  shredder: /\bshredder\b/i, leaper: /\bleaper\b/i, wasp: /\bwasp\b/i,
  hornet: /\bhornet\b/i, bastion: /\bbastion\b/i, rocketeer: /\brocketeer\b/i,
  tick: /\btick\b/i, queen: /\bqueen\b/i, snitch: /\bsnitch\b/i,
  pop: /\bpop\b/i, bombardier: /\bbombardier\b/i,
  loot: /\b(loot|lootkist|lootkisten|kluis|munitiekist)\b/i,
  bag: /\b(rugzak|safe pocket|stash)\b/i,
  exit: /\b(hatch|lift|liftdeur|extractielift|uitgang)\b/i,
  weapon: /\b(wapen|kogels|granaat|schieten|munitie)\b/i,
  shield: /\bschild\b/i, teammate: /\bteamgenoot\b/i,
  door: /\b(deur|deuren|sleutel|voordeur|deurbel)\b/i,
  food: /\b(brood|boterham|broodje|pizza|koekje|pannenkoek|kaas)\b/i,
  banana: /\b(banaan|schil)\b/i, clothes: /\b(schoenen|schoen|sokken|sok|veters|jas|regenjas)\b/i,
  water: /\b(water|regen|regent|zwembad|nat|kraan|emmer|paraplu)\b/i,
  light: /\b(lamp|zaklamp|donker|zonnebril)\b/i,
  book: /\b(boek|bladzijden|bladzijde|leest)\b/i,
  bike: /\b(fiets|fietsbel|wielen|zadel)\b/i,
  falling: /\b(vallen|valt|omlaag|beneden|glijden|struikelen)\b/i,
  stairs: /\b(trap|trede|verdieping|dak)\b/i,
  empty: /\b(leeg|lege|volle|vol)\b/i,
};
export function tipTags(tip: Pick<Tip, 'text'>): string[] {
  const tags = Object.entries(subjects).filter(([,pattern]) => pattern.test(tip.text)).map(([tag]) => tag);
  if (/^als\b/i.test(tip.text)) tags.push('pattern:als');
  if (/^een\b/i.test(tip.text)) tags.push('pattern:een');
  if (/^wil je\b/i.test(tip.text)) tags.push('pattern:wil');
  return tags;
}
