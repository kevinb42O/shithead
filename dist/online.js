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
  inRoom = false;
  notice = "";
  body.scrollTop = 0;
  root.dataset.screen = "lobby";
  selected = [];
  swapHand = null;
  body.replaceChildren();
  exitButton.textContent = "Back to menu";
  const intro = el("div", "ol-intro");
  const title = el("h1", "ol-title");
  title.append(art("club-title", "ol-title-art", "The Card Club"));
  intro.append(title, el("p", "ol-tagline", "Good company. Terrible intentions."));
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
    el("h2", "", "Make yourself at home."),
    label,
    el("p", "", "2–4 friends. No buy-in. Same questionable luck."),
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
  directory.append(directoryHeading);
  const list = el("div", "ol-list");
  directory.append(list);
  layout.append(create, directory);
  body.append(intro, layout);
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
      empty.append(art("club-empty-table", "ol-empty-art"), emptyCopy);
      list.append(empty);
    }
    for (const r of available) {
      const row = el("div", "ol-room");
      const copy = el("div");
      copy.append(
        el("strong", "", r.name),
        el("span", "", `${r.count} of 4 seats · Waiting for friends`),
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
  loading.append(art("club-empty-table", "ol-loading-art"), el("h1", "", "Setting your table…"));
  body.replaceChildren(loading);
  status.textContent = "Connecting to your friends…";
  const joining = new Session(
    playerName,
    () => {
      notice = "";
      render();
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
  if (s.view) {
    root.hidden = true;
    document.dispatchEvent(new CustomEvent("online-table", { detail: s }));
    return;
  }
  if (root.hidden) return;
  const previousFocus = document.activeElement?.dataset.focus;
  body.replaceChildren();
  root.dataset.screen = "waiting";
  exitButton.textContent = s.host ? "Close table" : "Leave table";
  const waiting = el("section", "ol-waiting");
  waiting.append(
    el("h1", "", s.host ? "Your table is open." : "You’re at the table."),
    el(
      "p",
      "",
      "Friends can find this table in Open tables. Deal when everyone is seated.",
    ),
  );
  waiting.append(art("club-empty-table", "ol-waiting-art"));
  const roster = el("div", "ol-roster");
  roster.setAttribute("aria-label", "Table seats");
  for (let i=0; i<4; i++) {
    const m=s.members[i], seat=el("section",m ? "ol-seat" : "ol-seat ol-seat-empty"),identity=el("div");
    if (m) {
      identity.append(el("strong","",m.name+(m.id===s.id?" · You":"")),el("span","",!m.connected?"Connecting…":i===0?"Host":"At the table"));
      seat.append(el("span","ol-avatar",m.name.slice(0,1).toUpperCase()),identity);
      if (m.id===s.id) seat.classList.add("ol-seat-you");
    } else {
      identity.append(el("strong","","Open seat"), el("span","","Waiting for a friend"));
      seat.append(el("span","ol-avatar ol-avatar-empty",String(i+1)),identity);
    }
    roster.append(seat);
  }
  waiting.append(roster);
  const actions = el("div", "ol-actions");
  actions.append(
    button("Copy invite", async () => {
      const url = new URL(location.href);
      url.hash = "table=" + s.room;
      try {
        await navigator.clipboard.writeText(url.href);
        error("Invite copied. Send it to your friends.");
      } catch {
        error("Your invite: " + url.href);
      }
    }),
  );
  if (s.host) {
    const deal = button(
      "Deal the cards",
      () => s.act("deal"),
      "ol-button ol-primary",
    );
    deal.disabled = s.members.length < 2 || s.members.some((m) => !m.connected);
    actions.append(deal);
  }
  if (s.paused || s.ended) actions.append(button("Back to tables", browse));
  waiting.append(
    actions,
    el(
      "p",
      "ol-note",
      s.host
        ? "You’re the host. Keep this tab open while playing."
        : "The host will deal once everyone has joined.",
    ),
  );
  body.append(waiting);
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
  browser?.close();
  browser = null;
  clearInterval(interval);
  root.hidden = true;
  inRoom = false;
});
const opener = document.querySelector(".menu-multiplayer");
opener.onclick = show;
if (new URLSearchParams(location.hash.slice(1)).has("table")) show();
