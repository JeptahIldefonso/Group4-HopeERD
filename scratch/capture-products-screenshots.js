const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = path.join('C:', 'Users', 'ildef', '.gemini', 'antigravity', 'brain', 'c91b77fd-c6e8-436a-8538-b02d68b673b3');

async function main() {
  console.log('Warming up http://localhost:3000/products ...');
  try {
    const res = await fetch('http://localhost:3000/products');
    console.log('Warmup status:', res.status);
    await new Promise((r) => setTimeout(r, 2000));
  } catch (e) {
    console.error('Warmup failed:', e.message);
  }

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
    const outPath = path.join(artifactDir, t.name);
    console.log(`Capturing ${t.name} from ${t.url} ...`);
    // Use --virtual-time-budget=5000 to allow full rendering
    const cmd = `"${chromePath}" --headless --disable-gpu --virtual-time-budget=5000 --hide-scrollbars --window-size=${t.width},${t.height} --screenshot="${outPath}" "${t.url}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(`Saved: ${outPath} (size: ${fs.statSync(outPath).size} bytes)`);
  }
  console.log('All screenshots captured successfully.');
}

main();
