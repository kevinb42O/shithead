import test from 'node:test';
import assert from 'node:assert/strict';
import {createBank} from '../dist/bank.js';
import {createPortraitStore,installPortraitShortcut} from '../dist/portrait-store.js';
function fixture(balance=1000){
 let value=JSON.stringify({wallet:{balance},game:{phase:'playing',marker:'preserve'},stats:{you:4},onlineBets:{held:{stake:50,status:'reserved'}}});
 const storage={getItem:()=>value,setItem:(_,next)=>value=next};let queue=Promise.resolve();
 const locks={request:(_,fn)=>{const next=queue.then(fn);queue=next.catch(()=>{});return next;}};
 const bank=()=>createBank({key:'wallet',storage,locks});return {storage,bank,shop:()=>createPortraitStore(bank())};
}
test('exactly Fox, Owl, Raven and Vesper are free from an empty inventory',()=>{
 const shop=fixture().shop();assert.deepEqual([...shop.state().owned],['vesper','fox','owl','raven']);
 for(const id of ['isolde','cinder','aurel','silas'])assert.equal(shop.canUse(id),false);
});
test('purchase spends existing coins once, survives reload and preserves cards, stats and held buy-ins',async()=>{
 const f=fixture(3000),shop=f.shop();assert.deepEqual(await shop.purchase('isolde'),{id:'isolde',charged:2500});
 assert.equal(shop.state().balance,500);assert.equal(f.shop().canUse('isolde'),true);
 assert.equal((await f.shop().purchase('isolde')).charged,0);assert.equal(shop.state().balance,500);
 const saved=f.bank().read();assert.equal(saved.game.marker,'preserve');assert.equal(saved.stats.you,4);assert.equal(saved.onlineBets.held.status,'reserved');
 await f.bank().saveGame({phase:'setup'},{you:5});assert.equal(f.shop().canUse('isolde'),true);assert.equal(f.shop().state().balance,500);
});
test('insufficient funds, invalid IDs and failed persistence do not spend coins or grant characters',async()=>{
 const f=fixture(1000);await assert.rejects(f.shop().purchase('isolde'),/1[,.]500/);await assert.rejects(f.shop().purchase('../no'),/Choose/);
 assert.equal(f.shop().state().balance,1000);assert.equal(f.shop().canUse('isolde'),false);
 const rich=fixture(3000);rich.storage.setItem=()=>{throw Error('Storage full');};await assert.rejects(rich.shop().purchase('isolde'),/Storage full/);
 assert.equal(rich.shop().state().balance,3000);assert.equal(rich.shop().canUse('isolde'),false);
});
test('two tabs cannot double charge the same unlock or overspend on different unlocks',async()=>{
 const f=fixture(2500),a=f.shop(),b=f.shop();const results=await Promise.all([a.purchase('isolde'),b.purchase('isolde')]);
 assert.equal(results.reduce((n,r)=>n+r.charged,0),2500);assert.equal(a.state().balance,0);
 const rich=fixture(12500);const attempts=await Promise.allSettled([rich.shop().purchase('cinder'),rich.shop().purchase('isolde')]);
 assert.equal(attempts.filter(r=>r.status==='fulfilled').length,1);assert.equal(rich.shop().state().balance,0);
});
test('private shortcut grants persistent ownership without changing wallet and ignores typing outside the main menu',async()=>{
 const f=fixture(73),shop=f.shop();let listener,editing=false,menuActive=true,modal=false;
 const doc={body:{classList:{contains:()=>menuActive}},getElementById:()=>({hidden:false,inert:false}),querySelector:()=>modal?{}:null,addEventListener:(_,fn)=>listener=fn,removeEventListener(){},dispatchEvent(){}};
 installPortraitShortcut(shop,{document:doc});
 const type=word=>{for(const key of word)listener({key,target:{closest:()=>editing},ctrlKey:false,metaKey:false,altKey:false,repeat:false});};
 editing=true;type('unlockall');editing=false;menuActive=false;type('unlockall');menuActive=true;modal=true;type('unlockall');modal=false;
 assert.equal(shop.state().owned.size,4);type('unlockall');await f.bank().idle();await new Promise(r=>setImmediate(r));
 assert.equal(f.shop().state().owned.size,8);assert.equal(shop.state().balance,73);
});
