import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  FileCheck2,
  Check,
  X,
  FileText,
  Layers,
  GitBranch,
  Save,
  Upload,
  ExternalLink,
  History,
  AlertTriangle,
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
  fetchAuditLogs,
} from '../store/investigationsSlice';
import {
  fetchLatestAnalysis,
  fetchAnalysisHistory,
  clearAnalysisState,
} from '../store/slices/analysisSlice';
import { InvestigationForm, InvestigationFormData } from '../components/investigations/InvestigationForm';
import { AssistancePanel } from '../components/investigations/AssistancePanel';
import { SourceIntakeModal } from '../components/investigations/SourceIntakeModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import { InvestigationStatus, SourceDocument } from '../types';

type InvestigationStage = 'intake' | 'evidence' | 'rca' | 'capa' | 'review';

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
    auditLogs,
  } = useAppSelector((state) => state.investigations);

  const { currentAnalysis, loading: analysisLoading } = useAppSelector((state) => state.analysis);

  // Staged workflow navigation state
  const [activeStage, setActiveStage] = useState<InvestigationStage>('intake');
  const [rcaSubTab, setRcaSubTab] = useState<'causes' | 'fiveWhys' | 'fishbone'>('causes');

  // Contextual AI drawer state
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Source intake modal state
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [pendingSourceDoc, setPendingSourceDoc] = useState<SourceDocument | null>(null);
  const [previewSnippetDoc, setPreviewSnippetDoc] = useState<{ title: string; text: string } | null>(null);

  // Lifecycle modal states
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completionJustification, setCompletionJustification] = useState('');
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenTargetStatus, setReopenTargetStatus] = useState('In Review');
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);

  // Persistent form state (never lost when navigating between stages)
  const [formData, setFormData] = useState<InvestigationFormData>({
    title: '',
    incident_reference: '',
    status: 'Draft' as InvestigationStatus,
    incident_description: '',
    incident_datetime: '',
    discovery_datetime: '',
    product_name: '',
    batch_number: '',
    manufacturing_site: '',
    process_step: '',
    incident_category: 'OOS Result',
    expected_result: '',
    actual_result: '',
    acceptance_criterion: '',
    immediate_impact: '',
    immediate_containment: '',
    reporter_name: '',
    known_facts: '',
    initial_observations: '',
    evidence_available: '',
    investigation_notes: '',
    has_unresolved_gaps: false,
  });

  const [isDirty, setIsDirty] = useState(false);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  const isEditMode = Boolean(id && id !== 'new');
  const isCompleted = currentInvestigation?.status === 'Completed';

  // Initialize and load investigation data
  useEffect(() => {
    // Clear previous analysis state immediately on route change to prevent stale data
    dispatch(clearAnalysisState());

    if (isEditMode && id) {
      const numId = Number(id);
      dispatch(fetchInvestigationById(id));
      if (!isNaN(numId)) {
        dispatch(fetchLatestAnalysis(numId));
        dispatch(fetchAnalysisHistory(numId));
        dispatch(fetchAuditLogs(numId));
      }
    } else {
      dispatch(clearCurrentInvestigation());
    }

    return () => {
      dispatch(clearSaveFeedback());
      dispatch(clearAnalysisState());
    };
  }, [dispatch, id, isEditMode]);

  // Synchronize form data when currentInvestigation loads
  useEffect(() => {
    if (currentInvestigation && !isDirty) {
      setFormData({
        title: currentInvestigation.title || '',
        incident_reference: currentInvestigation.incident_reference || '',
        status: currentInvestigation.status || 'Draft',
        incident_description: currentInvestigation.incident_description || '',
        incident_datetime: currentInvestigation.incident_datetime ? currentInvestigation.incident_datetime.substring(0, 16) : '',
        discovery_datetime: currentInvestigation.discovery_datetime ? currentInvestigation.discovery_datetime.substring(0, 16) : '',
        product_name: currentInvestigation.product_name || '',
        batch_number: currentInvestigation.batch_number || '',
        manufacturing_site: currentInvestigation.manufacturing_site || '',
        process_step: currentInvestigation.process_step || '',
        incident_category: currentInvestigation.incident_category || 'OOS Result',
        expected_result: currentInvestigation.expected_result || '',
        actual_result: currentInvestigation.actual_result || '',
        acceptance_criterion: currentInvestigation.acceptance_criterion || '',
        immediate_impact: currentInvestigation.immediate_impact || '',
        immediate_containment: currentInvestigation.immediate_containment || '',
        reporter_name: currentInvestigation.reporter_name || '',
        known_facts: currentInvestigation.known_facts || '',
        initial_observations: currentInvestigation.initial_observations || '',
        evidence_available: currentInvestigation.evidence_available || '',
        investigation_notes: currentInvestigation.investigation_notes || '',
        has_unresolved_gaps: currentInvestigation.has_unresolved_gaps ?? false,
      });
    }
  }, [currentInvestigation, isDirty]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setIsDirty(true);
    setFormValidationError(null);
  };

  const handleLoadScenario = () => {
    setFormData({
      title: 'Residual Solvent Result Outside Acceptance Criteria',
      incident_reference: 'DEV-2026-014',
      status: 'Draft',
      incident_description: 'During batch release testing of Example API Batch API-2026-014, residual solvent (methanol/acetone) was reported at 0.65%, exceeding the illustrative limit of 0.50%.',
      incident_datetime: '2026-10-22T14:30',
      discovery_datetime: '2026-10-23T09:00',
      product_name: 'Example API',
      batch_number: 'API-2026-014',
      manufacturing_site: 'Area C, Vacuum Tray Dryer Suite 04',
      process_step: 'Drying',
      incident_category: 'OOS Result',
      expected_result: 'Residual solvent <= 0.50% after 18-hour standard drying profile',
      actual_result: 'Residual solvent reported as 0.65%',
      acceptance_criterion: 'NMT 0.50% (Illustrative specification limit)',
      immediate_impact: 'Batch release withheld. Lot placed in electronic and physical quarantine.',
      immediate_containment: 'Physical quarantine tag QA-Q-881 attached to pallet. ERP status locked to Quarantine.',
      reporter_name: 'QC Analytical Team / Shift Supervisor',
      known_facts: '- Standard drying cycle executed on 2026-10-22.\n- Analytical method executed according to validated SOP TM-SOLV-01.\n- Test performed in duplicate with consistent readings.',
      initial_observations: 'Review of drying logs suggests vacuum pressure profile experienced intermittent fluctuations during the final 3 hours.',
      evidence_available: '- QC Analytical Test Certificate #TC-2026-904\n- Batch Production Record BPR-API-2026-014 (Section 7: Drying)',
      investigation_notes: 'Potential investigation areas:\n1. Actual drying-cycle duration and vacuum depth\n2. Temperature trend record across all 4 heated shelves\n3. Vacuum dryer sensor calibration records\n4. Re-test analytical sample preparation integrity',
      has_unresolved_gaps: true,
    });
    setIsDirty(true);
  };

  const handleSaveForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setFormValidationError('Investigation title is required and must be at least 3 characters.');
      return;
    }
    setFormValidationError(null);

    const payload: any = {
      ...formData,
      incident_datetime: formData.incident_datetime ? new Date(formData.incident_datetime).toISOString() : null,
      discovery_datetime: formData.discovery_datetime ? new Date(formData.discovery_datetime).toISOString() : null,
    };

    if (pendingSourceDoc && !currentInvestigation) {
      payload.source_document_ids = [pendingSourceDoc.id];
    }

    if (isEditMode && id) {
      const res = await dispatch(updateInvestigation({ idOrCode: id, payload }));
      if (updateInvestigation.fulfilled.match(res)) {
        setIsDirty(false);
      }
    } else {
      const resultAction = await dispatch(createInvestigation(payload));
      if (createInvestigation.fulfilled.match(resultAction)) {
        setIsDirty(false);
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

    if (text) {
      const extractField = (patterns: RegExp[]): string => {
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match && match[1]) return match[1].trim();
        }
        return '';
      };

      const extractedTitle = extractField([
        /(?:Title|Investigation Title|Incident Title)[:\s]+([^\r\n]+)/i,
        /(?:Subject)[:\s]+([^\r\n]+)/i,
      ]) || titleHint || '';

      const extractedRef = extractField([
        /(?:Deviation Number|Deviation Reference|Incident Reference|Reference)[:\s]+([^\r\n]+)/i,
      ]);

      const extractedProduct = extractField([
        /(?:Product Name|Product)[:\s]+([^\r\n]+)/i,
      ]);

      const extractedBatch = extractField([
        /(?:Batch \/ Lot Number|Batch Number|Lot Number|Batch)[:\s]+([^\r\n]+)/i,
      ]);

      const extractedSite = extractField([
        /(?:Facility \/ Site|Manufacturing Site|Site|Facility)[:\s]+([^\r\n]+)/i,
      ]);

      const extractedStep = extractField([
        /(?:Process Step|Operation|Equipment Involved)[:\s]+([^\r\n]+)/i,
      ]);

      const extractedReporter = extractField([
        /(?:Reported By|Reporter|Author|Investigator)[:\s]+([^\r\n]+)/i,
      ]);

      setFormData((prev) => ({
        ...prev,
        title: prev.title || extractedTitle || (sourceDoc?.original_filename ? `Investigation: ${sourceDoc.original_filename.replace('.pdf', '')}` : prev.title),
        incident_reference: prev.incident_reference || extractedRef || prev.incident_reference,
        product_name: prev.product_name || extractedProduct || prev.product_name,
        batch_number: prev.batch_number || extractedBatch || prev.batch_number,
        manufacturing_site: prev.manufacturing_site || extractedSite || prev.manufacturing_site,
        process_step: prev.process_step || extractedStep || prev.process_step,
        reporter_name: prev.reporter_name || extractedReporter || prev.reporter_name,
        known_facts: prev.known_facts || text.substring(0, 1500),
        incident_description: prev.incident_description || text.substring(0, 800),
      }));
      setIsDirty(true);
    }
  };

  const attachedSourcesList = currentInvestigation?.source_documents?.length
    ? currentInvestigation.source_documents
    : pendingSourceDoc
    ? [pendingSourceDoc]
    : [];

  const structured = currentAnalysis?.structured_output;
  const isConfirmed = currentAnalysis?.is_confirmed_by_human;

  const stages: { id: InvestigationStage; number: string; title: string; subtitle: string; badge?: string }[] = [
    {
      id: 'intake',
      number: '01',
      title: 'Intake & Context',
      subtitle: 'Incident details & documents',
      badge: attachedSourcesList.length ? `${attachedSourcesList.length} docs` : undefined,
    },
    {
      id: 'evidence',
      number: '02',
      title: 'Evidence & Gaps',
      subtitle: 'Extracted facts & missing evidence',
      badge: structured?.extracted_facts?.length ? `${structured.extracted_facts.length} facts` : undefined,
    },
    {
      id: 'rca',
      number: '03',
      title: 'Root Cause (RCA)',
      subtitle: 'Hypotheses, 5 Whys & Fishbone',
      badge: isConfirmed ? 'Confirmed' : structured?.potential_root_causes?.length ? `${structured.potential_root_causes.length} causes` : undefined,
    },
    {
      id: 'capa',
      number: '04',
      title: 'CAPA Actions',
      subtitle: 'Corrective & preventive actions',
      badge: structured?.capa_recommendations?.length ? `${structured.capa_recommendations.length} actions` : undefined,
    },
    {
      id: 'review',
      number: '05',
      title: 'Review & Closure',
      subtitle: 'Quality sign-off & audit trail',
      badge: isCompleted ? 'Sealed' : currentInvestigation?.status,
    },
  ];

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. COMPACT INVESTIGATION HEADER & QUICK ACTIONS
          ========================================================================= */}
      <header className="bg-white border-2 border-ink shadow-brutal p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Back button + Investigation Title & Lifecycle State */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/investigations')}
            className="btn-brutal-secondary text-xs px-3 py-1.5 shadow-brutal-xs inline-flex items-center gap-1.5 shrink-0"
            title="Return to Investigations Registry"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Registry</span>
          </button>

          <div className="h-6 w-[2px] bg-ink/20 hidden sm:block shrink-0" />

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-mono text-xs font-bold text-ink px-2 py-0.5 bg-paper border border-ink shadow-brutal-xs">
                {currentInvestigation?.investigation_id || 'NEW INVESTIGATION (DRAFT)'}
              </span>
              <StatusBadge status={formData.status} size="sm" />
              {isDirty && (
                <span className="font-mono text-[10px] text-amber-900 bg-amber-100 px-2 py-0.5 border border-ink font-bold uppercase shadow-brutal-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                  Unsaved Changes
                </span>
              )}
            </div>
            <h1 className="font-display font-bold text-sm sm:text-base text-ink truncate max-w-xl">
              {formData.title || 'Untitled Investigation'}
            </h1>
          </div>
        </div>

        {/* Right: Quick action buttons */}
        <div className="flex items-center gap-2 flex-wrap self-end md:self-center shrink-0">
          {/* Quick Scenario Prefill (when new or draft) — indigo = dev utility */}
          {!isCompleted && !isEditMode && (
            <button
              type="button"
              onClick={handleLoadScenario}
              className="hidden sm:inline-flex items-center justify-center gap-1.5 font-display font-bold text-xs uppercase tracking-wider
                         bg-indigo-50 text-indigo-800 border-2 border-indigo-400 px-3 py-1.5
                         shadow-[2px_2px_0px_#4F46E5] transition-all duration-150
                         hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-indigo-100 hover:shadow-[4px_4px_0px_#4F46E5]
                         active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              title="Loads the fictional DEV-2026-014 scenario for rapid verification"
            >
              ⚡ DEV-2026-014 Scenario
            </button>
          )}

          {/* Source Intake Trigger — amber = data ingestion / upload */}
          <button
            type="button"
            onClick={() => setIsIntakeOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 font-display font-bold text-xs uppercase tracking-wider
                       bg-amber-400 text-amber-950 border-2 border-ink px-3 py-1.5
                       shadow-brutal-sm transition-all duration-150
                       hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-brutal
                       active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            title="Upload PDF or paste incident notes"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Source Intake</span>
            {attachedSourcesList.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-ink text-white font-mono font-bold">
                {attachedSourcesList.length}
              </span>
            )}
          </button>

          {/* AI Intelligence Toggle — lime (active) / violet-tinted (inactive) */}
          <button
            type="button"
            onClick={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
            className={isAiDrawerOpen
              ? 'inline-flex items-center justify-center gap-1.5 font-display font-black text-xs uppercase tracking-wider bg-ink text-lime-accent border-2 border-ink px-3 py-1.5 shadow-brutal transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
              : 'inline-flex items-center justify-center gap-1.5 font-display font-bold text-xs uppercase tracking-wider bg-violet-600 text-white border-2 border-ink px-3 py-1.5 shadow-brutal-sm transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-brutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
            }
            title={isAiDrawerOpen ? 'Close AI intelligence drawer' : 'Open contextual AI intelligence drawer'}
            aria-expanded={isAiDrawerOpen}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiDrawerOpen ? 'text-lime-accent' : 'text-white'}`} />
            <span>AI Intelligence</span>
            {currentAnalysis && (
              <span className="text-[10px] px-1.5 py-0.5 bg-lime-accent text-ink border border-ink font-mono font-bold">
                v{currentAnalysis.version}
              </span>
            )}
          </button>

          {/* Primary Save Changes CTA — teal = primary commit action */}
          <button
            type="button"
            onClick={handleSaveForm}
            disabled={saveLoading || isCompleted}
            className="btn-brutal-primary text-xs px-4 py-2 shadow-brutal inline-flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>
              {saveLoading
                ? 'Saving...'
                : isCompleted
                ? 'Record Sealed'
                : isEditMode
                ? 'Save Changes'
                : 'Create Record'}
            </span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. INVESTIGATION STAGE NAVIGATION BAR (PROGRESSIVE DISCLOSURE)
          ========================================================================= */}
      <nav aria-label="Investigation Workflow Stages" className="bg-paper border-2 border-ink shadow-brutal p-1.5">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {stages.map((stage) => {
            const isActive = activeStage === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStage(stage.id)}
                className={`flex flex-col justify-between min-h-[64px] ${
                  isActive ? 'stage-tab-active' : 'stage-tab-inactive'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`font-mono text-[10px] font-bold tracking-wider uppercase ${
                    isActive ? 'text-white/80' : 'text-muted'
                  }`}>
                    [{stage.number}]
                  </span>
                  {stage.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 font-mono font-bold uppercase border truncate max-w-[85px] ${
                        isActive
                          ? 'bg-white/20 text-white border-white/40'
                          : 'bg-paper text-ink border-ink'
                      }`}
                    >
                      {stage.badge}
                    </span>
                  )}
                </div>
                <div className={`font-display font-bold text-xs truncate mt-1 ${
                  isActive ? 'text-white' : 'text-ink'
                }`}>
                  {stage.title}
                </div>
                <div className={`font-mono text-[9px] truncate ${
                  isActive ? 'text-white/70' : 'text-muted'
                }`}>
                  {stage.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Error / Loading State for Workspace Record */}
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
        /* =========================================================================
            3. PRIMARY WORKSPACE CONTENT BY ACTIVE STAGE (FULL GENEROUS WIDTH)
            ========================================================================= */
        <main className="w-full">
          {/* STAGE 1: INTAKE & CONTEXT */}
          {activeStage === 'intake' && (
            <section aria-label="Investigation Intake Stage">
              <InvestigationForm
                formData={formData}
                onChange={handleFormChange}
                onSave={handleSaveForm}
                isSaving={saveLoading}
                saveSuccessMessage={saveSuccessMessage}
                saveError={saveError}
                validationError={formValidationError}
                onOpenSourceIntake={() => setIsIntakeOpen(true)}
                attachedSources={attachedSourcesList}
                pendingSourceDoc={pendingSourceDoc}
                isCompleted={isCompleted}
                isDirty={isDirty}
                onLoadScenario={handleLoadScenario}
                investigationId={currentInvestigation?.investigation_id}
                isEditMode={isEditMode}
                onPreviewSourceDoc={(doc) =>
                  setPreviewSnippetDoc({
                    title: doc.original_filename || doc.source_id,
                    text: doc.extracted_text || 'No text extracted.',
                  })
                }
              />
            </section>
          )}

          {/* STAGE 2: EVIDENCE & GAPS */}
          {activeStage === 'evidence' && (
            <section aria-label="Evidence & Gaps Verification Stage" className="space-y-4">
              <AssistancePanel
                investigation={currentInvestigation}
                onOpenSourceIntake={() => setIsIntakeOpen(true)}
                attachedSources={attachedSourcesList}
                mode="stage"
                activeTab="evidence"
                onSavePrompt={handleSaveForm}
              />
            </section>
          )}

          {/* STAGE 3: ROOT CAUSE ANALYSIS (RCA) */}
          {activeStage === 'rca' && (
            <section aria-label="Root Cause Analysis Stage" className="space-y-4">
              <AssistancePanel
                investigation={currentInvestigation}
                onOpenSourceIntake={() => setIsIntakeOpen(true)}
                attachedSources={attachedSourcesList}
                mode="stage"
                activeTab={rcaSubTab}
                onTabChange={(tab) => {
                  if (tab === 'causes' || tab === 'fiveWhys' || tab === 'fishbone') {
                    setRcaSubTab(tab);
                  }
                }}
                onSavePrompt={handleSaveForm}
              />
            </section>
          )}

          {/* STAGE 4: CAPA ACTIONS */}
          {activeStage === 'capa' && (
            <section aria-label="Corrective & Preventive Actions Stage" className="space-y-4">
              <AssistancePanel
                investigation={currentInvestigation}
                onOpenSourceIntake={() => setIsIntakeOpen(true)}
                attachedSources={attachedSourcesList}
                mode="stage"
                activeTab="capa"
                onSavePrompt={handleSaveForm}
              />
            </section>
          )}

          {/* STAGE 5: REVIEW & CLOSURE */}
          {activeStage === 'review' && (
            <section aria-label="Review & Closure Stage" className="space-y-6">
              {/* Review Disposition & Verification Card */}
              <div className="card-brutal p-6 bg-white border-2 border-ink shadow-brutal space-y-5">
                <div className="flex items-center justify-between border-b-2 border-ink pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 border-2 border-ink bg-teal text-white flex items-center justify-center shadow-brutal-xs">
                      <ShieldCheck className="w-5 h-5 text-lime" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-ink uppercase tracking-wider">
                        Stage 5: Quality Reviewer Sign-Off &amp; Disposition
                      </h3>
                      <p className="font-mono text-xs text-muted">
                        Formal verification of findings, root causes, and CAPA approval prior to sealing.
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={formData.status} size="md" />
                </div>

                {/* Verification Health Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 border-2 border-ink shadow-brutal-xs space-y-1.5 ${
                    isConfirmed ? 'bg-teal/10 border-teal' : 'bg-amber-50 border-amber-800'
                  }`}>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted block">
                      Root Cause Human Confirmation
                    </span>
                    <div className="flex items-center gap-2">
                      {isConfirmed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-teal" />
                          <span className="font-display font-bold text-xs text-teal">Confirmed by QA</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-700" />
                          <span className="font-display font-bold text-xs text-amber-800">Pending Human Sign-Off</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-ink">
                      {currentAnalysis?.confirmed_root_cause || 'No root cause formally confirmed yet in RCA stage.'}
                    </p>
                  </div>

                  <div className={`p-4 border-2 border-ink shadow-brutal-xs space-y-1.5 ${
                    formData.has_unresolved_gaps ? 'bg-amber-50 border-amber-800' : 'bg-paper'
                  }`}>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted block">
                      Evidence Gaps Flag
                    </span>
                    <div className="flex items-center gap-2">
                      {formData.has_unresolved_gaps ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-700" />
                          <span className="font-display font-bold text-xs text-amber-900">Unresolved Gaps Flagged</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-teal" />
                          <span className="font-display font-bold text-xs text-teal">No Critical Gaps Flagged</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-muted">
                      {formData.has_unresolved_gaps
                        ? 'Disposition justification is required to complete record.'
                        : 'Analytical and process data verified complete.'}
                    </p>
                  </div>

                  <div className="p-4 bg-paper border-2 border-ink shadow-brutal-xs space-y-1.5">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted block">
                      Record Integrity State
                    </span>
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span className="font-display font-bold text-xs text-emerald-900">Sealed (Completed)</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-ink" />
                          <span className="font-display font-bold text-xs text-ink">Active (Editable)</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-muted">
                      {isCompleted
                        ? 'Sealed per GxP requirements. Direct edits locked.'
                        : 'Subject to audit trail tracking upon modification.'}
                    </p>
                  </div>
                </div>

                {/* Lifecycle Transition Action Bar */}
                <div className="p-4 bg-paper border-2 border-ink shadow-brutal-xs space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-mono text-xs font-bold uppercase text-ink block">
                        Lifecycle Progression Actions
                      </span>
                      <p className="text-[11px] font-mono text-muted">
                        Move this record to the next phase according to standard operating procedures.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {currentInvestigation?.status === 'Draft' && (
                        <button
                          type="button"
                          onClick={() => handleTransition('Under Investigation', 'Investigation intake initiated')}
                          className="btn-brutal-secondary text-xs px-3.5 py-2 shadow-brutal-xs inline-flex items-center gap-1.5 text-amber-900 font-bold"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Mark Under Investigation</span>
                        </button>
                      )}

                      {(currentInvestigation?.status === 'Draft' || currentInvestigation?.status === 'Under Investigation') && (
                        <button
                          type="button"
                          onClick={() => handleTransition('In Review', 'Submitted for quality review')}
                          className="btn-brutal-secondary text-xs px-3.5 py-2 shadow-brutal-xs inline-flex items-center gap-1.5 text-blue-900 font-bold"
                        >
                          <Clock className="w-3.5 h-3.5 text-blue-700" />
                          <span>Submit for Quality Review</span>
                        </button>
                      )}

                      {currentInvestigation?.status === 'AI Analysis Available' && (
                        <button
                          type="button"
                          onClick={() => handleTransition('In Review', 'Reviewer commenced findings review')}
                          className="btn-brutal-lime text-xs px-4 py-2 shadow-brutal inline-flex items-center gap-1.5"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Start Human Review</span>
                        </button>
                      )}

                      {currentInvestigation?.status === 'In Review' && (
                        <button
                          type="button"
                          onClick={() => setIsCompleteModalOpen(true)}
                          className="btn-brutal-primary text-xs px-5 py-2.5 shadow-brutal inline-flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-lime" />
                          <span>Sign Off &amp; Complete Investigation</span>
                        </button>
                      )}

                      {isCompleted && (
                        <button
                          type="button"
                          onClick={() => setIsReopenModalOpen(true)}
                          className="btn-brutal-secondary text-xs px-4 py-2 shadow-brutal-xs inline-flex items-center gap-1.5 text-amber-950 border-2 border-amber-900 font-bold hover:bg-amber-100"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reopen Investigation</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {lifecycleError && (
                    <div className="p-3 bg-rose-50 border-2 border-ink shadow-brutal-xs text-rose-900 text-xs font-mono font-bold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
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
              </div>

              {/* Full Chronological Audit Trail View */}
              <div className="card-brutal p-6 bg-white border-2 border-ink shadow-brutal space-y-4">
                <div className="flex items-center justify-between border-b-2 border-ink pb-3">
                  <div className="flex items-center gap-2.5">
                    <History className="w-5 h-5 text-teal" />
                    <div>
                      <h3 className="font-display font-bold text-sm text-ink uppercase tracking-wider">
                        Immutable GxP Audit Trail ({auditLogs.length} Events)
                      </h3>
                      <p className="font-mono text-xs text-muted">
                        Chronological, tamper-evident transaction log recorded in PostgreSQL.
                      </p>
                    </div>
                  </div>
                </div>

                <AssistancePanel
                  investigation={currentInvestigation}
                  onOpenSourceIntake={() => setIsIntakeOpen(true)}
                  attachedSources={attachedSourcesList}
                  mode="stage"
                  activeTab="history"
                />
              </div>
            </section>
          )}
        </main>
      )}

      {/* =========================================================================
          4. CONTEXTUAL AI ASSISTANCE DRAWER (EXPANDABLE / COLLAPSIBLE SLIDE-OVER)
          ========================================================================= */}
      <AssistancePanel
        investigation={currentInvestigation}
        onOpenSourceIntake={() => setIsIntakeOpen(true)}
        attachedSources={attachedSourcesList}
        mode="drawer"
        isDrawerOpen={isAiDrawerOpen}
        onCloseDrawer={() => setIsAiDrawerOpen(false)}
        onSavePrompt={handleSaveForm}
      />

      {/* =========================================================================
          5. MODALS: SOURCE INTAKE, COMPLETION, REOPEN, AND SNIPPET PREVIEW
          ========================================================================= */}
      {/* Source Intake Modal */}
      <SourceIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        investigationId={currentInvestigation?.id}
        onApplyExtractedText={handleApplyExtractedText}
      />

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
                  <AlertCircle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                  <span>
                    Warning: Investigation has unresolved gaps flagged. Please provide QA disposition justification below to complete.
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="closure-notes" className="text-xs font-mono font-bold uppercase tracking-wider text-ink block">
                Quality Reviewer Sign-off Rationale / Disposition Notes:
              </label>
              <textarea
                id="closure-notes"
                value={completionJustification}
                onChange={(e) => setCompletionJustification(e.target.value)}
                placeholder="Document QA evaluation, root cause verification evidence, and disposition approval..."
                rows={3}
                className="w-full text-xs p-2.5 border-2 border-ink bg-white font-sans text-ink shadow-brutal-xs focus:shadow-brutal focus:outline-none"
              />
            </div>

            {lifecycleError && (
              <div className="p-2.5 bg-rose-50 border-2 border-rose-600 text-rose-900 text-xs font-mono font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{lifecycleError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCompleteModalOpen(false)}
                className="btn-brutal-secondary text-xs px-3.5 py-2 shadow-brutal-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleTransition('Completed', completionJustification)}
                className="btn-brutal-primary text-xs px-4 py-2 shadow-brutal inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-lime" />
                <span>Confirm &amp; Seal Record</span>
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
              <div className="w-10 h-10 border-2 border-ink bg-amber-100 flex items-center justify-center text-amber-900 shadow-brutal-xs">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-ink uppercase tracking-wider">
                  Reopen Completed Investigation
                </h3>
                <p className="text-xs font-mono text-muted">
                  {currentInvestigation?.investigation_id} &bull; Documented GxP Reopening
                </p>
              </div>
            </div>

            <div className="text-xs text-amber-900 bg-amber-50 p-3 border-2 border-ink shadow-brutal-xs space-y-1 font-mono">
              <strong>GxP Regulatory Audit Requirement:</strong>
              <p>Reopening a formally completed investigation generates an immutable audit trail entry.</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="reopen-target-status" className="text-xs font-mono font-bold uppercase tracking-wider text-ink block">
                  Target Workflow Status:
                </label>
                <select
                  id="reopen-target-status"
                  value={reopenTargetStatus}
                  onChange={(e) => setReopenTargetStatus(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none"
                >
                  <option value="In Review">In Review</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="reopen-justification" className="text-xs font-mono font-bold uppercase tracking-wider text-ink block">
                  Mandatory Justification for Reopening <span className="text-rose-600">*</span>:
                </label>
                <textarea
                  id="reopen-justification"
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Document the exact technical reason, new analytical data, or regulatory request requiring investigation reopening..."
                  rows={3}
                  className="w-full text-xs p-2.5 border-2 border-ink bg-white font-sans text-ink shadow-brutal-xs focus:shadow-brutal focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="btn-brutal-secondary text-xs px-3.5 py-2 shadow-brutal-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReopen}
                disabled={reopenReason.trim().length < 5}
                className="btn-brutal-primary text-xs px-4 py-2 shadow-brutal inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm Reopening</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Source Document Text Snippet Preview Modal */}
      {previewSnippetDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-xs p-4">
          <div className="bg-paper border-2 border-ink shadow-brutal-lg max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-3.5 bg-ink text-white flex items-center justify-between border-b-2 border-ink">
              <div className="flex items-center gap-2 truncate">
                <Layers className="w-4 h-4 text-teal shrink-0" />
                <h4 className="font-display text-xs font-bold uppercase tracking-wider truncate text-white">
                  Source Excerpt: {previewSnippetDoc.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSnippetDoc(null)}
                className="text-white hover:text-lime p-1"
                aria-label="Close Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto font-mono text-xs text-ink bg-white leading-relaxed flex-1">
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                {previewSnippetDoc.text}
              </pre>
            </div>
            <div className="p-3 bg-paper border-t-2 border-ink flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewSnippetDoc(null)}
                className="btn-brutal-secondary text-xs py-1.5 px-3"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
