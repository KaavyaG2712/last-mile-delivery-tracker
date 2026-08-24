import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEMO_USERS } from '@/types/auth';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    let targetUser = DEMO_USERS.find((u) => u.id === userId);

    if (!targetUser) {
      // Check database
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      if (dbUser) {
        targetUser = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role as any,
          label: dbUser.name,
          badge: dbUser.role,
          description: `Active role: ${dbUser.role}`,
        };
      }
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const response = NextResponse.json({
      success: true,
      user: targetUser,
      message: `Session switched to ${targetUser.name} (${targetUser.role})`,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: targetUser.id,
      path: '/',
      httpOnly: false, // Accessible to client-side components for fast dynamic UI updates
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to switch user' }, { status: 500 });
  }
}
