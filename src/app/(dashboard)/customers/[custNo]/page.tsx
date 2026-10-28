import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ custNo: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { custNo } = await params;
  redirect(`/customers?custNo=${custNo}`);
}
