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
    <div className="flex h-screen overflow-hidden bg-[#F5F6F4] text-[#17231F] selection:bg-[#EAF2ED] selection:text-[#17231F] font-sans">
      {/* Enterprise Sidebar */}
      <Sidebar userRole={user.role} userName={user.fullName} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F5F6F4]">
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
