import { cookies } from 'next/headers';
import prisma from './prisma';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'AGENT' | 'CUSTOMER';
  phone?: string | null;
  currentZoneId?: string | null;
  status?: string;
}

export const DEMO_USERS: Array<{
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'AGENT' | 'CUSTOMER';
  label: string;
  badge: string;
  description: string;
}> = [
  {
    id: 'user_admin_01',
    name: 'Eleanor Vance',
    email: 'admin@logitrack.io',
    role: 'ADMIN',
    label: 'Operations Director',
    badge: 'Admin',
    description: 'Full system control, zone configs, rate cards, and manual overrides',
  },
  {
    id: 'user_agent_01',
    name: 'Rahul Sharma',
    email: 'rahul.agent@logitrack.io',
    role: 'AGENT',
    label: 'North Hub Delivery Partner',
    badge: 'Agent (North)',
    description: 'Zone North active agent, mobile delivery status actions',
  },
  {
    id: 'user_agent_02',
    name: 'David Chen',
    email: 'david.agent@logitrack.io',
    role: 'AGENT',
    label: 'South Hub Delivery Partner',
    badge: 'Agent (South)',
    description: 'Zone South active agent, mobile delivery status actions',
  },
  {
    id: 'user_customer_01',
    name: 'Acme Enterprise Solutions',
    email: 'acme.corp@example.com',
    role: 'CUSTOMER',
    label: 'Enterprise Logistics Client',
    badge: 'Customer (B2B)',
    description: 'High-volume commercial shipper with B2B rate cards',
  },
  {
    id: 'user_customer_02',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@example.com',
    role: 'CUSTOMER',
    label: 'Direct Retail Customer',
    badge: 'Customer (B2C)',
    description: 'Individual ecommerce parcel recipient and shipper',
  },
];

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
