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
    <div className="flex h-screen overflow-hidden bg-[#F5F7F8] text-[#172B3A] selection:bg-[#E8F3EE] selection:text-[#172B3A] font-sans">
      {/* Enterprise Sidebar */}
      <Sidebar userRole={user.role} userName={user.fullName} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F5F7F8]">
        <Header userRole={user.role} />
        <main className="flex-1 overflow-y-auto p-5 sm:p-7 md:p-8 scroll-smooth">
          <div className="max-w-[1440px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
