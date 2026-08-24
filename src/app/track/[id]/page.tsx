'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  MapPin,
  Truck,
  Scale,
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  Navigation as NavIcon,
} from 'lucide-react';
import { TrackingTimeline } from '@/components/TrackingTimeline';
import { SLABadge } from '@/components/SLABadge';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function TrackOrderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) {
        throw new Error(`Shipment "${id}" not found`);
      }
      const json = await res.json();
      setOrder(json.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch shipment tracking details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  // Periodic polling for live real-time feel
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchOrder();
    }, 5000);
    return () => clearInterval(interval);
  }, [id, autoRefresh]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs space-y-3">
        <RefreshCw className="w-8 h-8 mx-auto animate-spin text-indigo-400" />
        <span>Loading live satellite telemetry & shipment logs...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white mb-1">Shipment Not Found</h3>
          <p>{error || `No order matching tracking identifier "${id}"`}</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Shipments Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white font-mono">{order.trackingNumber}</h1>
              {order.slaEvaluation && <SLABadge sla={order.slaEvaluation} showDetails />}
            </div>
            <p className="text-xs text-slate-400">
              Live Last-Mile Telemetry • {order.orderType} Delivery Tier
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              autoRefresh
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
            <span>{autoRefresh ? 'Live Sync Active (5s)' : 'Sync Paused'}</span>
          </button>

          <button
            onClick={fetchOrder}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Refresh now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Timeline, Right Logistics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Timeline & Logs */}
        <div className="lg:col-span-8 space-y-6">
          <TrackingTimeline order={order} onRefresh={fetchOrder} allowSimulations />
        </div>

        {/* Right Column: Shipment Details & Route Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Route Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <NavIcon className="w-4 h-4 text-indigo-400" />
              <span>Route & Transit Geometry</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-indigo-400 font-semibold block uppercase">Origin (Pickup Hub)</span>
                <p className="text-white font-medium">{order.pickupAddress}</p>
                <p className="text-slate-400 font-mono text-[11px]">
                  Pincode: {order.pickupPincode} • Zone: {order.pickupZone?.name || 'North Hub'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-emerald-400 font-semibold block uppercase">Destination (Drop Off)</span>
                <p className="text-white font-medium">{order.dropAddress}</p>
                <p className="text-slate-400 font-mono text-[11px]">
                  Recipient: {order.recipientName} ({order.recipientPhone})
                </p>
                <p className="text-slate-400 font-mono text-[11px]">
                  Pincode: {order.dropPincode} • Zone: {order.dropZone?.name || 'South Hub'}
                </p>
              </div>
            </div>
          </div>

          {/* Package Weight & Rate Audit Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Scale className="w-4 h-4 text-indigo-400" />
              <span>Volumetric & Charge Breakdown</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Dimensions (L×B×H):</span>
                <span className="font-mono text-white">
                  {order.lengthCm} × {order.breadthCm} × {order.heightCm} cm
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Actual Scale Weight:</span>
                <span className="font-mono text-white">{order.actualWeightKg} kg</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Volumetric Weight [(L×B×H)/5000]:</span>
                <span className="font-mono text-indigo-300">{order.volumetricWeightKg} kg</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-semibold">
                <span className="text-emerald-400">Chargeable Weight:</span>
                <span className="font-mono text-emerald-400 font-bold">{order.chargeableWeightKg} kg</span>
              </div>

              {/* Price Line Items */}
              <div className="pt-3 border-t border-slate-800 space-y-1.5 text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Base Rate:</span>
                  <span className="font-mono">{formatCurrency(order.baseRateApplied)}</span>
                </div>
                {order.extraWeightCharge > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Additional Weight Charge:</span>
                    <span className="font-mono text-amber-400">+{formatCurrency(order.extraWeightCharge)}</span>
                  </div>
                )}
                {order.codFeeApplied > 0 && (
                  <div className="flex items-center justify-between">
                    <span>COD Fee:</span>
                    <span className="font-mono text-amber-400">+{formatCurrency(order.codFeeApplied)}</span>
                  </div>
                )}
                {order.fuelSurchargeApplied > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Fuel Surcharge:</span>
                    <span className="font-mono text-slate-400">+{formatCurrency(order.fuelSurchargeApplied)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-white text-sm">
                  <span>Total Amount Paid:</span>
                  <span className="font-mono text-emerald-400">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Notes */}
          {order.deliveryNotes && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl text-xs space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Special Handling Instructions
              </span>
              <p className="text-slate-300 italic bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                "{order.deliveryNotes}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
