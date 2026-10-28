async function testRoutes() {
  const routes = [
    '/',
    '/customers',
    '/customers?custNo=C0001',
    '/products',
    '/products?code=AK0001',
    '/sales',
    '/sales/TR000001',
    '/employees',
    '/reports',
    '/receipts/OR000001',
  ];

  for (const r of routes) {
    try {
      const res = await fetch('http://localhost:3000' + r);
      console.log(`${r} -> Status ${res.status}`);
      if (res.status !== 200) {
        const text = await res.text();
        console.log(`Error body for ${r}:`, text.slice(0, 300));
      }
    } catch (err) {
      console.log(`Failed to fetch ${r}:`, err.message);
    }
  }
}

testRoutes();
