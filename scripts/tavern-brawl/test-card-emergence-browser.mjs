import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';
const browser=await launch(),out='artifacts/tavern-brawl/card-emergence';await mkdir(out,{recursive:true});
try{
  const page=await browser.page();await page.call('Page.addScriptToEvaluateOnNewDocument',{source:`const nativeTimeout=window.setTimeout.bind(window);window.setTimeout=(fn,delay,...args)=>nativeTimeout(fn,[1450,1850,2100,2400].includes(delay)?600000:delay,...args);`});
  await page.navigate('http://localhost:5173/brawl-motion-review.html');await page.wait('window.signatureReview');
  const report={cases:[]};
  for(const [w,h,name]of [[1440,900,'desktop'],[390,844,'phone']]){
    await page.viewport(w,h);await sleep(150);
    for(const legend of ['mordren','vesper','orun','nox'])for(const seat of [0,1])for(const slot of [0,1,2]){
      const result=await page.evaluate(`(()=>{signatureReview.setLegend('${legend}');signatureReview.setSeat(${seat});signatureReview.setSlot(${slot});signatureReview.replay();const actor=document.querySelector('.${legend}-actor'),node=document.querySelector('[data-uid="review-hand-0"]'),source=node.querySelector('.unit-front').getBoundingClientRect(),bounds=document.getElementById('battle').getBoundingClientRect();document.querySelectorAll('.legend-theatre,.legend-theatre *').forEach(n=>n.getAnimations().forEach(a=>{a.pause();a.currentTime=90;}));const r=actor.getBoundingClientRect();actor.getAnimations().forEach(a=>a.currentTime=650);const peak=actor.getBoundingClientRect();actor.getAnimations().forEach(a=>a.currentTime=90);return {sourceX:source.left+source.width*.5,sourceY:source.top+source.height*.7,birthX:r.left+r.width/2,birthY:r.bottom,peakFits:peak.left>=0&&peak.right<=innerWidth&&peak.top>=0&&peak.bottom<=innerHeight,uid:actor.dataset.sourceUid,portal:!!document.querySelector('.legend-card-portal[data-source-uid="review-hand-0"]'),mood:document.querySelector('.legend-scene-light').className};})()`);
      assert(Math.abs(result.birthX-result.sourceX)<1&&Math.abs(result.birthY-result.sourceY)<1,JSON.stringify({legend,seat,slot,w,...result}));assert.equal(result.uid,'review-hand-0');assert(result.portal);assert(result.peakFits,JSON.stringify({legend,seat,slot,w,...result}));
      report.cases.push({name,w,h,legend,seat,slot,...result});
      if(seat===0&&slot===1){
        const {data}=await page.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`${out}/${name}-${legend}-birth.png`,Buffer.from(data,'base64'));
        await page.evaluate(`document.querySelectorAll('.legend-theatre,.legend-theatre *').forEach(n=>n.getAnimations().forEach(a=>a.currentTime=650));`);
        const peak=await page.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`${out}/${name}-${legend}-peak.png`,Buffer.from(peak.data,'base64'));
      }
    }
  }
  await page.evaluate(`signatureReview.setLegend('mordren');signatureReview.setSeat(0);signatureReview.setSlot(1);signatureReview.replay();const battle=document.getElementById('battle');window.preJolt=document.querySelector('[data-uid="review-hand-0"]').getBoundingClientRect().toJSON();battle.getAnimations().forEach(a=>{a.pause();a.currentTime=970;});`);
  const shake=await page.evaluate(`(()=>{const matrix=new DOMMatrix(getComputedStyle(document.getElementById('battle'),'::before').transform),r=document.querySelector('[data-uid="review-hand-0"]').getBoundingClientRect();return {jolt:Math.abs(matrix.m41)+Math.abs(matrix.m42),stable:Math.abs(r.left-preJolt.left)<.1&&Math.abs(r.top-preJolt.top)<.1};})()`);
  assert(shake.jolt>.1&&shake.stable,JSON.stringify(shake));
  await page.evaluate('signatureReview.setReduced(true);signatureReview.replay()');assert.equal(await page.evaluate(`document.querySelectorAll('.legend-card-portal,.legend-scene-light').length`),0);
  assert.deepEqual(page.errors,[]);Object.assign(report,{sceneryShake:shake,reduced:true,errors:page.errors});await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');console.log('PASS card emergence: all four actors originate inside their own card across 48 slot/seat/viewport cases; scenery shake preserves hit geometry.');
}finally{await browser.close();}
