'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  Package,
  MapPin,
  Phone,
  CheckCircle2,
  AlertOctagon,
  Clock,
  ArrowRight,
  RefreshCw,
  Navigation as NavIcon,
  X,
  ExternalLink,
} from 'lucide-react';
import { SLABadge } from '@/components/SLABadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { OrderStatus } from '@/lib/types';

export default function AgentMobilePortal() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ACTIVE');

  // Modal State for Failed Delivery Reason
  const [failureModalOrder, setFailureModalOrder] = useState<any | null>(null);
  const [failureReason, setFailureReason] = useState<string>('Customer unavailable & phone unanswered');
  const [failureNotes, setFailureNotes] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAgentOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const json = await res.json();
        setOrders(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load agent orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentOrders();
  }, []);

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    reason?: string,
    notes?: string
  ) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          failureReason: reason,
          notes: notes || `Agent updated status to ${newStatus}`,
        }),
      });

      if (res.ok) {
        setFailureModalOrder(null);
        setFailureNotes('');
        await fetchAgentOrders();
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'ACTIVE') {
      return ['PENDING_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'RESCHEDULED'].includes(order.status);
    }
    if (activeTab === 'COMPLETED') {
      return order.status === 'DELIVERED';
    }
    if (activeTab === 'FAILED') {
      return order.status === 'FAILED';
    }
    return true;
  });

  const activeCount = orders.filter((o) =>
    ['PENDING_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'RESCHEDULED'].includes(o.status)
  ).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Agent App Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">Delivery Partner Mobile View</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                Online • Active Dispatch
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Assigned parcels queue & instant one-tap status action triggers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-mono">ACTIVE PAYLOAD</span>
            <span className="text-base font-bold text-amber-400 font-mono">{activeCount} Parcels</span>
          </div>
          <button
            onClick={fetchAgentOrders}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`py-2.5 rounded-xl border font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'ACTIVE'
              ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Active Tasks ({activeCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`py-2.5 rounded-xl border font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'COMPLETED'
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Delivered</span>
        </button>

        <button
          onClick={() => setActiveTab('FAILED')}
          className={`py-2.5 rounded-xl border font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'FAILED'
              ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Failed</span>
        </button>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-amber-400" />
          <span>Syncing assigned delivery orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-semibold text-white">All Clear!</h3>
          <p className="text-xs text-slate-400">No shipments in this category right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isUpdating = updatingId === order.id;
            return (
              <div
                key={order.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-all"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="font-mono font-bold text-sm text-white">{order.trackingNumber}</span>
                    <span className="text-[11px] text-slate-400 block">
                      {order.orderType} • {order.paymentType} • Chargeable: {order.chargeableWeightKg} kg
                    </span>
                  </div>
                  {order.slaEvaluation && <SLABadge sla={order.slaEvaluation} />}
                </div>

                {/* Addresses */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">PICKUP LOCATION:</span>
                      <span className="text-slate-200">{order.pickupAddress}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">DELIVERY DESTINATION:</span>
                      <span className="text-slate-200">{order.dropAddress}</span>
                      <div className="mt-1 flex items-center gap-3 text-slate-300">
                        <span className="font-medium text-white">{order.recipientName}</span>
                        <a
                          href={`tel:${order.recipientPhone}`}
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono text-[11px]"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{order.recipientPhone}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* One-Tap Action Buttons Grid */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    Update Dispatch State:
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {order.status === 'PENDING_PICKUP' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'PICKED_UP', undefined, 'Agent scanned & picked up parcel')}
                        disabled={isUpdating}
                        className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow transition-all col-span-2 sm:col-span-4"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Confirm Pickup</span>
                      </button>
                    )}

                    {(order.status === 'PICKED_UP' || order.status === 'RESCHEDULED') && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'IN_TRANSIT', undefined, 'In transit to delivery zone')}
                        disabled={isUpdating}
                        className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow transition-all col-span-2"
                      >
                        <NavIcon className="w-3.5 h-3.5" />
                        <span>In Transit</span>
                      </button>
                    )}

                    {['PICKED_UP', 'IN_TRANSIT', 'RESCHEDULED'].includes(order.status) && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY', undefined, 'Agent is out for final delivery')}
                        disabled={isUpdating}
                        className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow transition-all col-span-2"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Out for Delivery</span>
                      </button>
                    )}

                    {['OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(order.status) && (
                      <>
                        <button
                          onClick={() =>
                            handleUpdateStatus(order.id, 'DELIVERED', undefined, `Handed over to ${order.recipientName}`)
                          }
                          disabled={isUpdating}
                          className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow transition-all col-span-2 sm:col-span-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Delivered</span>
                        </button>

                        <button
                          onClick={() => setFailureModalOrder(order)}
                          disabled={isUpdating}
                          className="py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center justify-center gap-1 transition-all col-span-2 sm:col-span-2"
                        >
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                          <span>Mark Failed (Trigger Reschedule)</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom detail link */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2">
                  <span>Current State: <strong className="text-white">{order.status}</strong></span>
                  <Link
                    href={`/track/${order.trackingNumber}`}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    <span>View Public Tracking Timeline</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Failure Reason Modal */}
      {failureModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertOctagon className="w-5 h-5" />
                <span>Mark Delivery Attempt as Failed</span>
              </div>
              <button
                onClick={() => setFailureModalOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Flagging shipment <span className="font-mono text-white font-semibold">{failureModalOrder.trackingNumber}</span> as failed will automatically send an SMS & Email notification to{' '}
              <strong className="text-white">{failureModalOrder.recipientName}</strong> with a 1-click reschedule link.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Primary Failure Reason *
                </label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Customer unavailable & phone unanswered">
                    Customer unavailable & phone unanswered
                  </option>
                  <option value="Incorrect or incomplete delivery address">
                    Incorrect or incomplete delivery address
                  </option>
                  <option value="Customer refused delivery / COD payment declined">
                    Customer refused delivery / COD payment declined
                  </option>
                  <option value="Premises closed / gate locked / access restricted">
                    Premises closed / gate locked / access restricted
                  </option>
                  <option value="Severe weather / logistical traffic disruption">
                    Severe weather / logistical traffic disruption
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Agent Operational Notes
                </label>
                <textarea
                  rows={2}
                  value={failureNotes}
                  onChange={(e) => setFailureNotes(e.target.value)}
                  placeholder="Attempted at 3:15 PM, gate security stated resident out of town..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setFailureModalOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUpdateStatus(
                    failureModalOrder.id,
                    'FAILED',
                    failureReason,
                    failureNotes || failureReason
                  )
                }
                disabled={updatingId === failureModalOrder.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Confirm Failure & Notify Customer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
