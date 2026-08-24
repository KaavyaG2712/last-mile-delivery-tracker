import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { evaluateSLA } from '@/lib/sla';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Search by ID or trackingNumber
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { trackingNumber: id }],
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            lat: true,
            lng: true,
            currentZoneId: true,
          },
        },
        pickupZone: true,
        dropZone: true,
        statusLogs: {
          orderBy: { timestamp: 'desc' },
          include: {
            actor: { select: { id: true, name: true, role: true } },
          },
        },
        notifications: {
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const lastUpdate = order.statusLogs[0]?.timestamp || order.updatedAt;
    const sla = evaluateSLA(order.status, lastUpdate);

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        slaEvaluation: sla,
      },
    });
  } catch (error: any) {
    console.error('Fetch order detail error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
