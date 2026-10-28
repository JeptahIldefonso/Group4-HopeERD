import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ orNo: string }>;
}

export default async function LegacyPaymentReceiptPage({ params }: PageProps) {
  const { orNo } = await params;
  redirect(`/receipts/${orNo}`);
}
