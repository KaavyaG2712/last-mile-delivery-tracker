import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET() {
  try {
    const zones = await prisma.zone.findMany({
      include: {
        agents: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            currentLoad: true,
            maxCapacity: true,
          },
        },
        _count: {
          select: {
            pickupOrders: true,
            dropOrders: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    const pincodes = await prisma.pincodeMapping.findMany({
      orderBy: { pincode: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        zones,
        pincodes,
      },
    });
  } catch (error: any) {
    console.error('Fetch zones error:', error);
    return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { code, name, pincodes, adjacentZoneCodes, centerLat, centerLng } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Code and Name are required' }, { status: 400 });
    }

    const zone = await prisma.zone.create({
      data: {
        code: code.trim().toUpperCase(),
        name,
        pincodes: pincodes || '',
        adjacentZoneCodes: adjacentZoneCodes || '',
        centerLat: Number(centerLat || 28.6139),
        centerLng: Number(centerLng || 77.209),
      },
    });

    return NextResponse.json({ success: true, data: zone });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create zone' }, { status: 500 });
  }
}
