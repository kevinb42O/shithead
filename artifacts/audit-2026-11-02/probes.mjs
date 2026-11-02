// Audit evidence: assertions describe observed defects, not desired regressions.
// Run from any directory: node artifacts/audit-2026-11-02/probes.mjs
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createGame, assertGame} from '../../dist/engine.js';
import {Session} from '../../dist/multiplayer/session.js';
import {createBank} from '../../dist/bank.js';
import {buyIn} from '../../dist/coins.js';

const storage = value => {
  let raw = value;
  return {getItem: () => raw, setItem: (_, next) => {raw = next;}};
};
const locks = {request: async (_, callback) => callback()};

test('confirmed: ordinary play command selects a concealed ten by canonical ID', () => {
  const s = new Session('Host', () => {}, () => {});
  s.host = true;
  s.members = [{id:s.id,name:'Host',connected:true},{id:'guest',name:'Guest',connected:true}];
  s.announce = () => {};
  const g = createGame();
  const cards = [...g.deck,...g.players.flatMap(p => [...p.hand,...p.up,...p.down])];
  const take = (rank, suit) => cards.splice(cards.findIndex(c => c.rank===rank && (!suit || c.suit===suit)),1)[0];
  g.players = [{hand:[take(9)],up:[],down:[]},{hand:[],up:[],down:[take(4),take(10,'♠'),take(6)]}];
  g.pile=[take(13)];g.deck=[];g.burned=cards;g.phase='playing';g.turn=1;
  assertGame(g);s.game=g;
  // Guest never received down IDs. This guess is a known deck identifier.
  s.command('guest',{type:'play',seq:1,ids:['♠10']});
  assert.equal(g.moves,1);
  assert.equal(g.pile.length,0);
  assert.equal(g.players[1].down.length,2);
  assert.equal(s.event.wasBlind,false);
  assert.equal(s.event.burn,true);
  s.close();
});

test('confirmed: malformed JSON permanently rejects the proposed new-game recovery', async () => {
  const disk=storage('{broken');
  const bank=createBank({key:'audit',storage:disk,locks});
  await assert.rejects(bank.transact(saved => {saved.game=createGame();}),SyntaxError);
  assert.equal(disk.getItem(),'{broken');
});

test('confirmed: a stale tab overwrites a newer charged table', async () => {
  const old=createGame(), disk=storage(JSON.stringify({game:old,wallet:{balance:1000}}));
  const a=createBank({key:'audit',storage:disk,locks}), b=createBank({key:'audit',storage:disk,locks});
  const stale=structuredClone(old), newer=createGame();
  await a.transact(saved => {assert(buyIn(saved.wallet,newer,100));saved.game=newer;});
  const wager=newer.bet.id;
  await b.saveGame(stale,{you:0,fox:0});
  const saved=a.read();
  assert.equal(saved.wallet.balance,900);
  assert.equal(saved.game.bet,undefined);
  assert.notEqual(saved.game.bet?.id,wager);
});

test('confirmed: ordinary saves return before a contended lock commits the move', async () => {
  let release;
  const gate=new Promise(resolve => {release=resolve;});
  const original=createGame(), disk=storage(JSON.stringify({game:original}));
  const bank=createBank({key:'audit',storage:disk,locks:{request:async (_,fn)=>{await gate;return fn();}}});
  const moved=structuredClone(original);moved.moves=1;
  const saving=bank.saveGame(moved,{you:0,fox:0});
  await Promise.resolve();
  assert.equal(JSON.parse(disk.getItem()).game.moves,0);
  release();await saving;
  assert.equal(JSON.parse(disk.getItem()).game.moves,1);
});

test('confirmed: invalid swap consumes sequence but sends neither error nor snapshot', () => {
  const s=new Session('Host',()=>{},()=>{});
  s.host=true;s.members=[{id:s.id,connected:true},{id:'guest',connected:true}];
  s.game=createGame();s.announce=()=>{};
  const sent=[];s.send=(_,message)=>sent.push(message);
  s.command('guest',{type:'swap',seq:1,hand:'missing',up:'missing'});
  assert.equal(s.lastSequences.get('guest'),1);
  assert.equal(sent.length,0);
  s.close();
});

test('confirmed: non-host accepts offers from multiple unbound host identities',async()=>{
  const previous=globalThis.RTCPeerConnection;
  globalThis.RTCPeerConnection=class {
    async setRemoteDescription(value){this.remoteDescription=value;}
    async createAnswer(){return {type:'answer',sdp:'audit'};}
    async setLocalDescription(value){this.localDescription={toJSON:()=>value};}
    close(){}
  };
  const s=new Session('Guest',()=>{},()=>{});s.publish=()=>{};
  try {
    await s.signal({id:'real-host',type:'offer',to:s.id,description:{}});
    await s.signal({id:'unrelated-peer',type:'offer',to:s.id,description:{}});
    assert.equal(s.links.size,2);
  } finally {s.close();globalThis.RTCPeerConnection=previous;}
});
