import {MqttWsSignalingClient} from '../multiplayer/signaling.js';
import {HEROES} from './engine.js';
const TABLES='tavern-brawl/v3/tables',DISCOVER='tavern-brawl/v3/discover';
const clean=value=>String(value||'Guest').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,24)||'Guest';
const validRoom=value=>typeof value==='string'&&/^[a-zA-Z0-9-]{1,64}$/.test(value);
export const TURN_MS=30000,MULLIGAN_MS=45000,DISCONNECT_MS=15000;
const randomSeed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
export class BrawlDirectory {
  constructor(onChange,onError){this.onChange=onChange;this.onError=onError;this.tables=new Map();this.broker=new MqttWsSignalingClient();this.closed=false;}
  async open(){
    this.broker.subscribe(TABLES,raw=>{try{const m=JSON.parse(raw);if(!validRoom(m.room)||!Number.isFinite(m.at)||Math.abs(Date.now()-m.at)>30000)return;if(m.closed||m.playing||m.count!==1)this.tables.delete(m.room);else this.tables.set(m.room,{room:m.room,name:clean(m.name),hero:HEROES[m.hero]?m.hero:'fox',at:m.at});this.onChange();}catch{}});
    await this.broker.connect();if(this.closed)return;
    this.refresh();this.tick=setInterval(()=>{for(const [key,m]of this.tables)if(Date.now()-m.at>15000)this.tables.delete(key);this.refresh();this.onChange();},4000);this.onChange();
  }
  refresh(){this.broker.publish(DISCOVER,'{}');}
  close(){this.closed=true;clearInterval(this.tick);this.broker.close();}
}
export class BrawlRoom {
  constructor({rules,hero='fox',name='Guest',deck,onChange=()=>{},onError=()=>{},broker,now=()=>Date.now()}={}){
    this.now=now;this.clockOffset=0;this.deadline=null;this.clockKey=null;this.disconnectTimers=new Map();this.disconnectDeadlines=new Map();
    this.rules=rules;this.hero=HEROES[hero]?hero:'fox';this.name=clean(name);this.deck=rules.validateDeck(deck,this.hero)?[...deck]:[...rules.featuredDecks[this.hero]];
    this.onChange=onChange;this.onError=onError;this.broker=broker||new MqttWsSignalingClient();this.id=crypto.randomUUID();this.members=[];this.links=new Map();this.lastSequences=new Map();this.sequence=0;this.revision=0;this.pending=0;this.busy=false;this.paused=false;this.ended=false;this.closed=false;this.view=null;this.game=null;this.host=false;this.message='Connecting to the tavern…';
  }
  async open(room){
    if(room&&!validRoom(room))throw Error('That invitation is not valid.');
    this.room=room||crypto.randomUUID();this.host=!room;this.seat=this.host?0:1;this.topic=`tavern-brawl/v3/rooms/${this.room}`;
    if(this.host)this.members=[{id:this.id,name:this.name,hero:this.hero,ready:false,connected:true,deck:[...this.deck]}];
    this.broker.subscribe(this.topic,raw=>{if(typeof raw!=='string'||raw.length>24000)return;try{const m=JSON.parse(raw);if(m.room===this.room&&m.id!==this.id)this.signal(m).catch(e=>this.onError(e.message));}catch{}});
    if(this.host)this.broker.subscribe(DISCOVER,()=>this.announce());
    await this.broker.connect();if(this.closed)return;
    this.message=this.host?'Your table is open. Invite a friend or wait for a challenger.':'Looking for the host…';
    const pulse=()=>{if(this.host)this.announce();else if(!this.connected)this.publish({type:'join',name:this.name,hero:this.hero,rulesVersion:this.rules.version,fingerprint:this.rules.fingerprint});};pulse();this.tick=setInterval(pulse,2500);
    this.connectTimeout=setTimeout(()=>{if(!this.connected&&!this.host){this.message='The host could not be reached. Check the invite or try another table. Some networks need a TURN relay.';this.onError(this.message);}},35000);this.onChange();
  }
  get connected(){return this.host||[...this.links.values()].some(l=>l.dc?.readyState==='open');}
  announce(closed=false){if(this.host&&!this.closed)this.broker.publish(TABLES,JSON.stringify({room:this.room,name:this.name,hero:this.hero,count:this.members.length,playing:!!this.game,rulesVersion:this.rules.version,fingerprint:this.rules.fingerprint,closed,at:Date.now()}));}
  publish(message){if(!this.closed)this.broker.publish(this.topic,JSON.stringify({...message,rulesVersion:this.rules.version,fingerprint:this.rules.fingerprint,id:this.id,room:this.room}));}
  async signal(m){
    if(this.closed||typeof m.id!=='string'||m.id.length>64)return;
    if(this.host&&m.type==='join'){
      if(m.rulesVersion!==this.rules.version||m.fingerprint!==this.rules.fingerprint){this.publish({type:'reject',to:m.id,reason:'version'});return;}
      let l=this.links.get(m.id);
      if(l){if(l.offer)this.publish({type:'offer',to:m.id,description:l.offer});for(const candidate of l.candidates)this.publish({type:'ice',to:m.id,candidate});return;}
      if(this.members.length>=2||this.game){this.publish({type:'reject',to:m.id});return;}
      l=this.link(m.id);const hero=HEROES[m.hero]?m.hero:'fox';this.members.push({id:m.id,name:clean(m.name),hero,ready:false,connected:false,deck:[...this.rules.featuredDecks[hero]]});
      l.dc=l.pc.createDataChannel('tavern-brawl-v3');this.bind(m.id,l);await l.pc.setLocalDescription(await l.pc.createOffer());l.offer=l.pc.localDescription.toJSON();this.publish({type:'offer',to:m.id,description:l.offer});this.broadcast();
    }else if(!this.host&&m.type==='offer'&&m.to===this.id){
      if(m.rulesVersion!==this.rules.version||m.fingerprint!==this.rules.fingerprint){this.onError('This table uses another card set. Reload both games.');return;}
      if(this.peer&&this.peer!==m.id)return;this.peer=m.id;let l=this.links.get(m.id)||this.link(m.id);
      if(l.answer){this.publish({type:'answer',to:m.id,description:l.answer});for(const candidate of l.candidates)this.publish({type:'ice',to:m.id,candidate});return;}
      if(l.negotiating)return;l.negotiating=true;await l.pc.setRemoteDescription(m.description);await this.flush(l);await l.pc.setLocalDescription(await l.pc.createAnswer());l.answer=l.pc.localDescription.toJSON();this.publish({type:'answer',to:m.id,description:l.answer});
    }else if(this.host&&m.type==='answer'&&m.to===this.id){const l=this.links.get(m.id);if(l?.pc.signalingState==='have-local-offer'){await l.pc.setRemoteDescription(m.description);await this.flush(l);}}
    else if(m.type==='ice'&&m.to===this.id&&typeof m.candidate?.candidate==='string'&&m.candidate.candidate.length<4096){const l=this.links.get(m.id);if(l&&l.pending.length<100){l.pending.push(m.candidate);await this.flush(l);}}
    else if(m.type==='reject'&&m.to===this.id){this.message=m.reason==='version'?'This table uses another card set. Reload both games.':'This table is full or the duel has already started.';this.onError(this.message);}
  }
  async flush(l){if(l.pc.remoteDescription)while(l.pending.length)try{await l.pc.addIceCandidate(l.pending.shift());}catch{}}
  link(peer){
    const pc=new RTCPeerConnection({iceServers:globalThis.SHITHEAD_ICE_SERVERS||[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'}]});
    const l={pc,candidates:[],pending:[]};this.links.set(peer,l);
    l.timeout=setTimeout(()=>{if(l.dc?.readyState!=='open'){pc.close();this.disconnected(peer);}},35000);
    pc.onicecandidate=e=>{if(e.candidate){const candidate=e.candidate.toJSON();l.candidates.push(candidate);this.publish({type:'ice',to:peer,candidate});}};
    pc.ondatachannel=e=>{if(e.channel.label!=='tavern-brawl-v3'){e.channel.close();return;}l.dc=e.channel;this.bind(peer,l);};
    pc.onconnectionstatechange=()=>{if(this.closed)return;if(pc.connectionState==='disconnected'){this.disconnected(peer);}else if(pc.connectionState==='connected'&&l.dc?.readyState==='open'){this.reconnected(peer);}else if(['failed','closed'].includes(pc.connectionState))this.disconnected(peer);};
    return l;
  }
  bind(peer,l){
    l.dc.onopen=()=>{clearTimeout(l.timeout);clearTimeout(this.connectTimeout);this.reconnected(peer);this.message=this.game?'':'Choose Ready when you are seated.';if(!this.host)this.act('configure',{hero:this.hero,deck:this.deck});this.broadcast();this.onChange();};
    l.dc.onclose=()=>this.disconnected(peer);
    l.dc.onmessage=e=>{if(typeof e.data!=='string'||e.data.length>65536)return;try{const m=JSON.parse(e.data);if(this.host)this.command(peer,m);else this.receive(m);}catch{}};
  }
  receive(m){
    if(this.closed||!m||typeof m!=='object')return;
    if(this.ended&&m.type==='snapshot')return;
    if(m.type==='snapshot'&&Number.isSafeInteger(m.revision)&&m.revision>=this.revision){
      if(!Array.isArray(m.members)||m.members.length>2)return;
      this.revision=m.revision;this.members=m.members;this.view=m.game;if(Number.isFinite(m.serverNow))this.clockOffset=m.serverNow-this.now();this.deadline=Number.isFinite(m.deadline)?m.deadline:null;this.ended=!!m.ended;this.paused=!!m.paused;this.message=String(m.message||'').slice(0,240);
      if(m.ack>=this.pending)this.clearPending();this.onChange();
    }else if(m.type==='error'){if(m.ack===this.pending)this.clearPending();this.onError(String(m.message||'That move could not be made.'));this.onChange();}
    else if(m.type==='ended'){this.settleDisconnect(this.peer);}
  }
  send(l,message){if(l?.dc?.readyState!=='open'||l.dc.bufferedAmount>65536)return false;try{l.dc.send(JSON.stringify(message));return true;}catch{return false;}}
  snapshot(seat){return {type:'snapshot',rulesVersion:this.rules.version,fingerprint:this.rules.fingerprint,revision:this.revision,ack:this.lastSequences.get(this.members[seat]?.id)||0,members:this.members.map(({id,name,hero,ready,connected})=>({id,name,hero,ready,connected})),game:this.game?this.rules.project(this.game,seat):null,paused:this.paused,ended:this.ended,deadline:this.deadline,serverNow:this.now(),message:this.message};}
  broadcast(){if(!this.host||this.closed)return;this.syncClock();this.revision++;this.view=this.game?this.rules.project(this.game,0):null;for(let seat=1;seat<this.members.length;seat++)this.send(this.links.get(this.members[seat].id),this.snapshot(seat));this.onChange();}
  clearPending(){this.busy=false;clearTimeout(this.commandTimeout);}
  act(type,data={}){
    if(this.closed||this.ended||this.busy)return false;const message={type,...data,seq:++this.sequence};
    if(this.host){this.command(this.id,message);return true;}
    this.busy=true;this.pending=message.seq;
    if(![...this.links.values()].some(l=>this.send(l,message))){this.clearPending();this.onError('Not connected. Wait for the host or return to the tavern.');return false;}
    this.commandTimeout=setTimeout(()=>{for(const l of this.links.values())this.send(l,{type:'resync'});this.onError('Waiting for the host to confirm. The table will unlock when it is synchronized.');},8000);this.onChange();return true;
  }
  command(peer,m){
    if(!this.host||this.closed||!m||typeof m!=='object')return;
    const seat=this.members.findIndex(p=>p.id===peer);if(seat<0)return;
    if(m.type==='resync'){this.send(this.links.get(peer),this.snapshot(seat));return;}
    if(!Number.isSafeInteger(m.seq)||m.seq<1)return;
    if(m.seq<=(this.lastSequences.get(peer)||0)){this.send(this.links.get(peer),this.snapshot(seat));return;}
    this.lastSequences.set(peer,m.seq);
    const reject=message=>{if(peer===this.id)this.onError(message);else this.send(this.links.get(peer),{type:'error',ack:m.seq,message});};
    for(const [id,deadline]of this.disconnectDeadlines)if(this.now()>=deadline){this.settleDisconnect(id);return reject('The connection grace period expired.');}
    if(m.type==='move'&&this.expireClock())return reject('Time expired. Check the current turn before moving.');
    if(m.type==='configure'&&!this.game){if(!this.rules.validateDeck(m.deck,m.hero))return reject('Choose a legal twenty-card deck.');Object.assign(this.members[seat],{hero:m.hero,deck:[...m.deck],ready:false});}
    else if(m.type==='ready'&&!this.game&&this.members[seat].connected)this.members[seat].ready=m.ready===true;
    else if((m.type==='start'||m.type==='rematch')&&seat===0&&(!this.game||this.game.phase==='finished')&&!this.paused&&this.members.length===2&&this.members.every(p=>p.connected&&(m.type==='rematch'||p.ready))){
      const seed=randomSeed();this.game=this.rules.create({heroes:this.members.map(p=>p.hero),names:this.members.map(p=>p.name),deckLists:this.members.map(p=>p.deck),seed,id:crypto.randomUUID()});this.message='Choose your starting hand.';
    }else if(m.type==='move'&&this.game&&!this.paused&&this.members.every(p=>p.connected)){
      const result=this.rules.apply(this.game,seat,m.action);if(!result.ok)return reject(result.error);this.game=result.state;this.message='';
    }else if(m.type==='concede'&&this.game&&this.game.phase!=='finished'){
      this.game=structuredClone(this.game);this.game.choice=null;this.game.phase='finished';this.game.winner=1-seat;this.game.revision++;this.game.events=[{id:++this.game.eventId,type:'finish',winner:1-seat,reason:'concede'}];this.game.log.unshift(`${this.members[seat].name} concedes.`);
    }else return reject('That action is not available at this table.');
    this.broadcast();this.announce();
  }
  remainingMilliseconds(){return this.deadline===null?0:Math.max(0,this.deadline-this.now()-(this.host?0:this.clockOffset));}
  remainingSeconds(){return Math.ceil(this.remainingMilliseconds()/1000);}
  syncClock(){
    if(!this.host)return;
    const g=this.game,key=g&&g.phase!=='finished'?`${g.id}:${g.phase}:${g.turnNumber}`:null;
    if(key===this.clockKey)return;
    clearTimeout(this.clockTimer);this.clockKey=key;this.deadline=null;
    if(!key)return;
    this.deadline=this.now()+(g.phase==='mulligan'?MULLIGAN_MS:TURN_MS);
    this.armClock();
  }
  armClock(){
    clearTimeout(this.clockTimer);
    if(this.closed||this.deadline===null)return;
    this.clockTimer=setTimeout(()=>{if(!this.expireClock())this.armClock();},Math.max(1,this.deadline-this.now()));this.clockTimer.unref?.();
  }
  expireClock(){
    if(!this.host||this.closed||!this.game||this.game.phase==='finished'||this.deadline===null||this.now()<this.deadline)return false;
    const g=this.game;
    if(g.phase==='mulligan'){
      for(let seat=0;seat<2;seat++)if(!this.game.players[seat].mulliganDone){const result=this.rules.apply(this.game,seat,{type:'mulligan',ids:[]});if(result.ok)this.game=result.state;}
    }else{
      if(g.choice){const choice=this.rules.apply(this.game,g.turn,{type:'choose',uid:g.choice.options[0]});if(choice.ok)this.game=choice.state;}
      if(this.game.phase!=='finished'){const result=this.rules.apply(this.game,g.turn,{type:'end'});if(result.ok)this.game=result.state;}
    }
    this.message='';this.broadcast();return true;
  }
  reconnected(peer){
    if(this.closed||this.ended)return;
    if(this.disconnectDeadlines.has(peer)&&this.now()>=this.disconnectDeadlines.get(peer)){this.settleDisconnect(peer);return;}
    clearTimeout(this.disconnectTimers.get(peer));this.disconnectTimers.delete(peer);this.disconnectDeadlines.delete(peer);
    const member=this.members.find(m=>m.id===peer);if(member)member.connected=true;
    this.paused=false;this.message='';this.broadcast();this.onChange();
  }
  finishForfeit(winner,message){
    const state=this.host?this.game:this.view;
    if(state&&state.phase!=='finished'){
      const next=structuredClone(state);next.choice=null;next.phase='finished';next.winner=winner;next.revision++;
      next.events=[{id:++next.eventId,type:'finish',winner,reason:'forfeit'}];next.log.unshift(message);
      if(this.host)this.game=next;else{next.legal=[];this.view=next;}
    }
    clearTimeout(this.clockTimer);this.deadline=null;
    for(const timer of this.disconnectTimers.values())clearTimeout(timer);this.disconnectTimers.clear();this.disconnectDeadlines.clear();
    this.ended=true;this.paused=false;this.message=message;this.clearPending();this.broadcast();this.onChange();
  }
  settleDisconnect(peer){
    if(this.closed||this.ended)return;
    if((this.host?this.game:this.view)?.phase==='finished'){this.ended=true;this.paused=false;this.deadline=null;this.clearPending();this.onChange();return;}
    const seat=this.host?this.members.findIndex(m=>m.id===peer):0;
    if(seat<0)return;
    this.finishForfeit(1-seat,this.host?'Your opponent disconnected. You win by forfeit.':'The host disconnected. You win by forfeit.');
  }
  disconnected(peer){
    if(this.closed||this.ended)return;clearTimeout(this.links.get(peer)?.timeout);
    const member=this.members.find(p=>p.id===peer);if(member)member.connected=false;
    if(this.host&&!this.game){this.members=this.members.filter(p=>p.id!==peer);this.links.delete(peer);this.message='Your table is open. Waiting for a challenger.';}
    else if((this.host?this.game:this.view)?.phase==='finished'){this.ended=true;this.paused=false;this.clearPending();}
    else{
      this.paused=true;this.message='Connection interrupted. Reconnect within 15 seconds or forfeit. The turn clock keeps running.';this.clearPending();
      if(!this.disconnectTimers.has(peer)){const timer=setTimeout(()=>this.settleDisconnect(peer),DISCONNECT_MS);timer.unref?.();this.disconnectTimers.set(peer,timer);this.disconnectDeadlines.set(peer,this.now()+DISCONNECT_MS);}
    }
    this.broadcast();this.onChange();
  }
  close(){
    if(this.closed)return;
    if(this.host){
      if(this.game?.phase!=='finished'&&this.game)this.finishForfeit(1,'The host left the table. The guest wins by forfeit.');
      this.announce(true);for(const l of this.links.values())this.send(l,{type:'ended'});
    }else if(this.view&&this.view.phase!=='finished')for(const l of this.links.values())this.send(l,{type:'concede',seq:++this.sequence});
    this.closed=true;this.clearPending();clearTimeout(this.clockTimer);for(const timer of this.disconnectTimers.values())clearTimeout(timer);this.disconnectTimers.clear();this.disconnectDeadlines.clear();
    clearInterval(this.tick);clearTimeout(this.connectTimeout);this.broker.close();for(const l of this.links.values()){clearTimeout(l.timeout);l.dc?.close();l.pc.close();}this.links.clear();
  }
}
