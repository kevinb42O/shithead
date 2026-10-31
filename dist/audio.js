// Actual Hearthstone audio. Source filenames and Blizzard ownership are recorded in assets/audio/manifest.json.
export const SOUND_PALETTE={
  "select": {
    "files": [
      "hs-card-select"
    ],
    "gain": 0.45,
    "bus": "foley",
    "gap": 65
  },
  "slide": {
    "files": [
      "hs-card-draw-1",
      "hs-card-draw-2"
    ],
    "gain": 0.38,
    "bus": "foley",
    "gap": 80
  },
  "place": {
    "files": [
      "hs-card-drop"
    ],
    "gain": 0.5,
    "bus": "foley",
    "gap": 70
  },
  "slap": {
    "files": [
      "hs-card-play-1",
      "hs-card-play-2"
    ],
    "gain": 0.68,
    "bus": "foley",
    "gap": 85
  },
  "deal": {
    "files": [
      "hs-card-deal"
    ],
    "gain": 0.35,
    "bus": "foley",
    "gap": 90
  },
  "gather": {
    "files": [
      "hs-card-gather"
    ],
    "gain": 0.5,
    "bus": "foley",
    "gap": 100
  },
  "pickup": {
    "files": [
      "hs-card-gather"
    ],
    "gain": 0.5,
    "bus": "foley",
    "gap": 250
  },
  "return": {
    "files": [
      "hs-card-return"
    ],
    "gain": 0.4,
    "bus": "foley",
    "gap": 150
  },
  "shuffle": {
    "files": [
      "hs-card-shuffle"
    ],
    "gain": 0.45,
    "bus": "foley",
    "gap": 1000
  },
  "hover": {
    "files": [
      "hs-hover"
    ],
    "gain": 0.12,
    "bus": "ui",
    "gap": 180
  },
  "click": {
    "files": [
      "hs-click",
      "hs-click-2"
    ],
    "gain": 0.38,
    "bus": "ui",
    "gap": 85
  },
  "open": {
    "files": [
      "hs-open"
    ],
    "gain": 0.35,
    "bus": "ui",
    "gap": 180
  },
  "close": {
    "files": [
      "hs-close",
      "hs-back"
    ],
    "gain": 0.33,
    "bus": "ui",
    "gap": 180
  },
  "back": {
    "files": [
      "hs-back"
    ],
    "gain": 0.36,
    "bus": "ui",
    "gap": 120
  },
  "confirm": {
    "files": [
      "hs-confirm"
    ],
    "gain": 0.4,
    "bus": "ui",
    "gap": 150
  },
  "reject": {
    "files": [
      "hs-reject"
    ],
    "gain": 0.45,
    "bus": "ui",
    "gap": 250
  },
  "on": {
    "files": [
      "hs-toggle-on"
    ],
    "gain": 0.4,
    "bus": "ui",
    "gap": 100
  },
  "off": {
    "files": [
      "hs-toggle-off"
    ],
    "gain": 0.35,
    "bus": "ui",
    "gap": 100
  },
  "turn": {
    "files": [
      "hs-turn"
    ],
    "gain": 0.32,
    "bus": "event",
    "gap": 1000
  },
  "spin": {
    "files": [
      "hs-coin-flip"
    ],
    "gain": 0.4,
    "bus": "foley",
    "gap": 700
  },
  "chosen": {
    "files": [
      "hs-coin-drop"
    ],
    "gain": 0.4,
    "bus": "foley",
    "gap": 400
  },
  "frost": {
    "files": [
      "hs-frost"
    ],
    "gain": 0.48,
    "bus": "event",
    "gap": 500
  },
  "reverse": {
    "files": [
      "hs-wind"
    ],
    "gain": 0.42,
    "bus": "event",
    "gap": 500
  },
  "free": {
    "files": [
      "hs-free"
    ],
    "gain": 0.38,
    "bus": "event",
    "gap": 500
  },
  "joker": {
    "files": [
      "hs-arcane"
    ],
    "gain": 0.36,
    "bus": "event",
    "gap": 500
  },
  "heartbeat": {
    "files": [
      "hs-tension"
    ],
    "gain": 0.25,
    "bus": "event",
    "gap": 400
  },
  "dread": {
    "files": [
      "hs-fizzle"
    ],
    "gain": 0.4,
    "bus": "event",
    "gap": 500
  },
  "relief": {
    "files": [
      "hs-relief"
    ],
    "gain": 0.4,
    "bus": "event",
    "gap": 500
  },
  "win": {
    "files": [
      "hs-victory"
    ],
    "gain": 0.6,
    "bus": "event",
    "gap": 3000
  },
  "lose": {
    "files": [
      "hs-defeat"
    ],
    "gain": 0.5,
    "bus": "event",
    "gap": 3000
  },
  "escape": {
    "files": [
      "hs-reward"
    ],
    "gain": 0.42,
    "bus": "event",
    "gap": 1500
  },
  "reward": {
    "files": [
      "hs-reward"
    ],
    "gain": 0.48,
    "bus": "event",
    "gap": 1500
  },
  "coins": {
    "files": [
      "hs-coin-drop"
    ],
    "gain": 0.4,
    "bus": "foley",
    "gap": 200
  },
  "phase": {
    "files": [
      "hs-page"
    ],
    "gain": 0.4,
    "bus": "event",
    "gap": 400
  },
  "page": {
    "files": [
      "hs-page"
    ],
    "gain": 0.42,
    "bus": "ui",
    "gap": 120
  },
  "burn": {
    "files": [
      "hs-hellfire"
    ],
    "gain": 0.6,
    "bus": "event",
    "gap": 1200
  }
};
const aliases={tap:"place",flick:"select",draw:"slide"};
export function createGameAudio(){
  let context,master,compressor,loading,enabled=false,volume=.7,epoch=0;
  const buffers=new Map(),buses={},voices=new Set(),last=new Map(),previous=new Map(),timers=new Set();
  function createContext(){
    const AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!AudioContextClass)return null;
    try{return new AudioContextClass({latencyHint:'interactive'});}
    catch{try{return new AudioContextClass();}catch{return null;}}
  }
  function graph(){
    if(context)return context;
    context=createContext();if(!context)return null;
    master=context.createGain();master.gain.value=enabled?volume:0;
    compressor=context.createDynamicsCompressor();compressor.threshold.value=-7;compressor.knee.value=9;compressor.ratio.value=2.5;compressor.attack.value=.003;compressor.release.value=.15;
    master.connect(compressor);compressor.connect(context.destination);
    for(const bus of ['foley','ui','event']){buses[bus]=context.createGain();buses[bus].connect(master);}
    return context;
  }
  async function preload(){
    if(!graph())return[];if(loading)return loading;
    const files=[...new Set(Object.values(SOUND_PALETTE).flatMap(s=>s.files))];
    loading=Promise.allSettled(files.map(async name=>{
      const response=await fetch(new URL(`assets/audio/${name}.mp3`,import.meta.url));
      if(!response.ok)throw Error(`Audio unavailable: ${name}`);
      const buffer=await context.decodeAudioData(await response.arrayBuffer());buffers.set(name,buffer);
    }));return loading;
  }
  function unlock(){if(!enabled)return;const audio=graph();if(!audio)return;if(audio.state!=='running')audio.resume().catch(()=>{});preload();}
  function stop(){epoch++;for(const t of timers)clearTimeout(t);timers.clear();for(const voice of voices){try{voice.source.stop();}catch{}}voices.clear();last.clear();}
  function setEnabled(value){
    enabled=!!value;stop();if(!enabled){if(master)master.gain.setValueAtTime(0,context.currentTime);return;}
    unlock();if(master)master.gain.setTargetAtTime(volume,context.currentTime,.012);
  }
  function setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));if(master)master.gain.setTargetAtTime(enabled?volume:0,context.currentTime,.015);}
  function choose(files,key){let index=Math.floor(Math.random()*files.length);if(files.length>1&&index===previous.get(key))index=(index+1)%files.length;previous.set(key,index);return files[index];}
  function sample(name,{gain=.4,bus='foley',delay=0,rate=1,fixed=(bus==='event'),pan=0,duration}={}){
    const buffer=buffers.get(name);if(!buffer||!enabled||document.hidden||!context||context.state!=='running')return false;
    if(voices.size>=20){const oldest=[...voices].find(v=>v.bus==='ui')||voices.values().next().value;try{oldest.source.stop();}catch{}voices.delete(oldest);}
    const source=context.createBufferSource(),level=context.createGain(),panner=context.createStereoPanner();
    source.buffer=buffer;source.playbackRate.value=rate;source.detune.value=fixed?0:(Math.random()-.5)*45;
    panner.pan.value=Math.max(-.55,Math.min(.55,pan+(fixed?0:(Math.random()-.5)*.06)));
    const at=context.currentTime+delay,length=Math.min(duration??buffer.duration/rate,buffer.duration/rate);
    level.gain.setValueAtTime(0,at);level.gain.linearRampToValueAtTime(gain,at+.003);level.gain.setValueAtTime(gain,at+Math.max(.004,length-.04));level.gain.linearRampToValueAtTime(0,at+length);
    source.connect(level);level.connect(panner);panner.connect(buses[bus]);
    const voice={source,bus};voices.add(voice);source.onended=()=>{voices.delete(voice);source.disconnect();level.disconnect();panner.disconnect();};
    source.start(at);source.stop(at+length+.01);return true;
  }
  function play(kind,options={}){
    kind=aliases[kind]||kind;if(!enabled||document.hidden)return false;unlock();
    const now=performance.now(),gap=SOUND_PALETTE[kind]?.gap??80;
    if(now-(last.get(kind)??-Infinity)<gap)return false;last.set(kind,now);
    const definition=SOUND_PALETTE[kind];if(!definition)return false;
    if(kind==='win'||kind==='lose'||kind==='burn'||kind==='escape'||kind==='reward')duck();
    if(kind==='slap'&&(options.count||1)>1){
      const count=Math.min(4,Math.max(1,options.count));
      options={...options,gain:Math.min(.8,definition.gain+(count-1)*.035)};
      for(let i=1;i<count;i++){
        const stagger=i*(count===4?36:44);
        const hitGain=Math.min(.8,definition.gain+i*.03);
        const t=setTimeout(()=>{timers.delete(t);if(enabled&&!document.hidden)sample(choose(definition.files,kind),{...definition,...options,gain:hitGain,fixed:false});},stagger);
        timers.add(t);
      }
    }
    if(kind==='coins'&&options.shower){
      for(let i=1;i<=3;i++){
        const stagger=i*70;
        const panJitter=(Math.random()-.5)*.2;
        const t=setTimeout(()=>{timers.delete(t);if(enabled&&!document.hidden)sample(choose(definition.files,kind),{...definition,...options,gain:definition.gain*(1-i*.12),pan:(options.pan||0)+panJitter,fixed:false});},stagger);
        timers.add(t);
      }
    }
    return sample(choose(definition.files,kind),{...definition,...options});
  }
  function duck(){if(!context)return;for(const name of ['ui','foley']){const gain=buses[name].gain,t=context.currentTime;gain.cancelScheduledValues(t);gain.setValueAtTime(.5,t);gain.setTargetAtTime(1,t+.65,.18);}}
  document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
  document.addEventListener('keydown',unlock,{capture:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(master)master.gain.setValueAtTime(0,context.currentTime);}else if(master){if(enabled&&context.state!=='running')context.resume().catch(()=>{});master.gain.setTargetAtTime(enabled?volume:0,context.currentTime,.015);}});
  window.addEventListener('pagehide',stop);
  function attachUI(){
    let lastCardHover=null;
    document.addEventListener('pointerover',event=>{
      if(event.pointerType==='touch')return;
      const card=event.target.closest('button.card');
      if(card&&!card.disabled&&!card.closest('[inert]')){
        const cardId=card.dataset.cardId||card.id;
        if(cardId&&cardId!==lastCardHover){
          lastCardHover=cardId;
          play('hover',{gain:0.08,fixed:false});
        }
        return;
      }
      const node=event.target.closest('button,a,input[type=radio],.rules-tab-btn');
      if(!node||node.disabled||node.contains(event.relatedTarget)||node.matches('.card,#play')||node.closest('[inert]'))return;
      lastCardHover=null;
      play('hover');
    },{passive:true});
    document.addEventListener('pointerout',event=>{
      if(!event.relatedTarget?.closest('button.card'))lastCardHover=null;
    },{passive:true});
    document.addEventListener('click',event=>{
      const node=event.target.closest('button,a,input');
      if(!node||node.disabled||node.matches('.card,#sound,#menu-sound,#mobile-sound,#option-sound,#option-volume,#option-music,#option-music-volume')||node.closest('#selection-tools'))return;
      const id=node.id;
      const kind=node.matches('.rules-tab-btn')?'page':
        node.matches('.close-dialog,.close-rules')||/cancel/.test(id)?'close':
        /back/.test(id)?'back':
        /deal-selected|refill-coins/.test(id)||node.matches('input[name=stake]')?'coins':
        /confirm|menu-resume|ace-/.test(id)?'confirm':
        /rules|options|credits|history|menu-btn/.test(id)?'open':'click';
      play(kind);
    },true);
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.querySelector('dialog[open]'))play('close');});
  }
  return{play,stop,setEnabled,setVolume,preload,attachUI,ready:()=>loading||Promise.resolve(),status:()=>({enabled,volume,loaded:buffers.size,voices:voices.size,state:context?.state||'idle',epoch})};
}
