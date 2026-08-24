import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      include: {
        currentZone: true,
        _count: {
          select: {
            assignedOrders: {
              where: {
                status: {
                  in: ['PENDING_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'RESCHEDULED'],
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: agents.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone,
        status: a.status,
        currentZoneId: a.currentZoneId,
        zoneName: a.currentZone?.name || 'Unassigned',
        zoneCode: a.currentZone?.code || null,
        lat: a.lat,
        lng: a.lng,
        maxCapacity: a.maxCapacity,
        currentLoad: a._count.assignedOrders,
      })),
    });
  } catch (error: any) {
    console.error('Fetch agents error:', error);
    return NextResponse.json({ error: 'Failed to fetch delivery agents' }, { status: 500 });
  }
}
