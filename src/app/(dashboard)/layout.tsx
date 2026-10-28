import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // If unauthenticated, redirect to login
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F4F0] text-[#041a24] selection:bg-[#041a24] selection:text-[#F4F4F0]">
      {/* Midnight Oceanic Cyan Sidebar */}
      <Sidebar userRole={user.role} userName={user.fullName} />

      {/* Main Parchment Broadsheet Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header userRole={user.role} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}
