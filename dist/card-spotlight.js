// Hearthstone-inspired Card Spotlight & Reveal Showcase for Shithead.
// Features dramatic large card presentation, 3D tilt & flip, radiant auras,
// player origin crests, card lore & mechanical rule boxes, and glorious outcome banners.

import { svgCard } from './card-art.js';
import { playerName, rankName } from './engine.js';

const SUIT_META = {
  '♠': { name: 'Spades', icon: '♠', color: 'suit-black' },
  '♥': { name: 'Hearts', icon: '♥', color: 'suit-red' },
  '♣': { name: 'Clubs', icon: '♣', color: 'suit-black' },
  '♦': { name: 'Diamonds', icon: '♦', color: 'suit-red' }
};

const FULL_RANKS = {
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  8: 'Eight',
  9: 'Nine',
  10: 'Ten',
  11: 'Jack',
  12: 'Queen',
  13: 'King',
  14: 'Ace',
  15: 'Joker'
};

const ARCHETYPES = {
  2: 'Special Power · Universal Reset',
  3: 'Special Power · Transparent Mirror',
  4: 'Standard Rank · Number Card',
  5: 'Standard Rank · Number Card',
  6: 'Standard Rank · Number Card',
  7: 'Rule Modifier · Glass Ceiling (≤ 7)',
  8: 'Special Power · Turn Skip',
  9: 'Standard Rank · Number Card',
  10: 'Legendary Power · Discard Incinerator',
  11: 'Royal Court · Jack',
  12: 'Royal Court · Queen',
  13: 'Royal Court · King',
  14: 'Legendary Power · Dual Value Ace',
  15: 'Wild Power · Transparent Joker'
};

const RULE_DESCRIPTIONS = {
  2: 'Universal Reset: Can be played onto ANY card. Resets the active pile threshold back to 2, allowing any card to follow.',
  3: 'Transparent Mirror: Adopts the rank of whatever card is beneath it. When played singly, reverses the table turn order.',
  4: 'Standard rank card. Must match or beat the active pile rank.',
  5: 'Standard rank card. Must match or beat the active pile rank.',
  6: 'Standard rank card. Must match or beat the active pile rank.',
  7: 'Glass Ceiling: The next player must play a 7 or lower (or a special universal card like 2 or 10).',
  8: 'Turn Skip: Instantly skips the next player in the turn order.',
  9: 'Standard rank card. Must match or beat the active pile rank.',
  10: 'Inferno Burn: Instantly incinerates the entire discard pile into ash! Clears the table and grants an immediate extra turn.',
  11: 'Royal Court Jack. Must match or beat the active pile rank.',
  12: 'Royal Court Queen. Must match or beat the active pile rank.',
  13: 'Royal Court King. Highest standard rank. Must match or beat the active pile rank.',
  14: 'Dual Value Ace: Can be declared as Low (Rank 1) or High (Rank 14). If played under a 7 rule, acts as 1.',
  15: 'Wild Joker: Playable on any card. Inherits and preserves the underlying rank and low-turn restrictions.'
};

