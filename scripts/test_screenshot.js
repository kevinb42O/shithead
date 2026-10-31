import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';

const isMobile = process.argv.includes('--mobile');
const width = isMobile ? 390 : 1400;
const height = isMobile ? 844 : 900;

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  '--remote-debugging-port=9227',
  `--window-size=${width},${height}`,
  'http://localhost:5173'
]);

const getWs = async () => {
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {
      const data = await new Promise((resolve, reject) => {
        const req = http.get('http://127.0.0.1:9227/json', (res) => {
          let chunk = '';
          res.on('data', c => chunk += c);
          res.on('end', () => resolve(chunk));
        });
        req.on('error', reject);
      });
      const list = JSON.parse(data);
      if (list[0]?.webSocketDebuggerUrl) return list[0].webSocketDebuggerUrl;
    } catch {}
  }
  throw new Error('Failed to connect to Chrome debugging port');
};

const wsUrl = await getWs();
const ws = new WebSocket(wsUrl);
await new Promise(r => ws.onopen = r);

let msgId = 1;
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const id = msgId++;
  const handler = (event) => {
    const data = JSON.parse(event.data);
    if (data.id === id) {
      ws.removeEventListener('message', handler);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };
  ws.addEventListener('message', handler);
  ws.send(JSON.stringify({ id, method, params }));
});

const evalJs = async (expr) => {
  const res = await call('Runtime.evaluate', { expression: `(() => { return (${expr}); })()`, returnByValue: true, awaitPromise: true });
  return res.result?.value;
};

const takeScreenshot = async (filename) => {
  const res = await call('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(filename, Buffer.from(res.data, 'base64'));
  console.log('Saved', filename);
};

await call('Page.enable');
await call('Runtime.enable');
if (isMobile) {
  await call('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
}
await new Promise(r => setTimeout(r, 1200));

// Click single player on main menu
await evalJs(`document.getElementById('menu-play').click()`);
await new Promise(r => setTimeout(r, 300));
await evalJs(`document.getElementById('deal-selected').click()`);
await new Promise(r => setTimeout(r, 600));

// Skip deal
await evalJs(`if(!document.getElementById('play').hidden) document.getElementById('play').click()`);
await new Promise(r => setTimeout(r, 800));

// Take setup phase screenshot
await takeScreenshot('screen_setup_ok.png');

// Start game (spins bottle)
await evalJs(`document.getElementById('play').click()`);

// Wait for bottle spin to complete and enter playing phase
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 500));
  const res = await evalJs(`({
    phase: document.body.dataset.phase,
    turn: document.body.dataset.turn,
    playHidden: document.getElementById('play').hidden,
    pickupHidden: document.getElementById('pickup').hidden,
    pileLength: document.querySelectorAll('.pile .card').length
  })`);
  console.log('Poll state:', i, res);
  if (res && res.turn !== '' && res.phase !== 'setup' && res.phase !== 'dealing') {
    break;
  }
}

// Check turn
let curTurn = await evalJs(`document.body.dataset.turn`);
console.log('Current turn after spin:', curTurn);

// Screenshot of current play state
await takeScreenshot('screen_turn_initial.png');

// If it's turn 1 (Fox's turn), wait until Fox plays and it becomes turn 0!
if (curTurn !== '0') {
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    curTurn = await evalJs(`document.body.dataset.turn`);
    console.log('Waiting for turn 0, now:', curTurn);
    if (curTurn === '0') break;
  }
  await new Promise(r => setTimeout(r, 600));
}

// Screenshot of Player's Turn with cards on the pile and NO card selected:
await takeScreenshot('screen_turn0_clean.png');

const turn0Status = await evalJs(`({
  playHidden: document.getElementById('play').hidden,
  pickupHidden: document.getElementById('pickup').hidden,
  pickupParent: document.getElementById('pickup').parentElement.className,
  pileCards: document.querySelectorAll('.pile .card').length
})`);
console.log('Player turn 0 status:', turn0Status);

// Now select a card in hand
await evalJs(`
  const c = document.querySelector('.hand .card.playable');
  if(c) c.click();
`);
await new Promise(r => setTimeout(r, 300));

const turn0Selected = await evalJs(`({
  playHidden: document.getElementById('play').hidden,
  playText: document.getElementById('play').textContent.trim()
})`);
console.log('Player turn 0 with selected card:', turn0Selected);

await takeScreenshot('screen_turn0_with_selection.png');

ws.close();
chrome.kill();
