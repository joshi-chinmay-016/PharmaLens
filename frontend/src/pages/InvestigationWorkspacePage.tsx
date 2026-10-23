import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ChevronRight,
  FileCheck2,
  Check,
  X,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchInvestigationById,
  createInvestigation,
  updateInvestigation,
  transitionInvestigationStatus,
  reopenInvestigation,
  clearCurrentInvestigation,
  clearSaveFeedback,
} from '../store/investigationsSlice';
import { InvestigationForm } from '../components/investigations/InvestigationForm';
import { AssistancePanel } from '../components/investigations/AssistancePanel';
import { SourceIntakeModal } from '../components/investigations/SourceIntakeModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import { SourceDocument } from '../types';

export const InvestigationWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    currentInvestigation,
    loading,
    saveLoading,
    error,
    saveError,
    saveSuccessMessage,
  } = useAppSelector((state) => state.investigations);

  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [pendingSourceDoc, setPendingSourceDoc] = useState<SourceDocument | null>(null);

  // Lifecycle modal states
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completionJustification, setCompletionJustification] = useState('');
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenTargetStatus, setReopenTargetStatus] = useState('In Review');
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);

  const isEditMode = Boolean(id && id !== 'new');
  const isCompleted = currentInvestigation?.status === 'Completed';

  useEffect(() => {
    if (isEditMode && id) {
      dispatch(fetchInvestigationById(id));
    } else {
      dispatch(clearCurrentInvestigation());
    }

    return () => {
      dispatch(clearSaveFeedback());
    };
  }, [dispatch, id, isEditMode]);

  const handleSave = async (formData: any) => {
    if (isEditMode && id) {
      await dispatch(updateInvestigation({ idOrCode: id, payload: formData }));
    } else {
      const resultAction = await dispatch(createInvestigation(formData));
      if (createInvestigation.fulfilled.match(resultAction)) {
        const created = resultAction.payload;
        navigate(`/investigations/${created.id}`, { replace: true });
      }
    }
  };

  const handleTransition = async (targetStatus: string, justification?: string) => {
    if (!id) return;
    setLifecycleError(null);
    const result = await dispatch(
      transitionInvestigationStatus({
        idOrCode: id,
        payload: { target_status: targetStatus, justification },
      })
    );
    if (transitionInvestigationStatus.rejected.match(result)) {
      setLifecycleError((result.payload as string) || 'Failed to update workflow state.');
    } else {
      setIsCompleteModalOpen(false);
      setCompletionJustification('');
    }
  };

  const handleReopen = async () => {
    if (!id || !reopenReason.trim() || reopenReason.trim().length < 5) {
      setLifecycleError('A documented justification (at least 5 characters) is required to reopen an investigation.');
      return;
    }
    setLifecycleError(null);
    const result = await dispatch(
      reopenInvestigation({
        idOrCode: id,
        payload: { reason: reopenReason.trim(), target_status: reopenTargetStatus },
      })
    );
    if (reopenInvestigation.rejected.match(result)) {
      setLifecycleError((result.payload as string) || 'Failed to reopen investigation.');
    } else {
      setIsReopenModalOpen(false);
      setReopenReason('');
    }
  };

  const handleApplyExtractedText = (text: string, titleHint?: string, sourceDoc?: SourceDocument) => {
    if (sourceDoc) {
      setPendingSourceDoc(sourceDoc);
    }
  };

  const lifecycleStages = [
    { key: 'Draft', label: '1. Draft' },
    { key: 'Under Investigation', label: '2. Under Investigation' },
    { key: 'AI Analysis Available', label: '3. AI Analysis Available' },
    { key: 'In Review', label: '4. In Review' },
    { key: 'Completed', label: '5. Completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/investigations')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Registry</span>
        </button>

        {isEditMode && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/investigations/new')}
              className="inline-flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-md font-medium transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Another Record</span>
            </button>
          </div>
        )}
      </div>

      {/* Lifecycle Workflow Progression Bar (only in edit mode with loaded record) */}
      {isEditMode && currentInvestigation && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Lifecycle State:
              </span>
              <StatusBadge status={currentInvestigation.status} size="md" />
            </div>

            {/* Workflow Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {currentInvestigation.status === 'Draft' && (
                <button
                  type="button"
                  onClick={() => handleTransition('Under Investigation', 'Investigation intake initiated')}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-md font-semibold transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Mark Under Investigation
                </button>
              )}

              {(currentInvestigation.status === 'Draft' || currentInvestigation.status === 'Under Investigation') && (
                <button
                  type="button"
                  onClick={() => handleTransition('In Review', 'Submitted for quality review')}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-md font-semibold transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Move to In Review
                </button>
              )}

              {currentInvestigation.status === 'AI Analysis Available' && (
                <button
                  type="button"
                  onClick={() => handleTransition('In Review', 'Reviewer commenced findings review')}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-md font-semibold transition-colors"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Start Human Review
                </button>
              )}

              {currentInvestigation.status === 'In Review' && (
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-md font-semibold shadow-sm transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Sign Off & Complete Investigation
                </button>
              )}

              {isCompleted && (
                <button
                  type="button"
                  onClick={() => setIsReopenModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-md font-semibold transition-colors shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reopen Investigation
                </button>
              )}
            </div>
          </div>

          {/* Lifecycle Step Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
            {lifecycleStages.map((stage, idx) => {
              const currentIdx = lifecycleStages.findIndex(
                (s) => s.key.toLowerCase() === currentInvestigation.status.toLowerCase()
              );
              const isCurrent = currentInvestigation.status.toLowerCase() === stage.key.toLowerCase();
              const isPast = currentIdx !== -1 && idx < currentIdx;

              return (
                <div
                  key={stage.key}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-colors ${
                    isCurrent
                      ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold'
                      : isPast
                      ? 'bg-slate-50 border-slate-200 text-slate-700'
                      : 'bg-white border-slate-100 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isCurrent
                        ? 'bg-teal-600 text-white'
                        : isPast
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isPast ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                  </div>
                  <span className="truncate">{stage.key}</span>
                </div>
              );
            })}
          </div>

          {lifecycleError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{lifecycleError}</span>
              </div>
              <button
                type="button"
                onClick={() => setLifecycleError(null)}
                className="text-rose-500 hover:text-rose-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {loading && isEditMode && !currentInvestigation ? (
        <LoadingSpinner message="Retrieving investigation record..." />
      ) : error && isEditMode && !currentInvestigation ? (
        <div className="p-8 bg-white border border-rose-200 rounded-xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">Failed to Load Investigation</h3>
          <p className="text-xs text-slate-500">{error}</p>
          <button
            type="button"
            onClick={() => id && dispatch(fetchInvestigationById(id))}
            className="text-xs px-4 py-2 bg-slate-900 text-white rounded-md font-medium"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        /* Dual-Panel Workspace Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Primary Form Area */}
          <div className="lg:col-span-7 space-y-6">
            <InvestigationForm
              initialData={currentInvestigation}
              onSave={handleSave}
              isSaving={saveLoading}
              saveSuccessMessage={saveSuccessMessage}
              saveError={saveError}
              onOpenSourceIntake={() => setIsIntakeOpen(true)}
              pendingSourceDoc={pendingSourceDoc}
              isCompleted={isCompleted}
            />
          </div>

          {/* Secondary Assistance & Intelligence Panel */}
          <div className="lg:col-span-5 sticky top-20">
            <AssistancePanel
              investigation={currentInvestigation}
              onOpenSourceIntake={() => setIsIntakeOpen(true)}
              attachedSources={
                currentInvestigation?.source_documents?.length
                  ? currentInvestigation.source_documents
                  : pendingSourceDoc
                  ? [pendingSourceDoc]
                  : []
              }
            />
          </div>
        </div>
      )}

      {/* Complete Investigation Confirmation Modal */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Complete & Seal Investigation</h3>
                <p className="text-xs text-slate-500">
                  {currentInvestigation?.investigation_id} — Formal Quality Sign-off
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p>
                <strong>Regulatory & Quality Safeguard:</strong> Completing this investigation seals the record from direct edits. Ensure root causes have been human-confirmed and critical gaps are resolved.
              </p>
              {currentInvestigation?.has_unresolved_gaps && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Warning: Investigation has unresolved gaps flagged. Please provide QA disposition justification below to complete.
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Quality Reviewer Sign-off Rationale / Disposition Notes:
              </label>
              <textarea
                value={completionJustification}
                onChange={(e) => setCompletionJustification(e.target.value)}
                placeholder="Document QA evaluation, root cause verification evidence, and disposition approval..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCompleteModalOpen(false)}
                className="text-xs px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleTransition('Completed', completionJustification)}
                className="text-xs text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 rounded-md font-semibold shadow-sm transition-colors"
              >
                Confirm Sign-off & Seal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Investigation Modal */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Reopen Investigation</h3>
                <p className="text-xs text-slate-500">
                  {currentInvestigation?.investigation_id} — GxP Reopening Workflow
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Reopening a completed pharmaceutical investigation generates an auditable record in compliance history. Please state the specific regulatory or analytical justification (minimum 5 characters).
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Mandatory Reopening Justification:
              </label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g., New chromatography data received, CAPA effectiveness check failure, or QA audit observation..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Target Transition State:
              </label>
              <select
                value={reopenTargetStatus}
                onChange={(e) => setReopenTargetStatus(e.target.value)}
                className="w-full text-xs p-2 rounded-md border border-slate-300 bg-white"
              >
                <option value="In Review">In Review (QA Reviewing New Data)</option>
                <option value="Under Investigation">Under Investigation (Collecting Further Evidence)</option>
                <option value="Draft">Draft (Restructuring Investigation)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="text-xs px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReopen}
                className="text-xs text-white bg-amber-700 hover:bg-amber-800 px-4 py-1.5 rounded-md font-semibold shadow-sm transition-colors"
              >
                Confirm Reopening
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Source Intake Modal */}
      <SourceIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        investigationId={currentInvestigation?.id}
        onApplyExtractedText={handleApplyExtractedText}
      />
    </div>
  );
};
