import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { executeAtomicAgentAssignment } from '@/lib/assignmentEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    const { id } = params;
    const body = await req.json().catch(() => ({}));

    const { agentId, notes, autoAssign } = body;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { trackingNumber: id }],
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can reassign delivery agents' },
        { status: 403 }
      );
    }

    const targetAgentId = autoAssign ? null : (agentId || null);

    const result = await executeAtomicAgentAssignment(
      prisma,
      order.id,
      targetAgentId,
      user.id,
      'ADMIN',
      notes || (targetAgentId ? `Admin manually reassigned agent` : `Admin triggered smart auto-assignment`)
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.reason || 'Failed to assign agent' },
        { status: 422 }
      );
    }

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { assignedAgent: true },
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      assignment: result,
    });
  } catch (error: any) {
    console.error('Agent assignment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign agent' },
      { status: 500 }
    );
  }
}
