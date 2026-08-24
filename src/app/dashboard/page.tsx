'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  PlusCircle,
  Search,
  Filter,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Truck,
  ExternalLink,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { SLABadge } from '@/components/SLABadge';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function CustomerDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setOrders(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'OUT_FOR_DELIVERY':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 animate-pulse';
      case 'IN_TRANSIT':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'PICKED_UP':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'FAILED':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'RESCHEDULED':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Customer Shipments Portal</h1>
              <p className="text-xs text-slate-400">
                Track real-time delivery lifecycle, view dynamic weight calculations, and manage bookings
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/orders/new"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Book New Shipment</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 text-xs">
          {[
            { key: 'ALL', label: 'All Shipments' },
            { key: 'PENDING_PICKUP', label: 'Pending' },
            { key: 'IN_TRANSIT', label: 'In Transit' },
            { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
            { key: 'DELIVERED', label: 'Delivered' },
            { key: 'FAILED', label: 'Failed' },
            { key: 'RESCHEDULED', label: 'Rescheduled' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-indigo-600 text-white border-indigo-400 font-semibold'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[280px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracking #, recipient..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </form>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-400" />
          <span>Loading active shipments...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No shipments found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are no orders matching your current filter criteria. Book a shipment to see live tracking.
          </p>
          <Link
            href="/orders/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-all mt-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Book New Shipment</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => {
            const isFailed = order.status === 'FAILED';
            return (
              <div
                key={order.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all hover:shadow-xl ${
                  isFailed
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/40'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-white">{order.trackingNumber}</span>
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* SLA Badge */}
                  {order.slaEvaluation && (
                    <div>
                      <SLABadge sla={order.slaEvaluation} showDetails />
                    </div>
                  )}

                  {/* Route Details */}
                  <div className="space-y-2 text-xs border-y border-slate-800/80 py-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">From:</span>
                        <span className="text-slate-200 line-clamp-1">{order.pickupAddress}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Pin: {order.pickupPincode}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">To:</span>
                        <span className="text-slate-200 line-clamp-1">{order.dropAddress}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Recipient: {order.recipientName} ({order.dropPincode})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Weight & Billing Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Chargeable Wt.</span>
                      <span className="font-mono font-semibold text-white">{order.chargeableWeightKg} kg</span>
                      <span className="text-[9px] text-slate-500 block">
                        (Vol: {order.volumetricWeightKg} kg)
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Total Amount</span>
                      <span className="font-mono font-semibold text-emerald-400">
                        {formatCurrency(order.totalAmount)}
                      </span>
                      <span className="text-[9px] text-slate-500 block">{order.paymentType}</span>
                    </div>
                  </div>

                  {/* Assigned Agent Snippet */}
                  {order.assignedAgent && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Truck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Agent: {order.assignedAgent.name}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">{formatDate(order.createdAt)}</span>

                  <div className="flex items-center gap-2">
                    {isFailed && order.rescheduleToken && (
                      <Link
                        href={`/reschedule/${order.rescheduleToken}`}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
                      >
                        Reschedule
                      </Link>
                    )}

                    <Link
                      href={`/track/${order.trackingNumber}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>Track Live</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
