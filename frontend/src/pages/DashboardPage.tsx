import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PlusCircle,
  FileText,
  ArrowRight,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchInvestigations, fetchMetrics } from '../store/investigationsSlice';
import { StatusBadge, EvidenceGapBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { investigations, metrics, loading, error } = useAppSelector((state) => state.investigations);

  useEffect(() => {
    dispatch(fetchMetrics());
    dispatch(fetchInvestigations());
  }, [dispatch]);

  const recentList = investigations.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome / Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded">
              Active Investigation Suite
            </span>
            <span className="text-xs text-slate-400">• GMP Quality Operations</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Root Cause Analysis & CAPA Hub</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Investigate Active Pharmaceutical Ingredient (API) deviations with intelligence and act with verifiable evidence.
          </p>
        </div>

        <Link
          to="/investigations/new"
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-md transition-colors flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Investigation</span>
        </Link>
      </div>

      {/* Metrics Cards Grid (from actual DB records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Records</span>
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.total_investigations ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Logged deviations & RCAs</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Draft</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.draft_investigations ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Intake pending full review</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Review</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.in_review_investigations ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Under QA investigation</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.completed_investigations ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sealed & signed-off records</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Unresolved Gaps</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.unresolved_gaps_count ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Missing key data or evidence</p>
        </div>
      </div>

      {/* Recent Investigations Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Investigations</h3>
            <p className="text-xs text-slate-500">Live persisted investigation records from PostgreSQL</p>
          </div>
          <Link
            to="/investigations"
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1"
          >
            <span>View All Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading && recentList.length === 0 ? (
          <LoadingSpinner message="Loading recent records..." />
        ) : error ? (
          <div className="p-6 text-center text-rose-600 text-xs">{error}</div>
        ) : recentList.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700">No Investigations Recorded Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start by creating a new investigation record or intake an incident report to begin root cause analysis.
            </p>
            <div className="pt-2">
              <Link
                to="/investigations/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create First Investigation</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Investigation ID</th>
                  <th className="py-3 px-4">Title & Deviation</th>
                  <th className="py-3 px-4">Product / Batch</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Evidence Status</th>
                  <th className="py-3 px-4">Workflow Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentList.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/investigations/${inv.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">
                      {inv.investigation_id}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 truncate max-w-[280px]">{inv.title}</p>
                      {inv.incident_reference && (
                        <p className="text-[11px] text-slate-400 font-mono">{inv.incident_reference}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {inv.product_name || 'Not provided'}
                      {inv.batch_number && (
                        <span className="block text-[11px] font-mono text-slate-400">Lot: {inv.batch_number}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {inv.incident_category || 'Uncategorized'}
                    </td>
                    <td className="py-3 px-4">
                      <EvidenceGapBadge hasGaps={inv.has_unresolved_gaps} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/investigations/${inv.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-teal-600 hover:text-teal-800 font-semibold"
                      >
                        Open Record
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
