import test from 'node:test';
import assert from 'node:assert/strict';
import {PORTRAITS,portraitFor,validPortrait} from '../dist/portraits.js';
import {Session} from '../dist/multiplayer/session.js';
import {tableView} from '../dist/multiplayer/table-view.js';
import {createGame} from '../dist/engine.js';
function host(){const s=new Session('Host',()=>{},()=>{},{portrait:'vesper'});s.host=true;s.members=[{id:s.id,name:'Host',portrait:s.portrait,connected:true},{id:'guest',name:'Guest',portrait:'owl',connected:true}];s.announce=()=>{};return s;}
test('five new stable characters coexist with original portraits and unknown IDs fall back',()=>{
 assert.equal(PORTRAITS.filter(p=>p.story).length,5);assert.equal(new Set(PORTRAITS.map(p=>p.id)).size,8);
 for(const id of [null,'../private.png','https://evil.test/pixel','__proto__',{},'unknown']){assert.equal(validPortrait(id),false);assert.equal(portraitFor(id).id,'fox');}
});
test('guest portrait changes are attributed to their own seat and included in every snapshot',()=>{
 const s=host();s.command('guest',{type:'portrait',portrait:'isolde',id:s.id,seq:1});
 assert.equal(s.members[0].portrait,'vesper');assert.equal(s.members[1].portrait,'isolde');
 assert.equal(s.snapshot(0).members[1].portrait,'isolde');assert.equal(s.snapshot(1).members[1].portrait,'isolde');
 s.command('guest',{type:'portrait',portrait:'cinder',seq:1});assert.equal(s.members[1].portrait,'isolde','replayed commands are ignored');
});
test('outsiders, invalid portraits, disconnected seats and changes after dealing are rejected',()=>{
 const s=host();s.command('outsider',{type:'portrait',portrait:'silas',seq:1});
 s.command('guest',{type:'portrait',portrait:'https://evil.test/pixel',seq:1});assert.equal(s.members[1].portrait,'owl');
 s.members[1].connected=false;s.command('guest',{type:'portrait',portrait:'aurel',seq:2});assert.equal(s.members[1].portrait,'owl');
 s.members[1].connected=true;s.game=createGame();s.command('guest',{type:'portrait',portrait:'silas',seq:3});assert.equal(s.members[1].portrait,'owl');
});
test('private table rotation keeps portraits paired with the correct player',()=>{
 const s=host();s.game=createGame(()=>.5,2);const v=tableView(s.snapshot(1).game,1,s.members);
 assert.equal(v.players[0].name,'Guest');assert.equal(v.players[0].portrait,'owl');assert.equal(v.players[1].portrait,'vesper');
});
test('chat records the sender portrait and never accepts a forged portrait from a chat command',()=>{
 const s=host();s.command('guest',{type:'chat',text:'Hello',portrait:'silas'});assert.equal(s.chat[0].portrait,'owl');
});