export function getCardSpotlightInfo(card, { who, result, pileSize = 0, topRankBefore = null, lowTurns = 0 }) {
  const isJoker = card.rank === 15;
  const suitInfo = SUIT_META[card.suit] || { name: '', icon: '', color: 'suit-gold' };
  const rankLabel = FULL_RANKS[card.rank] || String(card.rank);
  const fullName = isJoker ? 'The Wild Joker' : `${rankLabel} of ${suitInfo.name}`;
  const archetype = ARCHETYPES[card.rank] || `Rank ${card.rank}`;

  let ruleDesc = RULE_DESCRIPTIONS[card.rank] || 'Must match or beat the active pile rank.';
  if (lowTurns > 0 && card.rank !== 2 && card.rank !== 10 && !isJoker) {
    if (result.pickup) {
      ruleDesc = `Glass ceiling rule active (≤ 7). ${rankLabel} (${card.rank}) was too high and could not be played!`;
    } else {
      ruleDesc = `Glass ceiling rule active (≤ 7). ${rankLabel} (${card.rank}) satisfies the low play requirement!`;
    }
  } else if (topRankBefore != null && [4, 5, 6, 9, 11, 12, 13].includes(card.rank)) {
    const targetRankName = FULL_RANKS[topRankBefore] || topRankBefore;
    if (result.pickup) {
      ruleDesc = `Pile required Rank ${targetRankName} (${topRankBefore}) or higher. ${rankLabel} (${card.rank}) could not beat it!`;
    } else {
      ruleDesc = `Pile required Rank ${targetRankName} (${topRankBefore}) or higher. ${rankLabel} (${card.rank}) safely beats it!`;
    }
  } else if (pileSize === 0) {
    ruleDesc = `${rankLabel} played freely onto an empty pile.`;
  }

  // Outcome categorization
  let outcomeType = 'safe';
  let outcomeBadge = 'DEFENSE';
  let outcomeHeadline = 'SAFE MOVE!';
  let outcomeDetail = who === 0 ? 'Your card safely beats the pile. The danger passes.' : `${(result.actorName || playerName(who))} played safely. The turn passes.`;
  let auraClass = 'hs-aura-emerald';
  let iconSvg = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 2 4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18 6 2.25v4.66c0 4.1-2.6 7.9-6 8.91-3.4-1.01-6-4.81-6-8.91V6.43l6-2.25zm-1 5.82v6h2v-6h-2z"/></svg>';

  if (result.wentOut) {
    outcomeType = 'escape';
    outcomeBadge = 'VICTORY';
    outcomeHeadline = 'ESCAPED!';
    outcomeDetail = who === 0 ? 'You cleared your final card and escaped to safety!' : `${(result.actorName || playerName(who))} played their final card and escaped to safety!`;
    auraClass = 'hs-aura-gold';
    iconSvg = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M5 16 3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14v1z"/></svg>';
  } else if (result.burn) {
    outcomeType = 'burn';
    outcomeBadge = 'INFERNO';
    outcomeHeadline = 'PILE BURNED!';
    outcomeDetail = 'The entire discard pile was incinerated into ash! Extra turn granted!';
    auraClass = 'hs-aura-fire';
    iconSvg = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.784 1.399 8.169-7.333-3.856-7.333 3.856 1.4-8.169-5.935-5.784 8.2-1.192zm1.5 13.413c1.38 0 2.5-1.12 2.5-2.5 0-1.63-1.88-3.5-2.5-3.5-.63 0-2.5 1.88-2.5 3.5 0 1.38 1.12 2.5 2.5 2.5z"/></svg>';
  } else if (result.pickup) {
    outcomeType = 'pickup';
    outcomeBadge = 'DANGER';
    outcomeHeadline = 'FAILED TO BEAT PILE!';
    outcomeDetail = who === 0 ? `Rank too low! You must pick up the ${pileSize} ${pileSize === 1 ? 'card' : 'cards'} at stake!` : `${(result.actorName || playerName(who))}’s card was too low! Must pick up ${pileSize} ${pileSize === 1 ? 'card' : 'cards'}!`;
    auraClass = 'hs-aura-danger';
    iconSvg = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
  } else if (result.needsAceChoice) {
    outcomeType = 'ace';
    outcomeBadge = 'DECISION';
    outcomeHeadline = 'ACE VALUE CHOICE';
    outcomeDetail = 'Declare this Ace as Low (Rank 1) or High (Rank 14).';
    auraClass = 'hs-aura-arcane';
    iconSvg = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="m12 2 2.4 7.2H22l-6 4.8 2.4 7.2L12 16.8 5.6 21.2 8 14 2 9.2h7.6z"/></svg>';
  }

  const stakesText = pileSize > 0 ? `${pileSize} ${pileSize === 1 ? 'card' : 'cards'} at stake in the center pile` : 'The pile was empty · Clean play';

  return {
    fullName,
    rankLabel,
    suitInfo,
    archetype,
    ruleDesc,
    outcomeType,
    outcomeBadge,
    outcomeHeadline,
    outcomeDetail,
    auraClass,
    iconSvg,
    stakesText,
    who,
    whoName: (result.actorName || playerName(who))
  };
}

