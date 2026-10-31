import {test} from 'node:test';import assert from 'node:assert/strict';import {createGame,start,play,pickup,chooseMove,assertGame,legal,topRank,swap,aceOptions} from '../dist/engine.js';
const c=rank=>({id:String(rank),rank,suit:'♠'});
test('special ranks, transparent jokers, low sevens',()=>{assert.equal(legal(c(6),[c(7)],1),true);assert.equal(legal(c(8),[c(7)],1),false);assert.equal(legal(c(14),[c(7),c(15)],1),true);assert.equal(topRank([c(12),c(15)]),12);for(const r of [2,15,10])assert.equal(legal(c(r),[c(14)]),true);assert.equal(legal(c(4),[c(2)]),true);});
test('setup swap preserves all cards',()=>{const g=createGame();assert(swap(g,g.players[0].hand[0].id,g.players[0].up[0].id));assertGame(g);});
test('invalid selections cannot mutate state',()=>{const g=createGame();start(g,()=>0);const before=JSON.stringify(g);assert.equal(play(g,['invalid']).ok,false);assert.equal(JSON.stringify(g),before);});
test('500 seeded games preserve 54 unique cards and finish',()=>{for(let n=0;n<500;n++){let seed=n===499?1313:n+1;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);const g=createGame(rng);start(g,rng);let moves=0;while(g.phase!=='finished'&&moves++<3000){const ids=chooseMove(g,g.turn,rng);const r=ids.length?play(g,ids):pickup(g);assert(r.ok);assertGame(g);}assert.equal(g.phase,'finished',`Seed ${n===499?1313:n+1} exceeded the turn limit`);}});
test('tens burn and grant another turn',()=>{const g=createGame();start(g,()=>0);g.players[0].hand=[c(10),c(5),c(6)];g.deck=[];g.pile=[c(14)];assert.equal(play(g,['10']).burn,true);assert.equal(g.turn,0);assert.equal(g.pile.length,0);});
test('failed blind flip picks up both card and pile',()=>{const g=createGame();start(g,()=>0);g.deck=[];g.players[0]={hand:[],up:[],down:[c(4)]};g.pile=[c(14)];assert.equal(play(g,['4']).pickup,true);assert.equal(g.players[0].hand.length,2);assert.equal(g.turn,1);});
test('stacked sevens persist across low plays; two does not reset',()=>{const g=createGame();start(g,()=>0);g.deck=[];g.players[0].hand=[{id:'7a',rank:7},{id:'7b',rank:7},c(8)];g.players[1].hand=[c(2),c(4)];play(g,['7a','7b']);assert.equal(g.lowTurns,2);play(g,['2']);assert.equal(g.lowTurns,1);assert.equal(legal(c(8),g.pile,g.lowTurns),false);});
test('three reverses direction and passes to next player, repeatedly',()=>{
 const g=createGame();start(g,()=>0);g.deck=[];
 g.players[0].hand=[{id:'3a',rank:3},{id:'3c',rank:3},{id:'3e',rank:3}];
 g.players[1].hand=[{id:'3b',rank:3},{id:'2b',rank:2},{id:'3d',rank:3}];
 assert.equal(g.turn,0);assert.equal(g.direction,1);
 assert(play(g,['3a']).ok);assert.equal(g.direction,-1);assert.equal(g.turn,1);
 assert(play(g,['3b']).ok);assert.equal(g.direction,1);assert.equal(g.turn,0);
 assert(play(g,['3c']).ok);assert.equal(g.direction,-1);assert.equal(g.turn,1);
 assert(play(g,['2b']).ok);assert.equal(g.direction,-1);assert.equal(g.turn,0);
 assert(play(g,['3e']).ok);assert.equal(g.direction,1);assert.equal(g.turn,1);
 assert(play(g,['3d']).ok);assert.equal(g.direction,-1);assert.equal(g.turn,0);
 const h=createGame();start(h,()=>0);h.players[0].hand=[c(3)];h.pile=[c(14)];
 assert.equal(play(h,['3']).ok,false);
});
test('four matching cards burn, including four sevens',()=>{const g=createGame();start(g,()=>0);g.deck=[];g.players[0].hand=[...Array.from({length:4},(_,i)=>({id:'seven'+i,rank:7})),c(4)];assert(play(g,['seven0','seven1','seven2','seven3']).burn);assert.equal(g.lowTurns,0);assert.equal(g.turn,0);});
test('joker preserves underlying rank and low-turn count',()=>{const g=createGame();start(g,()=>0);g.deck=[];g.players[0].hand=[c(15),c(6)];g.pile=[c(7)];g.lowTurns=2;play(g,['15']);assert.equal(g.lowTurns,2);assert.equal(topRank(g.pile),7);});
function aceGame(){const g=createGame();start(g,()=>0);g.deck=[];g.players[0].hand=[c(14),c(4)];g.players[1].hand=[{id:'other-ace',rank:14,suit:'♥'},c(5)];return g;}
test('ace under seven becomes one and uses one low turn',()=>{const g=aceGame();g.pile=[c(7)];g.lowTurns=2;assert(play(g,['14']).ok);assert.equal(topRank(g.pile),1);assert.equal(g.lowTurns,1);assert.equal(legal(c(13),g.pile,g.lowTurns),false);assert.equal(legal(c(14),g.pile,g.lowTurns,14),false);});
test('another ace on a low ace can be declared either low or high',()=>{for(const value of [1,14]){const g=aceGame();g.pile=[c(7)];g.lowTurns=1;play(g,['14']);assert(play(g,['other-ace'],{aceValue:value}).ok);assert.equal(topRank(g.pile),value);assert.equal(legal(c(5),g.pile),value===1);}});
test('ace choices pass through transparent jokers',()=>{const g=aceGame();g.pile=[{...c(14),id:'pile-ace',aceValue:1,aceFromSeven:true},c(15)];assert(play(g,['14'],{aceValue:14}).ok);assert.equal(topRank(g.pile),14);});
test('high and low ace declarations cannot evade remaining seven turns',()=>{const g=aceGame();g.pile=[c(7)];g.lowTurns=2;const before=JSON.stringify(g);assert.equal(play(g,['14'],{aceValue:14}).ok,false);assert.equal(JSON.stringify(g),before);assert(play(g,['14'],{aceValue:1}).ok);assert.equal(play(g,['other-ace'],{aceValue:14}).ok,false);assert(play(g,['other-ace'],{aceValue:1}).ok);assert.equal(g.lowTurns,0);});
test('ace is ordinarily high and cannot be declared one on a king',()=>{const g=aceGame();g.pile=[c(13)];assert.equal(play(g,['14'],{aceValue:1}).ok,false);assert(play(g,['14']).ok);assert.equal(topRank(g.pile),14);});
test('picked-up low ace can be played high on a later pile',()=>{const g=aceGame();g.players[0].hand=[{...c(14),aceValue:1},c(4)];g.pile=[c(13)];play(g,['14']);assert.equal(topRank(g.pile),14);});
test('four aces still burn regardless of declared value',()=>{const g=aceGame();g.pile=[{id:'a1',rank:14,aceValue:1},{id:'a2',rank:14,aceValue:14},{id:'a3',rank:14,aceValue:1,aceFromSeven:true}];assert(play(g,['14'],{aceValue:14}).burn);assert.equal(g.pile.length,0);});
test('blind ace choice locks revealed card and survives save/restore',()=>{let g=aceGame();g.players[0]={hand:[],up:[],down:[c(14),c(4)]};g.pile=[{...c(14),id:'old-ace',aceValue:1,aceFromSeven:true}];const r=play(g,['14'],{requestChoice:true});assert(r.needsAceChoice);assert.equal(g.players[0].down.length,2);assert.equal(play(g,['4']).ok,false);assert.equal(pickup(g).ok,false);g=JSON.parse(JSON.stringify(g));assert(play(g,['14'],{aceValue:1}).ok);assert.equal(topRank(g.pile),1);assert.equal(g.pendingAce,undefined);});
test('computer can choose low ace to support its remaining low hand',()=>{const g=aceGame();g.turn=1;g.pile=[{...c(14),id:'old-ace',aceValue:1,aceFromSeven:true}];assert(play(g,['other-ace']).ok);assert.equal(topRank(g.pile),1);});

