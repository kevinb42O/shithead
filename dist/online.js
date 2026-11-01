import { TABLE_STAKES } from "./multiplayer/stakes.js";
import { createBank } from "./bank.js";
import { createTableWallet } from "./multiplayer/wallet.js";
import { createChat } from "./chat.js";
import { Session, LIST, DISCOVER } from "./multiplayer/session.js";
import { MqttWsSignalingClient } from "./multiplayer/signaling.js";
import { preloadCardArtwork } from "./card-art.js";
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const art = (source, cls, alt = "") => {
  const image = el("img", cls);
  image.src = `assets/${source}.png`;
  image.alt = alt;
  image.decoding = "async";
  image.draggable = false;
  if (!alt) image.setAttribute("aria-hidden", "true");
  return image;
};
const button = (label, fn, cls = "ol-button") => {
  const b = el("button", cls, label);
  b.type = "button";
  b.dataset.focus = label;
  b.onclick = fn;
  return b;
};
const bank = createBank({ key: 'shithead-table-v2', changed(wallet) {
  document.dispatchEvent(new CustomEvent('wallet-updated', { detail: wallet }));
} });
const tableWallet = createTableWallet(bank);
let accepting = false;
tableWallet.recover().catch(e => error(e.message));
const chat = createChat();
const chatStyle = document.createElement("link");
chatStyle.rel = "stylesheet"; chatStyle.href = "chat.css"; document.head.append(chatStyle);
const root = el("section", "online");
root.hidden = true;
root.setAttribute("aria-label", "Multiplayer card club");
document.body.append(root);
let session = null,
  browser = null,
  rooms = new Map(),
  interval,
  selected = [],
  swapHand = null,
  notice = "",
  inRoom = false;
let lobbyTab = "table";
let playerName;
try {
  playerName = localStorage.getItem("shithead-online-name") || "";
} catch {
  playerName = "";
}
const header = el("header", "ol-header");
const logo = el("img", "ol-logo");
logo.src = "assets/shithead-title.png";
logo.alt = "Shithead";
const exitButton = button("Back to menu", leave, "ol-quiet");
const navigation = el("nav", "ol-navigation");
navigation.setAttribute("aria-label", "Table navigation");
navigation.append(
  button(
    "Rules",
    () => document.getElementById("rules-dialog").showModal(),
    "ol-quiet",
  ),
  exitButton,
);
header.append(logo, navigation);
const body = el("div", "ol-body"),
  status = el("p", "ol-status");
