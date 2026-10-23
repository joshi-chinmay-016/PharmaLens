import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, Clock, Shield } from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Quality Dashboard';
    if (path === '/investigations') return 'Investigations Registry';
    if (path.startsWith('/investigations/new')) return 'New Investigation Workspace';
    if (path.startsWith('/investigations/')) return 'Investigation Workspace';
    if (path === '/settings') return 'Platform & System Settings';
    return 'PharmaLens';
  };

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'GMP Manufacturing / Overview';
    if (path === '/investigations') return 'GMP Manufacturing / Investigations';
    if (path.startsWith('/investigations/new')) return 'GMP Manufacturing / Investigations / New';
    if (path.startsWith('/investigations/')) return 'GMP Manufacturing / Investigations / Detail';
    if (path === '/settings') return 'System / Configuration';
    return 'PharmaLens';
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div>
        <p className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
          {getBreadcrumb()}
        </p>
        <h2 className="text-lg font-bold text-slate-800 leading-tight">
          {getPageTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Compliance / Environment Badge */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md text-xs">
          <Shield className="w-3.5 h-3.5 text-teal-600" />
          <span className="font-medium">Active API QA Environment</span>
        </div>

        {/* Date / Timestamp */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{todayStr}</span>
        </div>

        {/* Quick CTA */}
        {location.pathname !== '/investigations/new' && (
          <Link
            to="/investigations/new"
            className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Investigation</span>
          </Link>
        )}
      </div>
    </header>
  );
};
