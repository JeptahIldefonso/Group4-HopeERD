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

  // Wait 1.5s for Chrome to start
  await new Promise((r) => setTimeout(r, 1500));

  // Get WebSocket debugger URL
  const versionRes = await fetch(`http://127.0.0.1:${port}/json/version`);
  const versionData = await versionRes.json();
  const wsUrl = versionData.webSocketDebuggerUrl;
  console.log('Chrome WS URL:', wsUrl);

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

  // Create target tab
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

  // Set demo admin cookies
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
      name: 'screenshot-products-desktop.png',
      url: 'http://localhost:3000/products',
      width: 1440,
      height: 900,
    },
    {
      name: 'screenshot-product-detail-desktop.png',
      url: 'http://localhost:3000/products?code=CPU-R5-5600',
      width: 1440,
      height: 960,
    },
    {
      name: 'screenshot-price-history-desktop.png',
      url: 'http://localhost:3000/products?view=history',
      width: 1440,
      height: 900,
    },
    {
      name: 'screenshot-products-tablet.png',
      url: 'http://localhost:3000/products',
      width: 820,
      height: 1180,
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
    // Wait 2.5s for page to render
    await new Promise((r) => setTimeout(r, 2500));

    const { data } = await sendSession('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(data, 'base64');
    const outPath = path.join(artifactDir, t.name);
    fs.writeFileSync(outPath, buffer);
    console.log(`Captured ${t.name}: ${buffer.length} bytes -> ${outPath}`);
  }

  ws.close();
  chromeProc.kill();
  console.log('All CDP screenshots captured successfully.');
}

main().catch((e) => {
  console.error('CDP Error:', e);
  process.exit(1);
});