test('opening ace is one; ordinary ace-on-ace inherits without choice',()=>{
 const g=aceGame();assert.deepEqual(aceOptions(g.pile),[1]);assert(play(g,['14']).ok);assert.equal(topRank(g.pile),1);
 assert.deepEqual(aceOptions(g.pile),[1]);assert(play(g,['other-ace'],{requestChoice:true}).ok);assert.equal(topRank(g.pile),1);
 const h=aceGame();h.pile=[c(13)];play(h,['14']);assert.deepEqual(aceOptions(h.pile),[14]);assert.equal(play(h,['other-ace'],{aceValue:1}).ok,false);assert(play(h,['other-ace'],{requestChoice:true}).ok);assert.equal(topRank(h.pile),14);
});
test('two sevens, then two separate threes resume play from three',()=>{
 const g=aceGame();g.players[0].hand=[{id:'7a',rank:7},{id:'7b',rank:7},c(9)];g.players[1].hand=[{id:'3a',rank:3},c(8)];g.players[0].hand.push({id:'3b',rank:3});
 assert(play(g,['7a','7b']).ok);assert.equal(g.lowTurns,2);assert(play(g,['3a']).ok);assert.equal(g.turn,0);assert.equal(g.lowTurns,1);
 assert(play(g,['3b']).ok);assert.equal(g.turn,1);assert.equal(g.lowTurns,0);assert.equal(topRank(g.pile),3);
 for(const rank of [3,4,5,6,7,8])assert.equal(legal(c(rank),g.pile,g.lowTurns),true);
 const restored=JSON.parse(JSON.stringify(g));assert.equal(topRank(restored.pile),3);
});
test('picked-up cards lose old seven threshold when replayed',()=>{const g=aceGame();g.players[0].hand=[{...c(4),resumeRank:7},c(9)];assert(play(g,['4']).ok);assert.equal(topRank(g.pile),4);});
test('joker-only pile opens with an ace as one',()=>{assert.deepEqual(aceOptions([c(15)]),[1]);});

