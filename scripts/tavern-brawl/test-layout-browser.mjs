import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';
const browser=await launch(),out='artifacts/tavern-brawl/game/layout';await mkdir(out,{recursive:true});
const results=[];
try{
  const page=await browser.page();
  for(const [width,height,name]of [[1440,900,'desktop'],[390,844,'mobile'],[320,568,'small-mobile'],[844,390,'landscape']]){
    await page.viewport(width,height);await page.navigate('http://localhost:5173/');await page.wait(`!document.body.classList.contains('booting')`,45000);
    const menu=await page.evaluate(`(()=>{const r=document.getElementById('menu-brawl').getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,overflow:document.documentElement.scrollWidth>innerWidth};})()`);
    assert(!menu.overflow&&menu.x>=0&&menu.right<=width,`${name} main-menu horizontal overflow`);assert(menu.bottom<=height&&menu.y>=0,`${name} main-menu Brawl entry is offscreen`);await page.capture(`${out}/main-menu-${name}.png`);
    await page.press('#menu-brawl');await page.wait(`document.getElementById('app')&&!document.getElementById('app').hidden`);await page.capture(`${out}/home-${name}.png`);
    const home=await page.evaluate(`({horizontal:document.documentElement.scrollWidth>innerWidth,screen:document.getElementById('home').scrollHeight>document.getElementById('home').clientHeight})`);assert(!home.horizontal,`${name} home horizontal overflow`);
    await page.press('#home [data-settings]');await page.capture(`${out}/options-${name}.png`);await page.press('#settings-dialog [data-close]');await page.press('#home [data-rules]');await page.capture(`${out}/rules-${name}.png`);await page.press('#rules-dialog [data-close]');
    await page.evaluate(`(async()=>{const {createRules}=await import('/brawl/engine.js');const {createRun}=await import('/brawl/adventure.js');const rules=createRules(await(await fetch('/assets/tavern-brawl/cards.json')).json());const p=JSON.parse(localStorage.getItem('tavern-brawl-v1'));p.duel=rules.create({seed:1,id:'layout-duel'});p.run=createRun('fox',rules.decks.fox,2,'layout-run');localStorage.setItem('tavern-brawl-v1',JSON.stringify(p));dispatchEvent(new StorageEvent('storage',{key:'tavern-brawl-v1'}));})()`);
    await sleep(50);await page.capture(`${out}/home-with-resumes-${name}.png`);
    results.push({name,width,height,menu,home,homeWithResumes:await page.evaluate(`({horizontal:document.documentElement.scrollWidth>innerWidth,scroll:document.getElementById('home').scrollHeight>document.getElementById('home').clientHeight})`)});
  }
  assert.deepEqual(page.errors,[]);await writeFile(`${out}/layout.json`,JSON.stringify({status:'passed',results,errors:page.errors},null,2)+'\n');console.log('PASS: main-menu entry, home, both resume options, Options and Rules across four sizes.',results.map(r=>({name:r.name,homeScroll:r.home.screen,resumeScroll:r.homeWithResumes.scroll})));
}catch(error){throw error;}finally{await browser.close();}
