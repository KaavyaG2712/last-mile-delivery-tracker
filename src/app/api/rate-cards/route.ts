import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET() {
  try {
    const rateCards = await prisma.rateCard.findMany({
      orderBy: [{ orderType: 'asc' }, { scope: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: rateCards,
    });
  } catch (error: any) {
    console.error('Fetch rate cards error:', error);
    return NextResponse.json({ error: 'Failed to fetch rate cards' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { id, baseRate, perKgRate, baseWeightKg, codSurcharge, minCodFee, fuelSurchargePercent, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Rate card ID required' }, { status: 400 });
    }

    const updated = await prisma.rateCard.update({
      where: { id },
      data: {
        baseRate: baseRate != null ? Number(baseRate) : undefined,
        perKgRate: perKgRate != null ? Number(perKgRate) : undefined,
        baseWeightKg: baseWeightKg != null ? Number(baseWeightKg) : undefined,
        codSurcharge: codSurcharge != null ? Number(codSurcharge) : undefined,
        minCodFee: minCodFee != null ? Number(minCodFee) : undefined,
        fuelSurchargePercent: fuelSurchargePercent != null ? Number(fuelSurchargePercent) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Update rate card error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update rate card' }, { status: 500 });
  }
}
