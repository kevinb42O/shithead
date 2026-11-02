// Records actual browser frames; the output is review evidence, not game media.
import {mkdir,writeFile} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';
const legend=process.argv[2]||'vesper';
if(!['vesper','mordren','orun','nox'].includes(legend))throw Error('Choose vesper, mordren, orun or nox');
const out=`artifacts/tavern-brawl/${legend}/motion-frames`,browser=await launch();await mkdir(out,{recursive:true});
try{
  const page=await browser.page();await page.viewport(1120,700);
  await page.navigate(`http://localhost:5173/brawl-motion-review.html?legend=${legend}`);await page.wait('window.signatureReview');
  await page.evaluate(`(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));})()`);
  const frames=[],writes=[];
  page.on('Page.screencastFrame',event=>{
    const file=`frame-${String(frames.length).padStart(4,'0')}.jpg`;
    frames.push({file,timestamp:event.metadata.timestamp});writes.push(writeFile(`${out}/${file}`,Buffer.from(event.data,'base64')));
    return page.call('Page.screencastFrameAck',{sessionId:event.sessionId});
  });
  await page.call('Page.startScreencast',{format:'jpeg',quality:85,maxWidth:960,maxHeight:600,everyNthFrame:2});
  await sleep(100);await page.evaluate('signatureReview.replay()');await sleep(legend==='nox'?3000:legend==='orun'?2750:2300);
  await page.call('Page.stopScreencast');await Promise.all(writes);
  if(frames.length<8)throw Error(`Insufficient motion frames: ${frames.length}`);
  await writeFile(`${out}/frames.json`,JSON.stringify({legend,note:'Actual browser screencast, no audio; capture overhead is not an FPS benchmark',frames},null,2)+'\n');
  console.log(`Recorded ${frames.length} ${legend} frames in ${out}`);
}finally{await browser.close();}
