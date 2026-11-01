// One finite lantern gust; the same reversal rule is shared by solo and online play.
// Canvas geometry is in CSS pixels; the owner supplies resolution and lifecycle.
export const REVERSAL_DURATION = 2500;
export function reversalOccurs(result) {
  return !!(result.ok && !result.pickup && (result.reversed ??
    (result.cards?.[0]?.rank === 3 && result.cards.length % 2 === 1)));
}
export { createLanternWind as createReversalWind, lanternWindGeometry, WIND_TIMING } from './lantern-wind.js';
