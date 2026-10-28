import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ prodCode: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { prodCode } = await params;
  redirect(`/products?code=${encodeURIComponent(prodCode)}`);
}
