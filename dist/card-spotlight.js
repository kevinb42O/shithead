import { svgCard } from './card-art.js';

// A private reveal has three readable beats: lift, discover, return to the table.
export const REVEAL_TIMING = Object.freeze({ lift: 580, flip: 640, hold: 1800, outcomeHold: 2300, settle: 620 });
export function getCardSpotlightInfo(card, { result = {} } = {}) {
  const outcome = result.needsAceChoice ? 'choice' : result.pickup ? 'pickup' : result.burn ? 'burn' : result.reversed ? 'reverse' : result.wentOut ? 'escape' : card.rank === 7 ? 'low' : card.rank === 2 ? 'reset' : 'safe';
  return { outcome, label: ({ choice: 'Choose your ace', pickup: 'Pick up', burn: 'Burn', reverse: '', escape: 'You’re out!', low: '', reset: '', safe: '' })[outcome] };
}
export function createCardSpotlight({ card, who = 0, result = {}, isBlind = true, reducedMotion = false, fastForward = false, sound = () => {}, onComplete = () => {}, onChoose = () => {}, sourceRect = null }) {
  // Opponents get public table motion, never somebody else's personal spotlight.
  if (who !== 0) { onComplete(); return { cancel() {} }; }
  const { outcome, label } = getCardSpotlightInfo(card, { result });
  const stage = document.createElement('div');
  stage.className = `card-reveal final-reveal reveal-${outcome}`;
  stage.setAttribute('role', result.needsAceChoice ? 'dialog' : 'status');
  stage.setAttribute('aria-label', result.needsAceChoice ? 'Choose ace value' : 'Your card reveal');
  if (result.needsAceChoice) stage.setAttribute('aria-modal', 'true');
  else stage.setAttribute('aria-live', 'polite');
  const previousFocus = document.activeElement;
  const destination = document.querySelector(`.card[data-card-id="${CSS.escape(card.id)}"]`);
  const previousVisibility = destination?.style.visibility;
  if (destination && isBlind) destination.style.visibility = 'hidden';
  stage.innerHTML = `<div class="reveal-aura" aria-hidden="true"></div><div class="reveal-card-wrap"><div class="reveal-card">${svgCard(card, isBlind)}</div><div class="reveal-shine" aria-hidden="true"></div></div><div class="reveal-caption"><strong></strong></div>`;
  const wrap = stage.querySelector('.reveal-card-wrap'), face = stage.querySelector('.reveal-card'), caption = stage.querySelector('strong');
  document.body.append(stage);
  const timers = new Set(), animations = new Set();
  let cancelled = false, exiting = false, discovered = false;
  const duration = key => fastForward ? 70 : reducedMotion ? (key === 'hold' || key === 'outcomeHold' ? REVEAL_TIMING[key] : 0) : REVEAL_TIMING[key];
  function later(fn, ms) { const id = setTimeout(() => { timers.delete(id); if (!cancelled) fn(); }, ms); timers.add(id); }
  function motion(node, frames, ms) { if (!ms || cancelled) return; const a = node.animate(frames, { duration: ms, easing: 'cubic-bezier(.22,.7,.2,1)', fill: 'both' }); animations.add(a); a.finished.catch(() => {}).finally(() => animations.delete(a)); }
  function cleanup() { if (destination && isBlind) destination.style.visibility = previousVisibility; cancelled = true; timers.forEach(clearTimeout); animations.forEach(a => a.cancel()); stage.remove(); window.removeEventListener('keydown', key, true); if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); }
  function targetPose(rect) { const r = wrap.getBoundingClientRect(); return rect?.width ? `translate(${rect.left + rect.width / 2 - r.left - r.width / 2}px,${rect.top + rect.height / 2 - r.top - r.height / 2}px) scale(${rect.width / r.width})` : 'translateY(45px) scale(.78)'; }
  const origin = targetPose(sourceRect);
  motion(wrap, [{ transform: origin, opacity: .3 }, { transform: 'translateY(-10px) scale(1.035)', opacity: 1, offset: .8 }, { transform: 'none', opacity: 1 }], duration('lift'));
  function finish() {
    if (exiting || cancelled || result.needsAceChoice || !discovered) return;
    exiting = true;
    timers.forEach(clearTimeout); timers.clear();
    const target = document.querySelector('#pile')?.getBoundingClientRect();
    stage.classList.add('is-settling');
    motion(wrap, [{ transform: 'none', opacity: 1 }, { transform: targetPose(target), opacity: 0 }], duration('settle'));
    later(() => { cleanup(); onComplete(); }, duration('settle'));
  }
  function choose(value) { if (!discovered || cancelled) return; cleanup(); onChoose(value); }
  function key(e) {
    if (!stage.isConnected) return;
    if (['Escape', 'Enter', ' ', 'Tab'].includes(e.key)) {
      e.stopImmediatePropagation();
      if (result.needsAceChoice) {
        if (e.key === 'Tab') { e.preventDefault(); const buttons = [...stage.querySelectorAll('button')]; const i = buttons.indexOf(document.activeElement); buttons[(i + (e.shiftKey ? buttons.length - 1 : 1)) % buttons.length]?.focus(); }
        else if (e.key === 'Escape') e.preventDefault();
      } else { e.preventDefault(); finish(); }
    }
  }
  window.addEventListener('keydown', key, true);
  stage.addEventListener('click', () => { if (discovered && !result.needsAceChoice) finish(); });
  function discover() {
    discovered = true;
    face.innerHTML = svgCard(card);
    stage.classList.add('revealed');
    caption.textContent = label;
    stage.setAttribute('aria-label', `${card.rank === 14 ? 'Ace' : card.rank === 15 ? 'Joker' : card.rank} ${card.suit || ''}${label ? ': ' + label : ', played'}`);
    if (isBlind && !reducedMotion) motion(face, [{ transform: 'perspective(1000px) rotateY(90deg)' }, { transform: 'perspective(1000px) rotateY(-7deg)', offset: .72 }, { transform: 'none' }], duration('flip') / 2);
    sound(outcome === 'pickup' ? 'dread' : outcome === 'choice' ? 'confirm' : 'relief');
    if (outcome === 'pickup' && !reducedMotion) later(() => motion(wrap, [{ transform: 'none' }, { transform: 'translateY(-16px) rotate(-5deg)', offset: .4 }, { transform: 'none' }], 480), duration('flip') / 2);
    if (result.needsAceChoice) {
      const choices = document.createElement('div'); choices.className = 'reveal-choices';
      for (const value of [1, 14]) { const b = document.createElement('button'); b.type = 'button'; b.textContent = value; b.setAttribute('aria-label', `Play ace as ${value}`); b.onclick = () => choose(value); choices.append(b); }
      stage.querySelector('.reveal-caption').append(choices);
      choices.querySelector('button').focus();
    } else later(finish, duration('flip') / 2 + duration(outcome === 'safe' ? 'hold' : 'outcomeHold'));
  }
  later(() => {
    if (isBlind) {
      sound('heartbeat');
      motion(face, [{ transform: 'perspective(1000px) rotateY(0deg)' }, { transform: 'perspective(1000px) rotateY(-90deg)' }], duration('flip') / 2);
      later(discover, duration('flip') / 2);
    } else discover();
  }, duration('lift'));
  return { stage, dismiss: finish, cancel: cleanup };
}
