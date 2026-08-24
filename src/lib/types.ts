export type OrderType = 'B2B' | 'B2C';
export type PaymentType = 'PREPAID' | 'COD';
export type ZoneScope = 'INTRA_ZONE' | 'INTER_ZONE';

export type OrderStatus =
  | 'PENDING_PICKUP'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'RESCHEDULED';

export type UserRole = 'ADMIN' | 'AGENT' | 'CUSTOMER';
export type ActorRole = 'SYSTEM' | 'ADMIN' | 'AGENT' | 'CUSTOMER';

export interface RateQuoteInput {
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  actualWeightKg: number;
  orderType: OrderType;
  paymentType: PaymentType;
  pickupPincode: string;
  dropPincode: string;
}

export interface RateQuoteBreakdown {
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  orderType: OrderType;
  paymentType: PaymentType;
  pickupZoneCode: string;
  pickupZoneName: string;
  dropZoneCode: string;
  dropZoneName: string;
  zoneScope: ZoneScope;
  baseRate: number;
  baseWeightKg: number;
  extraWeightKg: number;
  perKgRate: number;
  extraWeightCharge: number;
  codSurcharge: number;
  fuelSurchargePercent: number;
  fuelSurchargeAmount: number;
  subtotal: number;
  totalAmount: number;
}

export interface RateCardData {
  id?: string;
  orderType: OrderType;
  scope: ZoneScope;
  baseWeightKg: number;
  baseRate: number;
  perKgRate: number;
  codSurcharge: number;
  minCodFee: number;
  fuelSurchargePercent: number;
  isActive?: boolean;
}

export interface ZoneData {
  id: string;
  code: string;
  name: string;
  pincodes: string[];
  adjacentZoneCodes: string[];
  centerLat: number;
  centerLng: number;
}

export interface PincodeInfo {
  pincode: string;
  areaName: string;
  city: string;
  state: string;
  zoneCode: string;
  lat: number;
  lng: number;
}

export interface AgentCandidate {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  currentZoneId?: string | null;
  zoneCode?: string | null;
  status: string;
  lat?: number | null;
  lng?: number | null;
  maxCapacity: number;
  currentLoad: number;
  distanceKm?: number;
  isAdjacent?: boolean;
  score?: number;
}

export interface SLAThresholds {
  warningMinutes: number;
  breachMinutes: number;
}

export type SLAStatus = 'ON_TRACK' | 'WARNING' | 'BREACHED' | 'TERMINAL';

export interface SLAEvaluation {
  status: SLAStatus;
  timeInStateMinutes: number;
  slaLimitMinutes: number;
  label: string;
  colorClass: {
    badge: string;
    text: string;
    border: string;
    bg: string;
  };
}
