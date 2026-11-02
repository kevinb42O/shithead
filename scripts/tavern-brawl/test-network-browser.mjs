import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {launch} from './browser-tools.mjs';
const browser=await launch();
try{
  const page=await browser.page();await page.navigate('http://localhost:5173/tavern-brawl.html');await page.wait(`document.getElementById('app')&&!document.getElementById('app').hidden`);
  const report=await page.evaluate(`(async()=>{
    const {BrawlRoom}=await import('/brawl/network.js'),{createRules,seeded}=await import('/brawl/engine.js'),{chooseAction}=await import('/brawl/ai.js');
    const rules=createRules(await(await fetch('/assets/tavern-brawl/cards.json')).json()),topics=new Map(),errors=[];
    const check=(condition,message)=>{if(!condition)throw Error(message);};
    const wait=async test=>{const start=Date.now();while(!test()){if(Date.now()-start>10000)throw Error('Network condition timed out');await new Promise(r=>setTimeout(r,10));}};
    function broker(){const owned=[];return {async connect(){},subscribe(topic,callback){if(!topics.has(topic))topics.set(topic,new Set());topics.get(topic).add(callback);owned.push([topic,callback]);},publish(topic,raw){for(const cb of topics.get(topic)||[])queueMicrotask(()=>cb(raw));},close(){for(const [t,cb]of owned)topics.get(t).delete(cb);}};}
    window.SHITHEAD_ICE_SERVERS=[];
    const deck=[...rules.decks.raven].reverse(),host=new BrawlRoom({rules,broker:broker(),name:'Host',onError:e=>errors.push(e)}),guest=new BrawlRoom({rules,hero:'raven',deck,broker:broker(),name:'Guest',onError:e=>errors.push(e)});
    try{
      await host.open();await guest.open(host.room);await wait(()=>host.members[1]?.connected&&guest.members.length===2&&!guest.busy);
      check(JSON.stringify(host.members[1].deck)===JSON.stringify(deck),'Guest custom deck lost at connection');
      host.act('ready',{ready:true});guest.act('ready',{ready:true});await wait(()=>host.members.every(m=>m.ready)&&!guest.busy);host.act('start');await wait(()=>guest.view?.id===host.game.id);
      check(guest.view.players[0].hand.length===0&&!('deck' in guest.view.players[0]),'Opponent cards leaked');
      const rng=seeded(99);let actions=0;
      while(host.game.phase!=='finished'&&actions<1200){
        const g=host.game,seat=g.phase==='mulligan'?g.players.findIndex(p=>!p.mulliganDone):g.turn,actor=seat===0?host:guest,revision=g.revision;
        const action=chooseAction(rules,g,seat,{rng});check(actor.act('move',{action}),'Command failed to send');
        await wait(()=>host.game.revision>revision&&guest.view.revision===host.game.revision&&!guest.busy);actions++;
      }
      check(host.game.phase==='finished','Online duel stalled');check(guest.view.winner===host.game.winner,'Peers disagree about winner');
      const old=host.game.id;host.act('rematch');await wait(()=>guest.view.id===host.game.id&&guest.view.id!==old);check(guest.view.phase==='mulligan','Rematch did not start with mulligan');
      guest.act('concede');await wait(()=>host.game.phase==='finished'&&guest.view.phase==='finished'&&!guest.busy);check(host.game.winner===0,'Guest concession winner incorrect');
      host.close();await wait(()=>guest.ended);check(guest.ended&&!guest.paused&&!guest.busy&&guest.view.phase==='finished','Guest result lost after host leaves');
      check(errors.length===0,errors.join('; '));return {status:'passed',transport:'real WebRTC data channels; local signaling broker',actions,customGuestDeck:true,privateHands:true,rematch:true,guestConcession:true,hostDeparture:true,errors};
    }finally{host.close();guest.close();}
  })()`);
  assert.deepEqual(page.errors,[]);await writeFile('artifacts/brawl-audit/network-browser.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser.close();}
