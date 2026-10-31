import assert from 'node:assert/strict';
import {createGame,start,play,pickup,zone,legal,aceOptions,assertGame,remaining} from '../dist/engine.js';
let total=0,maxMoves=0;
for(let seed=1;seed<=3000;seed++){
 let value=seed;const rng=()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296);
 let g=createGame(rng,2+seed%3);start(g,rng);let moves=0;
 while(g.phase==='playing'&&moves++<20000){
  const p=g.players[g.turn],z=zone(p),who=g.turn;
  assert(remaining(p)>0);let ids=[];
  if(z==='down')ids=[p.down[Math.floor(rng()*p.down.length)].id];
  else{
   const groups=[...new Set(p[z].map(c=>c.rank))].map(rank=>p[z].filter(c=>c.rank===rank));
   const options=groups.flatMap(cards=>Array.from({length:cards.length},(_,i)=>cards.slice(0,i+1))).filter(cards=>legal(cards[0],g.pile,g.lowTurns,undefined,cards.length));
   if(options.length && (!g.pile.length||rng()>.08)) ids=options[Math.floor(rng()*options.length)].map(c=>c.id);
  }
  let result;
  if(ids.length){result=play(g,ids,{requestChoice:true});if(result.needsAceChoice){g=JSON.parse(JSON.stringify(g));const choices=aceOptions(g.pile,g.lowTurns);result=play(g,ids,{aceValue:choices[Math.floor(rng()*choices.length)]});}}
  else result=pickup(g);
  assert(result.ok,`seed ${seed} turn ${moves}`);g.log=g.log.slice(0,100);assertGame(g);
  assert(Number.isInteger(g.lowTurns)&&g.lowTurns>=0);
  assert.equal(new Set(g.placements).size,g.placements.length);
  for(const out of g.placements)assert.equal(remaining(g.players[out]),0);
  if(g.phase==='playing')assert(remaining(g.players[g.turn])>0);
  if(moves%37===0)g=JSON.parse(JSON.stringify(g));
 }
 assert.equal(g.phase,'finished',`seed ${seed}`);total+=moves;maxMoves=Math.max(maxMoves,moves);
}
console.log({games:3000,moves:total,maxMoves});
