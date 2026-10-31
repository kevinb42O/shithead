# Browser multiplayer plan

## Shared-table requirement

Multiplayer gameplay uses the original single-player `dist/app.js` renderer, DOM, assets, layout, drag handlers and effects. The separate multiplayer table was removed. Only the lobby/waiting room is a new screen; Ready replaces Start Game online. This requirement takes precedence over any earlier interface suggestions below.

## Implementation status — 31 October 2026

The public-table first release is implemented locally; see [MULTIPLAYER.md](MULTIPLAYER.md) for actual controls, network configuration and validation. The user confirmed the existing HTTPS app at https://playshithead.vercel.app and requested automatically visible public rooms, superseding the invite-first default below. Implemented: public discovery, create/join/invites, 2–4 humans, all-player card arrangement and Ready gate, authoritative play, per-player private views, rematches, responsive generated-art lobby and keyboard focus restoration. Deferred: host refresh recovery, guest reconnection, computer takeover and a supplied TURN account. A lost connection pauses the game; create a new table for a permanently lost session. No deployment was performed.

## Purpose

Add online games for 2–4 people while preserving the existing fullscreen table and single-player game. Follow the current DevildaggersV2 pattern: one browser hosts the authoritative session, WebRTC data channels carry game traffic, and a separate signaling service handles room discovery and peer negotiation. Use private invites by default; allow a host to opt into an open table listing.

This is a plan only. The game is still single-player; the Multiplayer menu item is disabled. No game code, hosting, deployment, or external service configuration is part of this document.

## Product decisions for the first release

| Decision | First-release choice | Reason |
| --- | --- | --- |
| Players | 2–4 human players; host counts as one | Matches the engine's 2–4 seat limit and avoids mixing online identities with computer seats. |
| Room discovery | Private invite link by default; optional open-table listing | Friends can join directly, while people who want matchmaking can opt into the lobby browser pattern already used in DevildaggersV2. |
| Authority | Host-authoritative game | One rules engine resolves turns, shuffles, deals, and outcomes; peers cannot disagree about a legal move. |
| Game traffic | One reliable, ordered WebRTC data channel per guest | Traffic is tiny and turn-based. Reliability and order matter more than low-latency lossy delivery. |
| Online stakes | No coin buy-ins, payouts, or shared online wallet | Current coins are stored locally and cannot be trusted or transferred between browsers. Keep online play practice-only. |
| AI seats | None in a started online game | Keeps the lobby and turn ownership clear. Solo AI games continue as they do today. |
| Host migration | Not in the first release | A single authority is the simplest way to preserve hidden cards and game state. If the host leaves, the room ends. |
| Chat | None | Out of scope for playing the card game; names and ready state are sufficient. |

The host is a trusted dealer. The host browser necessarily holds the complete deck and all private cards, so a technically curious host could inspect opponents' cards. Guest clients must never receive other players' hands or the order of hidden cards. Eliminating host visibility would require a server authority or a cryptographic dealing protocol and is not part of this casual-friends design.

## What exists today

- The project is a dependency-free browser game served from `dist/` by `server.js`; `npm run dev` starts it at `http://localhost:5173`.
- `dist/engine.js` already supports 2–4 seats, card conservation, setup swaps, game phases, turn direction, burns, blind flips, ace choices, placements, and deterministic state validation.
- `dist/app.js` and the renderer assume seat 0 is the local human. Setup swaps also target seat 0. Opponent seats are computer-controlled by `dist/opponents.js`.
- Local saves and the virtual-coin wallet are browser-local. Neither is suitable as shared multiplayer state or as a trusted source of online stakes.
- The main-menu Multiplayer button exists in `dist/index.html` and is disabled.
- `tests/multiplayer.test.js` currently covers multi-seat game rules and AI simulations, not network multiplayer.
- Keep the app local-first and keep the existing fullscreen composition. Do not use ChatGPT Sites or publish/deploy anything as part of implementation unless separately requested.

