import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface AlertBannerProps {
  type: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  message: string;
  onClose?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ type, title, message, onClose }) => {
  const configs = {
    info: {
      bg: 'bg-blue-50 border-ink text-ink',
      icon: <Info className="w-5 h-5 text-blue-700 flex-shrink-0" />,
      accent: 'border-l-4 border-l-blue-600',
    },
    warning: {
      bg: 'bg-amber-50 border-ink text-ink',
      icon: <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0" />,
      accent: 'border-l-4 border-l-amber-500',
    },
    error: {
      bg: 'bg-rose-50 border-ink text-ink',
      icon: <AlertCircle className="w-5 h-5 text-rose-700 flex-shrink-0" />,
      accent: 'border-l-4 border-l-rose-600',
    },
    success: {
      bg: 'bg-emerald-50 border-ink text-ink',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />,
      accent: 'border-l-4 border-l-emerald-600',
    },
  };

  const current = configs[type];

  return (
    <div className={`flex items-start gap-3 p-4 border-2 shadow-brutal-sm ${current.bg} ${current.accent} mb-4 relative transition-all`}>
      {current.icon}
      <div className="flex-1 text-xs">
        {title && <h4 className="font-display font-bold uppercase tracking-wider text-xs mb-0.5">{title}</h4>}
        <p className="leading-relaxed font-sans">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-ink hover:text-rose-600 p-0.5 hover:bg-paper transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
