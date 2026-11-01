import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectEvent, Session } from '../dist/multiplayer/session.js';
import { getCardSpotlightInfo, REVEAL_TIMING } from '../dist/card-spotlight.js';
const ace = { id: 'secret-ace', rank: 14, suit: '♠' };
test('pending ace events contain no identity or choice for other recipients', () => {
  const event = { id: 4, who: 2, needsAceChoice: true, reveal: ace, wasBlind: true, blindSlot: 1 };
  assert.deepEqual(projectEvent(event, 1), { id: 4, who: 2, waiting: true });
  assert.deepEqual(projectEvent(event, 2), event);
  assert(!JSON.stringify(projectEvent(event, 0)).includes(ace.id));
});
test('failed blind cards stay private while every recipient sees the pickup outcome', () => {
  const event = { id: 5, who: 1, ok: true, pickup: true, wasBlind: true, reveal: ace, blind: ace, pileSize: 8 };
  const other = projectEvent(event, 0);
  assert.equal(other.pickup, true); assert.equal(other.pileSize, 8);
  assert(!('reveal' in other)); assert(!('blind' in other));
  assert.equal(projectEvent(event, 1).reveal, ace);
  assert.equal(event.reveal, ace, 'projection must not mutate the authority event');
});
test('public played cards, burns, reversals and escapes reach every seat', () => {
  const event = { id: 6, who: 2, ok: true, burn: true, reversed: true, wentOut: true, cards: [{ id:'public-three', rank:3, suit:'♣' }], reveal: ace };
  for (const seat of [0, 1, 2, 3]) {
    const projected = projectEvent(event, seat);
    assert.equal(projected.burn, true); assert.equal(projected.reversed, true); assert.equal(projected.wentOut, true);
    assert.deepEqual(projected.cards, event.cards);
  }
});
test('wire snapshots apply event privacy before transmission', () => {
  const s = new Session('Host', () => {}, () => {});
  try {
    s.members = [{id:s.id}, {id:'guest'}];
    s.event = { id: 7, who: 0, needsAceChoice: true, reveal: ace };
    assert(!JSON.stringify(s.snapshot(1)).includes(ace.id));
    assert(JSON.stringify(s.snapshot(0)).includes(ace.id));
  } finally { s.close(); }
});
test('reveal labels describe actual outcomes and allow time for discovery', () => {
  assert.equal(getCardSpotlightInfo(ace, { result:{pickup:true} }).label, 'Pick up');
  assert.equal(getCardSpotlightInfo(ace, { result:{burn:true,wentOut:true} }).outcome, 'burn');
  assert.equal(getCardSpotlightInfo(ace, { result:{reversed:true,wentOut:true} }).outcome, 'reverse');
  assert.equal(getCardSpotlightInfo(ace, { result:{needsAceChoice:true} }).label, 'Choose your ace');
  assert.equal(getCardSpotlightInfo({rank:7}, {result:{}}).label, '');
  assert.equal(getCardSpotlightInfo({rank:4}, { result:{} }).label, '');
  assert.equal(getCardSpotlightInfo({rank:2}, {result:{lowTurns:2}}).label, '');
  assert.equal(getCardSpotlightInfo({rank:2}, {result:{lowTurns:1}}).label, '');
  assert.equal(getCardSpotlightInfo({rank:3}, {result:{reversed:true}}).label, '');
  assert(REVEAL_TIMING.hold >= 1800);
  assert(REVEAL_TIMING.lift + REVEAL_TIMING.flip + REVEAL_TIMING.hold + REVEAL_TIMING.settle >= 3500);
});