## Architecture

```text
Guest browser A ── WebRTC reliable data channel ──┐
Guest browser B ── WebRTC reliable data channel ──┼── Host browser
Guest browser C ── WebRTC reliable data channel ──┘   owns full game state
        │                                                  │
        └──────── signaling only (SDP, ICE, room events) ──┘
```

Each guest connects directly to the host. Guests do not connect to one another. The signaling service transports room discovery and WebRTC offer/answer/ICE messages only; it never receives card moves, game snapshots, private hands, or coin balances. If a direct connection cannot be established and TURN is configured, WebRTC relays encrypted data through TURN. Data channels use WebRTC's encrypted transport.

Keep the implementation dependency-free unless a later review shows a concrete reliability or maintenance benefit to a small library. Add isolated modules under `dist/` rather than growing the already large UI controller:

- `dist/multiplayer/signaling.js`: signaling transport, room topic helpers, retries, expiry, broker failover, and connection status.
- `dist/multiplayer/peer.js`: one `RTCPeerConnection` and data channel lifecycle for one remote seat.
- `dist/multiplayer/protocol.js`: message schemas, protocol version, size limits, parsing, and validation.
- `dist/multiplayer/authority.js`: host command authorization, idempotency, engine action dispatch, and revision management.
- `dist/multiplayer/projection.js`: per-seat, privacy-filtered game snapshots.
- `dist/multiplayer/session.js`: lobby membership, ready state, seat ownership, start/end, reconnect, and teardown.

Names may change during implementation; the boundaries should remain. The single-player code path should remain the default and should not depend on a live signaling service.

## Lobby and invitation flow

1. The menu's disabled Multiplayer action becomes **Play with friends** and opens a fullscreen multiplayer lobby browser with **Create table** and **Join by invite** actions.
2. The host creates a friends-only room by default, with an explicit **List as open table** option. The host chooses a capacity from 2 to 4 seats.
3. Each room gets a cryptographically random public room ID and a separate 128-bit invite capability. Do not use `Math.random()` for secrets. The invite link opens the same app and routes directly to join; put the capability in the URL fragment or an equivalent client-only field so it is not sent in HTTP request paths or referrer headers. A short join code can be offered as a manually typed convenience, but it must not replace host admission checks.
4. Open-table listings expose only the table name, host display name, occupied seats, ready count, and whether the room is waiting or full. They never include game state, hidden cards, invite capability, or wallet data. The host must approve join requests before a seat is reserved. Listing is opt-in; private invite links work whether or not the room is listed.
5. A joiner enters a display name, connects to the host, receives an approved seat, and marks ready. Names are trimmed, limited to 24 visible characters, and rendered as text, never HTML.
6. The host may start only when there are 2–4 connected, ready human players. Starting fixes seat order for the whole game. No new seats may join after start.
7. The host starts the existing setup phase. Every player swaps only their own hand and face-up cards. A start command is accepted only from the host and only when all active participants are ready.
8. During the game, only the player whose seat owns the turn can submit play, pickup, ace-choice, blind-flip, or setup-swap commands. The host resolves and broadcasts the resulting state.
9. The host can return to the menu or end the room. Guests receive an explicit ended/host-left state and can return to the local menu without affecting local saves or wallet.

Expired and closed rooms disappear from discovery. Validate listing fields, cap lobby name length, rate-limit room announcements and join attempts, and keep public listings separate from private invite capabilities. Public MQTT is not an authentication service; host approval is required for open-table joins.

## Network lifecycle

For each guest, the host creates an `RTCPeerConnection` with a single reliable, ordered data channel named `shithead-game-v1`. The host creates the channel before offering; the guest receives it from the `datachannel` event. Only the host sends authoritative game snapshots. Either side can send its allowed lobby/control messages, but guests cannot broadcast game state.

