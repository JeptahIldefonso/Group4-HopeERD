const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = path.join('C:', 'Users', 'ildef', '.gemini', 'antigravity', 'brain', 'c91b77fd-c6e8-436a-8538-b02d68b673b3');

async function main() {
  const port = 9222;
  const userDataDir = path.join(process.cwd(), 'scratch', 'chrome-profile');
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

  console.log('Spawning Chrome with remote debugging on port', port);
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
  ]);

  await new Promise((r) => setTimeout(r, 1500));

  const versionRes = await fetch(`http://127.0.0.1:${port}/json/version`);
  const versionData = await versionRes.json();
  const wsUrl = versionData.webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.onopen = resolve);

  let idCounter = 1;
  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

  const sendSession = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, sessionId, method, params }));
    });
  };

  await sendSession('Network.enable');
  await sendSession('Page.enable');

  await sendSession('Network.setCookie', {
    name: 'hope_demo_role',
    value: 'admin',
    domain: 'localhost',
    path: '/',
  });
  await sendSession('Network.setCookie', {
    name: 'hope_demo_email',
    value: 'admin@hope.demo',
    domain: 'localhost',
    path: '/',
  });
  await sendSession('Network.setCookie', {
    name: 'hope_demo_name',
    value: 'Maria Santos (Admin)',
    domain: 'localhost',
    path: '/',
  });

  const targets = [
    {
      name: 'screenshot-products-clean-columns.png',
      url: 'http://localhost:3000/products?view=products&page=1&sort=lastSold&order=desc',
      width: 1440,
      height: 1000,
    },
    {
      name: 'screenshot-price-history-clean-columns.png',
      url: 'http://localhost:3000/products?view=history',
      width: 1440,
      height: 1000,
    },
  ];

  for (const t of targets) {
    console.log(`Setting viewport ${t.width}x${t.height} and navigating to ${t.url} ...`);
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: t.width,
      height: t.height,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await sendSession('Page.navigate', { url: t.url });
    await new Promise((r) => setTimeout(r, 2500));

    const { data } = await sendSession('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(data, 'base64');
    const outPath = path.join(artifactDir, t.name);
    fs.writeFileSync(outPath, buffer);
    console.log(`Captured ${t.name}: ${buffer.length} bytes -> ${outPath}`);
  }

  ws.close();
  chromeProc.kill();
  console.log('Finished capturing clean columns screenshots.');
}

main().catch((e) => {
  console.error('CDP Error:', e);
  process.exit(1);
});