status.setAttribute("role", "status");
status.setAttribute("aria-live", "polite");
root.append(header, body, status);
function fitLobby() {
  if (!root.clientWidth || !root.clientHeight) return;
  const scale = root.clientWidth > 1100
    ? Math.max(1, Math.min(2.3, (root.clientWidth - 96) / 1100, (root.clientHeight - 120) / 600)) : 1;
  root.style.setProperty("--lobby-scale", scale.toFixed(3));
}
new ResizeObserver(fitLobby).observe(root);
function error(s) {
  notice = s;
  status.textContent = s;
  if (session?.view)
    document.dispatchEvent(new CustomEvent("online-error", { detail: s }));
}
function leave() {
  if (
    session?.view?.phase === "playing" &&
    !confirm(
      session.host
        ? "End this table for everyone?"
        : "Leave this game? Your table will pause.",
    )
  )
    return;
  session?.close();
  session = null;
  chat.update(null);
  browser?.close();
  browser = null;
  clearInterval(interval);
  root.hidden = true;
  document.querySelector("#main-menu").inert = false;
  document.querySelector(".menu-multiplayer").focus();
  document.dispatchEvent(new CustomEvent("online-mode", { detail: false }));
}
function show() {
  root.hidden = false;
  document.querySelector("#main-menu").inert = true;
  document.dispatchEvent(new CustomEvent("online-mode", { detail: true }));
  browse();
}
function browse() {
  session?.close();
  session = null;
  chat.update(null);
  inRoom = false;
  lobbyTab = "table";
  notice = "";
  body.scrollTop = 0;
  root.dataset.screen = "lobby";
  selected = [];
  swapHand = null;
  body.replaceChildren();
  exitButton.textContent = "Back to menu";
  const intro = el("div", "ol-intro");
  const title = el("h1", "ol-title");
  title.textContent = "The Tavern";
  intro.append(el("span", "ol-eyebrow", "THE SHITHEAD CARD CLUB"));
  intro.append(title, el("p", "ol-tagline", "A warm hearth. A full table. Terrible intentions."));
  const layout = el("div", "ol-lobby"),
    create = el("form", "ol-create"),
    label = el("label", "", "Your name"),
    input = el("input");
  input.value = playerName;
  input.placeholder = "What should we call you?";
  input.maxLength = 24;
  input.required = true;
  input.autocomplete = "nickname";
  label.append(input);
  create.append(
    el("h2", "", "Host a table"),
    el("p", "ol-create-welcome", "There’s always room for one more."),
    label,
    el("p", "", "2–4 friends. Play for fun, or put a few coins on the table."),
  );
  const make = button("Create a table", () => {}, "ol-button ol-primary");
  make.type = "submit";
  create.append(make);
  create.onsubmit = (e) => {
    e.preventDefault();
    playerName = input.value.trim();
    if (!playerName) return input.focus();
    try {
      localStorage.setItem("shithead-online-name", playerName);
    } catch {}
    enter();
  };
  const directory = el("section", "ol-directory");
  const directoryHeading = el("div", "ol-directory-heading");
  directoryHeading.append(el("h2", "", "Open tables"), el("span", "ol-table-count", ""));
  directory.append(directoryHeading, el("p", "ol-directory-subtitle", "Find your people. Take an open seat."));
  const list = el("div", "ol-list");
  directory.append(list);
  layout.append(create, directory);
  const stage = el("div", "ol-browse-stage");
  stage.append(intro, layout);
  body.append(stage);
  const draw = () => {
    if (inRoom) return;
    const focusedRoom = list.contains(document.activeElement)
      ? document.activeElement.dataset.room
      : null;
    list.replaceChildren();
    for (const [id, room] of rooms)
      if (Date.now() - room.received >= 12000) rooms.delete(id);
    const available = [...rooms.values()].filter(
      (r) =>
        Date.now() - r.received < 12000 && r.state === "waiting" && r.count < 4,
    );
    directory.querySelector(".ol-table-count").textContent = `${available.length} open`;
    if (!available.length) {
      const empty = el("div", "ol-empty");
      const emptyCopy = el("div", "ol-empty-copy");
      emptyCopy.append(
        el("strong", "", "The chairs are yours."),
        el(
          "p",
          "",
          "No open tables yet. Make one and your friends will see it here.",
        ),
      );
      empty.append(art("tavern-table-art", "ol-empty-art"), emptyCopy);
      list.append(empty);
    }
    for (const r of available) {
      const row = el("div", "ol-room");
      const copy = el("div");
      copy.append(
        el("strong", "", r.name),
        el("span", "", `${r.count} of 4 seats · ${TABLE_STAKES.includes(r.stake) ? r.stake + " coins each" : "Practice"}`),
      );
      const joinButton = button("Join table", () => {
        playerName = input.value.trim();
        if (!playerName) {
          input.reportValidity();
          input.focus();
          return;
        }
        try {
          localStorage.setItem("shithead-online-name", playerName);
        } catch {}
        enter(r.room);
      });
      joinButton.dataset.room = r.room;
      joinButton.setAttribute("aria-label", `Join ${r.name}`);
      row.append(copy, joinButton);
      list.append(row);
    }
    if (focusedRoom)
      [...list.querySelectorAll("button")]
        .find((b) => b.dataset.room === focusedRoom)
        ?.focus({ preventScroll: true });
    status.textContent =
      notice ||
      (browser?.isConnected()
        ? "Lobby is live. Tables appear here automatically."
        : "Connecting to the card club…");
  };
  browser?.close();
  browser = new MqttWsSignalingClient();
  browser.subscribe(LIST, (raw) => {
    try {
      const r = JSON.parse(raw);
      if (
        r.v !== 1 ||
        typeof r.room !== "string" ||
        r.room.length > 64 ||
        typeof r.name !== "string" ||
        !Number.isInteger(r.count) ||
        r.count < 1 ||
        r.count > 4
      )
        return;
      if (r.state === "closed") rooms.delete(r.room);
      else
        rooms.set(r.room, {
          ...r,
          name: r.name.slice(0, 48),
          received: Date.now(),
        });
      draw();
    } catch {}
  });
  const discovery = browser;
  discovery.connect().then(() => {
    if (browser === discovery && !inRoom) discovery.publish(DISCOVER, "{}");
  });
  clearInterval(interval);
  interval = setInterval(draw, 2000);
  draw();
  const invite = new URLSearchParams(location.hash.slice(1)).get("table");
  if (invite && /^[a-zA-Z0-9-]{1,64}$/.test(invite)) {
    input.value = playerName;
    const join = button(
      "Join your invited table",
      () => {
        if (!input.value.trim()) {
          input.reportValidity();
          return;
        }
        playerName = input.value.trim();
        enter(invite);
      },
      "ol-button ol-primary",
    );
    directory.prepend(join);
  }
}
async function enter(room) {
  notice = "";
  inRoom = true;
  browser?.close();
  browser = null;
  clearInterval(interval);
  root.dataset.screen = "loading";
  const loading = el("div", "ol-loading");
  loading.append(art("tavern-table-art", "ol-loading-art"), el("h1", "", "Setting your table…"));
  body.replaceChildren(loading);
  status.textContent = "Connecting to your friends…";
  const joining = new Session(
    playerName,
    () => {
      tableWallet.sync(joining).then(() => {
        if (session === joining && !joining.closed) { notice = ""; render(); }
      }).catch(e => error(e.message));
    },
    error,
  );
  session = joining;
  try {
    await preloadCardArtwork();
    if (session !== joining || joining.closed) return;
    await joining.open(room);
    if (session === joining && !joining.closed) render();
  } catch (e) {
    if (session === joining && !joining.closed) {
      error(e.message);
      body.append(button("Back to tables", browse));
    }
  }
}
function render() {
  const s = session;
  if (!s) return;
  chat.update(s);
  if (s.view) {
    root.hidden = true;
    document.dispatchEvent(new CustomEvent("online-table", { detail: s }));
    return;
  }
  if (s.closed) return;
  if (root.hidden) {
    document.dispatchEvent(new CustomEvent('online-waiting'));
    root.hidden = false;
  }
  const previousFocus = document.activeElement?.dataset.focus;
  const chatInput = document.querySelector("#table-chat-input");
  const chatWasFocused = document.activeElement === chatInput;
  const chatSelection = chatWasFocused ? [chatInput.selectionStart, chatInput.selectionEnd] : null;
  const scrollPosition = body.scrollTop;
  body.replaceChildren();
  root.dataset.screen = "waiting";
  exitButton.textContent = s.host ? "Close table" : "Leave table";
  const waiting = el("section", "ol-waiting");
  waiting.dataset.tab = lobbyTab;
  const tabs = el("nav", "ol-mobile-tabs");
  tabs.setAttribute("aria-label", "Waiting room views");
  for (const [key, label] of [["table", "Your table"], ["chat", "Table talk"]]) {
    const tab = button(label, () => {
      lobbyTab = key; waiting.dataset.tab = key;
      for (const item of tabs.children) item.setAttribute("aria-pressed", String(item.dataset.tab === key));
    }, "ol-tab");
    tab.dataset.tab = key; tab.setAttribute("aria-pressed", String(lobbyTab === key)); tabs.append(tab);
  }
  waiting.append(tabs);
  const table = el("div", "ol-table-details");
  const heading = el("div", "ol-waiting-heading");
  heading.append(el("h1", "", s.host ? "Your table awaits" : "Welcome to the table"));
  const scene = el("div", "ol-table-scene");
  scene.append(art("tavern-table-art", "ol-waiting-art"));
  const seated = s.members.filter(m => m.connected).length;
  scene.append(el("span", "ol-seated-count", `${seated} / 4 seats filled`));
  table.append(heading, scene);
  const roster = el("div", "ol-roster");
  roster.setAttribute("aria-label", "Table seats");
  for (let i=0; i<4; i++) {
    const m=s.members[i], seat=el("section",m ? "ol-seat" : "ol-seat ol-seat-empty"),identity=el("div");
    if (m) {
      identity.append(el("strong","",m.name+(m.id===s.id?" · You":"")),el("span","",!m.connected?"Connecting…":s.stake ? (m.accepted === s.offerId ? "Buy-in accepted ✓" : "Reviewing buy-in") : i===0?"Host":"At the table"));
      seat.append(el("span","ol-avatar",m.name.slice(0,1).toUpperCase()),identity);
      if (m.id===s.id) seat.classList.add("ol-seat-you");
    } else {
      identity.append(el("strong","","Open seat"), el("span","","Waiting for a friend"));
      seat.append(el("span","ol-avatar ol-avatar-empty",String(i+1)),identity);
    }
    roster.append(seat);
  }
  table.append(roster);
  const stakes = el('section', 'ol-stakes');
  stakes.setAttribute('aria-label', 'Table stakes');
  const stakeHeading = el('div', 'ol-stakes-heading');
  stakeHeading.append(el('h2', '', 'Table stakes'), el('span', 'ol-bankroll', `${tableWallet.balance().toLocaleString()} coins available`));
  stakes.append(stakeHeading);
  const choices = el('div', 'ol-stake-choices');
  choices.setAttribute('role', 'group'); choices.setAttribute('aria-label', 'Coins per player');
  for (const amount of [0, ...TABLE_STAKES]) {
    const choice = button(amount ? amount.toLocaleString() : 'Practice', () => s.act('stake', { stake: amount }), amount ? 'ol-stake-coin' : 'ol-stake-practice');
    choice.setAttribute('aria-label', amount ? `${amount} coins per player` : 'Practice without coins');
    choice.setAttribute('aria-pressed', String(s.stake === amount));
    choice.disabled = !s.host || s.ended;
    choices.append(choice);
  }
  stakes.append(choices);
  const accepted = s.members.filter(m => m.accepted === s.offerId).length;
  if (s.stake) stakes.append(el('p', 'ol-stake-summary', `${s.stake.toLocaleString()} each · ${(s.stake * s.members.length).toLocaleString()} in the pot · First out wins`));
  if (s.stake) {
    const me = s.members.find(m => m.id === s.id), agreed = me?.accepted === s.offerId;
    const accept = button(accepting ? 'Saving buy-in…' : agreed ? 'Buy-in accepted ✓' : `Accept ${s.stake.toLocaleString()} coins`, async () => {
      if (accepting) return;
      accepting = true; render();
      try { await tableWallet.accept(s); }
      catch (e) { error(e.message); }
      finally { accepting = false; if (session === s && !s.closed) render(); }
    }, 'ol-button ol-primary ol-accept-stake');
    accept.disabled = accepting || agreed || s.ended || !s.connected || s.busy || tableWallet.balance() < s.stake;
    stakes.append(accept, el('p', 'ol-stake-help', `${accepted} of ${s.members.length} accepted · Virtual coins only`));
    stakes.append(el('p', 'ol-stake-help', agreed ? 'Coins held for this round. Leaving ends your wager and returns your buy-in.' : tableWallet.balance() < s.stake ? 'Not enough coins for this buy-in. Ask the host for a lower stake.' : 'Coins are held when you accept. A changed stake returns your buy-in.'));
  } else stakes.append(el('p', 'ol-stake-help', s.host ? 'Choose a coin to propose a buy-in to everyone.' : 'Your host chooses the stake. Everyone agrees before dealing.'));
  table.append(stakes);
  const actions = el("div", "ol-actions");
  if (s.host) {
    const deal = button(
      "Deal the cards",
      () => s.act("deal"),
      "ol-button ol-primary",
    );
    deal.disabled = accepting || s.members.length < 2 || s.members.some((m) => !m.connected || s.stake && m.accepted !== s.offerId);
    actions.append(deal);
  }
  if (s.paused || s.ended) actions.append(button("Back to tables", browse));
  table.append(actions);
  table.append(el("p", "ol-deal-hint", s.host ? (s.members.length < 2 ? "One more friend and you’re ready to deal." : s.members.some(m => !m.connected) ? "Waiting for everyone to connect…" : s.stake && s.members.some(m => m.accepted !== s.offerId) ? "Waiting for everyone to accept the buy-in." : "Everyone’s here. Let the good luck run out.") : "Your host will deal the cards when everyone’s ready."));
  const hint = table.querySelector(".ol-deal-hint");
  table.insertBefore(hint, actions);
  waiting.append(table);
  body.append(waiting);
  chat.placeLobby(waiting);
  body.scrollTop = scrollPosition;
  if (chatWasFocused) { chatInput.focus({preventScroll:true}); chatInput.setSelectionRange(...chatSelection); }
  if (previousFocus) [...root.querySelectorAll("button")].find(b=>b.dataset.focus === previousFocus && !b.disabled)?.focus({preventScroll:true});
  status.textContent =
    notice ||
    s.message ||
    (!s.connected
      ? "Connecting to the host…"
      : `${s.members.length} at the table · Up to 4 players`);
}
document.addEventListener("online-close", () => {
  session?.close();
  session = null;
  chat.update(null);
  browser?.close();
  browser = null;
  clearInterval(interval);
  root.hidden = true;
  inRoom = false;
});
const opener = document.querySelector(".menu-multiplayer");
opener.onclick = show;
if (new URLSearchParams(location.hash.slice(1)).has("table")) show();

window.addEventListener('pagehide', () => session?.close());
window.addEventListener('storage', event => { if (event.key === 'shithead-table-v2' && session && !session.view) render(); });
