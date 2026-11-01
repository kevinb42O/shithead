// Temporary localhost review pages. The user's normal saved game is untouched.
import {readFile,writeFile} from 'node:fs/promises';
import {createGame,assertGame} from '../dist/engine.js';
import {createWallet} from '../dist/coins.js';
const html = await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
for (const mode of ['final','early','win','escape','loss','practice']) {
  const count = mode==='final'?2:4, game=createGame(Math.random,count);
  const cards=[...game.deck,...game.players.flatMap(p=>[...p.hand,...p.up,...p.down])];
  const take=rank=>cards.splice(cards.findIndex(c=>c.rank===rank),1)[0];
  game.players=Array.from({length:count},()=>({hand:[],up:[],down:[]}));
  game.players[count-1].hand=[take(12),take(13)];
  game.pile=[take(4)];game.deck=[];game.turn=0;game.dealComplete=true;
  if(mode==='final'||mode==='early') {game.players[0].hand=[take(8)]; game.phase='playing';if(mode==='early'){game.players[1].hand=[take(5)];game.players[2].hand=[take(6)];}}
  else {
    game.phase='finished';game.winner=mode==='escape'?1:mode==='loss'?1:0;
    game.loser=mode==='loss'?0:count-1;
    if(mode==='loss') [game.players[0],game.players[count-1]]=[game.players[count-1],game.players[0]];
    game.placements=[game.winner,...Array.from({length:count},(_,i)=>i).filter(i=>i!==game.winner&&i!==game.loser)];
    game.turn=game.loser;
  }
  game.burned=cards;
  if(mode!=='practice')game.bet={id:'victory-review-'+mode,stake:10,pot:count*10,settled:!['final','early'].includes(mode),winner:['final','early'].includes(mode)?null:game.winner};
  assertGame(game);
  const wallet=createWallet({balance:game.bet?.winner===0?1030:990});
  const seed=`<script>if(location.hostname==='localhost'&&new URLSearchParams(location.search).has('qa')){localStorage.setItem('shithead-table-v2-qa',${JSON.stringify(JSON.stringify({game,wallet,stats:{you:0,fox:0}}))});localStorage.setItem('shithead-preferences-qa',JSON.stringify({playerCount:${count},sound:true,soundPreferenceSet:true,reducedMotion:new URLSearchParams(location.search).has('reduced')}));}</script>`;
  const auto=`<script type="module">document.addEventListener('game-ready',async()=>{const app=await import('./app.js');await app.enterGame();},{once:true});</script>`;
  await writeFile(new URL(`../dist/test-victory-${mode}.html`,import.meta.url),html.replace('<head>','<head>'+seed).replace('</body>',auto+'</body>'));
}
console.log('Prepared QA review pages: /test-victory-{final,early,win,escape,loss,practice}.html?qa');
