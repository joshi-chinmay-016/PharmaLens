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
  ShieldCheck,
  Search,
  Sparkles,
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
    <div className="space-y-8">
      {/* Welcome / Overview Banner */}
      <div className="card-brutal p-6 bg-white border-2 border-ink shadow-brutal-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-lime-accent text-ink border border-ink px-2 py-0.5 shadow-brutal-xs">
              ACTIVE QA OPERATIONS
            </span>
            <span className="text-xs font-mono text-muted">• PostgreSQL Live Telemetry</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-ink tracking-tight">
            Root Cause Analysis &amp; CAPA Hub
          </h2>
          <p className="text-xs text-muted max-w-2xl leading-relaxed">
            Investigate Active Pharmaceutical Ingredient deviations with verifiable evidence, deductive 5 Whys, and human-confirmed findings.
          </p>
        </div>

        <Link
          to="/investigations/new"
          className="btn-brutal-primary text-xs px-5 py-3 shadow-brutal flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Investigation</span>
        </Link>
      </div>

      {/* Metrics Cards Grid (from actual DB records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border-2 border-ink p-4 shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg transition-all space-y-2">
          <div className="flex items-center justify-between text-muted">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">TOTAL RECORDS</span>
            <FileSpreadsheet className="w-4 h-4 text-ink" />
          </div>
          <div className="font-display font-black text-3xl sm:text-4xl text-ink">
            {metrics?.total_investigations ?? 0}
          </div>
          <p className="text-[10px] font-mono text-muted uppercase">Persisted investigations</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border-2 border-ink p-4 shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg transition-all space-y-2">
          <div className="flex items-center justify-between text-amber-700">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">DRAFT INTAKE</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-display font-black text-3xl sm:text-4xl text-ink">
            {metrics?.draft_investigations ?? 0}
          </div>
          <p className="text-[10px] font-mono text-muted uppercase">Pending initial review</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border-2 border-ink p-4 shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg transition-all space-y-2">
          <div className="flex items-center justify-between text-blue-700">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">IN QA REVIEW</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-display font-black text-3xl sm:text-4xl text-ink">
            {metrics?.in_review_investigations ?? 0}
          </div>
          <p className="text-[10px] font-mono text-muted uppercase">Under investigation</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border-2 border-ink p-4 shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg transition-all space-y-2">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">COMPLETED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-display font-black text-3xl sm:text-4xl text-ink">
            {metrics?.completed_investigations ?? 0}
          </div>
          <p className="text-[10px] font-mono text-muted uppercase">Sealed &amp; locked</p>
        </div>

        {/* Metric 5 */}
        <div className="bg-white border-2 border-ink p-4 shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg transition-all space-y-2">
          <div className="flex items-center justify-between text-rose-700">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">UNRESOLVED GAPS</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="font-display font-black text-3xl sm:text-4xl text-rose-700">
            {metrics?.unresolved_gaps_count ?? 0}
          </div>
          <p className="text-[10px] font-mono text-rose-800 uppercase font-semibold">Missing evidence</p>
        </div>
      </div>

      {/* Recent Investigations Table */}
      <div className="card-brutal p-0 bg-white border-2 border-ink shadow-brutal overflow-hidden">
        <div className="p-4 border-b-2 border-ink flex items-center justify-between bg-paper">
          <div>
            <h3 className="font-display font-bold text-sm text-ink uppercase tracking-wider">
              Recent Deviation Investigations
            </h3>
            <p className="text-[11px] font-mono text-muted">Direct PostgreSQL query &bull; Sorted by latest update</p>
          </div>
          <Link
            to="/investigations"
            className="btn-brutal-secondary text-[11px] px-3 py-1.5 shadow-brutal-xs"
          >
            <span>View Full Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading && recentList.length === 0 ? (
          <LoadingSpinner message="Querying PostgreSQL records..." />
        ) : error ? (
          <div className="p-6 text-center text-rose-700 text-xs font-mono font-bold">{error}</div>
        ) : recentList.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 bg-paper border-2 border-ink flex items-center justify-center mx-auto text-ink shadow-brutal-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-base text-ink">No Investigations Recorded Yet</h4>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Start by creating a new investigation record or intake an incident report to begin root cause analysis.
            </p>
            <div className="pt-2">
              <Link
                to="/investigations/new"
                className="btn-brutal-primary text-xs px-4 py-2"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create First Investigation</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-paper border-b-2 border-ink font-display font-bold text-ink uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 border-r border-subtle">ID</th>
                  <th className="py-3 px-4 border-r border-subtle">Title &amp; Deviation</th>
                  <th className="py-3 px-4 border-r border-subtle">Product / Lot</th>
                  <th className="py-3 px-4 border-r border-subtle">Category</th>
                  <th className="py-3 px-4 border-r border-subtle">Evidence Gaps</th>
                  <th className="py-3 px-4 border-r border-subtle">Workflow State</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y border-t border-subtle divide-subtle font-sans">
                {recentList.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/investigations/${inv.id}`)}
                    className="hover:bg-paper/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-deep text-xs border-r border-subtle">
                      {inv.investigation_id}
                    </td>
                    <td className="py-3.5 px-4 border-r border-subtle">
                      <p className="font-bold text-ink truncate max-w-[260px]">{inv.title}</p>
                      {inv.incident_reference && (
                        <p className="text-[10px] text-muted font-mono">{inv.incident_reference}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 border-r border-subtle text-slate-700">
                      <span className="font-semibold">{inv.product_name || 'Unspecified'}</span>
                      {inv.batch_number && (
                        <span className="block text-[10px] font-mono text-muted">Lot: {inv.batch_number}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 border-r border-subtle text-muted text-xs">
                      {inv.incident_category || 'General'}
                    </td>
                    <td className="py-3.5 px-4 border-r border-subtle">
                      <EvidenceGapBadge hasGaps={inv.has_unresolved_gaps} />
                    </td>
                    <td className="py-3.5 px-4 border-r border-subtle">
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/investigations/${inv.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-display font-bold text-xs uppercase text-teal-deep hover:text-ink underline"
                      >
                        Open Record &rarr;
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
