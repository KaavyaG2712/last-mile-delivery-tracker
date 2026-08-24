'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PackagePlus,
  ArrowRight,
  User,
  Phone,
  MapPin,
  Scale,
  CreditCard,
  Building2,
  AlertCircle,
  CheckCircle2,
  Shield,
  Layers,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { OrderType, PaymentType, RateQuoteBreakdown } from '@/lib/types';
import { DEMO_USERS } from '@/lib/auth';

const PINCODE_PRESETS = [
  { pincode: '110001', name: '110001 - Connaught Place (North/Central)' },
  { pincode: '110007', name: '110007 - Kamla Nagar / DU (North)' },
  { pincode: '110016', name: '110016 - Hauz Khas (South)' },
  { pincode: '110017', name: '110017 - Saket (South)' },
  { pincode: '110015', name: '110015 - Kirti Nagar (West)' },
  { pincode: '110091', name: '110091 - Mayur Vihar (East)' },
];

export default function NewOrderPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form State
  const [recipientName, setRecipientName] = useState('Rahul Aggarwal');
  const [recipientPhone, setRecipientPhone] = useState('+91 98110 55443');
  const [pickupAddress, setPickupAddress] = useState('Shop 14, Block C, Connaught Place, New Delhi');
  const [pickupPincode, setPickupPincode] = useState('110001');
  const [dropAddress, setDropAddress] = useState('Flat 402, Green View Apartments, Saket, New Delhi');
  const [dropPincode, setDropPincode] = useState('110017');

  const [lengthCm, setLengthCm] = useState(30);
  const [breadthCm, setBreadthCm] = useState(20);
  const [heightCm, setHeightCm] = useState(15);
  const [actualWeightKg, setActualWeightKg] = useState(2.5);

  const [orderType, setOrderType] = useState<OrderType>('B2C');
  const [paymentType, setPaymentType] = useState<PaymentType>('PREPAID');
  const [targetCustomerId, setTargetCustomerId] = useState<string>('user_customer_02');
  const [deliveryNotes, setDeliveryNotes] = useState('Call before arrival. Leave with reception if gate locked.');

  // Quote State
  const [quote, setQuote] = useState<RateQuoteBreakdown | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
          if (data.user.role === 'CUSTOMER') {
            setTargetCustomerId(data.user.id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Live Dynamic Quote
  useEffect(() => {
    const fetchQuote = async () => {
      if (!pickupPincode || !dropPincode || lengthCm <= 0 || breadthCm <= 0 || heightCm <= 0 || actualWeightKg <= 0) {
        return;
      }
      setQuoteLoading(true);
      setQuoteError(null);
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
        if (res.ok) {
          setQuote(json.data);
        } else {
          setQuoteError(json.error || 'Failed to calculate rate');
          setQuote(null);
        }
      } catch (err: any) {
        setQuoteError(err.message);
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    };

    const debounce = setTimeout(fetchQuote, 250);
    return () => clearTimeout(debounce);
  }, [pickupPincode, dropPincode, lengthCm, breadthCm, heightCm, actualWeightKg, orderType, paymentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          targetCustomerId: currentUser?.role === 'ADMIN' ? targetCustomerId : undefined,
          deliveryNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to create order');
      }

      router.push(`/track/${json.data.trackingNumber}`);
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while creating the shipment');
    } finally {
      setSubmitting(false);
    }
  };

  const volumetricWeight = Math.round(((lengthCm * breadthCm * heightCm) / 5000) * 100) / 100;
  const chargeableWeight = Math.max(actualWeightKg, volumetricWeight);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Create New Delivery Order</h1>
              <p className="text-xs text-slate-400">
                Dynamic pricing calculation with smart nearest-agent auto-assignment
              </p>
            </div>
          </div>
        </div>

        {currentUser?.role === 'ADMIN' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Shield className="w-4 h-4" />
            <span>Admin Creation Mode (On Behalf of Customer)</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Column */}
        <div className="lg:col-span-7 space-y-6">
          {submitError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Admin On-Behalf-Of Selector */}
          {currentUser?.role === 'ADMIN' && (
            <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-2">
              <label className="block text-xs font-semibold text-indigo-300">
                Booking On Behalf of Customer:
              </label>
              <select
                value={targetCustomerId}
                onChange={(e) => setTargetCustomerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {DEMO_USERS.filter((u) => u.role === 'CUSTOMER').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.badge}) - {c.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Shipment Type & Payment Method */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">1. Service & Payment Configuration</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Order Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('B2C')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      orderType === 'B2C'
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700'
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
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>B2B Commercial</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Payment Terms</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('PREPAID')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      paymentType === 'PREPAID'
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700'
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
                        ? 'bg-amber-600 text-white border-amber-400'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>COD Surcharge</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recipient Information */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">2. Recipient Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Recipient Full Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <User className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Recipient Phone *</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Pickup and Drop Routing */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">3. Pickup & Destination Routing</h3>

            {/* Pickup */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">Pickup Address & Pincode *</label>
                <span className="text-[10px] text-slate-400 font-mono">Origin</span>
              </div>
              <input
                type="text"
                required
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Full address (house, street, landmark)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={pickupPincode}
                  onChange={(e) => setPickupPincode(e.target.value)}
                  placeholder="6-Digit Pincode"
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <select
                  onChange={(e) => setPickupPincode(e.target.value)}
                  value={pickupPincode}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-[11px] text-slate-300 focus:outline-none"
                >
                  <option value="">Quick Select Preset...</option>
                  {PINCODE_PRESETS.map((p) => (
                    <option key={p.pincode} value={p.pincode}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Drop */}
            <div className="space-y-2 pt-3 border-t border-slate-800/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">Delivery Address & Pincode *</label>
                <span className="text-[10px] text-slate-400 font-mono">Destination</span>
              </div>
              <input
                type="text"
                required
                value={dropAddress}
                onChange={(e) => setDropAddress(e.target.value)}
                placeholder="Full drop address"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={dropPincode}
                  onChange={(e) => setDropPincode(e.target.value)}
                  placeholder="6-Digit Pincode"
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <select
                  onChange={(e) => setDropPincode(e.target.value)}
                  value={dropPincode}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-[11px] text-slate-300 focus:outline-none"
                >
                  <option value="">Quick Select Preset...</option>
                  {PINCODE_PRESETS.map((p) => (
                    <option key={p.pincode} value={p.pincode}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dimensions & Scale Weight */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">4. Dimensions & Weight Specifications</h3>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Length (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Breadth (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={breadthCm}
                  onChange={(e) => setBreadthCm(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Height (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Actual Scale Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={actualWeightKg}
                onChange={(e) => setActualWeightKg(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Special Handling / Delivery Instructions</label>
              <textarea
                rows={2}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Gate codes, delivery preferences, etc."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right Sticky Calculation Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/20 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Quotation Breakdown</h3>
              {quoteLoading && <span className="text-xs text-indigo-400 animate-pulse">Calculating...</span>}
            </div>

            {quoteError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{quoteError}</span>
              </div>
            )}

            {/* Volumetric vs Actual Comparison Card */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Actual Scale Weight:</span>
                <span className="font-mono font-semibold text-white">{actualWeightKg} kg</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Volumetric Weight [(L×B×H)/5000]:</span>
                <span className="font-mono font-semibold text-indigo-300">{volumetricWeight} kg</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between font-medium">
                <span className="text-emerald-400">Chargeable Weight (Max):</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{chargeableWeight} kg</span>
              </div>
            </div>

            {/* Itemized charges */}
            {quote && (
              <div className="space-y-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Pickup Hub:</span>
                    <span className="text-white font-medium">{quote.pickupZoneName} ({quote.pickupZoneCode})</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Drop Hub:</span>
                    <span className="text-white font-medium">{quote.dropZoneName} ({quote.dropZoneCode})</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Zone Transit Tier:</span>
                    <span className="text-indigo-300 font-semibold">{quote.zoneScope}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Base Freight (up to {quote.baseWeightKg} kg):</span>
                    <span className="font-mono">{formatCurrency(quote.baseRate)}</span>
                  </div>

                  {quote.extraWeightKg > 0 && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Extra Weight ({quote.extraWeightKg} kg @ {formatCurrency(quote.perKgRate)}/kg):</span>
                      <span className="font-mono text-amber-400">+{formatCurrency(quote.extraWeightCharge)}</span>
                    </div>
                  )}

                  {quote.codSurcharge > 0 && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span>COD Surcharge ({quote.orderType}):</span>
                      <span className="font-mono text-amber-400">+{formatCurrency(quote.codSurcharge)}</span>
                    </div>
                  )}

                  {quote.fuelSurchargeAmount > 0 && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Fuel Surcharge ({quote.fuelSurchargePercent}%):</span>
                      <span className="font-mono text-slate-400">+{formatCurrency(quote.fuelSurchargeAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Total Due</span>
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                      {formatCurrency(quote.totalAmount)}
                    </span>
                  </div>
                  <span className="px-2 py-1 rounded bg-black/40 text-slate-300 font-mono text-[10px]">
                    {paymentType}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !quote}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/40 transition-all group"
            >
              {submitting ? (
                <span>Auto-Assigning Agent & Dispatching...</span>
              ) : (
                <>
                  <span>Confirm Order & Auto-Assign Agent</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 text-center">
              Nearest delivery agent in pickup zone will be auto-assigned via transaction locks.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
