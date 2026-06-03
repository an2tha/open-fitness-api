import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client';

export default function DashboardPage() {
  if (process.env.API_ONLY === 'true') {
    redirect('/docs');
  }

  return <DashboardClient />;
}
