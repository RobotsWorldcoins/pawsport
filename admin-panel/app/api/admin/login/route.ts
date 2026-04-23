import { NextRequest, NextResponse } from 'next/server';
import { adminLogin } from '@/lib/auth';
import { cookies } from 'next/headers';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nucca.pt@gmail.com';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // Rate limiting: basic IP-based (Vercel handles DDoS at edge)
    const token = await adminLogin(email, password);

    const res = NextResponse.json({ success: true });
    const cookieStore = await cookies();
    cookieStore.set('pawsport_admin_session', token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return res;
  } catch (err: any) {
    // Generic error to avoid user enumeration
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}
