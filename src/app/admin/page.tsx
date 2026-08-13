import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authConfig } from '@/lib/auth.config';
import { getDashboardStats } from '@/lib/dashboard-actions';
import DashboardClient from '@/components/dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authConfig);
  
  if (!session) {
    redirect('/login');
  }

  const stats = await getDashboardStats();
  const userName = session.user?.username || session.user?.email || 'Nutrióloga';

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <DashboardClient stats={stats} userName={userName} />
    </div>
  );
}