Use trickle ICE: send the offer/answer and individual ICE candidates over the signaling channel as they are produced. Queue remote ICE candidates until the remote description has been applied. Enforce timeouts for room join, offer/answer, ICE gathering, data-channel open, heartbeat expiry, and reconnect. Handle duplicate and late signaling packets safely.

ICE configuration is injected through a local/deployment configuration object, not hard-coded into UI. Use STUN for development and a TURN service for reliable cross-network play. Validate with relay-only connections as well as direct connections. The current DevildaggersV2 approach uses public MQTT-over-WebSocket signaling brokers with failover and public STUN; it is a useful reference, but its public broker and STUN setup is a playtest baseline, not a production uptime guarantee. If its MQTT transport is reused, add application-level acknowledgement, bounded retries, expiry, and deduplication for SDP/ICE messages rather than assuming a QoS-0 publish was delivered.

Control messages and state messages use versioned JSON initially. Every packet includes `protocolVersion`, `roomId`, `roomEpoch`, `messageId`, and the relevant `revision` or `clientSequence`. Reject unknown versions, stale epochs, malformed data, oversized packets, unrecognized message types, unexpected senders, and invalid state transitions. Enforce a conservative message-size limit (for example, 32 KiB); ordinary snapshots should be far smaller.

### Connection states shown to players

Use explicit lobby/table status rather than silent failure:

- Connecting to lobby service
- Open tables available
- Waiting for host / waiting for player
- Establishing secure direct connection
- Connected / ready
- Reconnecting
- Connection failed, with retry and return-to-menu actions
- Host left / room ended

Surface helpful but non-technical errors. Keep verbose WebRTC state and timing details in a development-only diagnostic panel or console, not in the normal game flow.

## Authoritative game protocol

The host keeps the canonical `game`, room membership, seat ownership, current revision, and bounded per-seat command sequence numbers. For every guest command it verifies:

1. The sender is the active connection assigned to that seat.
2. The room epoch and protocol version match.
3. The command sequence is new; duplicate commands receive the latest result/snapshot without being applied again.
4. The command is allowed in the current phase and belongs to the sender's seat.
5. Any referenced cards are in that seat's legal zone, have matching rank where required, and form a legal engine action.

The protocol should be intention-based, not state-mutation-based. Guest messages are limited to commands such as:

- `ready` / `unready`
- `swap` with the guest's own hand-card and face-up-card identifiers
- `play` with own visible card identifiers and the declared ace value, when needed
- `pickup`
- `blindFlip` with no card ID or rank
- `leave`

Never accept a guest-supplied game object, deck, random seed after dealing, outcome, wallet, pile contents, opponent cards, or arbitrary field patch. For a blind flip, the host selects and reveals the actual card; the request must not disclose the card to the guest before the host commits it.

After an accepted command, the host applies the current engine operation once, validates the state with `assertGame`, increments the monotonically increasing revision, persists its local host save, and sends each participant a new filtered snapshot. Rejected commands return a short reason and the latest snapshot. Full snapshots are small enough for this turn-based game; do not add delta compression or unreliable state channels unless profiling proves a need.

## Per-player snapshot and hidden-card rules

The host derives a separate snapshot for every connected player. A snapshot contains the public table state, public event log, seat names, readiness, direction, pile, public face-up cards, visible deck/burn counts, current actor, turn phase, and a revision.

- The recipient receives ranks/suits/IDs for their own hand and face-up cards.
- Every player's face-down cards are represented as anonymous backs plus count. Do not send face-down card IDs, ranks, suits, order, or deck position, including to their owner.
- Other players' hands are represented by count only.
- Other players' public face-up cards remain visible.
- The stock exposes count only; the upcoming draw order remains host-only.
- When a face-down card is committed, the host reveals the result in the same authoritative state transition that removes it from the hidden zone.
- Public logs and error messages must not mention unknown card ranks before a reveal.

