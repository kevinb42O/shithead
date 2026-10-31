// Menu-only music transport. Fades retarget the current level; interruptions never restart the track.
export function createMenuMusic(){
  let context,gain,buffer,loading,source,offset=0,started=0,pauseTimer=null,active=true,enabled=false,volume=.22,level=0,fadeFrom=0,fadeTo=0,fadeAt=0,fadeLength=0;
  const wanted=()=>enabled&&active&&!document.hidden&&volume>0;
  function current(){if(!context||!fadeLength)return level;const t=Math.max(0,Math.min(1,(context.currentTime-fadeAt)/fadeLength));return fadeFrom+(fadeTo-fadeFrom)*t;}
  function fade(value,seconds){
    const now=context.currentTime,start=current();gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(start,now);gain.gain.linearRampToValueAtTime(value,now+seconds);
    fadeFrom=start;fadeTo=value;fadeAt=now;fadeLength=seconds;level=value;
  }
  function pause(){if(!source)return;offset=(offset+context.currentTime-started)%buffer.duration;try{source.stop();}catch{}source.disconnect();source=null;}
  function graph(){if(context)return;context=new AudioContext({latencyHint:'playback'});gain=context.createGain();gain.gain.value=0;gain.connect(context.destination);}
  async function load(){
    graph();if(!loading)loading=fetch(new URL('assets/audio/hs-menu-music.mp3',import.meta.url)).then(r=>{if(!r.ok)throw Error('Menu music unavailable');return r.arrayBuffer();}).then(data=>context.decodeAudioData(data)).then(decoded=>{buffer=decoded;return decoded;}).catch(()=>{loading=null;return null;});
    return loading;
  }
  function start(){
    if(!wanted()||!buffer||context.state!=='running')return;
    clearTimeout(pauseTimer);pauseTimer=null;
    if(!source){source=context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(gain);started=context.currentTime;source.start(0,offset);}
    fade(volume,.9);
  }
  function sync(immediate=false){
    if(!context){if(wanted())unlock();return;}
    clearTimeout(pauseTimer);pauseTimer=null;
    if(wanted()){unlock();start();}
    else if(immediate){fade(0,0);pause();}
    else{fade(0,.45);pauseTimer=setTimeout(()=>{pauseTimer=null;if(!wanted())pause();},470);}
  }
  function unlock(){
    if(!wanted())return;
    graph();const resumed=context.state==='suspended'?context.resume().catch(()=>{}):Promise.resolve();
    Promise.all([resumed,load()]).then(()=>{if(wanted()&&!source)start();});
  }
  function setEnabled(value){enabled=!!value;sync(!enabled);}
  function setActive(value){active=!!value;sync();}
  function setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));sync();}
  document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
  document.addEventListener('keydown',unlock,{capture:true});
  document.addEventListener('visibilitychange',()=>sync(document.hidden));
  window.addEventListener('pagehide',()=>{enabled=false;sync(true);});
  return{setEnabled,setActive,setVolume,ready:()=>loading||Promise.resolve(),status:()=>({enabled,active,volume,playing:!!source,offset,state:context?.state||'idle',loaded:!!buffer})};
}
