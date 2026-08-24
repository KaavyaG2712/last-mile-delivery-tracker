'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Layers,
  MapPin,
  Calculator,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  Truck,
  Edit3,
  Check,
  AlertTriangle,
  Clock,
  TrendingUp,
  DollarSign,
  Package,
  PlusCircle,
  Eye,
  X,
  AlertCircle,
} from 'lucide-react';
import { SLABadge } from '@/components/SLABadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { OrderStatus } from '@/lib/types';

export default function AdminControlCenter() {
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'RATE_CARDS' | 'ZONES' | 'ANALYTICS'>('ORDERS');

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Agents & Zones State
  const [agents, setAgents] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [pincodes, setPincodes] = useState<any[]>([]);
  const [rateCards, setRateCards] = useState<any[]>([]);

  // Reassignment & Override Modals
  const [overrideModalOrder, setOverrideModalOrder] = useState<any | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<OrderStatus>('IN_TRANSIT');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Rate Card Edit State
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [cardSaveMessage, setCardSaveMessage] = useState<string | null>(null);

  // Zone Create State
  const [newZoneCode, setNewZoneCode] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  const [newZonePincodes, setNewZonePincodes] = useState('');
  const [newZoneAdjacent, setNewZoneAdjacent] = useState('');

  const fetchAllData = async () => {
    setLoadingOrders(true);
    try {
      // 1. Fetch Orders
      const orderParams = new URLSearchParams();
      if (statusFilter !== 'ALL') orderParams.append('status', statusFilter);
      if (zoneFilter !== 'ALL') orderParams.append('zoneId', zoneFilter);
      if (agentFilter !== 'ALL') orderParams.append('agentId', agentFilter);
      if (search.trim()) orderParams.append('search', search.trim());

      const [ordersRes, agentsRes, zonesRes, rateCardsRes] = await Promise.all([
        fetch(`/api/orders?${orderParams.toString()}`),
        fetch('/api/agents'),
        fetch('/api/zones'),
        fetch('/api/rate-cards'),
      ]);

      if (ordersRes.ok) {
        const d = await ordersRes.json();
        setOrders(d.data || []);
      }
      if (agentsRes.ok) {
        const d = await agentsRes.json();
        setAgents(d.data || []);
      }
      if (zonesRes.ok) {
        const d = await zonesRes.json();
        setZones(d.data?.zones || []);
        setPincodes(d.data?.pincodes || []);
      }
      if (rateCardsRes.ok) {
        const d = await rateCardsRes.json();
        setRateCards(d.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [statusFilter, zoneFilter, agentFilter]);

  // Handle Quick Reassignment (with Concurrency Transaction Lock)
  const handleReassignAgent = async (orderId: string, agentId: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agentId === 'AUTO' ? null : agentId,
          autoAssign: agentId === 'AUTO',
          notes: agentId === 'AUTO' ? 'Admin triggered auto-assignment' : 'Admin manual re-assignment',
        }),
      });

      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error('Reassignment failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Admin Status Override
  const handleStatusOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModalOrder) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/orders/${overrideModalOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: overrideStatus,
          notes: overrideNotes || `Admin override status to ${overrideStatus}`,
          isAdminOverride: true,
        }),
      });

      if (res.ok) {
        setOverrideModalOrder(null);
        setOverrideNotes('');
        await fetchAllData();
      }
    } catch (err) {
      console.error('Status override failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Rate Card Update
  const handleSaveRateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    setIsProcessing(true);
    setCardSaveMessage(null);
    try {
      const res = await fetch('/api/rate-cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCard),
      });

      if (res.ok) {
        setCardSaveMessage('Rate card updated successfully! New pricing applies instantly.');
        setEditingCard(null);
        await fetchAllData();
      }
    } catch (err) {
      console.error('Failed to update rate card:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Create Zone
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneCode || !newZoneName) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newZoneCode,
          name: newZoneName,
          pincodes: newZonePincodes,
          adjacentZoneCodes: newZoneAdjacent,
        }),
      });

      if (res.ok) {
        setNewZoneCode('');
        setNewZoneName('');
        setNewZonePincodes('');
        setNewZoneAdjacent('');
        await fetchAllData();
      }
    } catch (err) {
      console.error('Failed to create zone:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Analytics Computations
  const totalRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const failedCount = orders.filter((o) => o.status === 'FAILED').length;
  const slaBreachedCount = orders.filter((o) => o.slaEvaluation?.status === 'BREACHED').length;
  const totalWeightMoved = orders.reduce((acc, o) => acc + (o.chargeableWeightKg || 0), 0);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Logistics Operations & Command Center</h1>
            <p className="text-xs text-slate-400">
              Multi-filter order grid, dynamic rate card management, zone matrix, and SLA monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllData}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Refresh All"
          >
            <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/orders/new"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Shipment</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Shipments</span>
            <Package className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{orders.length}</div>
          <span className="text-[10px] text-emerald-400 block font-medium">
            {deliveredCount} Completed ({orders.length > 0 ? Math.round((deliveredCount / orders.length) * 100) : 0}%)
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Freight Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{formatCurrency(totalRevenue)}</div>
          <span className="text-[10px] text-slate-400 block font-mono">
            {Math.round(totalWeightMoved)} kg Chargeable Wt.
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Delivery Agents</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {agents.filter((a) => a.status === 'AVAILABLE').length} / {agents.length}
          </div>
          <span className="text-[10px] text-slate-400 block">Across 5 Geographic Hubs</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>SLA Attention Required</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{slaBreachedCount + failedCount}</div>
          <span className="text-[10px] text-rose-400 block font-semibold">
            {failedCount} Failed • {slaBreachedCount} SLA Breached
          </span>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'ORDERS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Orders & SLA Grid ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RATE_CARDS')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'RATE_CARDS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Rate Card Configurator ({rateCards.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ZONES')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'ZONES'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Zone & Pincode Matrix ({zones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'ANALYTICS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Agent Workload & SLA Matrix</span>
        </button>
      </div>

      {/* TAB 1: ORDERS & SLA GRID */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-6">
          {/* Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_PICKUP">Pending Pickup</option>
                <option value="PICKED_UP">Picked Up</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed</option>
                <option value="RESCHEDULED">Rescheduled</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Hub / Zone Filter</label>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Logistics Zones</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Delivery Agent</label>
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Agents</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.zoneName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Search Identifier</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tracking #, recipient..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Tracking Number</th>
                    <th className="py-3 px-4">Customer & Route</th>
                    <th className="py-3 px-4">Chargeable Wt. & Total</th>
                    <th className="py-3 px-4">Status & SLA Status</th>
                    <th className="py-3 px-4">Assigned Agent & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        No shipments found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Tracking # */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Link
                            href={`/track/${order.trackingNumber}`}
                            className="font-mono font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
                          >
                            <span>{order.trackingNumber}</span>
                            <Eye className="w-3 h-3 text-slate-500" />
                          </Link>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {formatDate(order.createdAt)}
                          </span>
                        </td>

                        {/* Customer & Route */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-white block">{order.customer?.name}</span>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <span>{order.pickupPincode}</span>
                              <span>→</span>
                              <span>{order.dropPincode}</span>
                              <span className="text-[10px] text-indigo-300 font-mono">({order.zoneScope})</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              To: {order.recipientName}
                            </span>
                          </div>
                        </td>

                        {/* Weight & Total */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono font-semibold text-emerald-400">
                            {formatCurrency(order.totalAmount)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {order.chargeableWeightKg} kg • {order.paymentType}
                          </div>
                        </td>

                        {/* Status & SLA */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <span className="font-semibold text-white px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] inline-block font-mono">
                              {order.status}
                            </span>
                            {order.slaEvaluation && (
                              <div>
                                <SLABadge sla={order.slaEvaluation} />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Agent Reassignment & Override */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {/* Agent Select Dropdown */}
                            <select
                              value={order.assignedAgentId || ''}
                              onChange={(e) => handleReassignAgent(order.id, e.target.value)}
                              disabled={isProcessing}
                              className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 max-w-[160px]"
                              title="Assign or reassign delivery partner"
                            >
                              <option value="">Unassigned</option>
                              <option value="AUTO">⚡ Auto-Assign Nearest</option>
                              {agents.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({a.currentLoad}/{a.maxCapacity})
                                </option>
                              ))}
                            </select>

                            {/* Status Override Button */}
                            <button
                              onClick={() => {
                                setOverrideModalOrder(order);
                                setOverrideStatus(order.status);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                              title="Manual Status Override"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RATE CARD CONFIGURATOR */}
      {activeTab === 'RATE_CARDS' && (
        <div className="space-y-6">
          {cardSaveMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{cardSaveMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rateCards.map((card) => {
              const isEditing = editingCard?.id === card.id;
              return (
                <div
                  key={card.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 font-bold font-mono text-xs border border-indigo-500/30">
                        {card.orderType}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {card.scope === 'INTRA_ZONE' ? 'Intra-Zone Rate Matrix' : 'Inter-Zone Rate Matrix'}
                      </span>
                    </div>

                    {!isEditing ? (
                      <button
                        onClick={() => setEditingCard({ ...card })}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 border border-slate-700"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Card</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingCard(null)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-slate-400 block text-[11px]">Base Freight</span>
                        <span className="text-base font-bold text-white font-mono">
                          {formatCurrency(card.baseRate)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Up to {card.baseWeightKg} kg</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-slate-400 block text-[11px]">Extra Weight Per Kg</span>
                        <span className="text-base font-bold text-amber-400 font-mono">
                          +{formatCurrency(card.perKgRate)}/kg
                        </span>
                        <span className="text-[10px] text-slate-500 block">Above base weight</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-slate-400 block text-[11px]">COD Surcharge</span>
                        <span className="text-base font-bold text-emerald-400 font-mono">
                          {formatCurrency(card.codSurcharge)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Per {card.orderType} order</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-slate-400 block text-[11px]">Fuel Surcharge</span>
                        <span className="text-base font-bold text-purple-400 font-mono">
                          {card.fuelSurchargePercent}%
                        </span>
                        <span className="text-[10px] text-slate-500 block">Applied on subtotal</span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveRateCard} className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">Base Rate (₹)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={editingCard.baseRate}
                            onChange={(e) =>
                              setEditingCard({ ...editingCard, baseRate: Number(e.target.value) })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Base Weight (kg)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={editingCard.baseWeightKg}
                            onChange={(e) =>
                              setEditingCard({ ...editingCard, baseWeightKg: Number(e.target.value) })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Per Extra Kg Rate (₹)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={editingCard.perKgRate}
                            onChange={(e) =>
                              setEditingCard({ ...editingCard, perKgRate: Number(e.target.value) })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Flat COD Surcharge (₹)</label>
                          <input
                            type="number"
                            step="1"
                            value={editingCard.codSurcharge}
                            onChange={(e) =>
                              setEditingCard({ ...editingCard, codSurcharge: Number(e.target.value) })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-slate-400 mb-1">Fuel Surcharge Percentage (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editingCard.fuelSurchargePercent}
                            onChange={(e) =>
                              setEditingCard({
                                ...editingCard,
                                fuelSurchargePercent: Number(e.target.value),
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingCard(null)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isProcessing}
                          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition-all"
                        >
                          Save & Apply Live Pricing
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ZONE & PINCODE MATRIX */}
      {activeTab === 'ZONES' && (
        <div className="space-y-8">
          {/* Create Zone Form */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              <span>Define New Logistics Hub Zone</span>
            </h3>

            <form onSubmit={handleCreateZone} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Zone Code (Unique) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ZONE_AIRPORT"
                  value={newZoneCode}
                  onChange={(e) => setNewZoneCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Zone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IGI Airport Cargo Hub"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Pincodes (Comma separated)</label>
                <input
                  type="text"
                  placeholder="110037, 110038"
                  value={newZonePincodes}
                  onChange={(e) => setNewZonePincodes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow transition-all flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Zone</span>
                </button>
              </div>
            </form>
          </div>

          {/* Zones Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zones.map((z) => (
              <div
                key={z.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white text-sm">{z.name}</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                    {z.code}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">COVERED PINCODES:</span>
                    <p className="text-slate-300 font-mono">{z.pincodes || 'None registered'}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">ADJACENT HUBS (FALLBACK):</span>
                    <p className="text-slate-400 font-mono">{z.adjacentZoneCodes || 'None'}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">ACTIVE AGENTS IN ZONE:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {z.agents?.map((a: any) => (
                        <span
                          key={a.id}
                          className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-[10px]"
                        >
                          {a.name} ({a.currentLoad} orders)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AGENT WORKLOAD & SLA METRICS */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Delivery Agent Real-Time Payload & Utilization</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => {
                const utilPercent = Math.min(100, Math.round((agent.currentLoad / agent.maxCapacity) * 100));
                return (
                  <div
                    key={agent.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white block text-sm">{agent.name}</span>
                        <span className="text-[11px] text-slate-400">{agent.zoneName}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold">
                        {agent.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Capacity Utilization</span>
                        <span className="font-mono text-white">
                          {agent.currentLoad} / {agent.maxCapacity} ({utilPercent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            utilPercent > 80 ? 'bg-rose-500' : utilPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${utilPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Manual Status Override Modal */}
      {overrideModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleStatusOverride}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Shield className="w-5 h-5" />
                <span>Admin Status Override</span>
              </div>
              <button
                type="button"
                onClick={() => setOverrideModalOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Overriding shipment <span className="font-mono text-white font-semibold">{overrideModalOrder.trackingNumber}</span> will immediately update lifecycle state and record an immutable entry into <span className="font-mono text-indigo-300">OrderStatusLog</span>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Status *</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value as OrderStatus)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="PENDING_PICKUP">PENDING_PICKUP</option>
                  <option value="PICKED_UP">PICKED_UP</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="RESCHEDULED">RESCHEDULED</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Audit Log Override Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="Operational justification for audit record..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setOverrideModalOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition-all"
              >
                Save Immutable Override
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
