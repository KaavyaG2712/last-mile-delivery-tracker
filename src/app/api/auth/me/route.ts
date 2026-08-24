import { NextResponse } from 'next/server';
import { getAuthenticatedUser, DEMO_USERS } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    return NextResponse.json({
      success: true,
      user,
      demoUsers: DEMO_USERS,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Auth error' }, { status: 500 });
  }
}