Keep private projected state separate from the canonical game object. Test serialization by scanning each recipient payload for every card ID/rank that should be secret; test both active play and unusual states such as failed blind flips, a pending ace, a burn, and reconnect.

## Game-engine and UI integration

Before connecting browsers, remove the assumption that the human is always seat 0:

1. Introduce a game-mode/session context: `solo` or `online`, plus a local seat ID and a seat-to-player ID map. Preserve `createGame`, `play`, `pickup`, and local save behavior for solo games.
2. Generalize setup swapping from player 0 to an explicit seat. Add an explicit engine entry point for a seat's action, or keep seat ownership checks in the multiplayer authority layer and call shared engine operations without changing rule semantics.
3. Replace UI checks such as `game.turn === 0` with `game.turn === localSeat`. Gate the card hand, pickup button, ace choice, blind-flip action, and setup swaps from local seat ownership and connection status.
4. Make player-name rendering use the room roster in online mode while leaving Fox/Owl/Raven labels and opponent personalities intact in solo mode.
5. The host applies commands from local input through the same authority path as remote input. This prevents host-only UI shortcuts from bypassing validation.
6. Disable fast-forward, single-player rematch/restart, local wager controls, and solo-only actions during an online session. Add explicit Leave table and Return to lobby controls with confirmation only when leaving would end/forfeit a live session.
7. Keep all existing fullscreen desktop, phone, short-landscape, reduced-motion, keyboard, touch, and screen-reader behavior. Network dialogs and status should not resize or reflow the game table unexpectedly.

Persist online sessions under separate, versioned localStorage keys so they can never overwrite the solo game or wallet. Host storage includes the canonical state and ephemeral room recovery material; guest storage includes only that guest's projection and reconnect credential. Do not treat guest localStorage as authoritative.

## Disconnects, recovery, and lifecycle

- A guest connection interruption pauses the game for everyone. No AI or host auto-play may take that disconnected player's turn.
- Attempt ICE recovery/restart automatically, then offer a bounded reconnect window (initial target: 120 seconds) with visible countdown and retry status. If the same player reconnects with its capability before expiry, restore the same seat and send a fresh filtered snapshot.
- During the window, the host may wait, cancel the game, or explicitly let a computer take over that seat. Computer takeover is permanent for that match and must be clearly announced. This takeover action is the only first-release path that allows play to continue without the human.
- A reconnecting player cannot take over a seat already assigned to a computer or join mid-game as a new seat.
- A host browser refresh restores the last persisted canonical snapshot and room epoch, then renegotiates fresh WebRTC connections for players presenting valid reconnect credentials. If host recovery fails or the host explicitly leaves, end the room; no host migration.
- On page close, send best-effort leave/end messages but do not depend on `beforeunload` delivery. Room heartbeats and expiry clean abandoned rooms.
- Clear credentials, peer connections, timers, listeners, and room topics on return to menu. Do not leave a stale room that prevents creating or joining a new one.

The 120-second interval is a starting UX value, not a technical guarantee. Confirm it through playtesting before implementation is considered finished.

## Signaling, privacy, and operational limits

WebRTC does not provide the signaling service itself; the application must exchange descriptions and ICE candidates through some other channel. Public MQTT-over-WebSocket signaling can match the DevildaggersV2 playtest path, but the broker learns room traffic and may be unavailable or change access rules. Use a random, unguessable room capability, scoped room topics, short expiry, message size limits, sender validation, rate limits, and app-level message IDs. Never publish full lobby or guest hand state to a shared wildcard topic.

STUN helps peers discover candidate routes but cannot make every network topology connect. TURN relays traffic when direct connectivity fails and should be available for dependable real-world use. Browser peer connectivity also does not make a local `http://localhost:5173` game URL internet-accessible: remote participants need the app served from an HTTPS-reachable URL, and each browser needs access to signaling plus the configured ICE/TURN services. This plan does not select or provision those services.

