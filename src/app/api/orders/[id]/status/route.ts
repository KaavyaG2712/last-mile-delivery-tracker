import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { triggerOrderNotification } from '@/lib/notificationService';
import { OrderStatus } from '@/lib/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    const { id } = params;
    const body = await req.json();

    const {
      status,
      notes,
      failureReason,
      locationLat,
      locationLng,
      isAdminOverride,
    } = body;

    const newStatus = status as OrderStatus;

    if (!newStatus) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { trackingNumber: id }],
      },
      include: {
        customer: true,
        assignedAgent: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const previousStatus = order.status;

    // Authorization & Validation
    if (user.role === 'AGENT' && order.assignedAgentId !== user.id && !isAdminOverride) {
      return NextResponse.json(
        { error: 'You are not assigned to this delivery order' },
        { status: 403 }
      );
    }

    const isFailureTransition = newStatus === 'FAILED';
    const isDeliveryCompletion = newStatus === 'DELIVERED';

    const rescheduleToken =
      order.rescheduleToken ||
      (isFailureTransition ? `resched_${Math.random().toString(36).substring(2, 10)}_${Date.now()}` : null);

    // Update order inside database transaction to ensure consistency
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // If delivery completed or failed, manage agent payload
      if (isDeliveryCompletion && order.assignedAgentId) {
        await tx.user.update({
          where: { id: order.assignedAgentId },
          data: { currentLoad: { decrement: 1 } },
        });
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: newStatus,
          failureReason: isFailureTransition ? (failureReason || notes || 'Delivery attempt unsuccessful') : order.failureReason,
          rescheduleToken: rescheduleToken || order.rescheduleToken,
        },
      });

      // Immutable Audit Log
      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          previousStatus,
          newStatus,
          actorId: user.id,
          actorRole: user.role,
          notes: notes || (isFailureTransition ? `Delivery failed: ${failureReason}` : `Status updated to ${newStatus}`),
          locationLat: locationLat ? Number(locationLat) : user.lat || null,
          locationLng: locationLng ? Number(locationLng) : user.lng || null,
        },
      });

      return updated;
    });

    // Trigger Notification for relevant lifecycle events
    if (['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'].includes(newStatus)) {
      const origin = req.headers.get('origin') || 'http://localhost:3000';
      const rescheduleUrl = `${origin}/reschedule/${rescheduleToken}`;

      await triggerOrderNotification(prisma, {
        orderId: order.id,
        recipientEmail: order.customer.email,
        recipientPhone: order.customer.phone || undefined,
        customerName: order.customer.name,
        trackingNumber: order.trackingNumber,
        eventType: newStatus as any,
        failureReason: failureReason || notes,
        rescheduleUrl,
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      previousStatus,
      newStatus,
    });
  } catch (error: any) {
    console.error('Status transition error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
