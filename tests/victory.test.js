import {test} from 'node:test';
import assert from 'node:assert/strict';
import {victoryResult} from '../dist/victory.js';
import {tableView} from '../dist/multiplayer/table-view.js';

const names = who => ['You','The Fox','The Owl','The Raven'][who];
const fixture = (winner=0,loser=3) => ({players:Array.from({length:4},()=>({})),winner,loser,bet:{stake:10,pot:40,settled:true,winner}});
test('first place celebrates the settled net gain without changing accounting', () => {
  const game = fixture(), before = structuredClone(game);
  const result = victoryResult(game,names);
  assert.equal(result.kind,'victory');
  assert.equal(result.amount,30);
  assert.equal(result.terms,'40 pot · 10 buy-in');
  assert.equal(result.detail,'The Raven is the Shithead.');
  assert.deepEqual(game,before);
});
test('later escape never claims another player’s pot', () => {
  const result = victoryResult(fixture(1,3),names);
  assert.equal(result.title,'ESCAPED');
  assert.equal(result.amount,null);
  assert.equal(result.terms,'The Fox takes the pot');
});
test('first-out celebration does not invent a loser while the table is playing', () => {
  const game = fixture(0,null); game.phase='playing';
  const result = victoryResult(game,names);
  assert.equal(result.title,'YOU WIN'); assert.equal(result.amount,30);
  assert.equal(result.detail,'The table plays on.');
});
test('a loss and a practice win cannot invent coin rewards', () => {
  const loss = victoryResult(fixture(2,0),names);
  assert.equal(loss.kind,'defeat'); assert.equal(loss.amount,null);
  const practice = fixture(); delete practice.bet;
  const result = victoryResult(practice,names);
  assert.equal(result.title,'YOU WIN'); assert.equal(result.reward,'FIRST OUT'); assert.equal(result.amount,null);
  const unsettled = fixture(); unsettled.bet.settled=false;
  assert.equal(victoryResult(unsettled,names).amount,null);
});
test('online result follows the recipient’s remapped seat and real player name', () => {
  const members = [{name:'Ada'},{name:'Mira'},{name:'Lin'}];
  const view = {players:members.map(()=>({hand:[],handCount:0,up:[],downCount:0})),bet:{stake:50,pot:150,settled:true,winner:1},winner:1,loser:2,placements:[1,0],deckCount:0,burnCount:54,pile:[],phase:'finished'};
  const game = tableView(view,1,members);
  const result = victoryResult(game);
  assert.equal(result.title,'YOU WIN'); assert.equal(result.amount,100);
  assert.equal(result.detail,'Lin is the Shithead.');
  const other = victoryResult(tableView(view,0,members));
  assert.equal(other.kind,'escape'); assert.equal(other.amount,null); assert.equal(other.terms,'Mira takes the pot');
});
