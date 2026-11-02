import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {createRules, seeded} from '../../dist/brawl/engine.js';
import {chooseAction} from '../../dist/brawl/ai.js';
import {createRun, startEncounter, resolveEncounter, claimReward, encounterConfig} from '../../dist/brawl/adventure.js';

// Diagnostic only: uses the shipped rules and real encounter/reward transitions.
const catalog = JSON.parse(readFileSync(new URL('../../dist/assets/tavern-brawl/cards.json', import.meta.url)));
const rules = createRules(catalog);
const samples = Number(process.argv[2] || 60);
const mode=process.argv[3]||'rebalanced',difficulty=process.argv[4]||'standard';
if(!['baseline','rebalanced'].includes(mode)||!['relaxed','standard','sharp'].includes(difficulty))throw Error('Use [samples] [baseline|rebalanced] [relaxed|standard|sharp].');
if (!Number.isInteger(samples) || samples < 1) throw Error('Supply a positive integer sample count.');
function makeRun(hero,deck,seed,id){const run=createRun(hero,deck,seed,id,{difficulty});if(mode==='baseline'){delete run.balanceVersion;delete run.difficulty;}return run;}
const report = {samples, mode,difficulty,balance: catalog.balance, method: 'Seeds 41000+, real mulligans, Standard player AI and challenge-selected enemy AI with independent seeded noise. Alternating first seat for isolated encounters; real seed-selected opener for trails. Rewards prefer Steel, then healing below 23 HP when offered, then another relic, otherwise healing or a legal card swap replacing the lowest-stat crew / lowest-cost non-crew. These are bot baselines, not human win rates.', isolated: [], trails: [], decks: {}};
function finish(game, seed) {
  const rngs = [seeded(seed + 100003), seeded(seed + 200003)];
  if (game.phase === 'mulligan') for (const seat of [0, 1]) {
    const result = rules.apply(game, seat, chooseAction(rules, game, seat, {difficulty:seat===0?'standard':difficulty, rng:rngs[seat]}));
    if (!result.ok) throw Error(result.error);
    game = result.state;
  }
  let steps = 0;
  const metrics = {fatigue:0, blockedCrewTurns:0, turns:0};
  while (game.phase !== 'finished' && steps++ < 1500) {
    const seat = game.turn;
    const action = chooseAction(rules, game, seat, {difficulty:seat===0?'standard':difficulty, rng:rngs[seat]});
    if (seat === 0 && action.type === 'end') {
      metrics.turns++;
      if (game.players[0].board.length === 3 && game.players[0].hand.some(c => rules.definition(c).type === 'crew')) metrics.blockedCrewTurns++;
    }
    const result = rules.apply(game, seat, action);
    if (!result.ok) throw Error(result.error);
    game = result.state;
    metrics.fatigue += game.events.filter(e => e.type === 'fatigue' && e.seat === 0).length;
  }
  if (game.phase !== 'finished') throw Error('Unfinished simulation.');
  return {game, metrics};
}
for (const hero of ['fox', 'owl', 'raven']) {
  const legal = catalog.cards.filter(c => c.faction === hero || c.faction === 'neutral');
  report.decks[hero] = {legalIdentities:legal.length, featured:rules.featuredDecks[hero].map(id => ({id, cost:rules.cards[id].cost, type:rules.cards[id].type})), core:rules.decks[hero]};
  for (const scenario of ['first', 'second-full', 'second-worn', 'second-core']) {
    let wins=0, draws=0, fatigueGames=0, turns=0, blocked=0, playerTurns=0;
    for (let i=0; i<samples; i++) {
      const seed=41000+i, run=makeRun(hero, scenario === 'second-core' ? rules.decks[hero] : rules.featuredDecks[hero], seed, `audit-${hero}-${scenario}-${i}`);
      run.stage = scenario === 'first' ? 0 : 1;
      run.health = scenario === 'second-worn' ? 18 : 30;
      let game=startEncounter(rules,run);
      // Recreate with the same encounter configuration, varying only opening seat.
      game=rules.create({heroes:game.players.map(p=>p.hero),names:game.players.map(p=>p.name),seed,first:i%2,deckLists:[run.deck,encounterConfig(rules,run).deck],health:game.players.map(p=>p.health),maxHealth:game.players.map(p=>p.maxHealth),openingEnergy:[1,0],trailVersion:game.trailVersion});
      const result=finish(game,seed);
      wins+=result.game.winner===0;draws+=result.game.winner===null;fatigueGames+=result.metrics.fatigue>0;turns+=result.game.turnNumber;blocked+=result.metrics.blockedCrewTurns;playerTurns+=result.metrics.turns;
    }
    const row={hero,scenario,games:samples,wins,draws,winPercent:100*wins/samples,fatigueGames,meanTurnNumber:turns/samples,blockedCrewTurnPercent:100*blocked/Math.max(1,playerTurns)};
    report.isolated.push(row);console.log(JSON.stringify(row));
  }
  const reached=Array(7).fill(0),won=Array(7).fill(0),entryHealth=Array(7).fill(0);
  for(let i=0;i<samples;i++) {
    const seed=41000+i,run=makeRun(hero,rules.featuredDecks[hero],seed,`audit-trail-${hero}-${i}`);
    while(run.status==='map') {
      const stage=run.stage;reached[stage]++;entryHealth[stage]+=run.health;
      startEncounter(rules,run);run.game=finish(run.game,seed+stage*7919).game;
      if(run.game.winner===0)won[stage]++;
      resolveEncounter(rules,run);
      if(run.status==='reward') {
        let index=run.choices.findIndex(c=>c.type==='relic'&&c.id==='steel');
        if(index<0&&run.health<23)index=run.choices.findIndex(c=>c.type==='heal');
        if(index<0)index=run.choices.findIndex(c=>c.type==='relic');
        if(index<0)index=run.choices.findIndex(c=>c.type==='heal');
        let replace;
        if(index<0){index=run.choices.findIndex(c=>c.type==='card');const offered=run.choices[index].card;
          const value=id=>{const c=rules.cards[id];return c.type==='crew'?c.attack+c.health:c.cost;};
          replace=run.deck.filter(id=>id!==offered).sort((a,b)=>value(a)-value(b))[0];
        }
        if(!claimReward(rules,run,index,replace))throw Error('Invalid audit reward.');
      }
    }
  }
  const row={hero,started:samples,reached,won,conditionalWinPercent:won.map((n,i)=>reached[i]?100*n/reached[i]:null),meanEntryHealth:entryHealth.map((n,i)=>reached[i]?n/reached[i]:null)};
  report.trails.push(row);console.log(JSON.stringify(row));
}
const output=new URL(`../../artifacts/brawl-audit/balance-${mode}-${difficulty}.json`,import.meta.url);
mkdirSync(new URL('.',output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n');
