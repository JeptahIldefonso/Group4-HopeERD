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

  await sendSession('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 960,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // 1. Capture table with CPU-AMD-000008 selected in detail panel
  console.log('Navigating to CPU-AMD-000008 detail...');
  await sendSession('Page.navigate', { url: 'http://localhost:3000/products?code=CPU-AMD-000008' });
  await new Promise((r) => setTimeout(r, 2500));

  const shot1 = await sendSession('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'screenshot-product-detail-sku.png'), Buffer.from(shot1.data, 'base64'));
  console.log('Saved screenshot-product-detail-sku.png');

  // 2. Open Add Product modal and type Ryzen 5 5600G to show live SKU generator
  console.log('Triggering Add Product modal and entering Ryzen 5 5600G...');
  await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        // Find Add Product button
        const buttons = Array.from(document.querySelectorAll('button'));
        const addBtn = buttons.find(b => b.textContent.includes('Add Product'));
        if (addBtn) addBtn.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 800));

  // Type into description input
  await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const descInput = document.querySelector('input[placeholder*="AMD Ryzen"]');
        if (descInput) {
          // React synthetic event trigger
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(descInput, 'AMD Ryzen 5 5600G | 6 Cores 12 Threads | 3.9GHz');
          descInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 800));

  const shot2 = await sendSession('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'screenshot-add-product-sku-modal.png'), Buffer.from(shot2.data, 'base64'));
  console.log('Saved screenshot-add-product-sku-modal.png');

  ws.close();
  chromeProc.kill();
  console.log('Done.');
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
