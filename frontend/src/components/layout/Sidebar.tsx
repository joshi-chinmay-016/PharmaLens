import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  PlusCircle,
  Settings,
  ShieldCheck,
  Activity,
  Layers,
  Database,
  Home,
  CheckCircle2,
  X,
} from 'lucide-react';
import { api } from '../../services/api';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const [backendHealth, setBackendHealth] = useState<'healthy' | 'checking' | 'offline'>('checking');

  useEffect(() => {
    let isMounted = true;
    api.getHealth()
      .then((res) => {
        if (isMounted) setBackendHealth(res.status === 'healthy' ? 'healthy' : 'offline');
      })
      .catch(() => {
        if (isMounted) setBackendHealth('offline');
      });
    return () => { isMounted = false; };
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Investigations', path: '/investigations', icon: FileSpreadsheet },
    { name: 'New Investigation', path: '/investigations/new', icon: PlusCircle },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const sidebarContent = (
    <aside className="w-64 bg-ink text-white flex flex-col flex-shrink-0 border-r-2 border-ink h-full">
      {/* Brand Header */}
      <div className="p-5 border-b-2 border-white/20 bg-ink flex items-center justify-between">
        <Link to="/" onClick={onCloseMobile} className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-teal border-2 border-white flex items-center justify-center text-white shadow-brutal-xs group-hover:scale-105 transition-all">
            <ShieldCheck className="w-6 h-6 text-lime" />
          </div>
          <div>
            <div className="flex items-center">
              <span className="font-display font-extrabold text-xl tracking-tight text-white">Pharma</span>
              <span className="font-display font-extrabold text-xl tracking-tight text-lime">Lens</span>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-teal-light font-bold">RCA &amp; CAPA Platform</p>
          </div>
        </Link>
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden text-gray-400 hover:text-white p-1"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        <div className="px-3 pb-1 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">
          Core Workflows
        </div>

        {/* Landing Page Quick Link */}
        <Link
          to="/"
          onClick={onCloseMobile}
          className="flex items-center gap-3 px-3 py-2 text-xs font-mono font-semibold text-slate-300 hover:text-white hover:bg-white/10 border border-transparent transition-all"
        >
          <Home className="w-4 h-4 text-lime" />
          <span>Product Overview</span>
        </Link>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-xs font-display font-bold uppercase tracking-wider transition-all border-2 ${
                  isActive
                    ? 'bg-teal text-white border-white shadow-brutal-xs translate-x-1'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        <div className="pt-6 px-3 pb-1 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">
          Active Modules
        </div>
        <div className="space-y-1 text-xs text-slate-300 px-3 font-mono">
          <div className="flex items-center justify-between py-1.5 border-b border-white/10 text-[11px]">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-lime" />
              Source Intake
            </span>
            <span className="text-[9px] px-1.5 py-0.2 bg-teal text-white border border-white font-bold">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-white/10 text-[11px]">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-lime" />
              LangGraph RCA
            </span>
            <span className="text-[9px] px-1.5 py-0.2 bg-teal text-white border border-white font-bold">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 text-[11px]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-lime" />
              Intelligent CAPA
            </span>
            <span className="text-[9px] px-1.5 py-0.2 bg-teal text-white border border-white font-bold">
              Active
            </span>
          </div>
        </div>
      </nav>

      {/* System Status Footer */}
      <div className="p-4 bg-black/40 border-t-2 border-white/20 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300 font-mono text-[11px] font-bold flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-lime" />
            Backend &amp; DB
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 inline-block ${
                backendHealth === 'healthy'
                  ? 'bg-lime'
                  : backendHealth === 'checking'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-[10px] text-white font-mono font-bold uppercase">
              {backendHealth === 'healthy' ? 'PostgreSQL' : backendHealth === 'checking' ? 'Connecting' : 'Offline'}
            </span>
          </span>
        </div>
        <p className="text-[10px] text-slate-400 font-mono leading-snug">
          Investigate with intelligence. Act with evidence.
        </p>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex flex-col flex-shrink-0 h-full">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-ink/70 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-50 h-full shadow-brutal-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
