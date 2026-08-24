import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { DEMO_USERS } from '@/types/auth';

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
