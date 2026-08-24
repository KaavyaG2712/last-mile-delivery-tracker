import { OrderStatus, SLAEvaluation, SLAStatus } from './types';

export const SLA_THRESHOLDS: Record<OrderStatus, { warningMinutes: number; breachMinutes: number }> = {
  PENDING_PICKUP: { warningMinutes: 30, breachMinutes: 60 },
  PICKED_UP: { warningMinutes: 45, breachMinutes: 90 },
  IN_TRANSIT: { warningMinutes: 120, breachMinutes: 240 },
  OUT_FOR_DELIVERY: { warningMinutes: 90, breachMinutes: 180 },
  RESCHEDULED: { warningMinutes: 60, breachMinutes: 120 },
  DELIVERED: { warningMinutes: 999999, breachMinutes: 999999 },
  FAILED: { warningMinutes: 0, breachMinutes: 0 },
};

/**
 * Evaluates the SLA performance and time-in-state for an order.
 * @param status Current order status
 * @param lastUpdated Timestamp when order entered the current status (or updatedAt)
 * @param referenceTime Current time (defaults to Date.now())
 */
export function evaluateSLA(
  status: OrderStatus | string,
  lastUpdated: Date | string | number,
  referenceTime: Date | number = Date.now()
): SLAEvaluation {
  const orderStatus = status as OrderStatus;
  const lastUpdatedTime = new Date(lastUpdated).getTime();
  const now = typeof referenceTime === 'number' ? referenceTime : referenceTime.getTime();
  const timeInStateMinutes = Math.max(0, Math.floor((now - lastUpdatedTime) / (1000 * 60)));

  if (orderStatus === 'DELIVERED') {
    return {
      status: 'TERMINAL',
      timeInStateMinutes,
      slaLimitMinutes: 0,
      label: 'Delivered (SLA Met)',
      colorClass: {
        badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      },
    };
  }

  if (orderStatus === 'FAILED') {
    return {
      status: 'TERMINAL',
      timeInStateMinutes,
      slaLimitMinutes: 0,
      label: 'Delivery Failed',
      colorClass: {
        badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-500',
        bg: 'bg-rose-50 dark:bg-rose-950/20',
      },
    };
  }

  const threshold = SLA_THRESHOLDS[orderStatus] || { warningMinutes: 60, breachMinutes: 120 };

  if (timeInStateMinutes >= threshold.breachMinutes) {
    return {
      status: 'BREACHED',
      timeInStateMinutes,
      slaLimitMinutes: threshold.breachMinutes,
      label: `SLA Breached (${timeInStateMinutes}m in state)`,
      colorClass: {
        badge: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500 animate-pulse',
        text: 'text-rose-600 dark:text-rose-400 font-semibold',
        border: 'border-rose-500',
        bg: 'bg-rose-500/10',
      },
    };
  }

  if (timeInStateMinutes >= threshold.warningMinutes) {
    return {
      status: 'WARNING',
      timeInStateMinutes,
      slaLimitMinutes: threshold.breachMinutes,
      label: `SLA Warning (${timeInStateMinutes}m / ${threshold.breachMinutes}m)`,
      colorClass: {
        badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-400',
        bg: 'bg-amber-500/10',
      },
    };
  }

  return {
    status: 'ON_TRACK',
    timeInStateMinutes,
    slaLimitMinutes: threshold.breachMinutes,
    label: `On Track (${timeInStateMinutes}m / ${threshold.breachMinutes}m)`,
    colorClass: {
      badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-400',
      bg: 'bg-blue-500/5',
    },
  };
}
