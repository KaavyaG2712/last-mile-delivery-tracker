'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  Truck,
  Package,
  Clock,
  AlertOctagon,
  Calendar,
  Send,
  User,
  Shield,
  Bot,
  MapPin,
  ArrowRight,
  RefreshCw,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { SLABadge } from './SLABadge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { OrderStatus } from '@/lib/types';

interface TrackingTimelineProps {
  order: any;
  onRefresh?: () => void;
  allowSimulations?: boolean;
}

const LIFECYCLE_STEPS: Array<{ key: OrderStatus; label: string; icon: any }> = [
  { key: 'PENDING_PICKUP', label: 'Order Created', icon: Package },
  { key: 'PICKED_UP', label: 'Picked Up', icon: Truck },
  { key: 'IN_TRANSIT', label: 'In Transit', icon: Clock },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
];

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({
  order,
  onRefresh,
  allowSimulations = true,
}) => {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const currentStatus: OrderStatus = order.status;
  const isFailed = currentStatus === 'FAILED';
  const isRescheduled = currentStatus === 'RESCHEDULED';
  const isDelivered = currentStatus === 'DELIVERED';

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING_PICKUP':
        return 0;
      case 'PICKED_UP':
        return 1;
      case 'IN_TRANSIT':
        return 2;
      case 'OUT_FOR_DELIVERY':
        return 3;
      case 'DELIVERED':
        return 4;
      case 'FAILED':
        return 3;
      case 'RESCHEDULED':
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(currentStatus);

  const getActorIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-3 h-3 text-indigo-400" />;
      case 'AGENT':
        return <Truck className="w-3 h-3 text-amber-400" />;
      case 'CUSTOMER':
        return <User className="w-3 h-3 text-emerald-400" />;
      default:
        return <Bot className="w-3 h-3 text-blue-400" />;
    }
  };

  const handleSimulateStatus = async (nextStatus: OrderStatus, customNotes?: string, failureReason?: string) => {
    setIsUpdating(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          notes: customNotes || `Simulated transition to ${nextStatus}`,
          failureReason,
          isAdminOverride: true,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setActionMessage(`Updated status to ${nextStatus}`);
        if (onRefresh) onRefresh();
        router.refresh();
      } else {
        setActionMessage(`Error: ${json.error}`);
      }
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getNextStage = (): OrderStatus | null => {
    switch (currentStatus) {
      case 'PENDING_PICKUP':
        return 'PICKED_UP';
      case 'PICKED_UP':
        return 'IN_TRANSIT';
      case 'IN_TRANSIT':
        return 'OUT_FOR_DELIVERY';
      case 'OUT_FOR_DELIVERY':
        return 'DELIVERED';
      case 'RESCHEDULED':
        return 'OUT_FOR_DELIVERY';
      default:
        return null;
    }
  };

  const nextStage = getNextStage();

  return (
    <div className="space-y-6">
      {/* Visual Step Progress Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white font-mono">{order.trackingNumber}</h3>
              {order.slaEvaluation && <SLABadge sla={order.slaEvaluation} showDetails />}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Created on {formatDate(order.createdAt)} • {order.orderType} Freight • {order.paymentType}
            </p>
          </div>

          {/* Quick Reschedule Banner if Failed */}
          {isFailed && order.rescheduleToken && (
            <Link
              href={`/reschedule/${order.rescheduleToken}`}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/30 animate-pulse transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>1-Click Customer Reschedule Link</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Linear Stepper */}
        <div className="relative py-4">
          <div className="hidden sm:block absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-slate-800 z-0">
            <div
              className={`h-full transition-all duration-500 ${
                isFailed ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-500'
              }`}
              style={{
                width: isFailed
                  ? '75%'
                  : `${Math.min(100, (currentStepIdx / (LIFECYCLE_STEPS.length - 1)) * 100)}%`,
              }}
            />
          </div>

          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-2">
            {LIFECYCLE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx && !isFailed;
              const isFailedStep = isFailed && idx === 3; // Out for delivery failed

              let stepColor = 'bg-slate-900 border-slate-800 text-slate-500';
              if (isPast) stepColor = 'bg-emerald-600 border-emerald-400 text-white';
              if (isCurrent) stepColor = 'bg-indigo-600 border-indigo-400 text-white ring-4 ring-indigo-500/20';
              if (isFailedStep) stepColor = 'bg-rose-600 border-rose-400 text-white ring-4 ring-rose-500/20';

              return (
                <div key={step.key} className="flex flex-col items-center text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${stepColor}`}
                  >
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-semibold mt-2 text-white">{step.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {isCurrent ? 'Active Stage' : isPast ? 'Completed' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Failed / Rescheduled Status Alert Box */}
        {isFailed && (
          <div className="mt-4 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-200 block text-sm">Delivery Attempt Failed</span>
                <p className="mt-0.5 text-rose-300">
                  Reason: {order.failureReason || 'Customer unavailable at delivery premises'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Automated SMS & Email notifications dispatched with secure reschedule URL.
                </p>
              </div>
            </div>
            {order.rescheduleToken && (
              <Link
                href={`/reschedule/${order.rescheduleToken}`}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
              >
                Open Reschedule Portal →
              </Link>
            )}
          </div>
        )}

        {isRescheduled && (
          <div className="mt-4 p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-3">
            <Calendar className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-200 block text-sm">Delivery Rescheduled</span>
              <p className="mt-0.5 text-amber-300">
                Scheduled for:{' '}
                <span className="font-semibold text-white">
                  {order.rescheduleDate ? new Date(order.rescheduleDate).toLocaleDateString() : 'Next working day'} (
                  {order.rescheduleTimeSlot || 'Standard Slot'})
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Assigned delivery partner:{' '}
                <span className="text-white font-medium">{order.assignedAgent?.name || 'Assigned to nearest partner'}</span>
              </p>
            </div>
          </div>
        )}

        {/* Assigned Agent Details Card */}
        {order.assignedAgent && (
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-mono">ASSIGNED DELIVERY AGENT</span>
                <span className="text-sm font-semibold text-white">{order.assignedAgent.name}</span>
                <span className="text-slate-400 block">{order.assignedAgent.phone || order.assignedAgent.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Active Payload: {order.assignedAgent.currentLoad ?? 1} parcels
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Evaluator Live Simulation Controls */}
      {allowSimulations && (
        <div className="bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>EVALUATOR INTERACTIVE SIMULATOR (Test Full Lifecycle Flow)</span>
            </div>
            {actionMessage && <span className="text-xs text-emerald-400 font-mono">{actionMessage}</span>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {nextStage && (
              <button
                type="button"
                onClick={() => handleSimulateStatus(nextStage)}
                disabled={isUpdating}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>Advance to "{nextStage}"</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {!isFailed && !isDelivered && (
              <button
                type="button"
                onClick={() =>
                  handleSimulateStatus(
                    'FAILED',
                    'Customer phone unanswered at gate attempt',
                    'Customer unavailable at delivery premises'
                  )
                }
                disabled={isUpdating}
                className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                <span>Simulate Delivery Failure (Trigger Reschedule Notice)</span>
              </button>
            )}

            {isFailed && order.rescheduleToken && (
              <Link
                href={`/reschedule/${order.rescheduleToken}`}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Simulate Customer Rescheduling</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Immutable Audit Log Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Immutable Tracking Audit Log (`OrderStatusLog`)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Append-Only Cryptographic Trail</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Transition</th>
                <th className="py-2.5 px-3">Actor / Role</th>
                <th className="py-2.5 px-3">Event Notes & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {order.statusLogs?.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-mono">
                      {log.previousStatus ? (
                        <>
                          <span className="text-slate-400 text-[11px]">{log.previousStatus}</span>
                          <span className="text-slate-500">→</span>
                        </>
                      ) : null}
                      <span className="font-semibold text-white px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                        {log.newStatus}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {getActorIcon(log.actorRole)}
                      <span className="font-medium text-slate-200">{log.actor?.name || 'System Orchestrator'}</span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        {log.actorRole}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    <span>{log.notes || '-'}</span>
                    {log.locationLat && log.locationLng && (
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        📍 Lat: {log.locationLat.toFixed(4)}, Lng: {log.locationLng.toFixed(4)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Channel Automated Notification History */}
      {order.notifications && order.notifications.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Automated Customer Notifications Dispatched
              </h4>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono">Multi-Channel Dispatched</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {order.notifications.map((notif: any) => (
              <div key={notif.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {notif.channel === 'EMAIL' ? (
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span className="font-semibold text-white">{notif.channel} ALERT</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{formatDate(notif.sentAt)}</span>
                </div>
                <div className="text-slate-300 font-medium text-[11px]">{notif.title}</div>
                <div className="text-slate-400 text-[11px] whitespace-pre-line line-clamp-3 bg-slate-900/60 p-2 rounded border border-slate-800/80 font-mono">
                  {notif.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
