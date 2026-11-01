import { TABLE_STAKES } from "./stakes.js";
import { recordBurn } from "../living-board.js";
import { MqttWsSignalingClient } from "./signaling.js";
import {
  createGame,
  start,
  play,
  pickup,
  zone,
  topRank,
  assertGame,
} from "../engine.js";
export const LIST = "shithead/v1/tables",
  DISCOVER = "shithead/v1/discover";
const id = () => crypto.randomUUID();
const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
const deal = (count) => createGame(random, count, { autoArrange: false });
const clean = (s) =>
  String(s || "Player")
    .replace(/[\u0000-\u001f]/g, "")
    .trim()
    .slice(0, 24) || "Player";
export function project(game, seat) {
  return {
    phase: game.phase,
    turn: game.turn,
    direction: game.direction,
    lowTurns: game.lowTurns,
    pile: game.pile,
    deckCount: game.deck.length,
    burnCount: game.burned.length,
    winner: game.winner,
    bet: game.bet ? { ...game.bet } : null,
    loser: game.loser,
    placements: game.placements,
    players: game.players.map((p, i) => ({
      hand: i === seat ? p.hand : [],
      handCount: p.hand.length,
      up: p.up,
      downCount: p.down.length,
    })),
    pending:
      game.pendingAce && game.turn === seat ? game.pendingAce : undefined,
    pendingSlot:
      game.pendingAce && game.turn === seat
        ? game.players[seat].down.findIndex((c) => c.id === game.pendingAce[0])
        : undefined,
    pendingCard:
      game.pendingAce && game.turn === seat
        ? game.players[seat].down.find((c) => c.id === game.pendingAce[0])
        : undefined,
    moves: game.moves,
    boardScars: game.boardScars || [],
  };
}
export class Session {
  constructor(name, onChange, onError) {
    this.id = id();
    this.name = clean(name);
    this.onChange = onChange;
    this.onError = onError;
    this.mqtt = new MqttWsSignalingClient();
    this.links = new Map();
    this.members = [];
    this.revision = 0;
    this.sequence = 0;
    this.lastSequences = new Map();
    this.closed = false;
    this.view = null;
    this.room = "";
    this.host = false;
    this.paused = false;
    this.message = "";
    this.busy = false;
    this.pendingSequence = 0;
    this.ended = false;
    this.chat = [];
    this.chatTimes = new Map();
    this.boardEffectTimes = new Map();
    this.boardEffectSequence = 0;
    this.lastBoardEffect = 0;
    this.onBoardEffect = () => {};
    this.stake = 0;
    this.offerId = id();
  }
  async open(room) {
    if (this.closed) return;
    if (room && !/^[a-zA-Z0-9-]{1,64}$/.test(room))
      throw Error(
        "This invite is not valid. Return to the tables and try another.",
      );
    this.room = room || id();
    this.host = !room;
    this.topic = `shithead/v1/rooms/${this.room}`;
    this.mqtt.subscribe(this.topic, (raw) => {
      try {
        const m = JSON.parse(raw);
        if (m.room === this.room && m.v === 1)
          this.signal(m).catch((e) => this.onError(e.message));
      } catch {}
    });
    if (this.host) {
      this.members = [
        { id: this.id, name: this.name, ready: false, connected: true },
      ];
      this.mqtt.subscribe(DISCOVER, () => this.announce());
    }
    await this.mqtt.connect();
    if (this.closed) return;
    this.tick = setInterval(() => {
      if (this.host) {
        this.announce();
      } else if (!this.connected)
        this.publish({ type: "join", name: this.name });
    }, 2500);
    if (this.host) this.announce();
    else this.publish({ type: "join", name: this.name });
    this.timeout = setTimeout(() => {
      if (!this.host && !this.connected)
        this.onError(
          "Could not reach this host. Retry the table; some networks need a TURN relay.",
        );
    }, 35000);
    this.onChange();
  }
  get connected() {
    return (
      this.host ||
      [...this.links.values()].some((l) => l.dc?.readyState === "open")
    );
  }
  publish(m) {
    this.mqtt.publish(
      this.topic,
      JSON.stringify({ ...m, id: this.id, room: this.room, v: 1 }),
    );
  }
  announce(closed = false) {
    if (!this.host) return;
    this.mqtt.publish(
      LIST,
      JSON.stringify({
        room: this.room,
        name: `${this.name}’s table`,
        host: this.name,
        count: this.members.length,
        stake: this.stake,
        state: closed ? "closed" : this.game ? "playing" : "waiting",
        at: Date.now(),
        v: 1,
      }),
    );
  }
  async signal(m) {
    if (
      !m ||
      typeof m !== "object" ||
      this.closed ||
      m.id === this.id ||
      typeof m.id !== "string" ||
      m.id.length > 64
    )
      return;
    if (this.host && m.type === "join") {
      const old = this.links.get(m.id);
      if (old) {
        if (old.offer)
          this.publish({ type: "offer", to: m.id, description: old.offer });
        for (const candidate of old.candidates)
          this.publish({ type: "ice", to: m.id, candidate });
        return;
      }
      if (this.game || this.members.length >= 4) {
        this.publish({
          type: "reject",
          to: m.id,
          reason: this.game
            ? "This game has already started."
            : "This table is full.",
        });
        return;
      }
      const l = this.link(m.id);
      this.members.push({
        id: m.id,
        name: clean(m.name),
        ready: false,
        connected: false,
      });
      l.dc = l.pc.createDataChannel("shithead-v1");
      this.bind(m.id, l);
      await l.pc.setLocalDescription(await l.pc.createOffer());
      l.offer = l.pc.localDescription.toJSON();
      this.publish({ type: "offer", to: m.id, description: l.offer });
      this.broadcast();
    } else if (!this.host && m.type === "offer" && m.to === this.id) {
      let l = this.links.get(m.id);
      if (l?.answer) {
        this.publish({ type: "answer", to: m.id, description: l.answer });
        for (const candidate of l.candidates)
          this.publish({ type: "ice", to: m.id, candidate });
        return;
      }
      l ||= this.link(m.id);
      if (l.negotiating) return;
      l.negotiating = true;
      await l.pc.setRemoteDescription(m.description);
      await this.flush(l);
      await l.pc.setLocalDescription(await l.pc.createAnswer());
      l.answer = l.pc.localDescription.toJSON();
      this.publish({ type: "answer", to: m.id, description: l.answer });
    } else if (this.host && m.type === "answer" && m.to === this.id) {
      const l = this.links.get(m.id);
      if (l?.pc.signalingState === "have-local-offer") {
        await l.pc.setRemoteDescription(m.description);
        await this.flush(l);
      }
    } else if (m.type === "ice" && m.to === this.id) {
      const l = this.links.get(m.id) || (!this.host ? this.link(m.id) : null);
      if (l && m.candidate?.candidate?.length < 4096) {
        const key = JSON.stringify(m.candidate);
        if (l.seen.has(key)) return;
        if (l.seen.size >= 128) return;
        l.seen.add(key);
        if (l.pending.length < 128) l.pending.push(m.candidate);
        await this.flush(l);
      }
    } else if (m.type === "reject" && m.to === this.id) this.onError(m.reason);
  }
  async flush(l) {
    if (l.pc.remoteDescription)
      while (l.pending.length)
        try {
          await l.pc.addIceCandidate(l.pending.shift());
        } catch {}
  }
  link(peer) {
    const pc = new RTCPeerConnection({
      iceServers: globalThis.SHITHEAD_ICE_SERVERS || [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun.cloudflare.com:3478" },
      ],
    });
    const l = { pc, pending: [], candidates: [], seen: new Set() };
    l.timeout = setTimeout(() => {
      if (l.dc?.readyState !== "open") {
        pc.close();
        this.disconnected(peer);
      }
    }, 35000);
    this.links.set(peer, l);
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        const candidate = e.candidate.toJSON();
        l.candidates.push(candidate);
        this.publish({ type: "ice", to: peer, candidate });
      }
    };
    pc.ondatachannel = (e) => {
      if (e.channel.label !== "shithead-v1") {
        e.channel.close();
        return;
      }
      l.dc = e.channel;
      this.bind(peer, l);
    };
    pc.onconnectionstatechange = () => {
      if (this.closed) return;
      if (pc.connectionState === "disconnected" && this.game) {
        const member = this.members.find((m) => m.id === peer);
        if (member) member.connected = false;
        this.paused = true;
        this.broadcast();
        this.onChange();
      } else if (
        pc.connectionState === "connected" &&
        l.dc?.readyState === "open"
      ) {
        const member = this.members.find((m) => m.id === peer);
        if (member) member.connected = true;
        this.paused = this.host && this.members.some((m) => !m.connected);
        this.broadcast();
        this.onChange();
      } else if (["failed", "closed"].includes(pc.connectionState)) {
        this.disconnected(peer);
      }
    };
    return l;
  }
  bind(peer, l) {
    l.dc.onopen = () => {
      clearTimeout(l.timeout);
      clearTimeout(this.timeout);
      const member = this.members.find((m) => m.id === peer);
      if (member) member.connected = true;
      this.broadcast();
      this.onChange();
    };
    l.dc.onclose = () => this.disconnected(peer);
    l.dc.onmessage = (e) => {
      if (typeof e.data !== "string" || e.data.length > 32768) return;
      try {
        const m = JSON.parse(e.data);
        if (this.host) this.command(peer, m);
        else if (m.type === "board-effect") {
          this.deliverBoardEffect(m);
        } else if (
          m.type === "snapshot" &&
          Number.isInteger(m.revision) &&
          m.revision >= this.revision
        ) {
          if (this.closed) return;
          if (Number.isSafeInteger(m.ack) && m.ack >= this.pendingSequence)
            this.clearPending();
          this.revision = m.revision;
          this.members = m.members;
          this.stake = TABLE_STAKES.includes(m.stake) ? m.stake : 0;
          this.offerId = m.offerId;
          this.chat = Array.isArray(m.chat) ? m.chat.slice(-100) : [];
          this.view = m.game;
          this.paused = m.paused;
          this.message = m.message || "";
          this.event = m.event;
          this.onChange();
        } else if (m.type === "ended") {
          this.ended = true;
          this.clearPending();
          this.message =
            "The host closed this table. Return to the lobby to find another.";
          this.paused = true;
          this.onChange();
          this.onError(this.message);
        } else if (m.type === "error") {
          if (m.ack === this.pendingSequence) this.clearPending();
          this.onChange();
          this.onError(m.message);
        }
      } catch {}
    };
  }
  disconnected(peer) {
    if (this.closed) return;
    const m = this.members.find((m) => m.id === peer);
    if (m && this.host) {
      m.connected = false;
      if (!this.game) {
        this.members = this.members.filter((m) => m.id !== peer);
        this.links.delete(peer);
      } else {
        this.paused = true;
        if (this.game.bet && !this.game.bet.settled) {
          this.game.bet.cancelled = true;
          this.message = 'A player left. The wager is cancelled and all buy-ins are returned.';
        }
      }
    }
    if (!this.host) {
      this.paused = true;
      this.ended = true;
      this.message = 'The host disconnected. This table has ended.';
      if (this.view?.bet && !this.view.bet.settled) {
        this.view.bet.cancelled = true;
        this.message += ' Your buy-in has been returned.';
      }
      this.clearPending();
    }
    this.broadcast();
    this.onChange();
  }
  send(l, m) {
    if (l.dc?.readyState !== "open" || l.dc.bufferedAmount >= 65536)
      return false;
    try {
      l.dc.send(JSON.stringify(m));
      return true;
    } catch {
      return false;
    }
  }
  clearPending() {
    this.busy = false;
    clearTimeout(this.commandTimeout);
  }
  snapshot(seat) {
    return {
      type: "snapshot",
      revision: this.revision,
      ack: this.lastSequences.get(this.members[seat]?.id) || 0,
      members: this.members,
      stake: this.stake,
      offerId: this.offerId,
      chat: this.chat,
      paused: this.paused,
      message: this.message,
      event: this.event,
      game: this.game ? project(this.game, seat) : null,
    };
  }
  broadcast() {
    if (!this.host || this.closed) return;
    this.revision++;
    this.view = this.game ? project(this.game, 0) : null;
    this.members.forEach((m, i) => {
      if (i) this.send(this.links.get(m.id) || {}, this.snapshot(i));
    });
    this.onChange();
  }
  act(type, data = {}) {
    if (this.closed || this.ended || this.busy) return;
    const m = { ...data, type, seq: ++this.sequence };
    if (this.host) this.command(this.id, m);
    else {
      if (!this.connected)
        return this.onError(
          "You’re disconnected. Wait for the connection or return to the tables.",
        );
      this.busy = true;
      this.pendingSequence = m.seq;
      const sent = [...this.links.values()].some((l) => this.send(l, m));
      if (!sent) {
        this.clearPending();
        return this.onError("Your choice could not be sent. Please try again.");
      }
      this.commandTimeout = setTimeout(() => {
        if (!this.busy || this.closed) return;
        // Do not unlock blind actions after a missing acknowledgement: it may
        // already have committed. A fresh snapshot must resolve the outcome.
        for (const l of this.links.values()) this.send(l, { type: "resync" });
        this.onError(
          "Waiting for the host to confirm your choice. Please keep this tab open.",
        );
      }, 8000);
      this.onChange();
    }
  }
  sendChat(text) {
    text = String(text || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 240);
    if (!text || this.closed || this.ended || !this.connected) return false;
    if (this.host) return this.receiveChat(this.id, text);
    return [...this.links.values()].some((l) => this.send(l, { type: "chat", text }));
  }
  // Transient scenery uses its own reliable channel messages. Never lock a
  // card action, change the game revision, or replay scenery on resync.
  interactBoard(prop) {
    if (this.closed || this.ended || !this.connected || !this.view || this.paused) return false;
    if (prop !== 'forge' && prop !== 'lantern') return false;
    if (this.host) return this.receiveBoardInteraction(this.id, prop);
    return [...this.links.values()].some(l => this.send(l, { type: 'board-interact', prop }));
  }
  receiveBoardInteraction(peer, prop) {
    if (!this.host || this.closed || !this.game || this.paused || !['forge', 'lantern'].includes(prop)) return false;
    if (!this.members.some(m => m.id === peer && m.connected)) return false;
    const now = Date.now();
    if (now - (this.boardEffectTimes.get(peer) ?? -Infinity) < 650) return false;
    this.boardEffectTimes.set(peer, now);
    const effect = { type: 'board-effect', id: ++this.boardEffectSequence, prop,
      seed: Math.floor(random() * 4294967296), sender: peer };
    for (const l of this.links.values()) this.send(l, effect);
    this.deliverBoardEffect(effect);
    return true;
  }
  deliverBoardEffect(effect) {
    if (this.closed || !this.view || !Number.isSafeInteger(effect.id) || effect.id <= this.lastBoardEffect ||
      !['forge', 'lantern'].includes(effect.prop) || !Number.isInteger(effect.seed) || effect.seed < 0 || effect.seed > 4294967295 ||
      !this.members.some(m => m.id === effect.sender)) return false;
    this.lastBoardEffect = effect.id;
    this.onBoardEffect({ id: effect.id, prop: effect.prop, seed: effect.seed, sender: effect.sender });
    return true;
  }
  receiveChat(peer, text) {
    const member = this.members.find((p) => p.id === peer && p.connected);
    if (!member || typeof text !== "string") return false;
    text = text.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 240);
    const now = Date.now();
    if (!text || now - (this.chatTimes.get(peer) || 0) < 800) return false;
    this.chatTimes.set(peer, now);
    this.chat.push({ id: id(), sender: member.id, name: member.name, text });
    this.chat = this.chat.slice(-100);
    this.broadcast();
    return true;
  }
  command(peer, m) {
    if (this.closed || !m || typeof m !== "object") return;
    if (m.type === 'board-interact') { this.receiveBoardInteraction(peer, m.prop); return; }
    if (m.type === "chat") { this.receiveChat(peer, m.text); return; }
    const seat = this.members.findIndex((p) => p.id === peer);
    if (seat >= 0 && m.type === "resync") {
      this.send(this.links.get(peer) || {}, this.snapshot(seat));
      return;
    }
    if (
      seat < 0 ||
      !Number.isSafeInteger(m.seq) ||
      m.seq < 1 ||
      m.seq <= (this.lastSequences.get(peer) || 0)
    )
      return;
    this.lastSequences.set(peer, m.seq);
    const fail = (message) => {
      if (peer === this.id) this.onError(message);
      else
        this.send(this.links.get(peer) || {}, {
          type: "error",
          message,
          ack: m.seq,
        });
    };
    if (m.type === "stake" && seat === 0 && !this.game) {
      if (![0, ...TABLE_STAKES].includes(m.stake)) return fail("Choose a table stake.");
      if (m.stake === this.stake) return;
      this.stake = m.stake;
      this.offerId = id();
      for (const p of this.members) p.accepted = null;
      this.message = this.stake ? "Everyone must accept the buy-in before dealing." : "A friendly practice table. No coins at stake.";
    } else if (m.type === "accept" && !this.game && this.stake) {
      if (m.offerId !== this.offerId) return fail("The stake changed. Please review it again.");
      this.members[seat].accepted = this.offerId;
    } else if (m.type === "deal" && seat === 0 && !this.game) {
      if (this.members.length < 2 || this.members.some((p) => !p.connected))
        return fail("Wait for at least one friend to connect.");
      if (this.stake && this.members.some(p => p.accepted !== this.offerId))
        return fail("Everyone must accept the buy-in first.");
      this.event = null;
      this.game = deal(this.members.length);
      if (this.stake) this.game.bet = { id: this.offerId, stake: this.stake, pot: this.stake * this.members.length, settled: false, winner: null };
      for (const p of this.members) p.ready = false;
      this.message = "Choose your face-up cards, then press Ready.";
    } else if (
      m.type === "rematch" &&
      seat === 0 &&
      this.game?.phase === "finished" &&
      !this.paused &&
      this.members.every((p) => p.connected)
    ) {
      this.event = null;
      if (this.stake) {
        this.game = null;
        this.offerId = id();
        for (const p of this.members) { p.ready = false; p.accepted = null; }
        this.message = "A fresh round. Accept the buy-in before the next deal.";
      } else {
        this.game = deal(this.members.length);
        for (const p of this.members) p.ready = false;
        this.message = "A fresh deal. Arrange your cards, then ready up.";
      }
    } else if (
      m.type === "ready" &&
      this.game?.phase === "setup" &&
      !this.paused
    ) {
      this.members[seat].ready = m.ready === true;
      if (this.members.every((p) => p.ready && p.connected)) {
        start(this.game, random);
        this.message = `${this.members[this.game.turn].name} starts. The bottle has spoken.`;
      }
    } else if (
      m.type === "swap" &&
      this.game?.phase === "setup" &&
      !this.members[seat].ready &&
      !this.paused
    ) {
      const p = this.game.players[seat],
        h = p.hand.findIndex((c) => c.id === m.hand),
        u = p.up.findIndex((c) => c.id === m.up);
      if (h < 0 || u < 0) return;
      [p.hand[h], p.up[u]] = [p.up[u], p.hand[h]];
    } else if (
      this.game?.phase === "playing" &&
      this.game.turn === seat &&
      !this.paused
    ) {
      let r;
      const pileSize = this.game.pile.length,
        topRankBefore = topRank(this.game.pile),
        lowTurnsBefore = this.game.lowTurns;
      const wasBlind = m.type === "blind" && !this.game.pendingAce;
      const blindCard = wasBlind
        ? this.game.players[seat].down[
            m.type === "blind"
              ? m.index || 0
              : this.game.players[seat].down.findIndex(
                  (c) => c.id === m.ids?.[0],
                )
          ]
        : null;
      this.lastBlindSlot = wasBlind
        ? this.game.players[seat].down.findIndex((c) => c.id === blindCard?.id)
        : undefined;
      if (m.type === "pickup") r = pickup(this.game);
      else if (m.type === "play" && Array.isArray(m.ids) && m.ids.length <= 4)
        r = play(this.game, m.ids, {
          aceValue: m.aceValue,
          requestChoice: true,
        });
      else if (m.type === "blind" && zone(this.game.players[seat]) === "down") {
        const p = this.game.players[seat],
          index = Number.isInteger(m.index) ? m.index : 0;
        if (index < 0 || index >= p.down.length) return;
        r = play(this.game, [p.down[index].id], {
          aceValue: m.aceValue,
          requestChoice: true,
        });
      } else
        return fail("That choice is no longer available. Please choose again.");
      if (!r.ok && !r.needsAceChoice)
        return fail(
          "That move is not legal. Choose another card or pick up the pile.",
        );
      if (r.burn) recordBurn(this.game, pileSize + (r.cards?.length || 1));
      this.event = {
        ...r,
        id: (this.eventSequence = (this.eventSequence || 0) + 1),
        who: seat,
        pileSize,
        topRankBefore,
        lowTurns: lowTurnsBefore,
        wasBlind,
        blindSlot: this.lastBlindSlot,
        reveal: blindCard || undefined,
      };
      this.message = r.needsAceChoice
        ? "Choose whether to play this ace as 1 or high."
        : `${this.members[seat].name} ${r.pickup ? "picked up the pile" : r.burn ? "burned the pile" : r.wentOut ? "escaped!" : "played " + (r.cards || []).map((c) => (c.rank === 15 ? "Joker" : c.rank)).join(" + ")}.`;
    } else
      return fail("Wait for your turn or for everyone to finish setting up.");
    if (this.game?.bet && !this.game.bet.settled && Number.isInteger(this.game.winner)) {
      this.game.bet.winner = this.game.winner;
      this.game.bet.settled = true;
    }
    if (this.game) assertGame(this.game);
    this.broadcast();
    this.announce();
  }
  close() {
    if (this.closed) return;
    this.clearPending();
    if (this.host) {
      for (const l of this.links.values()) this.send(l, { type: "ended" });
      this.announce(true);
    }
    this.closed = true;
    clearInterval(this.tick);
    clearTimeout(this.timeout);
    this.mqtt.close();
    for (const l of this.links.values()) {
      clearTimeout(l.timeout);
      l.dc?.close();
      l.pc.close();
    }
    this.links.clear();
    this.onChange();
  }
}
