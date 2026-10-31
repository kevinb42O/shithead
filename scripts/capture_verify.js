import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';

async function capture(mode) {
  const isMobile = mode === 'mobile';
  const width = isMobile ? 390 : 1400;
  const height = isMobile ? 844 : 900;
  const port = isMobile ? 9230 : 9231;

  const tmpDir = fs.mkdtempSync('/tmp/chrome-test-');
  console.log(`Starting capture for ${mode} (${width}x${height})...`);
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    `--user-data-dir=${tmpDir}`,
    `--remote-debugging-port=${port}`,
    `--window-size=${width},${height}`,
    'http://localhost:5173'
  ]);

  const getWs = async () => {
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 400));
      try {
        const data = await new Promise((resolve, reject) => {
          const req = http.get(`http://127.0.0.1:${port}/json`, (res) => {
            let chunk = '';
            res.on('data', c => chunk += c);
            res.on('end', () => resolve(chunk));
          });
          req.on('error', reject);
        });
        const list = JSON.parse(data);
        const page = list.find(t => t.type === 'page' && (t.url.includes('5173') || t.title.includes('Shithead')));
        if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      } catch {}
    }
    throw new Error('Failed to connect to Chrome debugging port ' + port);
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

  await call('Page.enable');
  await call('Runtime.enable');
  if (isMobile) {
    await call('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
  } else {
    await call('Emulation.setDeviceMetricsOverride', {
      width: 1400,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
  }
  await new Promise(r => setTimeout(r, 1500));

  const evalJsClean = async (expr) => {
    const res = await call('Runtime.evaluate', { expression: `(() => { return (${expr}); })()`, returnByValue: true, awaitPromise: true });
    return res.result?.value;
  };

  const takeScreenshot = async (filename) => {
    const res = await call('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width, height, scale: 1 },
      captureBeyondViewport: false
    });
    fs.writeFileSync(filename, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${filename}`);
  };

  // Click single player on main menu
  console.log('Clicking menu-play...');
  await evalJsClean(`document.getElementById('menu-play').click()`);
  await new Promise(r => setTimeout(r, 500));

  console.log('Clicking deal-selected...');
  await evalJsClean(`document.getElementById('deal-selected').click()`);
  await new Promise(r => setTimeout(r, 500));

  const dialogState = await evalJsClean(`({
    open: document.getElementById('restart-dialog')?.open,
    menuOpen: document.body.classList.contains('menu-open')
  })`);
  console.log('Dialog state:', dialogState);

  if (dialogState?.open) {
    console.log('Clicking confirm-restart...');
    await evalJsClean(`document.getElementById('confirm-restart').click()`);
    await new Promise(r => setTimeout(r, 800));
  }

  // Skip deal
  console.log('Skipping deal...');
  await evalJsClean(`
    const play = document.getElementById('play');
    if (play && !play.hidden) play.click();
  `);
  await new Promise(r => setTimeout(r, 800));

  // Setup screenshot
  await takeScreenshot(`${mode}_setup.png`);

  // Start game (spins bottle)
  await evalJsClean(`
    const startBtn = document.getElementById('start-game-center');
    if (!startBtn.hidden) startBtn.click();
    else document.getElementById('play').click();
  `);

  // Wait for game to enter playing phase
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    const phase = await evalJsClean(`document.body.dataset.phase`);
    if (phase === 'playing') break;
  }

  await new Promise(r => setTimeout(r, 1200));
  await takeScreenshot(`${mode}_gameplay.png`);

  // If mobile, also test opening the mobile menu!
  if (isMobile) {
    await evalJsClean(`document.getElementById('mobile-menu-btn').click()`);
    await new Promise(r => setTimeout(r, 400));
    await takeScreenshot(`mobile_menu_open.png`);
    await evalJsClean(`document.getElementById('close-mobile-menu').click()`);
    await new Promise(r => setTimeout(r, 300));
  }

  ws.close();
  chrome.kill();
  console.log(`Capture for ${mode} completed.\n`);
}

async function main() {
  await capture('mobile');
  await capture('desktop');
}

main().catch(console.error);
