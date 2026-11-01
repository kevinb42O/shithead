import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { Session } from "../dist/multiplayer/session.js";
globalThis.crypto ||= webcrypto;

test("table chat is attributed by host, bounded and carried in snapshots", () => {
  const s = new Session("Host", () => {}, () => {});
  s.host = true;
  s.members = [{id:s.id, name:"Host", connected:true}, {id:"guest", name:"Guest", connected:true}];
  s.links.set("guest", {dc:{readyState:"open", bufferedAmount:0, send(){}}});
  s.command("guest", {type:"chat", name:"Forged", text:"Hello"});
  assert.equal(s.chat[0].name, "Guest");
  assert.equal(s.snapshot(1).chat[0].text, "Hello");
  s.command("guest", {type:"chat", text:"Too fast"});
  assert.equal(s.chat.length, 1);
  s.command("outsider", {type:"chat", text:"No"});
  assert.equal(s.chat.length, 1);
  s.chatTimes.clear();
  s.command("guest", {type:"chat", text:"x".repeat(400)});
  assert.equal(s.chat[1].text.length, 240);
});
