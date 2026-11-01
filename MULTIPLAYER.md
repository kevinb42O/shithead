# Online card club

Run locally with `npm run dev`, then open http://localhost:5173. The main menu's **Multiplayer** action opens the card club.

1. Enter your name and create a table. It appears automatically in other players' **Open tables** lists.
2. Friends enter their names and choose **Join table**. A table holds 2–4 people, including its host. **Copy invite** also creates a link to the room on the current app origin.
3. The host chooses **Deal the cards** when everyone is connected.
4. Each person chooses a hand card, then a face-up card, to swap them. Repeat as desired. Press **Ready** when finished. You can unready while others are choosing.
5. When everyone is ready, the host chooses a random opening seat and the game begins. Tap matching cards to select a group, tap individual selected cards to remove them, and use Play. Aces offer the appropriate low/high choices. Blind cards are selected individually. Picking up the pile ends the turn.
6. First out takes first place; the table continues until the Shithead remains. The host can deal a rematch, and everyone arranges their new cards and readies again.

Online tables are practice games. Solo saves, scores and virtual-coin wallets are separate. Keep the host tab open. An in-game disconnection pauses the match; this implementation does not migrate the host or restore a room after refresh. Leave the table and create a new one if a connection is permanently lost.

## Shared game presentation

The furnace on the left and turquoise lantern on the right are shared board toys. Click, tap or focus and press Enter to wake either one, including during another player's turn. The host validates each interaction and sends one seeded effect to every player over the reliable game data channels. Flames, smoke, embers and arcane motes follow the same choreography on both screens, anchored to each device's painted fixture. Delivery follows network latency; motion and sound honor each player's accessibility and audio settings. Scenery never locks a card move or changes a deal, and resyncs do not replay old taps. `tests/board-props.test.js` checks both directions through the serialized message path, deduplication, validation and deterministic particles.

The lobby is the only new screen. Dealing opens the original single-player table: same board, hand fan, card artwork, opponent portraits, drag controls, painted buttons, bottle, fire, spotlights and responsive layout. `dist/multiplayer/table-view.js` adapts each private view into `dist/app.js`; it does not render a second game. Every browser sees its own hand in the existing bottom seat. Ready / Not ready replaces Start Game during online setup.

## Network configuration

Discovery and room negotiation use the same redundant public MQTT-over-WebSocket broker approach as DevildaggersV2 (EMQX and HiveMQ). Game commands and private per-player snapshots travel through reliable ordered WebRTC data channels. Public brokers carry SDP/ICE and room membership metadata, never game hands or deck state. These public services have no uptime guarantee.

`dist/network-config.js` configures ICE servers. Public Google and Cloudflare STUN servers are supplied. For networks that need a relay, configure your TURN service through `globalThis.SHITHEAD_ICE_SERVERS`. Use short-lived relay credentials supplied by a credential service; do not publish provider API secrets. A TURN account is not bundled. Four browser clients on one machine prove transport operation, not compatibility with every remote firewall.

The host acts as a trusted dealer and can technically inspect the complete state. Guests receive their own hand, all public face-up cards, the pile, and concealed card counts. Hidden down cards and stock order never go to guests before reveal. The host validates phase, seat, turn, card ownership, legal moves and command sequence before committing an action. A game uses exactly 54 cards and the existing rules engine.

The existing public app URL is https://playshithead.vercel.app. This implementation was developed and validated locally; no deployment was performed.

## Validation

`npm test` includes `tests/online.test.js`: setup readiness and swaps, private projections, wrong-seat and duplicate-command rejection, and full authoritative games for 2–4 players. Browser validation exercised live public lobby discovery, real WebRTC between four browsers, the setup Ready gate, keyboard focus, mobile public cards, and a complete four-player match.

Run `node --test scripts/test-online-browser.mjs` with the local server running for dependency-free Chromium checks of the original shared table at nine desktop/phone/landscape sizes, 30-card hands, card inspection, focus/scroll persistence, the lobby refresh and busy/ack control recovery. Test fixtures are injected by the browser harness only.
