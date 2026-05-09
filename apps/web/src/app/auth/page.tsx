import { headers } from 'next/headers';
import AuthForm from './auth-form';

export const dynamic = 'force-dynamic';

async function getAllowNewLogins() {
  try {
    const h = await headers();
    const protocol = h.get('x-forwarded-proto') ?? 'http';
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
    const origin = `${protocol}://${host}`;

    const response = await fetch(`${origin}/api/v1/auth/settings`, {
      cache: 'no-store',
      headers: {
        'x-forwarded-proto': protocol,
        'x-forwarded-host': host,
      },
    });

    if (!response.ok) return true;

    const data = (await response.json()) as { allowNewLogins?: boolean };
    return data.allowNewLogins !== false;
  } catch {
    return true;
  }
}

export default async function AuthPage() {
  const allowNewLogins = await getAllowNewLogins();
  return <AuthForm allowNewLogins={allowNewLogins} />;
}
