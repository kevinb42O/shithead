import fs from 'node:fs';
import {createRules,seeded} from '../../dist/brawl/engine.js';
import {chooseAction} from '../../dist/brawl/ai.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../../dist/assets/tavern-brawl/cards.json',import.meta.url)));
const rules=createRules(catalog),games=Number(process.argv[2]||200),report=[];
const start=Date.now();
for(const heroes of [['fox','owl'],['fox','raven'],['owl','raven']]){
 let wins=[0,0],draws=0,turns=0,actions=0,firstWins=0,choices=0;const plays={},deaths={};
 for(let i=0;i<games;i++){
  const rng=seeded(1000+i);let g=rules.create({heroes,deckLists:heroes.map(h=>rules.featuredDecks[h]),first:i%2,seed:1000+i,mulligan:false});let steps=0;
  while(g.phase!=='finished'&&steps++<1500){
   const a=chooseAction(rules,g,g.turn,{difficulty:'sharp',rng});const r=rules.apply(g,g.turn,a);if(!r.ok)throw Error(`${heroes}: ${r.error} ${JSON.stringify(a)}`);g=r.state;
   for(const e of g.events){if(e.type==='play')plays[e.card]=(plays[e.card]||0)+1;if(e.type==='death')deaths[e.card]=(deaths[e.card]||0)+1;}if(a.type==='choose')choices++;
  }
  if(g.phase!=='finished')throw Error('Unfinished game');if(g.winner===null)draws++;else{wins[g.winner]++;if(g.winner===g.first)firstWins++;}turns+=g.turnNumber;actions+=steps;
 }
 const row={heroes,games,wins,draws,winPercent:wins.map(v=>Math.round(v/games*1000)/10),firstWinPercent:Math.round(firstWins/games*1000)/10,meanTurnNumber:turns/games,meanActions:actions/games,choices,plays,deaths};report.push(row);console.log(JSON.stringify(row));
}
fs.writeFileSync(new URL('../../artifacts/tavern-brawl/after-midnight/balance.json',import.meta.url),JSON.stringify({catalogBalance:catalog.balance,gamesPerPair:games,elapsedMs:Date.now()-start,method:'Sharp AI, seeds 1000+, alternating opening seat, fixed per-game seeded evaluator noise, no mulligan',report},null,2)+'\n');
