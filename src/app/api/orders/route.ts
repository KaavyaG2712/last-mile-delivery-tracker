import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { calculateRateQuote, determineZoneScope } from '@/lib/rateEngine';
import { executeAtomicAgentAssignment } from '@/lib/assignmentEngine';
import { triggerOrderNotification } from '@/lib/notificationService';
import { evaluateSLA } from '@/lib/sla';
import { RateQuoteInput, ZoneData } from '@/lib/types';

function generateTrackingNumber(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LOGI-${rand}`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const { searchParams } = new URL(req.url);

    const statusFilter = searchParams.get('status');
    const zoneFilter = searchParams.get('zoneId');
    const agentFilter = searchParams.get('agentId');
    const customerFilter = searchParams.get('customerId');
    const searchQuery = searchParams.get('search');

    const whereClause: any = {};

    // Role-based scoping: Customers can only view their own orders unless Admin
    if (user.role === 'CUSTOMER') {
      whereClause.customerId = user.id;
    } else if (user.role === 'AGENT') {
      // Agents see their assigned orders or unassigned pending pickup in their zone
      whereClause.OR = [
        { assignedAgentId: user.id },
        { pickupZoneId: user.currentZoneId, status: 'PENDING_PICKUP' },
      ];
    }

    if (statusFilter && statusFilter !== 'ALL') {
      whereClause.status = statusFilter;
    }

    if (zoneFilter && zoneFilter !== 'ALL') {
      whereClause.OR = [
        { pickupZoneId: zoneFilter },
        { dropZoneId: zoneFilter },
      ];
    }

    if (agentFilter && agentFilter !== 'ALL') {
      whereClause.assignedAgentId = agentFilter;
    }

    if (customerFilter && customerFilter !== 'ALL' && user.role === 'ADMIN') {
      whereClause.customerId = customerFilter;
    }

    if (searchQuery) {
      const q = searchQuery.trim();
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { trackingNumber: { contains: q } },
            { recipientName: { contains: q } },
            { recipientPhone: { contains: q } },
            { pickupAddress: { contains: q } },
            { dropAddress: { contains: q } },
          ],
        },
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        assignedAgent: { select: { id: true, name: true, email: true, phone: true } },
        pickupZone: { select: { id: true, code: true, name: true } },
        dropZone: { select: { id: true, code: true, name: true } },
        statusLogs: {
          orderBy: { timestamp: 'desc' },
          take: 5,
          include: { actor: { select: { id: true, name: true, role: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedOrders = orders.map((order) => {
      const lastStatusUpdate = order.statusLogs[0]?.timestamp || order.updatedAt;
      const sla = evaluateSLA(order.status, lastStatusUpdate);
      return {
        ...order,
        slaEvaluation: sla,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedOrders,
      total: enrichedOrders.length,
    });
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const body = await req.json();

    const {
      recipientName,
      recipientPhone,
      pickupAddress,
      pickupPincode,
      dropAddress,
      dropPincode,
      lengthCm,
      breadthCm,
      heightCm,
      actualWeightKg,
      orderType,
      paymentType,
      targetCustomerId, // Optional: Admin creating on behalf of specific customer
      deliveryNotes,
    } = body;

    if (
      !recipientName ||
      !recipientPhone ||
      !pickupAddress ||
      !pickupPincode ||
      !dropAddress ||
      !dropPincode ||
      !lengthCm ||
      !breadthCm ||
      !heightCm ||
      !actualWeightKg ||
      !orderType ||
      !paymentType
    ) {
      return NextResponse.json(
        { error: 'Missing required order creation fields' },
        { status: 400 }
      );
    }

    // Determine target customer (Admin on behalf of customer, or active user)
    let customerId = user.id;
    if (user.role === 'ADMIN' && targetCustomerId) {
      customerId = targetCustomerId;
    }

    const customerRecord = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customerRecord) {
      return NextResponse.json({ error: 'Designated customer not found' }, { status: 404 });
    }

    // Lookup Pincode Mappings
    const [pickupMapping, dropMapping] = await Promise.all([
      prisma.pincodeMapping.findUnique({ where: { pincode: String(pickupPincode).trim() } }),
      prisma.pincodeMapping.findUnique({ where: { pincode: String(dropPincode).trim() } }),
    ]);

    if (!pickupMapping || !dropMapping) {
      return NextResponse.json(
        { error: 'Pickup or drop pincode is not within serviceable network' },
        { status: 404 }
      );
    }

    const [pickupZoneRaw, dropZoneRaw] = await Promise.all([
      prisma.zone.findUnique({ where: { code: pickupMapping.zoneCode } }),
      prisma.zone.findUnique({ where: { code: dropMapping.zoneCode } }),
    ]);

    if (!pickupZoneRaw || !dropZoneRaw) {
      return NextResponse.json({ error: 'Zone mappings missing' }, { status: 500 });
    }

    const pickupZone: ZoneData = {
      id: pickupZoneRaw.id,
      code: pickupZoneRaw.code,
      name: pickupZoneRaw.name,
      pincodes: pickupZoneRaw.pincodes.split(',').map((p) => p.trim()),
      adjacentZoneCodes: pickupZoneRaw.adjacentZoneCodes.split(',').map((p) => p.trim()),
      centerLat: pickupZoneRaw.centerLat,
      centerLng: pickupZoneRaw.centerLng,
    };

    const dropZone: ZoneData = {
      id: dropZoneRaw.id,
      code: dropZoneRaw.code,
      name: dropZoneRaw.name,
      pincodes: dropZoneRaw.pincodes.split(',').map((p) => p.trim()),
      adjacentZoneCodes: dropZoneRaw.adjacentZoneCodes.split(',').map((p) => p.trim()),
      centerLat: dropZoneRaw.centerLat,
      centerLng: dropZoneRaw.centerLng,
    };

    const zoneScope = determineZoneScope(pickupZone.code, dropZone.code);

    const rateCard = await prisma.rateCard.findFirst({
      where: { orderType, scope: zoneScope, isActive: true },
    });

    if (!rateCard) {
      return NextResponse.json(
        { error: `No active rate card for ${orderType} - ${zoneScope}` },
        { status: 404 }
      );
    }

    const input: RateQuoteInput = {
      lengthCm: Number(lengthCm),
      breadthCm: Number(breadthCm),
      heightCm: Number(heightCm),
      actualWeightKg: Number(actualWeightKg),
      orderType,
      paymentType,
      pickupPincode: String(pickupPincode).trim(),
      dropPincode: String(dropPincode).trim(),
    };

    const quote = calculateRateQuote(input, pickupZone, dropZone, rateCard);
    const trackingNumber = generateTrackingNumber();

    // Create Order in DB
    const newOrder = await prisma.order.create({
      data: {
        trackingNumber,
        customerId: customerRecord.id,
        recipientName,
        recipientPhone,
        pickupAddress,
        pickupPincode: input.pickupPincode,
        pickupZoneId: pickupZone.id,
        pickupLat: pickupMapping.lat,
        pickupLng: pickupMapping.lng,
        dropAddress,
        dropPincode: input.dropPincode,
        dropZoneId: dropZone.id,
        dropLat: dropMapping.lat,
        dropLng: dropMapping.lng,
        lengthCm: input.lengthCm,
        breadthCm: input.breadthCm,
        heightCm: input.heightCm,
        actualWeightKg: quote.actualWeightKg,
        volumetricWeightKg: quote.volumetricWeightKg,
        chargeableWeightKg: quote.chargeableWeightKg,
        orderType: quote.orderType,
        paymentType: quote.paymentType,
        zoneScope: quote.zoneScope,
        baseRateApplied: quote.baseRate,
        extraWeightCharge: quote.extraWeightCharge,
        codFeeApplied: quote.codSurcharge,
        fuelSurchargeApplied: quote.fuelSurchargeAmount,
        totalAmount: quote.totalAmount,
        status: 'PENDING_PICKUP',
        deliveryNotes,
        rescheduleToken: `resched_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`,
      },
    });

    // Immutable Initial Log
    await prisma.orderStatusLog.create({
      data: {
        orderId: newOrder.id,
        previousStatus: null,
        newStatus: 'PENDING_PICKUP',
        actorId: user.id,
        actorRole: user.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
        notes:
          user.role === 'ADMIN'
            ? `Admin placed order on behalf of customer ${customerRecord.name}`
            : 'Order confirmed by customer',
      },
    });

    // Trigger Smart Auto-Assignment with Concurrency Transaction
    const assignmentResult = await executeAtomicAgentAssignment(
      prisma,
      newOrder.id,
      null, // auto-select best candidate
      user.id,
      user.role === 'ADMIN' ? 'ADMIN' : 'SYSTEM',
      `Auto-assignment triggered upon order creation`
    );

    // Send confirmation notification
    await triggerOrderNotification(prisma, {
      orderId: newOrder.id,
      recipientEmail: customerRecord.email,
      recipientPhone: customerRecord.phone || undefined,
      customerName: customerRecord.name,
      trackingNumber: newOrder.trackingNumber,
      eventType: 'ORDER_CREATED',
    });

    // Refetch complete order
    const createdOrder = await prisma.order.findUnique({
      where: { id: newOrder.id },
      include: {
        assignedAgent: true,
        pickupZone: true,
        dropZone: true,
        statusLogs: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: createdOrder,
      quoteBreakdown: quote,
      assignment: assignmentResult,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
