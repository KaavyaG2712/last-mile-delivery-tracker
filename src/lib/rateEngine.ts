import {
  OrderType,
  PaymentType,
  ZoneScope,
  RateQuoteInput,
  RateQuoteBreakdown,
  RateCardData,
  PincodeInfo,
  ZoneData,
} from './types';

/**
 * Calculates the volumetric (dimensional) weight of a package in kilograms.
 * Formula: (Length x Breadth x Height in cm) / 5000
 */
export function calculateVolumetricWeight(
  lengthCm: number,
  breadthCm: number,
  heightCm: number
): number {
  if (lengthCm <= 0 || breadthCm <= 0 || heightCm <= 0) {
    throw new Error('Package dimensions must be positive non-zero numbers');
  }
  const volumetric = (lengthCm * breadthCm * heightCm) / 5000;
  return Math.round(volumetric * 100) / 100;
}

/**
 * Calculates the billable / chargeable weight.
 * Rule: MAX(Actual Weight, Volumetric Weight)
 */
export function calculateChargeableWeight(
  actualWeightKg: number,
  volumetricWeightKg: number
): number {
  if (actualWeightKg <= 0) {
    throw new Error('Actual weight must be greater than zero');
  }
  const maxWeight = Math.max(actualWeightKg, volumetricWeightKg);
  return Math.round(maxWeight * 100) / 100;
}

/**
 * Resolves a 6-digit pincode to its corresponding Zone and geographical coordinates.
 */
export function resolvePincodeZone(
  pincode: string,
  pincodeMappings: PincodeInfo[],
  zones: ZoneData[]
): { pincodeInfo: PincodeInfo; zone: ZoneData } {
  const cleanPin = pincode.trim();
  const mapping = pincodeMappings.find((m) => m.pincode === cleanPin);

  if (!mapping) {
    throw new Error(`Pincode "${pincode}" is outside our serviceable delivery network`);
  }

  const zone = zones.find((z) => z.code === mapping.zoneCode || z.id === mapping.zoneCode);
  if (!zone) {
    throw new Error(`Zone configuration missing for zone code "${mapping.zoneCode}"`);
  }

  return { pincodeInfo: mapping, zone };
}

/**
 * Determines whether a delivery is Intra-Zone or Inter-Zone.
 */
export function determineZoneScope(pickupZoneCode: string, dropZoneCode: string): ZoneScope {
  return pickupZoneCode === dropZoneCode ? 'INTRA_ZONE' : 'INTER_ZONE';
}

/**
 * Calculates the complete dynamic rate breakdown given package parameters, resolved zones, and rate card.
 * Strictly adheres to dynamic pricing rules with zero hardcoded rates.
 */
export function calculateRateQuote(
  input: RateQuoteInput,
  pickupZone: ZoneData,
  dropZone: ZoneData,
  rateCard: RateCardData
): RateQuoteBreakdown {
  const volumetricWeightKg = calculateVolumetricWeight(
    input.lengthCm,
    input.breadthCm,
    input.heightCm
  );

  const chargeableWeightKg = calculateChargeableWeight(input.actualWeightKg, volumetricWeightKg);

  const zoneScope = determineZoneScope(pickupZone.code, dropZone.code);

  const baseWeightKg = rateCard.baseWeightKg || 1.0;
  const baseRate = rateCard.baseRate;
  const perKgRate = rateCard.perKgRate;

  // Extra weight calculation
  const extraWeightKg = Math.max(0, Math.round((chargeableWeightKg - baseWeightKg) * 100) / 100);
  const extraWeightCharge = Math.round(extraWeightKg * perKgRate * 100) / 100;

  // Subtotal before surcharges
  const baseSubtotal = baseRate + extraWeightCharge;

  // COD Surcharge: Flat fee configured per order type if payment type is COD
  let codSurcharge = 0;
  if (input.paymentType === 'COD') {
    codSurcharge = Math.max(rateCard.codSurcharge || 0, rateCard.minCodFee || 0);
  }

  // Fuel / Operational Surcharge percentage (default 0 or configured)
  const fuelPercent = rateCard.fuelSurchargePercent || 0;
  const fuelSurchargeAmount = Math.round(((baseSubtotal + codSurcharge) * (fuelPercent / 100)) * 100) / 100;

  const totalAmount = Math.round((baseSubtotal + codSurcharge + fuelSurchargeAmount) * 100) / 100;

  return {
    actualWeightKg: input.actualWeightKg,
    volumetricWeightKg,
    chargeableWeightKg,
    orderType: input.orderType,
    paymentType: input.paymentType,
    pickupZoneCode: pickupZone.code,
    pickupZoneName: pickupZone.name,
    dropZoneCode: dropZone.code,
    dropZoneName: dropZone.name,
    zoneScope,
    baseRate,
    baseWeightKg,
    extraWeightKg,
    perKgRate,
    extraWeightCharge,
    codSurcharge,
    fuelSurchargePercent: fuelPercent,
    fuelSurchargeAmount,
    subtotal: baseSubtotal,
    totalAmount,
  };
}
