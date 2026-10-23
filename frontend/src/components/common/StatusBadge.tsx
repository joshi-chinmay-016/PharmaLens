import React from 'react';
import { AlertCircle, CheckCircle2, Clock, FileEdit, ShieldAlert } from 'lucide-react';
import { InvestigationStatus } from '../../types';

interface StatusBadgeProps {
  status: InvestigationStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normStatus = status?.toLowerCase() || 'draft';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  switch (normStatus) {
    case 'under investigation':
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider bg-amber-100 text-ink border border-ink shadow-brutal-xs ${sizeClasses}`}>
          <Clock className="w-3 h-3 text-amber-700 flex-shrink-0" />
          Under Investigation
        </span>
      );
    case 'ai analysis available':
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider bg-lime-accent text-ink border border-ink shadow-brutal-xs ${sizeClasses}`}>
          <AlertCircle className="w-3 h-3 text-ink flex-shrink-0" />
          AI Analysis Ready
        </span>
      );
    case 'in review':
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider bg-blue-100 text-ink border border-ink shadow-brutal-xs ${sizeClasses}`}>
          <Clock className="w-3 h-3 text-blue-700 flex-shrink-0" />
          In Review
        </span>
      );
    case 'completed':
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider bg-emerald-200 text-ink border border-ink shadow-brutal-xs ${sizeClasses}`}>
          <CheckCircle2 className="w-3 h-3 text-emerald-800 flex-shrink-0" />
          Completed (Locked)
        </span>
      );
    case 'closed':
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider bg-paper text-muted border border-ink shadow-brutal-xs ${sizeClasses}`}>
          Closed
        </span>
      );
    case 'draft':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider bg-paper text-ink border border-ink shadow-brutal-xs ${sizeClasses}`}>
          <FileEdit className="w-3 h-3 text-muted flex-shrink-0" />
          Draft
        </span>
      );
  }
};

export const EvidenceGapBadge: React.FC<{ hasGaps: boolean }> = ({ hasGaps }) => {
  if (!hasGaps) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-ink px-2 py-0.5 shadow-brutal-xs">
        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
        Evidence Complete
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-900 border border-ink px-2 py-0.5 shadow-brutal-xs"
      title="Missing critical evidence, acceptance criteria, or batch details"
    >
      <AlertCircle className="w-3 h-3 text-rose-700" />
      Unresolved Gaps
    </span>
  );
};
