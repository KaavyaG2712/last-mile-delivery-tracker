'use client';

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Box,
  Scale,
  MapPin,
  CreditCard,
  Building2,
  User,
  ArrowRight,
  Info,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { OrderType, PaymentType, RateQuoteBreakdown } from '@/lib/types';

interface RateCalculatorProps {
  initialValues?: {
    lengthCm?: number;
    breadthCm?: number;
    heightCm?: number;
    actualWeightKg?: number;
    orderType?: OrderType;
    paymentType?: PaymentType;
    pickupPincode?: string;
    dropPincode?: string;
  };
  onQuoteCalculated?: (quote: RateQuoteBreakdown | null) => void;
  showOrderNowButton?: boolean;
  onOrderNow?: () => void;
}

const PINCODE_PRESETS = [
  { pincode: '110001', name: 'Connaught Place (North/Central Hub)' },
  { pincode: '110007', name: 'Kamla Nagar / DU (North Hub)' },
  { pincode: '110016', name: 'Hauz Khas (South Hub)' },
  { pincode: '110017', name: 'Saket (South Hub)' },
  { pincode: '110015', name: 'Kirti Nagar (West Hub)' },
  { pincode: '110091', name: 'Mayur Vihar (East Hub)' },
];

export const RateCalculatorWidget: React.FC<RateCalculatorProps> = ({
  initialValues,
  onQuoteCalculated,
  showOrderNowButton = false,
  onOrderNow,
}) => {
  const [lengthCm, setLengthCm] = useState<number>(initialValues?.lengthCm || 30);
  const [breadthCm, setBreadthCm] = useState<number>(initialValues?.breadthCm || 20);
  const [heightCm, setHeightCm] = useState<number>(initialValues?.heightCm || 15);
  const [actualWeightKg, setActualWeightKg] = useState<number>(initialValues?.actualWeightKg || 2.0);
  const [orderType, setOrderType] = useState<OrderType>(initialValues?.orderType || 'B2C');
  const [paymentType, setPaymentType] = useState<PaymentType>(initialValues?.paymentType || 'PREPAID');
  const [pickupPincode, setPickupPincode] = useState<string>(initialValues?.pickupPincode || '110001');
  const [dropPincode, setDropPincode] = useState<string>(initialValues?.dropPincode || '110017');

  const [quote, setQuote] = useState<RateQuoteBreakdown | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Client-side quick metrics
  const localVolumetric = Math.round(((lengthCm * breadthCm * heightCm) / 5000) * 100) / 100;
  const localChargeable = Math.max(actualWeightKg, localVolumetric);
  const isVolumetricDominant = localVolumetric > actualWeightKg;

  const calculateQuote = async () => {
    if (!pickupPincode || !dropPincode || lengthCm <= 0 || breadthCm <= 0 || heightCm <= 0 || actualWeightKg <= 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/rate/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lengthCm,
          breadthCm,
          heightCm,
          actualWeightKg,
          orderType,
          paymentType,
          pickupPincode,
          dropPincode,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to calculate rate quote');
      }

      setQuote(json.data);
      if (onQuoteCalculated) {
        onQuoteCalculated(json.data);
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with dynamic rate engine');
      setQuote(null);
      if (onQuoteCalculated) {
        onQuoteCalculated(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateQuote();
    }, 250);
    return () => clearTimeout(timer);
  }, [lengthCm, breadthCm, heightCm, actualWeightKg, orderType, paymentType, pickupPincode, dropPincode]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Input Parameters Column */}
      <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Dynamic Rate Engine Configurator</h3>
              <p className="text-xs text-slate-400">Real-time volumetric weight & zone detection calculation</p>
            </div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Live Dynamic Pricing
          </span>
        </div>

        {/* Order Type & Payment Type Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Shipment Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType('B2C')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  orderType === 'B2C'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>B2C Retail</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('B2B')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  orderType === 'B2B'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>B2B Freight</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('PREPAID')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  paymentType === 'PREPAID'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Prepaid</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('COD')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  paymentType === 'COD'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Cash on Delivery</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pincode & Routing Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Pickup Pincode <span className="text-indigo-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={pickupPincode}
                onChange={(e) => setPickupPincode(e.target.value)}
                placeholder="e.g. 110001"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <MapPin className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {PINCODE_PRESETS.slice(0, 3).map((p) => (
                <button
                  key={p.pincode}
                  type="button"
                  onClick={() => setPickupPincode(p.pincode)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white"
                >
                  {p.pincode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Drop Pincode <span className="text-indigo-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={dropPincode}
                onChange={(e) => setDropPincode(e.target.value)}
                placeholder="e.g. 110017"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <MapPin className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {PINCODE_PRESETS.slice(3, 6).map((p) => (
                <button
                  key={p.pincode}
                  type="button"
                  onClick={() => setDropPincode(p.pincode)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white"
                >
                  {p.pincode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dimensions (L x B x H) and Actual Weight */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300">Package Dimensions (cm)</label>
            <span className="text-[11px] text-slate-400 font-mono">
              Formula: (L × B × H) ÷ 5000
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Length (cm)</span>
              <input
                type="number"
                min="1"
                value={lengthCm}
                onChange={(e) => setLengthCm(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Breadth (cm)</span>
              <input
                type="number"
                min="1"
                value={breadthCm}
                onChange={(e) => setBreadthCm(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Height (cm)</span>
              <input
                type="number"
                min="1"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Actual Weight */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300">Actual Scale Weight (kg)</label>
            <span className="text-[11px] text-indigo-400">Physical Scale Value</span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={actualWeightKg}
              onChange={(e) => setActualWeightKg(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <Scale className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
          </div>
        </div>

        {/* Live Weight Comparison Preview */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">Actual Weight</span>
            <span className="font-semibold text-white font-mono">{actualWeightKg} kg</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Volumetric Weight</span>
            <span className="font-semibold text-indigo-400 font-mono">{localVolumetric} kg</span>
          </div>
          <div className="border-l border-slate-800 pl-2">
            <span className="text-[10px] text-emerald-400 font-semibold block">Chargeable Weight</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">{localChargeable} kg</span>
            <span className="text-[9px] text-slate-400 block">
              {isVolumetricDominant ? '(Volumetric Dominates)' : '(Actual Dominates)'}
            </span>
          </div>
        </div>
      </div>

      {/* Output Breakdown Column */}
      <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Price Quotation</span>
              {loading && <span className="text-xs text-indigo-400 animate-pulse">(Calculating...)</span>}
            </h4>
            {quote && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  quote.zoneScope === 'INTRA_ZONE'
                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                    : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                }`}
              >
                {quote.zoneScope === 'INTRA_ZONE' ? 'Intra-Zone Transit' : 'Inter-Zone Transit'}
              </span>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {quote && (
            <div className="space-y-3 text-xs">
              {/* Route Summary */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Pickup Zone:</span>
                  <span className="font-medium text-white">{quote.pickupZoneName} ({quote.pickupZoneCode})</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Drop Zone:</span>
                  <span className="font-medium text-white">{quote.dropZoneName} ({quote.dropZoneCode})</span>
                </div>
              </div>

              {/* Line items */}
              <div className="space-y-2 pt-1 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Base Weight Rate (up to {quote.baseWeightKg} kg):</span>
                  <span className="font-mono font-medium">{formatCurrency(quote.baseRate)}</span>
                </div>

                {quote.extraWeightKg > 0 && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span>
                      Additional Weight ({quote.extraWeightKg} kg @ {formatCurrency(quote.perKgRate)}/kg):
                    </span>
                    <span className="font-mono font-medium text-amber-400">
                      +{formatCurrency(quote.extraWeightCharge)}
                    </span>
                  </div>
                )}

                {quote.codSurcharge > 0 && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span>COD Surcharge ({quote.orderType}):</span>
                    <span className="font-mono font-medium text-amber-400">
                      +{formatCurrency(quote.codSurcharge)}
                    </span>
                  </div>
                )}

                {quote.fuelSurchargeAmount > 0 && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Fuel Surcharge ({quote.fuelSurchargePercent}%):</span>
                    <span className="font-mono font-medium text-slate-400">
                      +{formatCurrency(quote.fuelSurchargeAmount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total Card */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-300 block font-medium">Chargeable Weight</span>
                    <span className="text-lg font-bold text-white font-mono">{quote.chargeableWeightKg} kg</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-indigo-300 block font-medium">Total Charge</span>
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                      {formatCurrency(quote.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!quote && !error && (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Box className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
              <span>Enter dimensions & pincodes to calculate instant rate quote</span>
            </div>
          )}
        </div>

        {showOrderNowButton && quote && onOrderNow && (
          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onOrderNow}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all group"
            >
              <span>Confirm & Place Shipment</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
