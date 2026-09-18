import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Shell from './Shell';

export default async function Home() {
  const s = await getSession();
  if (!s) redirect('/login');
  return <Shell />;
}
