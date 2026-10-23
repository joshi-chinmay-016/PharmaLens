import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  PlusCircle,
  Settings,
  ShieldCheck,
  Activity,
  Layers,
  Database,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';

export const Sidebar: React.FC = () => {
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
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Investigations', path: '/investigations', icon: FileSpreadsheet },
    { name: 'New Investigation', path: '/investigations/new', icon: PlusCircle },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold shadow-md shadow-teal-900/30">
            <ShieldCheck className="w-5 h-5 text-teal-100" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">PharmaLens</h1>
            <p className="text-[10px] uppercase tracking-wider text-teal-400 font-semibold">RCA & CAPA Platform</p>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-400 italic">
          "See Beyond the Deviation."
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
          Core Workflow
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-700/30 text-teal-300 border-l-4 border-teal-500 pl-2'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        <div className="pt-6 px-3 pb-1 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
          Architecture Modules
        </div>
        <div className="space-y-1 text-xs text-slate-400 px-3">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Source Intake
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
              Active (Phase 1)
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              Evidence RCA
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              Phase 2
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              Intelligent CAPA
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              Phase 2
            </span>
          </div>
        </div>
      </nav>

      {/* System Status Footer */}
      <div className="p-4 bg-slate-950/60 border-t border-slate-800 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            Backend & DB
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                backendHealth === 'healthy'
                  ? 'bg-teal-400 shadow-sm shadow-teal-400'
                  : backendHealth === 'checking'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-[11px] text-slate-300 font-mono">
              {backendHealth === 'healthy' ? 'PostgreSQL' : backendHealth === 'checking' ? 'Connecting' : 'Offline'}
            </span>
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          Investigate with intelligence. Act with evidence.
        </p>
      </div>
    </aside>
  );
};
