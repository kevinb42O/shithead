import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRules} from '../dist/brawl/engine.js';
import {BrawlRoom,TURN_MS,MULLIGAN_MS,DISCONNECT_MS} from '../dist/brawl/network.js';
const rules=createRules(JSON.parse(readFileSync(new URL('../dist/assets/tavern-brawl/cards.json',import.meta.url))));
const broker={publish(){},subscribe(){},close(){}};
function table(options={}){const errors=[],packets=[];const room=new BrawlRoom({rules,broker,onError:message=>errors.push(message),...options});room.host=true;room.room='test';room.members=[{id:room.id,name:'Host',hero:'fox',deck:rules.decks.fox,ready:false,connected:true},{id:'guest',name:'Friend',hero:'raven',deck:rules.decks.raven,ready:false,connected:true}];room.send=(_,packet)=>{packets.push(packet);return true;};return {room,errors,packets};}
test('brawl online: ready gate, private projections, atomic rejection and duplicate sequence',()=>{
  const {room,errors,packets}=table();room.command(room.id,{type:'start',seq:1});assert.equal(room.game,null);assert(errors.length);
  room.command(room.id,{type:'ready',seq:2,ready:true});room.command('guest',{type:'ready',seq:1,ready:true});room.command(room.id,{type:'start',seq:3});assert(room.game);
  const snapshot=room.snapshot(1);assert.equal(snapshot.game.players[0].hand.length,0);assert(snapshot.game.players[1].hand.length>=3);assert(!('deck' in snapshot.game.players[0]));assert(!('seed' in snapshot.game));assert(snapshot.members.every(m=>!('deck' in m)));
  const before=structuredClone(room.game);room.command('guest',{type:'move',seq:2,action:{type:'play',uid:room.game.players[0].hand[0].uid}});assert.deepEqual(room.game,before);assert(packets.some(p=>p.type==='error'));
  room.command('guest',{type:'move',seq:3,action:{type:'mulligan',ids:[]}});const revision=room.game.revision;room.command('guest',{type:'move',seq:3,action:{type:'mulligan',ids:[]}});assert.equal(room.game.revision,revision);
  room.command(room.id,{type:'move',seq:4,action:{type:'mulligan',ids:[]}});assert.equal(room.game.phase,'playing');
  const wrong=1-room.game.turn,peer=wrong===0?room.id:'guest',seq=wrong===0?5:4;const g=structuredClone(room.game);room.command(peer,{type:'move',seq,action:{type:'end'}});assert.deepEqual(room.game,g);
  room.close();
});
test('brawl online: deck validation, host-only rematch, concession and disconnect lock',()=>{
  const {room,packets}=table();room.command('guest',{type:'configure',seq:1,hero:'owl',deck:Array(20).fill('tavern-rat')});assert.equal(room.members[1].hero,'raven');assert(packets.some(p=>p.type==='error'));
  room.command('guest',{type:'configure',seq:2,hero:'owl',deck:rules.decks.owl});assert.equal(room.members[1].hero,'owl');
  room.game=rules.create({seed:10});room.command('guest',{type:'concede',seq:3});assert.equal(room.game.phase,'finished');assert.equal(room.game.winner,0);
  const id=room.game.id;room.command('guest',{type:'rematch',seq:4});assert.equal(room.game.id,id);room.command(room.id,{type:'rematch',seq:1});assert.equal(room.game.phase,'mulligan');assert.notEqual(room.game.id,id);
  room.disconnected('guest');assert(room.paused);assert(!room.ended);room.settleDisconnect('guest');assert(room.ended);assert.equal(room.game.winner,0);assert(!room.paused);const before=structuredClone(room.game);room.command(room.id,{type:'move',seq:2,action:{type:'mulligan',ids:[]}});assert.deepEqual(room.game,before);room.close();
});

