// Isolated developer specimen. No localStorage, wallet, profile or network writes.
import {createRules} from './engine.js';
import {createView,image,label,$} from './view.js';
import {renderInspection} from './card-inspection.js';
import {tierName} from './expansion.js';
import {chooseAction} from './ai.js';
const catalog=await(await fetch('assets/tavern-brawl/cards.json')).json(),rules=createRules(catalog);
let state,selection,selectedChoice=null;
const scene=new URLSearchParams(location.search).get('scene')||'gallery';
const view=createView(rules,{card:uid=>{selection={type:'play',uid};paint();},unit:uid=>{const a=legal().find(a=>a.target===uid);if(a)submit(a);else{selection={type:'attack',uid};paint();}},empty:slot=>{const a=legal().find(a=>!a.target);if(a)submit({...a,slot});},inspect,replace(){}});
function inspect(id,uid){const card=rules.cards[id],unit=state?.players.flatMap(p=>p.board).find(u=>u.uid===uid);$('inspect-title').textContent=card.name;$('inspect-card').replaceChildren(view.cardFace(card,{interactive:false}));renderInspection(card,unit);$('inspect-select').hidden=true;$('card-dialog').showModal();}
for(const n of document.querySelectorAll('[data-close]'))n.onclick=()=>n.closest('dialog').close();
for(const n of document.querySelectorAll('main>.screen'))n.hidden=true;
if(scene==='gallery'){
 document.body.classList.add('qa-gallery');
 $('decks').hidden=false;$('decks-title').textContent='After Midnight';$('deck-summary').textContent='25 original faces · 8 Common · 8 Rare · 5 Epic · 4 Legendary';
 for(const selector of ['.deck-toolbar','.filters','.collection-tools','#deck-curve','[data-home]'])document.querySelector('#decks '+selector).hidden=true;
 $('cards-grid').replaceChildren(...catalog.cards.filter(c=>c.set==='after-midnight').map(c=>{const fig=document.createElement('figure');fig.append(view.cardFace(c,{onClick:()=>inspect(c.id)}),label('card-tier-caption',tierName(c)+' · '+c.faction));return fig;}));
}else{
 $('battle').hidden=false;
 const heroes=scene==='choice'?['owl','raven']:['fox','raven'];
 const inserts=scene==='choice'?[['nightglass-diviner'],[]]:[['vesper-blackpaw-king','mordren-ashen-host','orun-eclipse-warden'],['mother-nox-bellkeeper','debt-eater','gravewax-collector']];
 const decks=heroes.map((h,i)=>{const ids=[...inserts[i]];for(const id of rules.featuredDecks[h])if(ids.length<20&&ids.filter(v=>v===id).length<rules.copyLimit(id))ids.push(id);return ids;});
 state=rules.create({heroes,deckLists:decks,seed:22,first:0,mulligan:false,mixed:true});
 function bring(seat,id){const p=state.players[seat];let c=p.hand.find(c=>c.card===id);if(!c){if(p.hand.length===8)p.deck.unshift(p.hand.shift());const i=p.deck.findIndex(c=>c.card===id);c=p.deck.splice(i,1)[0];p.hand.push(c);}p.energy=10;state.turn=seat;return c.uid;}
 if(scene==='choice'){state=rules.apply(state,0,{type:'play',uid:bring(0,'nightglass-diviner')}).state;}
 else{
  for(const [seat,ids]of inserts.entries())for(const id of ids){const uid=bring(seat,id);state=rules.apply(state,seat,{type:'play',uid}).state;}
  state.players[0].health=18;state.players[1].health=21;state.turn=0;state.turnNumber=11;for(const p of state.players){p.energy=8;p.maxEnergy=8;for(const u of p.board){u.ready=true;u.enteredTurn=1;}}
 }
 $('end-turn').onclick=()=>submit({type:'end'});$('commit-card').onclick=()=>{const a=legal().find(a=>!a.target);if(a)submit(a);};$('cancel-selection').onclick=()=>{selection=null;paint();};$('choice-confirm').onclick=()=>submit({type:'choose',uid:selectedChoice});$('choice-dialog').addEventListener('cancel',e=>e.preventDefault());
 $('own-hero').onclick=()=>{const a=legal().find(a=>a.target==='hero:0');if(a)submit(a);};$('enemy-hero').onclick=()=>{const a=legal().find(a=>a.target==='hero:1');if(a)submit(a);};
 paint();
}
function legal(){return rules.legalActions(state,0).filter(a=>selection&&a.type===selection.type&&a.uid===selection.uid);}
function submit(action){const result=rules.apply(state,0,action);if(!result.ok)throw Error(result.error);state=result.state;selection=null;paint();}
function paint(){
 const v=rules.project(state,0);view.renderBattle(v,0,{canAct:state.turn===0&&!state.choice,mode:'Isolated review'});view.highlights(legal(),selection);
 $('selection-dock').hidden=!selection;
 if(selection){const a=legal()[0],physical=state.players[0].hand.find(c=>c.uid===selection.uid)||state.players[0].board.find(c=>c.uid===selection.uid);$('selected-name').textContent=rules.definition(physical).name;$('selected-text').textContent=rules.definition(physical).text;$('commit-card').hidden=!a||!!a.target;}
 const d=$('choice-dialog');if(state.choice?.seat===0){if(!$('choice-cards').children.length){$('choice-cards').replaceChildren(...v.choice.options.map(c=>{const n=view.cardFace(rules.cards[c.card],{onClick:()=>{selectedChoice=c.uid;$('choice-confirm').disabled=false;for(const option of $('choice-cards').children)option.setAttribute('aria-pressed',String(option.dataset.uid===c.uid));}});n.dataset.uid=c.uid;return n;}));}if(!d.open)d.showModal();}else if(d.open)d.close();
 $('battle').dataset.qaRevision=state.revision;$('battle').dataset.qaChoice=String(!!state.choice);
}