test('bottle start gives each seat an equal interval for 2–4 players',()=>{
 for(const count of [2,3,4])for(let who=0;who<count;who++){
  for(const offset of [0,.5,.999999]){
   const g=createGame(Math.random,count);start(g,()=>(who+offset)/count);
   assert.equal(g.turn,who);assert.equal(g.phase,'playing');assert.match(g.log[0],/bottle/);assertGame(g);
  }
 }
});
test('starting an active or restored game cannot reroll the opening seat',()=>{
 const g=createGame();start(g,()=>.999);const snapshot=JSON.stringify(g);
 start(g,()=>0);assert.equal(JSON.stringify(g),snapshot);
 const restored=JSON.parse(snapshot);start(restored,()=>0);assert.equal(JSON.stringify(restored),snapshot);
});

test('seven followed by three resumes from three, including legacy saved piles',()=>{
 const g=aceGame();g.players[0].hand=[c(7),c(6),c(9)];g.players[1].hand=[c(3),c(13)];
 assert(play(g,['7']).ok);assert(play(g,['3']).ok);assert.equal(g.lowTurns,0);assert.equal(g.direction,-1);assert.equal(g.turn,0);
 assert.equal(topRank(g.pile),3);assert(legal(c(6),g.pile,g.lowTurns));assert(legal(c(13),g.pile,g.lowTurns));
 g.pile.at(-1).resumeRank=7;assert.equal(topRank(JSON.parse(JSON.stringify(g)).pile),3);
});

