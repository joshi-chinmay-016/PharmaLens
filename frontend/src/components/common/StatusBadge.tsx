import React from 'react';
import { AlertCircle, CheckCircle2, Clock, FileEdit, ShieldAlert } from 'lucide-react';
import { InvestigationStatus } from '../../types';

interface StatusBadgeProps {
  status: InvestigationStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normStatus = status?.toLowerCase() || 'draft';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  switch (normStatus) {
    case 'under investigation':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Under Investigation
        </span>
      );
    case 'ai analysis available':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}>
          <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
          AI Analysis Available
        </span>
      );
    case 'in review':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5" />
          In Review
        </span>
      );
    case 'completed':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Completed
        </span>
      );
    case 'closed':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          Closed
        </span>
      );
    case 'draft':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <FileEdit className="w-3.5 h-3.5 text-slate-500" />
          Draft
        </span>
      );
  }
};

export const EvidenceGapBadge: React.FC<{ hasGaps: boolean }> = ({ hasGaps }) => {
  if (!hasGaps) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" />
        Evidence Complete
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200" title="Missing critical evidence, acceptance criteria, or batch details">
      <AlertCircle className="w-3 h-3 text-amber-600" />
      Unresolved Gaps
    </span>
  );
};
