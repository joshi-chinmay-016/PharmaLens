import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, Clock, Shield, Home, Menu } from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Quality Operations Dashboard';
    if (path === '/investigations') return 'Investigations Registry';
    if (path.startsWith('/investigations/new')) return 'New Investigation Workspace';
    if (path.startsWith('/investigations/')) return 'Investigation Workspace';
    if (path === '/settings') return 'Platform & System Settings';
    return 'PharmaLens';
  };

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'GMP Operations / Live Quality Metrics';
    if (path === '/investigations') return 'GMP Operations / Investigations Registry';
    if (path.startsWith('/investigations/new')) return 'GMP Operations / Investigations / New Record';
    if (path.startsWith('/investigations/')) return 'GMP Operations / Investigations / Active Case';
    if (path === '/settings') return 'System / Platform Architecture';
    return 'PharmaLens';
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="h-16 bg-white border-b-2 border-ink px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 border-2 border-ink bg-paper text-ink shadow-brutal-xs hover:bg-white"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <p className="text-[10px] font-mono font-bold text-muted tracking-wider uppercase hidden sm:block">
            {getBreadcrumb()}
          </p>
          <h2 className="text-sm sm:text-base lg:text-lg font-display font-black text-ink leading-tight">
            {getPageTitle()}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Compliance / Environment Badge */}
        <div className="hidden lg:flex items-center gap-2 bg-teal-primary border-2 border-ink text-white px-2.5 py-1 text-[10px] font-mono font-bold uppercase shadow-brutal-xs">
          <Shield className="w-3.5 h-3.5 text-lime-accent" />
          <span>Active GMP QA Environment</span>
        </div>

        {/* Date / Timestamp */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-muted font-mono font-semibold">
          <Clock className="w-3.5 h-3.5 text-muted" />
          <span>{todayStr}</span>
        </div>

        {/* Home / Landing link */}
        <Link
          to="/"
          className="hidden sm:inline-flex items-center gap-1.5 border-2 border-slate-400 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 text-xs font-mono font-bold shadow-[2px_2px_0px_#64748B] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#64748B] transition-all"
          title="Return to Product Landing Page"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Product Home</span>
        </Link>

        {/* Quick CTA */}
        {location.pathname !== '/investigations/new' && (
          <Link
            to="/investigations/new"
            className="btn-brutal-primary text-xs px-2.5 sm:px-3 py-1.5 shadow-brutal-sm flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Investigation</span>
            <span className="sm:hidden">New</span>
          </Link>
        )}
      </div>
    </header>
  );
};
