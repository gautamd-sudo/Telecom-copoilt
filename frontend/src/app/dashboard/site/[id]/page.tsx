import { redirect } from 'next/navigation';

export default function SiteDashboard() {
  // Demo redirect to general region dashboard for now to represent generic hierarchy
  redirect('/dashboard/region/na');
}
