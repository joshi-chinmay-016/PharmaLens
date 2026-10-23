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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Investigations Registry</h2>
          <p className="text-xs text-slate-500">
            Browse, search, and manage Active Pharmaceutical Ingredient (API) quality investigations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 border border-slate-300 rounded-md bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/investigations/new"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-md text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Investigation</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, title, deviation ref, batch or product..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 bg-white"
          >
            <option value="all">All Workflow States</option>
            <option value="Draft">Drafts</option>
            <option value="In Review">In Review</option>
            <option value="Completed">Completed</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading && investigations.length === 0 ? (
          <LoadingSpinner message="Querying PostgreSQL records..." />
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
            <span>{error}</span>
          </div>
        ) : investigations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">No Matching Investigations Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search terms or clearing status filters.'
                : 'No investigations have been logged yet. Create your first record.'}
            </p>
            {searchTerm || statusFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                className="mt-2 text-xs text-teal-600 hover:underline font-semibold"
              >
                Clear all filters
              </button>
            ) : (
              <Link
                to="/investigations/new"
                className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-md shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Investigation</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Investigation ID</th>
                  <th className="py-3 px-4">Title & Deviation Ref</th>
                  <th className="py-3 px-4">Product / Batch</th>
                  <th className="py-3 px-4">Process Step</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Evidence Status</th>
                  <th className="py-3 px-4">Workflow Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {investigations.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/investigations/${inv.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700">
                      {inv.investigation_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900 truncate max-w-[260px]">{inv.title}</p>
                      {inv.incident_reference && (
                        <p className="text-[11px] text-slate-400 font-mono">{inv.incident_reference}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {inv.product_name || <span className="text-slate-400 italic">Not provided</span>}
                      {inv.batch_number && (
                        <span className="block text-[11px] font-mono text-slate-400">Lot: {inv.batch_number}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {inv.process_step || <span className="text-slate-400 italic">Not provided</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {inv.incident_category || 'Uncategorized'}
                    </td>
                    <td className="py-3.5 px-4">
                      <EvidenceGapBadge hasGaps={inv.has_unresolved_gaps} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
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

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing {investigations.length} investigation record{investigations.length !== 1 ? 's' : ''}</span>
          <span className="font-mono text-[11px]">PostgreSQL Database • PharmaLens Registry</span>
        </div>
      </div>
    </div>
  );
};