test('four of a kind can be played on anything to burn the pile, like a ten',()=>{
 const suits=['♠','♥','♣','♦'];
 // 1. Four 4s on a King (normally illegal for rank 4)
 const g=createGame();start(g,()=>0);g.deck=[];
 g.players[0].hand=suits.map(suit=>({id:'4'+suit,rank:4,suit}));
 g.players[0].hand.push(c(8));
 g.pile=[c(13)]; // Top is King
 // 1, 2, or 3 fours are not legal
 assert.equal(play(g,['4♠']).ok,false);
 assert.equal(play(g,['4♠','4♥']).ok,false);
 assert.equal(play(g,['4♠','4♥','4♣']).ok,false);
 assert.equal(legal(c(4),g.pile,g.lowTurns,undefined,1),false);
 assert.equal(legal(c(4),g.pile,g.lowTurns,undefined,4),true);
 // But all 4 fours are legal and burn the pile
 const r=play(g,['4♠','4♥','4♣','4♦']);
 assert.equal(r.ok,true);
 assert.equal(r.burn,true);
 assert.equal(g.pile.length,0);
 assert.equal(g.turn,0); // Player goes again
 assert.equal(g.players[0].hand.length,1); // Only the 8 remains
});

test('four of a kind burns and overrides low turns restriction',()=>{
 const suits=['♠','♥','♣','♦'];
 const g=createGame();start(g,()=>0);g.deck=[];
 g.players[0].hand=suits.map(suit=>({id:'8'+suit,rank:8,suit}));
 g.players[0].hand.push(c(5));
 g.pile=[c(7)];
 g.lowTurns=2;
 // Fewer than 4 eights cannot evade low turns
 assert.equal(play(g,['8♠']).ok,false);
 assert.equal(play(g,['8♠','8♥']).ok,false);
 assert.equal(play(g,['8♠','8♥','8♣']).ok,false);
 // Four eights burn the pile and clear lowTurns
 const r=play(g,['8♠','8♥','8♣','8♦']);
 assert.equal(r.ok,true);
 assert.equal(r.burn,true);
 assert.equal(g.lowTurns,0);
 assert.equal(g.pile.length,0);
 assert.equal(g.turn,0);
});

test('chooseMove detects four of a kind burn when facing a higher card',()=>{
 const suits=['♠','♥','♣','♦'];
 const g=createGame();start(g,()=>0);g.deck=[];
 g.pile=[c(13)]; // King on pile
 g.players[0].hand=[...suits.map(suit=>({id:'5'+suit,rank:5,suit})),c(6)];
 const move=chooseMove(g,0);
 assert.equal(move.length,4);
 assert.deepEqual(move.sort(),suits.map(s=>'5'+s).sort());
});

test('pickup refills to three, preserves cards and still ends the turn',()=>{
 const g=createGame();start(g,()=>0);
 g.burned.push(...g.players[0].hand.splice(1));g.pile.push(g.deck.pop());g.lowTurns=2;
 const stock=g.deck.length;
 assert(pickup(g).ok);assert.equal(g.players[0].hand.length,3);assert.equal(g.deck.length,stock-1);
 assert.equal(g.pile.length,0);assert.equal(g.lowTurns,0);assert.equal(g.turn,1);assertGame(g);
});
test('pickup takes only the available stock and never discards a larger hand',()=>{
 for(const cardsLeft of [0,1]){
  const g=createGame();start(g,()=>0);
  g.burned.push(...g.players[0].hand.splice(0));g.pile.push(g.deck.pop());
  g.burned.push(...g.deck.splice(cardsLeft));
  assert(pickup(g).ok);assert.equal(g.players[0].hand.length,1+cardsLeft);assert.equal(g.deck.length,0);assertGame(g);
 }
 const g=createGame();start(g,()=>0);g.pile.push(g.deck.pop());const stock=g.deck.length;
 assert(pickup(g).ok);assert.equal(g.players[0].hand.length,4);assert.equal(g.deck.length,stock);assertGame(g);
});
