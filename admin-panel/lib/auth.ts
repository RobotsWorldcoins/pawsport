import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabase';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nucca.pt@gmail.com';
const SESSION_COOKIE = 'pawsport_admin_session';

export async function validateAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return false;

  // Verify token is a valid Supabase JWT for the admin user
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(sessionToken);
    if (error || !data.user) return false;
    return data.user.email === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

export async function adminLogin(email: string, password: string) {
  if (email !== ADMIN_EMAIL) {
    throw new Error('Unauthorized');
  }
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session?.access_token;
}
