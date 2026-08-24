import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { executeAtomicAgentAssignment } from '@/lib/assignmentEngine';
import { triggerOrderNotification } from '@/lib/notificationService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      token,
      trackingNumber,
      orderId,
      rescheduleDate,
      rescheduleTimeSlot,
      deliveryNotes,
    } = body;

    if (!rescheduleDate || !rescheduleTimeSlot) {
      return NextResponse.json(
        { error: 'Preferred delivery date and time slot are required' },
        { status: 400 }
      );
    }

    // Find order
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          token ? { rescheduleToken: token } : null,
          trackingNumber ? { trackingNumber } : null,
          orderId ? { id: orderId } : null,
        ].filter(Boolean) as any,
      },
      include: {
        customer: true,
        pickupZone: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Invalid or expired reschedule token / shipment not found' },
        { status: 404 }
      );
    }

    const previousStatus = order.status;
    const parsedDate = new Date(rescheduleDate);

    // Update order status and schedule details
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'RESCHEDULED',
        rescheduleDate: parsedDate,
        rescheduleTimeSlot,
        deliveryNotes: deliveryNotes || order.deliveryNotes,
      },
    });

    // Log immutable audit entry
    await prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        previousStatus,
        newStatus: 'RESCHEDULED',
        actorId: order.customerId,
        actorRole: 'CUSTOMER',
        notes: `Customer rescheduled delivery for ${parsedDate.toLocaleDateString()} (${rescheduleTimeSlot}). ${
          deliveryNotes ? `Note: ${deliveryNotes}` : ''
        }`,
      },
    });

    // Smart Agent Reassignment for Rescheduled Attempt
    const assignmentResult = await executeAtomicAgentAssignment(
      prisma,
      order.id,
      null, // auto-select best available agent
      order.customerId,
      'SYSTEM',
      `Auto-reassigned agent for rescheduled delivery slot (${rescheduleTimeSlot})`
    );

    // Send confirmation notification
    await triggerOrderNotification(prisma, {
      orderId: order.id,
      recipientEmail: order.customer.email,
      recipientPhone: order.customer.phone || undefined,
      customerName: order.customer.name,
      trackingNumber: order.trackingNumber,
      eventType: 'RESCHEDULED',
    });

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        assignedAgent: true,
        statusLogs: { orderBy: { timestamp: 'desc' } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Delivery successfully rescheduled and agent reassigned',
      data: updatedOrder,
      assignment: assignmentResult,
    });
  } catch (error: any) {
    console.error('Reschedule API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reschedule delivery' },
      { status: 500 }
    );
  }
}
