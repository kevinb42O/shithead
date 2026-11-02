// Shared presentation clock: motion, particles and audio meet at contact.
// Rules still commit immediately; these durations never delay input or networking.
export const ATTACK = Object.freeze({windup: 190, contact: 340, release: 430, end: 760});
export const CAST_CONTACT_MS = 380;
export const DEATH_DELAY_MS = 150;
export const SUMMON_MS = Object.freeze({common: 420, rare: 540, epic: 680, legendary: 900});
export const summonContact = tier => Math.round((SUMMON_MS[tier] || SUMMON_MS.common) * .65);
export function combatDuration(events, cards = {}) {
  const attack = events.find(e => e.type === 'attack');
  const play = events.find(e => e.type === 'play');
  const arrival = cards[play?.card]?.type === 'crew' ? SUMMON_MS[cards[play.card].rarity] || SUMMON_MS.common : 0;
  const contact = attack ? ATTACK.contact : events.some(e => e.type === 'power' || e.type === 'play' && e.target) ? CAST_CONTACT_MS : 0;
  const death = events.some(e => e.type === 'death');
  const attackerDies = attack && events.some(e => e.type === 'death' && e.uid === attack.uid);
  return Math.max(attack ? ATTACK.end : 0, arrival, contact ? contact + 260 : 0,
    death ? (attackerDies ? ATTACK.end : contact + DEATH_DELAY_MS) + 600 : 0);
}
