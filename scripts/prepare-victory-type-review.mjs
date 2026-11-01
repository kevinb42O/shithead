// A disposable specimen page exercises the real result module with edge-case text.
import {writeFile} from 'node:fs/promises';
await writeFile(new URL('../dist/test-victory-type.html',import.meta.url),`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Victory type review</title><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="navigation.css"><link rel="stylesheet" href="victory.css"><style>body{margin:0;background:#20150e}#game-view{position:fixed;inset:0;background:url(assets/ember-hearth-board.jpg) center/100% 100%}.player-bankroll{position:absolute;left:5%;top:70%;color:#fff}</style></head><body><div id="game-view"><div class="player-bankroll">1,300 coins</div></div><script type="module">
import {createVictoryPresentation,prepareVictoryFonts} from './victory.js';
await prepareVictoryFonts();
const mode=new URLSearchParams(location.search).get('case')||'win';
const game={phase:mode==='early'?'playing':'finished',winner:mode==='guest'?1:0,loser:mode==='loss'?0:3,players:[{name:'You'},{name:'Maximilian Winterbourne'},{name:'The Owl'},{name:mode==='long'?'Aurelian van Ravenscroft':'The Raven'}],bet:{id:'type-'+mode,stake:100,pot:400,settled:true,winner:mode==='guest'||mode==='loss'?1:0}};
if(mode==='loss')game.winner=1;
if(mode==='practice')delete game.bet;
const presentation=createVictoryPresentation({onMenu:()=>location.href='/?qa',onReplay:()=>location.reload(),onContinue:()=>location.reload(),replayState:()=>({label:mode==='guest'?'Awaiting host':'Play again',disabled:mode==='guest',note:mode==='guest'?'The host will deal your next round.':''})});
presentation.show(game,{restored:!new URLSearchParams(location.search).has('animate')});
</script></body></html>`);
console.log('Prepared /test-victory-type.html?case=win|long|guest|loss|early|practice');
