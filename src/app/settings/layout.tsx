import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={session.user as any} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar user={session.user as any} />
        <main className="flex-1 overflow-y-auto"><div className="page-container p-6">{children}</div></main>
      </div>
    </div>
  );
}
