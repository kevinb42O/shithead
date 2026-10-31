import test from 'node:test';
import assert from 'node:assert/strict';
import {createWallet} from '../dist/coins.js';
import {DAY, FORTUNE_STAKES, MULTIPLIERS, RETURN_RATE, rollFortune, multiplier} from '../dist/fortune-engine.js';
import {createBank} from '../dist/bank.js';

const storage = initial => {
  let value = initial ? JSON.stringify(initial) : null;
  return { getItem: () => value, setItem: (key, next) => { value = next; } };
};
const makeLocks = () => {
  let pending = Promise.resolve();
  return { request(key, fn) { const work = pending.then(fn); pending = work.catch(() => {}); return work; } };
};
test('all 2251 daily amounts are possible, inclusive, additive, and claimable again exactly after 24h', () => {
  for (let n = 0; n <= 2250; n++) {
    const w = createWallet({balance:0});
    const r = rollFortune(w, {mode:'daily', now:1000, draw: limit => limit === 2251 ? n : 2 });
    assert.equal(r.payout, 250+n); assert.equal(w.balance,250+n); assert.equal(w.nextDailyAt,1000+DAY);
  }
  const w = createWallet({balance:123});
  rollFortune(w,{mode:'daily',now:1000,draw:()=>0});
  const saved = JSON.stringify(w);
  for (const now of [0,999,1000,1000+DAY-1]) assert.throws(()=>rollFortune(w,{mode:'daily',now}),/already/);
  assert.equal(JSON.stringify(w),saved);
  rollFortune(w,{mode:'daily',now:1000+DAY,draw:limit=>limit === 2251 ? 2250 : 5}); assert.equal(w.balance,2873);
});
test('all 216 paid outcomes and every stake have exact accounting and published odds', () => {
  let pairs=0, triples=0, losses=0, returns=0;
  for(let a=0;a<6;a++)for(let b=0;b<6;b++)for(let c=0;c<6;c++) {
    const symbols=[a,b,c], unique=new Set(symbols).size;
    if(unique===1)triples++;else if(unique===2)pairs++;else losses++;
    const expected=unique===1?MULTIPLIERS[a]:unique===2?2:0;
    assert.equal(multiplier(symbols),expected); returns+=expected;
    for(const stake of FORTUNE_STAKES){
      const w=createWallet({balance:1000});let i=0;
      const r=rollFortune(w,{mode:'paid',stake,now:10,draw:()=>symbols[i++]});
      assert.equal(r.payout,expected*stake);assert.equal(w.balance,1000-stake+r.payout);assert.equal(r.net,r.payout-stake);
      assert.equal(w.nextDailyAt,0);
    }
  }
  assert.deepEqual([triples,pairs,losses],[6,90,120]);assert.equal(returns/216,RETURN_RATE);
  const w=createWallet({balance:250});assert.equal(rollFortune(w,{mode:'paid',stake:250,draw:()=>5}).payout,750);
});
test('invalid, unaffordable, overflow and malformed outcomes leave wallet untouched', () => {
  for(const options of [{mode:'paid',stake:26},{mode:'paid',stake:250},{mode:'other'},{mode:'daily',now:-1},{mode:'daily',draw:()=>2251},{mode:'paid',stake:10,draw:()=>6}]){
    const w=createWallet({balance:25});const before=JSON.stringify(w);assert.throws(()=>rollFortune(w,options));assert.equal(JSON.stringify(w),before);
  }
  const w=createWallet({balance:Number.MAX_SAFE_INTEGER});assert.throws(()=>rollFortune(w,{mode:'daily'}),/limit/);
});
test('old wallet migration preserves balance and new metadata across JSON reload', () => {
  assert.equal(createWallet({balance:0}).nextDailyAt,0);
  const w=createWallet({balance:100});rollFortune(w,{mode:'daily',now:1000,draw:limit=>limit === 2251 ? 42 : 2});
  assert.deepEqual(createWallet(JSON.parse(JSON.stringify(w))),w);
});
test('two bank instances serialize a daily claim and keep card state intact',async()=>{
  const game={phase:'playing',bet:{id:'table',settled:false},cards:['kept']};
  const store=storage({game,stats:{you:4},wallet:{balance:0}}),locks=makeLocks();
  const a=createBank({key:'test',storage:store,locks}),b=createBank({key:'test',storage:store,locks});
  const claim=bank=>bank.transact(s=>rollFortune(s.wallet,{mode:'daily',now:1000,draw:limit=>limit === 2251 ? 2250 : 5}));
  const results=await Promise.allSettled([claim(a),claim(b)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(a.read().wallet.balance,2500);assert.deepEqual(a.read().game,game);
  await b.saveGame({...game,cards:['updated']},{you:5});
  assert.equal(a.read().wallet.balance,2500);assert.equal(a.read().wallet.nextDailyAt,1000+DAY);
  assert.equal(createWallet(JSON.parse(store.getItem()).wallet).lastSpin.payout,2500);
});
test('simultaneous paid spins cannot overspend the last stake',async()=>{
  const store=storage({wallet:{balance:10}}),locks=makeLocks();
  const a=createBank({key:'test',storage:store,locks}),b=createBank({key:'test',storage:store,locks});
  const spin=bank=>bank.transact(s=>{let i=0;return rollFortune(s.wallet,{mode:'paid',stake:10,draw:()=>i++});});
  const result=await Promise.allSettled([spin(a),spin(b)]);
  assert.equal(result.filter(r=>r.status==='fulfilled').length,1);assert.equal(a.read().wallet.balance,0);
});
test('failed persistence changes neither stored state nor visible wallet and a later retry succeeds',async()=>{
  const store=storage({wallet:{balance:0}}),write=store.setItem;let changes=0;
  const bank=createBank({key:'test',storage:store,locks:makeLocks(),changed:()=>changes++});
  store.setItem=()=>{throw Error('Storage full');};
  await assert.rejects(bank.transact(s=>rollFortune(s.wallet,{mode:'daily',now:1000,draw:()=>0})),/Storage full/);
  assert.equal(bank.read().wallet.balance,0);assert.equal(changes,0);
  store.setItem=write;
  await bank.transact(s=>rollFortune(s.wallet,{mode:'daily',now:1000,draw:()=>0}));assert.equal(bank.read().wallet.balance,250);
});
test('a stale card save cannot undo an already settled wager',async()=>{
  const store=storage({wallet:{balance:2000},game:{bet:{id:'same',settled:true,winner:0}}});
  const bank=createBank({key:'test',storage:store,locks:makeLocks()});
  await bank.saveGame({bet:{id:'same',settled:false,winner:null}},{});
  assert.equal(bank.read().game.bet.settled,true);assert.equal(bank.read().wallet.balance,2000);
});
test('user payout rule: every pair doubles and every triple triples the stake',()=>{
  for(let symbol=0;symbol<6;symbol++){
    let i=0;const pair=[symbol,symbol,(symbol+1)%6];
    const w=createWallet({balance:100});
    const r=rollFortune(w,{mode:'paid',stake:25,draw:()=>pair[i++]});
    assert.equal(r.payout,50);assert.equal(r.net,25);assert.equal(w.balance,125);
    const triple=rollFortune(w,{mode:'paid',stake:25,draw:()=>symbol});
    assert.equal(triple.payout,75);assert.equal(triple.net,50);assert.equal(w.balance,175);
  }
});
