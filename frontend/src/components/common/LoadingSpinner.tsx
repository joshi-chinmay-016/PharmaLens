import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Processing...', size = 'md' }) => {
  const spinnerSize = size === 'sm' ? 'w-4 h-4 border-2' : size === 'lg' ? 'w-8 h-8 border-3' : 'w-6 h-6 border-2';

  return (
    <div className="flex flex-col items-center justify-center p-6 text-ink">
      <div className={`animate-spin border-ink border-t-teal-primary ${spinnerSize}`} style={{ borderRadius: '0px' }} />
      {message && (
        <p className="mt-3 text-xs font-mono font-bold tracking-wider uppercase text-ink">
          {message}
        </p>
      )}
    </div>
  );
};