For development, continue using `npm run dev` and `http://localhost:5173`. Test local browser profiles first, then different devices on the same LAN, then genuinely separate networks. A successful same-machine test is not proof of internet NAT/firewall compatibility.

If using a public broker for a private room, the room secret is effectively a bearer invite: anyone who receives it can attempt to join. The host must approve/assign seats, and the secret must rotate when the room closes. Direct connections exchange ICE candidates that can reveal network-address information to the connected peer; a relay-only TURN policy can mask peer addresses from one another, with additional relay cost and service requirements.

## Implementation phases and exit criteria

### Phase 0 — Lock the scope

- Keep first release invite-first, with opt-in open-table listings, 2–4 humans, no online wagers, no AI fill, and one host authority.
- Identify the development signaling/ICE configuration and record how remote HTTPS hosting and TURN would be provided later; do not provision or publish anything as part of this phase.
- Define protocol version and rules version; define the local-seat/player-ID mapping.

**Exit:** decisions above are reflected in this document and all multiplayer behavior has a named owner (host or seat).

### Phase 1 — Seat-aware game core and views

- Generalize local-seat UI and setup swaps without changing solo rule behavior.
- Implement and unit-test per-player snapshot projections and a canonical host action dispatcher.
- Confirm that a host can play all existing engine transitions as seat 0 and remote seats can be the current actor.

**Exit:** projection tests prove guests cannot observe secret cards, authority tests reject out-of-turn and forged commands, and all existing single-player tests remain valid.

### Phase 2 — Private room and signaling vertical slice

- Add room create/join, invite code/link, opt-in open-table discovery, host approval/roster, seat assignment, ready state, and one host-to-one-guest WebRTC connection.
- Implement versioned handshake, trickle ICE, timeouts, app-level retries, deduplication, broker failover, and clean teardown.
- Do not start a game until the 2-player connection and authoritative state handshake are complete.

**Exit:** two separate browser contexts can create/join a private room, connect, disconnect, retry, and close without leaking gameplay data into signaling; open listings expire and a listed room still requires host approval.

### Phase 3 — Complete two-player game

- Wire setup swaps, start/deal, play, pickup, ace choices, blind flips, burns, direction changes, placements, and end-of-game through host commands and filtered snapshots.
- Add the network status/paused presentation while preserving table layout.
- Keep online coins, solo score, resume, and single-player saves untouched.

**Exit:** a full two-player game completes from invite through result on two devices; rejected and duplicate commands cannot change the game twice.

### Phase 4 — Four players, disconnects, persistence

- Add the third guest, roster/capacity limits, host control, per-seat reconnect, host refresh restore, optional computer takeover after expiry, and session teardown.
- Validate game state/card conservation after every accepted host command.

**Exit:** four clients can finish a game; one disconnected/reconnected player retains the same seat and private view; host restart recovers or ends the room cleanly.

### Phase 5 — Full QA and release readiness

- Complete the automated test plan below, browser/device checks, accessibility review, responsive screenshot review, and network matrix.
- Measure snapshot sizes, startup/connect time, idle traffic, per-turn traffic, and memory cleanup; add a small development-only diagnostic view.
- Confirm chosen HTTPS app delivery, signaling reliability, TURN availability/credentials, expiry/rate limits, support copy, and privacy wording before inviting external players.

**Exit:** all acceptance criteria pass on supported browsers and separate networks; operational services are documented; there are no unreviewed failures in existing solo rules or UI.

## Verification plan

### Rule and authority tests

- Every engine rule remains valid with the human at any seat: setup swaps, turn rotation, 3 reversals, low turns, ace selection, jokers, burns, blind-card failures, card pickup/refill, escape placements, and final loser.
- Only the actor's assigned seat can play/pick up/swap/flip. A guest cannot issue host start/end, impersonate another seat, or submit a state patch.
- Duplicate sequence/message IDs are idempotent; stale base revisions are rejected and resynchronized; wrong room/epoch/protocol messages are dropped.
- Fuzz malformed JSON, invalid IDs/ranks, oversized messages, unknown commands, repeated commands, spoofed seat IDs, and disconnect during each phase.
- After every accepted action call `assertGame`; across complete seeded online simulations preserve exactly 54 unique cards and valid turn/phase invariants.

