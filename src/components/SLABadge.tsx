'use client';

import React from 'react';
import { SLAEvaluation } from '@/lib/types';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface SLABadgeProps {
  sla: SLAEvaluation;
  showDetails?: boolean;
}

export const SLABadge: React.FC<SLABadgeProps> = ({ sla, showDetails = false }) => {
  const getIcon = () => {
    switch (sla.status) {
      case 'BREACHED':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />;
      case 'WARNING':
        return <Clock className="w-3.5 h-3.5 text-amber-500" />;
      case 'TERMINAL':
        return sla.label.includes('Failed') ? (
          <XCircle className="w-3.5 h-3.5 text-rose-500" />
        ) : (
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
        );
      default:
        return <Clock className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sla.colorClass.badge}`}
        title={`Time in current state: ${sla.timeInStateMinutes} mins (SLA Threshold: ${sla.slaLimitMinutes} mins)`}
      >
        {getIcon()}
        <span>{sla.label}</span>
      </span>
      {showDetails && sla.status !== 'TERMINAL' && (
        <span className="text-[11px] text-slate-400">
          ({sla.timeInStateMinutes}m active)
        </span>
      )}
    </div>
  );
};
