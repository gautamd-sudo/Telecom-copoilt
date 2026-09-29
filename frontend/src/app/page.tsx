import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function Home() {
  const cookieStore = cookies();
  const token = cookieStore.get('telecom_auth_token')?.value;

  const isAuthenticated = Boolean(
    token && 
    token.trim() !== '' && 
    token !== 'undefined' && 
    token !== 'null' && 
    token.split('.').length === 3
  );

  if (isAuthenticated) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