### Privacy tests

- Serialize snapshots for each seat and assert no opponent hand IDs, opponent hand ranks, down-card IDs/ranks, deck order, or hidden card positions appear.
- Check no hidden information leaks through the room roster, game log, rejection reasons, browser URL, signaling topics, console messages, error snapshots, or stale projection cache.
- Confirm blind cards become visible only after the host has committed the reveal and action result.

### Browser and network checks

- Two, three, and four browser contexts; one and multiple simultaneous guests; host/guest refresh; late invite; full room; duplicate join; expired invite; two rooms open at once.
- Desktop Chrome, Safari, Firefox, iOS Safari, and Android Chrome within the project’s supported baseline; test narrow phones, landscape, keyboard, touch, zoom, and reduced-motion.
- Direct LAN, separate home networks, mobile hotspot, VPN, restrictive NAT/firewall, and TURN relay-only. Include one test where UDP is blocked.
- Drop/duplicate/reorder signaling packets; broker disconnect/failover; ICE candidate arriving before SDP; channel closes during setup, turn, blind reveal, and end-state; app tab is backgrounded or device sleeps.
- Verify heartbeat expiry and bounded reconnect, refresh recovery, computer takeover, host leave, and cleanup of old room state.
- Verify local solo saves, wallet, menu, and full game interactions are unchanged by creating/ending multiplayer sessions.

### Product acceptance criteria

- A new user can create a room, copy/share an invite, join on another device, and understand who is host and whose turn it is without reading network instructions.
- Both desktop and phone layouts remain fullscreen and usable; the game does not expose or hint at opponents' hidden cards.
- A disconnected player cannot cause skipped/automatic turns; everyone sees a clear paused/reconnecting state and available next actions.
- Hosts and guests can finish, leave, or recover without corrupting their solo save, score, or wallet.
- Multiplayer requires no account, plugin, dependency installation, or manual SDP copy/paste.
- The UI explains a failed connection in actionable terms, and the development diagnostics make it possible to distinguish signaling failure, ICE failure, relay failure, protocol mismatch, and game-command rejection.

## Deferred scope

- Ranked matchmaking or identity-backed public matchmaking.
- Online wallet, buy-ins, payout, persistent leaderboard, or trusted tournament results.
- Host migration, spectators, reconnecting into a running room as a new player, and more than four seats.
- Voice/text chat, accounts, moderation systems, matchmaking backend, and mobile push notifications.
- Cryptographic fairness against a malicious host.
- Multiplayer Sites hosting or automatic source synchronization.

## Technical references

- Current DevildaggersV2 reference: `/Users/kevin/Documents/ChatGPT/devildaggersV2/MULTIPLAYER.md` and the sibling `src/signaling.ts`, `src/lobbies.ts`, `src/multiplayer.ts`, `tests/signaling.test.ts`, and `tests/lobby-joining.test.ts`. Reuse lobby/offer-answer/ICE recovery lessons, not its game-specific simulation transport or binary state optimizations.
- [WebRTC.org: Getting started with peer connections](https://webrtc.org/getting-started/peer-connections) — signaling, ICE candidates, offer/answer, and trickle ICE.
- [WebRTC.org: TURN server](https://webrtc.org/getting-started/turn-server) — why TURN relay service is needed for peers that cannot connect directly.
- [W3C WebRTC specification](https://www.w3.org/TR/webrtc/) — peer connection and data-channel APIs.
- [MDN: RTCDataChannel ordered property](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/ordered) — default ordered delivery and channel configuration.
- [MDN: Using WebRTC data channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels) — data-channel behavior and encrypted WebRTC transport.