export function createHearthstoneSpotlight({
  card,
  who = 0,
  result = {},
  pileSize = 0,
  topRankBefore = null,
  lowTurns = 0,
  isBlind = true,
  reducedMotion = false,
  fastForward = false,
  sound = () => { },
  revealOutcome = null,
  onComplete = () => { }
}) {
  const info = getCardSpotlightInfo(card, { who, result, pileSize, topRankBefore, lowTurns });

  // Stage container
  const stage = document.createElement('div');
  stage.className = `final-reveal hearthstone-spotlight hs-type-${info.outcomeType} ${info.auraClass}`;
  stage.setAttribute('role', 'status');
  stage.setAttribute('aria-live', 'polite');

  // Background atmospheric layers: dark vignette, light beam, ambient aura
  const backdrop = document.createElement('div');
  backdrop.className = 'hs-spotlight-backdrop';

  const lightBurst = document.createElement('div');
  lightBurst.className = 'hs-light-burst';

  // Origin ribbon at top (Hero Badge)
  const originRibbon = document.createElement('div');
  originRibbon.className = `hs-origin-ribbon hs-origin-seat-${who}`;

  const avatar = document.createElement('div');
  avatar.className = `hs-avatar hs-avatar-seat-${who}`;
  avatar.setAttribute('aria-hidden', 'true');

  const originMeta = document.createElement('div');
  originMeta.className = 'hs-origin-meta';

  const originSub = document.createElement('span');
  originSub.className = 'hs-origin-sub';
  originSub.textContent = isBlind ? 'Blind Card Flip' : result.wentOut ? 'Final Escape Play' : 'Card Spotlight';

  const originPlayer = document.createElement('strong');
  originPlayer.className = 'hs-origin-player';
  originPlayer.textContent = who === 0 ? 'YOU' : info.whoName.toUpperCase();

  originMeta.append(originSub, originPlayer);
  originRibbon.append(avatar, originMeta);

  // Central Card Frame
  const cardFrame = document.createElement('div');
  cardFrame.className = 'final-reveal-card hs-card-frame';

  // Halo aura around card
  const cardGlow = document.createElement('div');
  cardGlow.className = 'hs-card-glow';

  // Inner card graphics container
  const cardInner = document.createElement('div');
  cardInner.className = 'hs-card-inner';
  cardInner.innerHTML = svgCard(card, isBlind);

  // Shimmer light sweep element
  const cardShimmer = document.createElement('div');
  cardShimmer.className = 'hs-card-shimmer';

  cardFrame.append(cardGlow, cardInner, cardShimmer);

  // Details Panel (below card)
  const detailsPanel = document.createElement('div');
  detailsPanel.className = 'hs-details-panel';

  // Card Identity Banner (Full name + suit + archetype badge)
  const cardIdentity = document.createElement('div');
  cardIdentity.className = 'hs-card-identity';

  const cardTitle = document.createElement('h2');
  cardTitle.className = 'hs-card-title';
  cardTitle.innerHTML = `<span class="hs-card-suit ${info.suitInfo.color}">${info.suitInfo.icon}</span> <span class="hs-card-name-text">${info.fullName}</span>`;

  const archetypeBadge = document.createElement('span');
  archetypeBadge.className = 'hs-archetype-badge';
  archetypeBadge.textContent = info.archetype;

  cardIdentity.append(cardTitle, archetypeBadge);

  // Rule / Mechanical Lore Box (Hearthstone style scroll/stone box)
  const ruleBox = document.createElement('div');
  ruleBox.className = 'hs-rule-box';

  const ruleDesc = document.createElement('p');
  ruleDesc.className = 'hs-rule-text';
  ruleDesc.textContent = isBlind ? (who === 0 ? 'Flipping blind from your face-down reserves…' : `${info.whoName} flips a blind card…`) : info.ruleDesc;

  ruleBox.append(ruleDesc);

  // Outcome Banner (Hearthstone Event Ribbon)
  const outcomeBanner = document.createElement('div');
  outcomeBanner.className = `hs-outcome-banner hs-outcome-${info.outcomeType}`;

  const outcomeIcon = document.createElement('div');
  outcomeIcon.className = 'hs-outcome-icon';
  outcomeIcon.innerHTML = info.iconSvg;

  const outcomeText = document.createElement('div');
  outcomeText.className = 'hs-outcome-text';

  const outcomeHeadline = document.createElement('strong');
  outcomeHeadline.className = 'hs-outcome-headline';
  outcomeHeadline.textContent = isBlind ? 'REVEALING…' : info.outcomeHeadline;

  const outcomeDetail = document.createElement('span');
  outcomeDetail.className = 'hs-outcome-detail';
  outcomeDetail.textContent = isBlind ? 'Hold your breath…' : info.outcomeDetail;

  outcomeText.append(outcomeHeadline, outcomeDetail);
  outcomeBanner.append(outcomeIcon, outcomeText);

  // Stakes pill
  const stakesPill = document.createElement('div');
  stakesPill.className = 'hs-stakes-pill final-reveal-stakes';
  stakesPill.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M2 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1H3a1 1 0 0 1-1-1V3zm2 0v7h2V5a1 1 0 0 1 1-1h3V3H4zm3 2v8h6V5H7z"/></svg> <span>${info.stakesText}</span>`;

  // Tap-to-continue hint
  const tapHint = document.createElement('span');
  tapHint.className = 'hs-tap-hint';
  tapHint.textContent = 'Tap anywhere to continue';

  // Assemble the stage
  detailsPanel.append(cardIdentity, ruleBox, outcomeBanner, stakesPill, tapHint);
  stage.append(backdrop, lightBurst, originRibbon, cardFrame, detailsPanel);
  document.body.append(stage);

  let dismissed = false;
  let finishTimer = null;

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(finishTimer);
    window.removeEventListener('keydown', handleKey);
    stage.removeEventListener('click', dismiss);
    stage.classList.add('hs-exit');
    setTimeout(() => {
      stage.remove();
      onComplete();
    }, reducedMotion ? 50 : 250);
  }

  function handleKey(e) {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      dismiss();
    }
  }

  // Click or keypress dismisses at any time
  stage.addEventListener('click', dismiss);
  window.addEventListener('keydown', handleKey);

  // Timing constants
  const flipDuration = reducedMotion ? 0 : 220;
  const revealHoldTime = fastForward ? 450 : reducedMotion ? 850 : 2400;

  if (isBlind) {
    if (!reducedMotion) {
      sound('heartbeat');
      cardFrame.animate([
        { transform: 'perspective(900px) translateY(0) rotateY(0) rotateZ(0)' },
        { transform: 'perspective(900px) translateY(-22px) rotateY(-22deg) rotateZ(-3deg)', offset: 0.5 },
        { transform: 'perspective(900px) translateY(-18px) rotateY(-22deg) rotateZ(-3deg)', offset: 0.73 },
        { transform: 'perspective(900px) translateY(-12px) rotateY(-90deg) rotateZ(-2deg)' }
      ], { duration: flipDuration, fill: 'forwards', easing: 'ease-in-out' });
    }

    setTimeout(() => {
      if (dismissed) return;
      cardFrame.getAnimations().forEach(a => a.cancel());
      cardInner.innerHTML = svgCard(card);
      stage.classList.add('revealed');

      if (!reducedMotion) {
        cardFrame.animate([
          { transform: 'perspective(900px) translateY(-12px) rotateY(90deg)' },
          { transform: 'perspective(900px) translateY(0) rotateY(0)' }
        ], { duration: 100, easing: 'ease-out' });
      }

      // Update card rule text and outcome banner to revealed state
      ruleDesc.textContent = info.ruleDesc;
      outcomeHeadline.textContent = info.outcomeHeadline;
      outcomeDetail.textContent = info.outcomeDetail;

      if (typeof revealOutcome === 'function') {
        revealOutcome(stage, !!result.pickup);
      }

      // Play outcome audio
      if (info.outcomeType === 'escape') sound('win');
      else if (info.outcomeType === 'burn') sound('burn');
      else if (info.outcomeType === 'pickup') sound('dread');
      else sound('relief');

      finishTimer = setTimeout(dismiss, revealHoldTime);
    }, flipDuration);
  } else {
    // Face-up instant showcase (e.g. non-blind escape)
    stage.classList.add('revealed');
    ruleDesc.textContent = info.ruleDesc;
    outcomeHeadline.textContent = info.outcomeHeadline;
    outcomeDetail.textContent = info.outcomeDetail;
    if (info.outcomeType === 'escape') sound('win');
    finishTimer = setTimeout(dismiss, revealHoldTime);
  }

  return { stage, dismiss };
}
