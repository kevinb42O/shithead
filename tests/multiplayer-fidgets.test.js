import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Session, project } from '../dist/multiplayer/session.js';
import { createGame } from '../dist/engine.js';
import { validFidget } from '../dist/multiplayer/fidgets.js';

const state = (kind='dial',phase='move') => ({kind,phase,angle:kind==='press'?0:1.2,velocity:kind==='press'?0:3,pressed:true});
function table(count=4) {
  const sessions=Array.from({length:count},(_,i)=>new Session(`Player ${i}`,()=>{},assert.fail));
  const [host,...guests]=sessions;host.host=true;host.game=createGame(()=>.4,count);
  host.members=sessions.map(s=>({id:s.id,connected:true}));
  const events=sessions.map(()=>[]),wire=[];
  sessions.forEach((s,i)=>{s.members=structuredClone(host.members);s.view=project(host.game,i);s.onFidget=e=>events[i].push(e);});
  for(const guest of guests) {
    const up={dc:{readyState:'open',bufferedAmount:0,send:raw=>{wire.push(JSON.parse(raw));host.command(guest.id,JSON.parse(raw));}}};
    guest.links.set(host.id,up);guest.bind(host.id,up);
    host.links.set(guest.id,{dc:{readyState:'open',bufferedAmount:0,send:raw=>{wire.push(JSON.parse(raw));up.dc.onmessage({data:raw});}}});
  }
  return {sessions,host,events,wire};
}

test('all four seats share each mechanism through the real session dispatcher without changing cards or pending commands',()=>{
  for(let seat=0;seat<4;seat++) for(const kind of ['dial','press','ball']) {
    const {sessions,host,events}=table();
    const before=JSON.stringify(host.game);
    for(const s of sessions){s.busy=true;s.pendingSequence=123;}
    assert.equal(sessions[seat].interactFidget(state(kind,'start')),true);
    events.forEach(e=>{assert.equal(e.length,1);assert.equal(e[0].sender,sessions[seat].id);assert.equal(e[0].kind,kind);assert.deepEqual(e,events[0]);});
    assert.equal(JSON.stringify(host.game),before);assert.equal(host.revision,0);
    sessions.forEach(s=>{assert.equal(s.busy,true);assert.equal(s.pendingSequence,123);assert.equal(s.sequence,0);});
    assert(!JSON.stringify(host.snapshot(1)).includes('fidget'));
  }
});

test('intermediate frames are bounded per sender/mechanism while immediate release and final position are preserved',()=>{
  const {host,sessions,events}=table();const peer=sessions[1].id;
  assert(host.receiveFidget(peer,state()));
  for(let i=0;i<100;i++)assert.equal(host.receiveFidget(peer,state()),false);
  assert(host.receiveFidget(peer,state('ball')));
  assert(host.receiveFidget(sessions[2].id,state()));
  assert(host.receiveFidget(peer,{...state(),phase:'release',pressed:false}));
  assert(host.receiveFidget(peer,{...state(),phase:'settle',pressed:false,velocity:0,angle:2.4}));
  assert.equal(events[0].length,5);assert.equal(events[0].at(-1).angle,2.4);
});

test('authority rejects forged senders, malformed movement, disconnected/paused/closed tables and stale effects',()=>{
  const {host,sessions,events}=table();const peer=sessions[1].id;
  assert.equal(host.receiveFidget('outsider',state()),false);
  for(const patch of [{kind:'forge'},{phase:'play'},{angle:NaN},{angle:Infinity},{angle:-1},{angle:7},{velocity:23},{velocity:'3'},{pressed:1},{phase:'release'},{kind:'press',angle:1}]) {
    assert.equal(validFidget({...state(),...patch}),false);
    assert.equal(host.receiveFidget(peer,{...state(),...patch}),false);
  }
  assert(host.receiveFidget(peer,state()));const effect={...events[0][0]};
  sessions.forEach(s=>assert.equal(s.deliverFidget(effect),false));
  host.members[1].connected=false;assert.equal(host.receiveFidget(peer,state('ball')),false);
  host.members[1].connected=true;host.paused=true;assert.equal(host.receiveFidget(peer,state('ball')),false);
  host.paused=false;host.closed=true;assert.equal(host.receiveFidget(peer,state('ball')),false);
  sessions[2].ended=true;assert.equal(sessions[2].interactFidget(state()),false);
});

test('network backpressure does not lock a card action or change authoritative state',()=>{
  const {sessions}=table(2);const guest=sessions[1];
  guest.links.values().next().value.dc.bufferedAmount=65536;
  assert.equal(guest.interactFidget(state()),false);
  assert.equal(guest.busy,false);assert.equal(guest.pendingSequence,0);
});
