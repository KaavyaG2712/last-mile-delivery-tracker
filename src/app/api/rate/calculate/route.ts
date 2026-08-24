import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateRateQuote, determineZoneScope } from '@/lib/rateEngine';
import { RateQuoteInput, ZoneData, PincodeInfo } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      lengthCm,
      breadthCm,
      heightCm,
      actualWeightKg,
      orderType,
      paymentType,
      pickupPincode,
      dropPincode,
    } = body;

    if (
      !lengthCm ||
      !breadthCm ||
      !heightCm ||
      !actualWeightKg ||
      !orderType ||
      !paymentType ||
      !pickupPincode ||
      !dropPincode
    ) {
      return NextResponse.json(
        { error: 'Missing required parameters for rate calculation' },
        { status: 400 }
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

    if (input.lengthCm <= 0 || input.breadthCm <= 0 || input.heightCm <= 0 || input.actualWeightKg <= 0) {
      return NextResponse.json(
        { error: 'Dimensions and actual weight must be positive numbers greater than zero' },
        { status: 400 }
      );
    }

    // Lookup Pincode Mappings
    const pickupMapping = await prisma.pincodeMapping.findUnique({
      where: { pincode: input.pickupPincode },
    });
    const dropMapping = await prisma.pincodeMapping.findUnique({
      where: { pincode: input.dropPincode },
    });

    if (!pickupMapping) {
      return NextResponse.json(
        { error: `Pickup pincode ${input.pickupPincode} is not currently in our serviceable network` },
        { status: 404 }
      );
    }

    if (!dropMapping) {
      return NextResponse.json(
        { error: `Drop pincode ${input.dropPincode} is not currently in our serviceable network` },
        { status: 404 }
      );
    }

    // Lookup Zones
    const [pickupZoneRaw, dropZoneRaw] = await Promise.all([
      prisma.zone.findUnique({ where: { code: pickupMapping.zoneCode } }),
      prisma.zone.findUnique({ where: { code: dropMapping.zoneCode } }),
    ]);

    if (!pickupZoneRaw || !dropZoneRaw) {
      return NextResponse.json(
        { error: 'Configured zone data missing for the requested pincodes' },
        { status: 500 }
      );
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

    const scope = determineZoneScope(pickupZone.code, dropZone.code);

    // Fetch dynamic RateCard from DB
    const rateCard = await prisma.rateCard.findFirst({
      where: {
        orderType: input.orderType,
        scope,
        isActive: true,
      },
    });

    if (!rateCard) {
      return NextResponse.json(
        { error: `No active rate card configured for Order Type ${input.orderType} and Scope ${scope}` },
        { status: 404 }
      );
    }

    const quote = calculateRateQuote(input, pickupZone, dropZone, rateCard as any);

    return NextResponse.json({
      success: true,
      data: {
        ...quote,
        pickupArea: pickupMapping.areaName,
        pickupCity: pickupMapping.city,
        dropArea: dropMapping.areaName,
        dropCity: dropMapping.city,
        rateCardId: rateCard.id,
      },
    });
  } catch (error: any) {
    console.error('Rate calculation API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during rate calculation' },
      { status: 500 }
    );
  }
}
