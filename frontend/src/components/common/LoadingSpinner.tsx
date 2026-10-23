import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...', size = 'md' }) => {
  const spinnerSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

  return (
    <div className="flex flex-col items-center justify-center p-6 text-slate-500">
      <div className={`animate-spin rounded-full border-2 border-slate-300 border-t-teal-600 ${spinnerSize}`} />
      {message && <p className="mt-3 text-sm text-slate-600 font-medium">{message}</p>}
    </div>
  );
};
