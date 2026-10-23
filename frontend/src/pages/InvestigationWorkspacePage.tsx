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
          className="btn-brutal-secondary text-xs px-3 py-1.5 shadow-brutal-xs inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Registry</span>
        </button>

        {isEditMode && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/investigations/new')}
              className="btn-brutal-secondary text-xs px-3 py-1.5 shadow-brutal-xs inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-teal-deep" />
              <span>Create Another Record</span>
            </button>
          </div>
        )}
      </div>

      {/* Lifecycle Workflow Progression Bar (only in edit mode with loaded record) */}
      {isEditMode && currentInvestigation && (
        <div className="card-brutal p-5 bg-white border-2 border-ink shadow-brutal space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b-2 border-ink">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
                Workflow State:
              </span>
              <StatusBadge status={currentInvestigation.status} size="md" />
            </div>

            {/* Workflow Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {currentInvestigation.status === 'Draft' && (
                <button
                  type="button"
                  onClick={() => handleTransition('Under Investigation', 'Investigation intake initiated')}
                  className="btn-brutal-secondary text-xs px-3 py-1.5 shadow-brutal-xs inline-flex items-center gap-1.5 text-amber-800"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Mark Under Investigation
                </button>
              )}

              {(currentInvestigation.status === 'Draft' || currentInvestigation.status === 'Under Investigation') && (
                <button
                  type="button"
                  onClick={() => handleTransition('In Review', 'Submitted for quality review')}
                  className="btn-brutal-secondary text-xs px-3 py-1.5 shadow-brutal-xs inline-flex items-center gap-1.5 text-blue-800"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Move to In Review
                </button>
              )}

              {currentInvestigation.status === 'AI Analysis Available' && (
                <button
                  type="button"
                  onClick={() => handleTransition('In Review', 'Reviewer commenced findings review')}
                  className="btn-brutal-lime text-xs px-3.5 py-1.5 shadow-brutal-xs inline-flex items-center gap-1.5"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Start Human Review
                </button>
              )}

              {currentInvestigation.status === 'In Review' && (
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(true)}
                  className="btn-brutal-primary text-xs px-4 py-2 shadow-brutal inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-lime-accent" />
                  <span>Sign Off &amp; Complete Investigation</span>
                </button>
              )}

              {isCompleted && (
                <button
                  type="button"
                  onClick={() => setIsReopenModalOpen(true)}
                  className="btn-brutal-secondary text-xs px-3 py-1.5 shadow-brutal-xs inline-flex items-center gap-1.5 text-amber-900 border-2 border-amber-800"
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
                  className={`flex items-center gap-2 p-2.5 border-2 border-ink shadow-brutal-xs text-xs font-mono font-bold uppercase transition-all ${
                    isCurrent
                      ? 'bg-lime-accent text-ink -translate-y-0.5'
                      : isPast
                      ? 'bg-teal-primary text-white'
                      : 'bg-paper text-muted'
                  }`}
                >
                  <div
                    className={`w-5 h-5 border border-ink flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-ink text-lime-accent'
                        : isPast
                        ? 'bg-white text-ink'
                        : 'bg-white text-muted'
                    }`}
                  >
                    {isPast ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                  </div>
                  <span className="truncate">{stage.key}</span>
                </div>
              );
            })}
          </div>

          {lifecycleError && (
            <div className="p-3 bg-rose-50 border-2 border-ink shadow-brutal-xs text-rose-900 text-xs font-mono font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                <span>{lifecycleError}</span>
              </div>
              <button
                type="button"
                onClick={() => setLifecycleError(null)}
                className="text-rose-700 hover:text-rose-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {loading && isEditMode && !currentInvestigation ? (
        <LoadingSpinner message="Retrieving investigation record..." />
      ) : error && isEditMode && !currentInvestigation ? (
        <div className="p-8 card-brutal bg-white text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h3 className="font-display font-bold text-base text-ink">Failed to Load Investigation</h3>
          <p className="text-xs text-muted font-mono">{error}</p>
          <button
            type="button"
            onClick={() => id && dispatch(fetchInvestigationById(id))}
            className="btn-brutal-primary text-xs px-4 py-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-xs p-4">
          <div className="card-brutal p-6 bg-white border-2 border-ink shadow-brutal-xl max-w-lg w-full space-y-4">
            <div className="flex items-center gap-3 border-b-2 border-ink pb-3">
              <div className="w-10 h-10 border-2 border-ink bg-emerald-100 flex items-center justify-center text-emerald-800 shadow-brutal-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-ink uppercase tracking-wider">
                  Complete &amp; Seal Investigation
                </h3>
                <p className="text-xs font-mono text-muted">
                  {currentInvestigation?.investigation_id} &bull; Formal Quality Sign-Off
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-800 bg-paper p-3 border-2 border-ink shadow-brutal-xs">
              <p>
                <strong>Regulatory &amp; Quality Safeguard:</strong> Completing this investigation seals the record from direct edits. Ensure root causes have been human-confirmed and critical gaps are resolved.
              </p>
              {currentInvestigation?.has_unresolved_gaps && (
                <div className="p-2 bg-amber-100 border border-ink text-amber-900 flex items-start gap-1.5 font-mono text-[11px]">
                  <AlertCircle className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" />
                  <span>
                    Warning: Investigation has unresolved gaps flagged. Please provide QA disposition justification below to complete.
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-ink block">
                Quality Reviewer Sign-off Rationale / Disposition Notes:
              </label>
              <textarea
                value={completionJustification}
                onChange={(e) => setCompletionJustification(e.target.value)}
                placeholder="Document QA evaluation, root cause verification evidence, and disposition approval..."
                rows={3}
                className="w-full text-xs p-2.5 border-2 border-ink bg-white font-sans text-ink shadow-brutal-xs focus:shadow-brutal focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-ink">
              <button
                type="button"
                onClick={() => setIsCompleteModalOpen(false)}
                className="btn-brutal-secondary text-xs px-3.5 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleTransition('Completed', completionJustification)}
                className="btn-brutal-primary text-xs px-4 py-2"
              >
                Confirm Sign-off &amp; Seal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Investigation Modal */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-xs p-4">
          <div className="card-brutal p-6 bg-white border-2 border-ink shadow-brutal-xl max-w-lg w-full space-y-4">
            <div className="flex items-center gap-3 border-b-2 border-ink pb-3">
              <div className="w-10 h-10 border-2 border-ink bg-amber-100 flex items-center justify-center text-amber-800 shadow-brutal-xs">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-ink uppercase tracking-wider">
                  Reopen Investigation
                </h3>
                <p className="text-xs font-mono text-muted">
                  {currentInvestigation?.investigation_id} &bull; GxP Reopening Workflow
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Reopening a completed pharmaceutical investigation generates an auditable record in compliance history. Please state the specific regulatory or analytical justification (minimum 5 characters).
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-ink block">
                Mandatory Reopening Justification:
              </label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g., New analytical data received, CAPA effectiveness check failure, or QA audit observation..."
                rows={3}
                className="w-full text-xs p-2.5 border-2 border-ink bg-white font-sans text-ink shadow-brutal-xs focus:shadow-brutal focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-ink block">
                Target Transition State:
              </label>
              <select
                value={reopenTargetStatus}
                onChange={(e) => setReopenTargetStatus(e.target.value)}
                className="w-full text-xs p-2.5 border-2 border-ink bg-white font-mono font-bold uppercase shadow-brutal-xs focus:shadow-brutal focus:outline-none cursor-pointer"
              >
                <option value="In Review">In Review (QA Reviewing New Data)</option>
                <option value="Under Investigation">Under Investigation (Collecting Further Evidence)</option>
                <option value="Draft">Draft (Restructuring Investigation)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-ink">
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="btn-brutal-secondary text-xs px-3.5 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReopen}
                className="btn-brutal-primary text-xs px-4 py-2"
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