test('online deadlines keep unconfirmed hands, end turns, reject late moves, and never reset on ordinary moves',()=>{
  let time=1000;const {room,errors}=table({now:()=>time});
  try{
    room.game=rules.create({seed:44,first:0});room.broadcast();assert.equal(room.deadline,time+MULLIGAN_MS);
    const start=room.deadline;time+=10000;room.command(room.id,{type:'move',seq:1,action:{type:'mulligan',ids:[]}});assert.equal(room.deadline,start);
    time=start;assert(room.expireClock());assert.equal(room.game.phase,'playing');assert(room.game.players.every(p=>p.mulliganDone));assert.equal(room.deadline,time+TURN_MS);
    const deadline=room.deadline;room.game.players[0].energy=10;time+=1000;
    room.command(room.id,{type:'move',seq:2,action:{type:'power',target:'hero:1'}});assert.equal(room.deadline,deadline);
    time=deadline;const turn=room.game.turnNumber;room.command(room.id,{type:'move',seq:3,action:{type:'end'}});
    assert.equal(room.game.turnNumber,turn+1);assert.equal(room.game.turn,1);assert(errors.at(-1).includes('Time expired'));
    assert.equal(room.deadline,time+TURN_MS);assert(!room.expireClock());
    room.command('guest',{type:'concede',seq:1});assert.equal(room.deadline,null);assert.equal(room.game.winner,0);
  }finally{room.close();}
});
test('disconnect grace survives repeated events, recovery cancels forfeit, expiry awards exactly one winner',t=>{
  t.mock.timers.enable({apis:['setTimeout']});const {room}=table();
  try{
    room.game=rules.create({seed:2,mulligan:false});room.broadcast();const deadline=room.deadline;
    room.disconnected('guest');t.mock.timers.tick(DISCONNECT_MS-1);assert.equal(room.game.phase,'playing');
    room.reconnected('guest');assert(!room.paused);assert.equal(room.deadline,deadline);t.mock.timers.tick(1);assert.equal(room.game.phase,'playing');
    room.disconnected('guest');t.mock.timers.tick(DISCONNECT_MS-1);room.disconnected('guest');t.mock.timers.tick(1);
    assert.equal(room.game.phase,'finished');assert.equal(room.game.winner,0);assert(room.ended);assert(!room.paused);assert.equal(room.deadline,null);
    const revision=room.game.revision;room.settleDisconnect('guest');assert.equal(room.game.revision,revision);rules.assert(room.game);
  }finally{room.close();}
});
test('host leaving awards guest, guest departure sends concession, finished outcomes cannot be overwritten',()=>{
  const {room,packets}=table();room.game=rules.create({seed:3});room.broadcast();room.close();
  const final=packets.findLast(p=>p.type==='snapshot'&&p.game?.phase==='finished');assert.equal(final.game.winner,1);rules.assert(room.game);
  const guest=new BrawlRoom({rules,broker});guest.seat=1;guest.peer='host';guest.view=rules.project(rules.create({seed:7,mulligan:false}),1);
  guest.settleDisconnect('host');assert.equal(guest.view.winner,1);assert.equal(guest.view.phase,'finished');assert.deepEqual(guest.view.legal,[]);
  guest.receive({type:'snapshot',revision:100,members:[],game:rules.project(rules.create({seed:8}),1)});assert.equal(guest.view.phase,'finished');guest.close();
  const finished=new BrawlRoom({rules,broker});finished.view={phase:'finished',winner:0};finished.receive({type:'ended'});assert.equal(finished.view.winner,0);assert(!finished.paused);assert(finished.ended);finished.close();
  const leaving=new BrawlRoom({rules,broker}),sent=[];leaving.view={phase:'playing'};leaving.links.set('host',{dc:{readyState:'open',bufferedAmount:0,send:raw=>sent.push(JSON.parse(raw)),close(){}},pc:{close(){}}});leaving.close();assert.equal(sent[0].type,'concede');
});

test('late reconnection cannot beat a throttled disconnect timer; guest clocks compensate for clock skew',()=>{
  let time=1000;const {room}=table({now:()=>time});
  try{
    room.game=rules.create({seed:55,mulligan:false});room.broadcast();room.disconnected('guest');time+=DISCONNECT_MS;
    room.reconnected('guest');assert.equal(room.game.phase,'finished');assert.equal(room.game.winner,0);
    const guest=new BrawlRoom({rules,broker,now:()=>500000});
    guest.receive({type:'snapshot',revision:1,members:[],game:null,deadline:31000,serverNow:1000});assert.equal(guest.remainingSeconds(),30);assert.equal(guest.remainingMilliseconds(),30000);guest.now=()=>500125;assert.equal(guest.remainingMilliseconds(),29875);assert.equal(guest.remainingSeconds(),30);guest.now=()=>530001;assert.equal(guest.remainingMilliseconds(),0);assert.equal(guest.remainingSeconds(),0);guest.close();
  }finally{room.close();}
});

test('scheduled deadlines automatically keep hands and end turns without another command',t=>{
  t.mock.timers.enable({apis:['setTimeout']});let time=0;const {room}=table({now:()=>time});
  try{
    room.game=rules.create({seed:6,first:0});room.broadcast();time=MULLIGAN_MS;t.mock.timers.tick(MULLIGAN_MS);
    assert.equal(room.game.phase,'playing');assert.equal(room.game.turnNumber,1);
    time+=TURN_MS;t.mock.timers.tick(TURN_MS);assert.equal(room.game.turn,1);assert.equal(room.game.turnNumber,2);
    assert.equal(room.deadline,time+TURN_MS);
  }finally{room.close();}
});
