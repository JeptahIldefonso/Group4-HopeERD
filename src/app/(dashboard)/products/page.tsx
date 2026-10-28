import React, { Suspense } from 'react';
import { getProductsPageData } from '@/lib/data/products';
import { ProductsMainView } from '@/components/products/ProductsMainView';
import { getCurrentUser } from '@/app/actions/auth';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [data, user] = await Promise.all([
    getProductsPageData(),
    getCurrentUser(),
  ]);

  const userRole = user?.role || 'admin';

  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-10 bg-neutral-200 rounded w-48"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-neutral-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-neutral-200 rounded"></div>
        </div>
      }
    >
      <ProductsMainView
        initialProducts={data.products}
        initialPriceHistory={data.priceHistory}
        metrics={data.metrics}
        userRole={userRole}
      />
    </Suspense>
  );
}
