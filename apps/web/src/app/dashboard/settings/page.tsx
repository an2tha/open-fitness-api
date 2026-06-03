import { redirect } from 'next/navigation';
import DashboardSettingsClient from './settings-client';

export default function DashboardSettingsPage() {
  if (process.env.API_ONLY === 'true') {
    redirect('/docs');
  }

  return <DashboardSettingsClient />;
}
