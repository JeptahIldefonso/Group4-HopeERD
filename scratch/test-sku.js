const { detectCategoryAndBrand, generateStructuredSkuCode } = require('../src/lib/products');

console.log('Testing SKU Generator & Detector:');

const testCases = [
  'Ryzen 5 5600G',
  'AMD Ryzen 5 5600G | 6 Cores 12 Threads | 3.9GHz',
  'Intel Core i5-12400F',
  'NVIDIA GeForce RTX 4060',
  'Gigabyte B550M DS3H',
  'Corsair Vengeance DDR5 32GB',
  'Samsung 980 1TB NVMe SSD',
  'Deepcool CC560 ATX Mid Tower Case',
  'Logitech G102 Optical Gaming Mouse',
];

const existing = ['CPU-AMD-000008', 'CPU-R5-5600', 'CPU-I5-12400F'];

for (const t of testCases) {
  const d = detectCategoryAndBrand(t);
  const sku = generateStructuredSkuCode(d.category, d.brand, existing);
  console.log(`Input: "${t}"`);
  console.log(`  -> Category: ${d.category} (${d.categoryLabel}), Brand: ${d.brand}`);
  console.log(`  -> Generated SKU: ${sku.code} (Seq: ${sku.seqStr})\n`);
}
