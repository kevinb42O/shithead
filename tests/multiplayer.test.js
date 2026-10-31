import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,start,play,pickup,chooseMove,assertGame,nextPlayer,remaining} from '../dist/engine.js';
import {dealOrder} from '../dist/rendering.js';
const c=(id,rank)=>({id,rank,suit:'♠'});
for(const count of [2,3,4]){
 test(`${count} players: 250 seeded games finish, conserve cards and skip escaped seats`,()=>{
  for(let seed=1;seed<=250;seed++){
   let value=seed;const rng=()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296);
   let g=createGame(rng,count);assert.equal(g.deck.length,54-count*9);
   const order=dealOrder(g);assert.equal(order.length,count*9);assert.equal(new Set(order.map(s=>s.card.id)).size,count*9);
   order.forEach((s,i)=>assert.equal(s.who,i%count));start(g,rng);
   let moves=0;while(g.phase==='playing'&&moves++<5000){
    assert(remaining(g.players[g.turn])>0);const who=g.turn,ids=chooseMove(g,who,rng),result=ids.length?play(g,ids):pickup(g);assert(result.ok);assert.equal(result.who,who);assertGame(g);
    if(moves===20)g=JSON.parse(JSON.stringify(g));
   }
   assert.equal(g.phase,'finished',`${count} players, seed ${seed}`);
   assert.equal(g.placements.length,count-1);assert.equal(new Set(g.placements).size,count-1);assert(!g.placements.includes(g.loser));assert.equal(g.winner,g.placements[0]);
  }
 });
}
test('a three reverses to the neighboring player with three or four active seats',()=>{
 for(const count of [3,4]){const g=createGame(Math.random,count);start(g,()=>0);g.deck=[];g.players[0].hand=[c('three',3),c('four',4)];assert(play(g,['three']).ok);assert.equal(g.direction,-1);assert.equal(g.turn,count-1);}
});
test('an even set of threes preserves direction and advances normally with three active seats',()=>{const g=createGame(Math.random,3);start(g,()=>0);g.deck=[];g.players[0].hand=[c('a',3),c('b',3),c('c',4)];play(g,['a','b']);assert.equal(g.direction,1);assert.equal(g.turn,1);});
test('going out on a ten passes play and does not end a table with three active seats',()=>{const g=createGame(Math.random,4);start(g,()=>0);g.deck=[];g.players[0]={hand:[c('ten',10)],up:[],down:[]};const r=play(g,['ten']);assert(r.burn);assert(r.wentOut);assert.equal(g.phase,'playing');assert.equal(g.turn,1);assert.deepEqual(g.placements,[0]);g.turn=3;assert.equal(nextPlayer(g),1);g.direction=-1;g.turn=1;assert.equal(nextPlayer(g),3);});
test('last two active seats receive another turn on three',()=>{const g=createGame(Math.random,4);start(g,()=>0);g.deck=[];g.players[1]={hand:[],up:[],down:[]};g.players[3]={hand:[],up:[],down:[]};g.placements=[1,3];g.players[0].hand=[c('three-a',3),c('three-b',3),c('four',4)];g.players[2].hand=[c('five',5)];play(g,['three-a']);assert.equal(g.direction,-1);assert.equal(g.turn,0);play(g,['three-b']);assert.equal(g.direction,1);assert.equal(g.turn,0);});
test('unsupported player counts fail clearly',()=>{assert.throws(()=>createGame(Math.random,5),RangeError);});

test('opponent personalities choose different legal moves from the same cards',()=>{
 const g=createGame(()=>0.5,4);start(g,()=>0);g.deck=[];g.pile=[c('pile',6)];g.lowTurns=0;
 for(let who=1;who<=3;who++)g.players[who]={hand:[c(`${who}-seven`,7),c(`${who}-eight-a`,8),c(`${who}-eight-b`,8),c(`${who}-ten`,10)],up:[],down:[]};
 g.players[0]={hand:[c('a',4),c('b',5),c('c',6)],up:[],down:[]};
 assert.deepEqual(chooseMove(g,1,()=>0),['1-seven']);
 assert.deepEqual(chooseMove(g,2,()=>0),['2-eight-a','2-eight-b']);
 assert.deepEqual(chooseMove(g,3,()=>0),['3-ten']);
});
