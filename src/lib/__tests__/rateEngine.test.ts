import {
  calculateVolumetricWeight,
  calculateChargeableWeight,
  determineZoneScope,
  calculateRateQuote,
} from '../rateEngine';
import { RateCardData, RateQuoteInput, ZoneData } from '../types';

export function runRateEngineTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${testName}`);
    } else {
      failed++;
      const msg = `  ✗ ${testName} ${detail ? `(${detail})` : ''}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  console.log('\n--- 🧪 TEST SUITE: RATE CALCULATION ENGINE ---');

  // Test 1: Volumetric Weight Formula (L * B * H) / 5000
  try {
    const vol1 = calculateVolumetricWeight(50, 40, 30); // 60000 / 5000 = 12.0
    assert(vol1 === 12.0, 'Volumetric Weight: 50x40x30 cm => 12.0 kg', `Expected 12.0, got ${vol1}`);

    const vol2 = calculateVolumetricWeight(20, 15, 10); // 3000 / 5000 = 0.6
    assert(vol2 === 0.6, 'Volumetric Weight: 20x15x10 cm => 0.6 kg', `Expected 0.6, got ${vol2}`);

    let threw = false;
    try {
      calculateVolumetricWeight(-10, 20, 30);
    } catch {
      threw = true;
    }
    assert(threw, 'Volumetric Weight: Throws error on negative/zero dimensions');
  } catch (err: any) {
    assert(false, 'Volumetric Weight calculation crashed', err.message);
  }

  // Test 2: Chargeable Weight: MAX(Actual, Volumetric)
  try {
    // Volumetric dominates
    const c1 = calculateChargeableWeight(5.0, 12.0);
    assert(c1 === 12.0, 'Chargeable Weight: MAX(5.0 kg actual, 12.0 kg vol) => 12.0 kg', `Got ${c1}`);

    // Actual dominates
    const c2 = calculateChargeableWeight(15.0, 12.0);
    assert(c2 === 15.0, 'Chargeable Weight: MAX(15.0 kg actual, 12.0 kg vol) => 15.0 kg', `Got ${c2}`);

    // Equal
    const c3 = calculateChargeableWeight(8.0, 8.0);
    assert(c3 === 8.0, 'Chargeable Weight: MAX(8.0, 8.0) => 8.0 kg', `Got ${c3}`);
  } catch (err: any) {
    assert(false, 'Chargeable Weight calculation crashed', err.message);
  }

  // Test 3: Zone Scope Determination
  try {
    const intra = determineZoneScope('ZONE_NORTH', 'ZONE_NORTH');
    assert(intra === 'INTRA_ZONE', 'Zone Scope: Same pickup & drop => INTRA_ZONE');

    const inter = determineZoneScope('ZONE_NORTH', 'ZONE_SOUTH');
    assert(inter === 'INTER_ZONE', 'Zone Scope: Different pickup & drop => INTER_ZONE');
  } catch (err: any) {
    assert(false, 'Zone Scope calculation crashed', err.message);
  }

  // Test 4: Dynamic Quote Calculation - B2C Intra-Zone
  try {
    const mockZoneNorth: ZoneData = {
      id: 'z_north',
      code: 'ZONE_NORTH',
      name: 'North Cluster',
      pincodes: ['110001', '110007'],
      adjacentZoneCodes: ['ZONE_CENTRAL'],
      centerLat: 28.7041,
      centerLng: 77.1025,
    };

    const b2cIntraCard: RateCardData = {
      orderType: 'B2C',
      scope: 'INTRA_ZONE',
      baseWeightKg: 1.0,
      baseRate: 45.0,
      perKgRate: 18.0,
      codSurcharge: 25.0,
      minCodFee: 25.0,
      fuelSurchargePercent: 5.0,
    };

    const quoteInputPrepaid: RateQuoteInput = {
      lengthCm: 25,
      breadthCm: 20,
      heightCm: 10,
      actualWeightKg: 1.2,
      orderType: 'B2C',
      paymentType: 'PREPAID',
      pickupPincode: '110001',
      dropPincode: '110007',
    };

    const quotePrepaid = calculateRateQuote(quoteInputPrepaid, mockZoneNorth, mockZoneNorth, b2cIntraCard);

    assert(quotePrepaid.volumetricWeightKg === 1.0, 'B2C Quote: Volumetric weight is 1.0 kg');
    assert(quotePrepaid.chargeableWeightKg === 1.2, 'B2C Quote: Chargeable weight is 1.2 kg (Actual > Volumetric)');
    assert(quotePrepaid.zoneScope === 'INTRA_ZONE', 'B2C Quote: Correctly identified INTRA_ZONE');
    assert(quotePrepaid.extraWeightCharge === 3.6, 'B2C Quote: Extra weight charge = 0.2 * 18 = 3.6');
    assert(quotePrepaid.codSurcharge === 0, 'B2C Quote: Prepaid has 0 COD surcharge');
    assert(quotePrepaid.totalAmount === 51.03, `B2C Quote: Prepaid Total Amount is 51.03 (Got ${quotePrepaid.totalAmount})`);

    // Now test same quote with COD
    const quoteInputCod: RateQuoteInput = {
      ...quoteInputPrepaid,
      paymentType: 'COD',
    };
    const quoteCod = calculateRateQuote(quoteInputCod, mockZoneNorth, mockZoneNorth, b2cIntraCard);
    assert(quoteCod.codSurcharge === 25.0, 'B2C Quote COD: Applies $25.0 COD Surcharge');
    assert(quoteCod.totalAmount === 77.28, `B2C Quote COD: Total is 77.28 (Got ${quoteCod.totalAmount})`);
  } catch (err: any) {
    assert(false, 'B2C Quote calculation crashed', err.message);
  }

  // Test 5: Dynamic Quote Calculation - B2B Inter-Zone (Heavy Cargo)
  try {
    const mockZoneSouth: ZoneData = {
      id: 'z_south',
      code: 'ZONE_SOUTH',
      name: 'South Cluster',
      pincodes: ['110016', '110017'],
      adjacentZoneCodes: ['ZONE_CENTRAL'],
      centerLat: 28.5355,
      centerLng: 77.241,
    };

    const mockZoneWest: ZoneData = {
      id: 'z_west',
      code: 'ZONE_WEST',
      name: 'West Cluster',
      pincodes: ['110015'],
      adjacentZoneCodes: ['ZONE_NORTH'],
      centerLat: 28.6517,
      centerLng: 77.1232,
    };

    const b2bInterCard: RateCardData = {
      orderType: 'B2B',
      scope: 'INTER_ZONE',
      baseWeightKg: 5.0,
      baseRate: 210.0,
      perKgRate: 16.0,
      codSurcharge: 65.0,
      minCodFee: 65.0,
      fuelSurchargePercent: 6.0,
    };

    const quoteInputB2B: RateQuoteInput = {
      lengthCm: 60,
      breadthCm: 50,
      heightCm: 40, // Volumetric = 24.0 kg
      actualWeightKg: 8.0,
      orderType: 'B2B',
      paymentType: 'COD',
      pickupPincode: '110015',
      dropPincode: '110017',
    };

    const quoteB2B = calculateRateQuote(quoteInputB2B, mockZoneWest, mockZoneSouth, b2bInterCard);
    assert(quoteB2B.volumetricWeightKg === 24.0, 'B2B Quote: Volumetric weight = 24.0 kg');
    assert(quoteB2B.chargeableWeightKg === 24.0, 'B2B Quote: Chargeable weight = 24.0 kg (Volumetric > Actual)');
    assert(quoteB2B.zoneScope === 'INTER_ZONE', 'B2B Quote: Correctly identified INTER_ZONE');
    assert(quoteB2B.extraWeightCharge === 304.0, 'B2B Quote: Extra weight charge = (24 - 5) * 16 = 304.0');
    assert(quoteB2B.codSurcharge === 65.0, 'B2B Quote: Flat B2B COD Surcharge = $65.0');
    assert(quoteB2B.totalAmount === 613.74, `B2B Quote: Total is 613.74 (Got ${quoteB2B.totalAmount})`);
  } catch (err: any) {
    assert(false, 'B2B Quote calculation crashed', err.message);
  }

  return { passed, failed, errors };
}
