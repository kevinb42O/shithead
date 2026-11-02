import {test} from 'node:test';
import assert from 'node:assert/strict';
import {svgCard} from '../dist/card-art.js';

test('concealed special cards never identify their material, rank or identity in face markup', () => {
  const back = svgCard(null, true);
  for (const rank of [3, 7, 10]) {
    assert.equal(svgCard({id:`private-${rank}`,rank,suit:'♠'}, true), back);
    assert.doesNotMatch(back, /data-card-material|private-/);
  }
});

test('every public representation receives its material through the shared artwork renderer', () => {
  for (const [rank, kind] of [[3,'wind'],[7,'frost'],[10,'fire']]) {
    const markup = svgCard({id:'physical-card',rank,suit:'♥'});
    assert.match(markup, new RegExp(`data-card-material="${kind}"`));
    assert.match(markup, /aria-hidden="true"/);
    assert.doesNotMatch(markup, /<text|<button/);
  }
  for (const rank of [2,4,5,6,8,9,11,12,13,14,15]) {
    assert.doesNotMatch(svgCard({id:'ordinary',rank,suit:'♥'}), /data-card-material/);
  }
});
