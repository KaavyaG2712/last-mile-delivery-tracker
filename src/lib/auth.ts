import { cookies } from 'next/headers';
import prisma from './prisma';
import { AuthUser, DEMO_USERS } from '../types/auth';

export const SESSION_COOKIE_NAME = 'logitrack_active_user_id';

/**
 * Retrieves the currently active user from cookie session with fallback to Admin.
 */
export async function getAuthenticatedUser(): Promise<AuthUser> {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionUserId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: sessionUserId },
      });
      if (user) {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as 'ADMIN' | 'AGENT' | 'CUSTOMER',
          phone: user.phone,
          currentZoneId: user.currentZoneId,
          status: user.status,
        };
      }
    } catch {
      // Fallback if DB not ready
    }
  }

  // Default fallback user for immediate seamless inspection
  const defaultDemo = DEMO_USERS[0];
  return {
    id: defaultDemo.id,
    name: defaultDemo.name,
    email: defaultDemo.email,
    role: defaultDemo.role,
  };
}
