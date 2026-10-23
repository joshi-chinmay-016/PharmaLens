import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  PlusCircle,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchInvestigations } from '../store/investigationsSlice';
import { StatusBadge, EvidenceGapBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const InvestigationsListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { investigations, loading, error } = useAppSelector((state) => state.investigations);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchInvestigations({ search: searchTerm, status: statusFilter }));
  }, [dispatch, searchTerm, statusFilter]);

  const handleRefresh = () => {
    dispatch(fetchInvestigations({ search: searchTerm, status: statusFilter }));
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-ink tracking-tight">
            Investigations Registry
          </h2>
          <p className="text-xs font-mono text-muted mt-1">
            Query, inspect, and audit Active Pharmaceutical Ingredient (API) quality records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2.5 border-2 border-ink bg-white hover:bg-paper text-ink transition-all shadow-brutal-xs hover:-translate-x-0.5 hover:-translate-y-0.5"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/investigations/new"
            className="btn-brutal-primary text-xs px-4 py-2.5 shadow-brutal"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Investigation</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-brutal p-4 bg-white border-2 border-ink shadow-brutal flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-ink absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, title, lot number, batch..."
            className="w-full text-xs font-sans pl-9 pr-3 py-2.5 border-2 border-ink bg-paper text-ink shadow-brutal-xs focus:bg-white focus:shadow-brutal focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-ink">
            <Filter className="w-3.5 h-3.5 text-ink" />
            <span>Filter:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-mono font-bold uppercase px-3 py-2 border-2 border-ink shadow-brutal-xs bg-white text-ink focus:outline-none focus:shadow-brutal cursor-pointer"
          >
            <option value="all">All States</option>
            <option value="Draft">Draft</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="AI Analysis Available">AI Analysis Ready</option>
            <option value="In Review">In Review</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="card-brutal p-0 bg-white border-2 border-ink shadow-brutal overflow-hidden">
        {loading && investigations.length === 0 ? (
          <LoadingSpinner message="Querying PostgreSQL records..." />
        ) : error ? (
          <div className="p-8 text-center text-rose-700 text-xs font-mono font-bold">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-600" />
            <span>{error}</span>
          </div>
        ) : investigations.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 bg-paper border-2 border-ink flex items-center justify-center mx-auto text-ink shadow-brutal-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-base text-ink">No Matching Investigations Found</h4>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search terms or clearing status filters.'
                : 'No investigations have been logged yet. Create your first record.'}
            </p>
            {searchTerm || statusFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                className="mt-2 text-xs font-mono font-bold uppercase text-teal-deep hover:underline"
              >
                Clear all filters
              </button>
            ) : (
              <Link
                to="/investigations/new"
                className="btn-brutal-primary text-xs px-4 py-2 inline-flex"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Investigation</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-paper border-b-2 border-ink font-display font-bold text-ink uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 border-r border-subtle">Investigation ID</th>
                  <th className="py-3 px-4 border-r border-subtle">Title &amp; Deviation Ref</th>
                  <th className="py-3 px-4 border-r border-subtle">Product / Lot</th>
                  <th className="py-3 px-4 border-r border-subtle">Process Step</th>
                  <th className="py-3 px-4 border-r border-subtle">Category</th>
                  <th className="py-3 px-4 border-r border-subtle">Evidence Gaps</th>
                  <th className="py-3 px-4 border-r border-subtle">Workflow State</th>
                  <th className="py-3 px-4 border-r border-subtle">Logged Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y border-t border-subtle divide-subtle font-sans">
                {investigations.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/investigations/${inv.id}`)}
                    className="hover:bg-paper/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-deep text-xs border-r border-subtle">
                      {inv.investigation_id}
                    </td>
                    <td className="py-3.5 px-4 border-r border-subtle">
                      <p className="font-bold text-ink truncate max-w-[240px]">{inv.title}</p>
                      {inv.incident_reference && (
                        <p className="text-[10px] text-muted font-mono">{inv.incident_reference}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 border-r border-subtle text-slate-700">
                      <span className="font-semibold">{inv.product_name || <span className="text-muted italic">Unspecified</span>}</span>
                      {inv.batch_number && (
                        <span className="block text-[10px] font-mono text-muted">Lot: {inv.batch_number}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 border-r border-subtle text-slate-700">
                      {inv.process_step || <span className="text-muted italic">&mdash;</span>}
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
                    <td className="py-3.5 px-4 border-r border-subtle text-muted text-[11px] font-mono">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/investigations/${inv.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-display font-bold text-xs uppercase text-teal-deep hover:text-ink underline"
                      >
                        Inspect &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        <div className="p-3 bg-paper border-t-2 border-ink text-xs text-muted flex items-center justify-between font-mono">
          <span>Showing {investigations.length} investigation record{investigations.length !== 1 ? 's' : ''}</span>
          <span className="text-[10px] uppercase font-bold text-ink">PostgreSQL 16 &bull; Immutable Audit Logs</span>
        </div>
      </div>
    </div>
  );
};
