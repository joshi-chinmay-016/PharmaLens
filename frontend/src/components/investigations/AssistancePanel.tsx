import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  HelpCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  GitBranch,
  Network,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Info,
  Play,
  RotateCw,
  Save,
  Eye,
  Check,
  X,
  Plus,
  Trash2,
  Edit3,
  Award,
  AlertTriangle,
  ChevronDown,
  History,
  Clock,
  Unlink,
  FileCheck,
  Lock,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import {
  Investigation,
  SourceDocument,
  ExtractedFact,
  PotentialRootCause,
  FiveWhysStep,
  FishboneCause,
  CapaRecommendation,
  EvidenceGap,
} from '../../types';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchLatestAnalysis,
  fetchAnalysisHistory,
  executeAnalysis,
  executeFiveWhys,
  executeFishbone,
  executeCapa,
  saveAnalysisReview,
  updateLocalCause,
  updateLocalFiveWhysStep,
  addLocalFiveWhysStep,
  removeLocalFiveWhysStep,
  updateLocalFishboneCause,
  updateLocalCapa,
  updateLocalEvidenceGap,
  clearSaveStatus,
} from '../../store/slices/analysisSlice';
import {
  updateInvestigation,
  applyVerifiedFact,
  fetchAuditLogs,
} from '../../store/investigationsSlice';
import { detachSourceThunk } from '../../store/sourcesSlice';

export interface AssistancePanelProps {
  investigation: Investigation | null;
  onOpenSourceIntake: () => void;
  attachedSources: SourceDocument[];
  mode?: 'drawer' | 'stage' | 'embedded';
  activeTab?: 'evidence' | 'causes' | 'fiveWhys' | 'fishbone' | 'capa' | 'history';
  onTabChange?: (tab: 'evidence' | 'causes' | 'fiveWhys' | 'fishbone' | 'capa' | 'history') => void;
  isDrawerOpen?: boolean;
  onCloseDrawer?: () => void;
  onSavePrompt?: () => void;
}

export const AssistancePanel: React.FC<AssistancePanelProps> = ({
  investigation,
  onOpenSourceIntake,
  attachedSources,
  mode = 'embedded',
  activeTab: propActiveTab,
  onTabChange,
  isDrawerOpen = false,
  onCloseDrawer,
  onSavePrompt,
}) => {
  const dispatch = useAppDispatch();
  const {
    currentAnalysis,
    history,
    loading,
    saveLoading,
    stageMessage,
    error,
    saveError,
    saveSuccess,
    aiHealth,
  } = useAppSelector((state) => state.analysis);
  const { auditLogs, auditLoading } = useAppSelector((state) => state.investigations);

  const [internalTab, setInternalTab] = useState<'evidence' | 'causes' | 'fiveWhys' | 'fishbone' | 'capa' | 'history'>('evidence');
  const activeTab = propActiveTab || internalTab;
  const setActiveTab = (tab: 'evidence' | 'causes' | 'fiveWhys' | 'fishbone' | 'capa' | 'history') => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [showRunOptions, setShowRunOptions] = useState(false);
  const [evidenceModalDoc, setEvidenceModalDoc] = useState<{
    sourceId: string;
    snippet: string;
    title: string;
  } | null>(null);

  // Form fact update state
  const [acceptedFacts, setAcceptedFacts] = useState<Record<string, boolean>>({});
  const [rejectedFacts, setRejectedFacts] = useState<Record<string, boolean>>({});
  const [editingFact, setEditingFact] = useState<{
    fieldName: string;
    originalValue: string;
    currentValue: string;
    notes: string;
  } | null>(null);

  // Audit event payload inspector modal
  const [inspectAuditLog, setInspectAuditLog] = useState<any | null>(null);

  // Human confirmation notes state
  const [confirmationNotes, setConfirmationNotes] = useState('');
  const [selectedConfirmedCauseId, setSelectedConfirmedCauseId] = useState<string | null>(null);

  useEffect(() => {
    if (investigation?.id) {
      dispatch(fetchLatestAnalysis(investigation.id));
      dispatch(fetchAnalysisHistory(investigation.id));
      dispatch(fetchAuditLogs(investigation.id));
    }
  }, [dispatch, investigation?.id]);

  useEffect(() => {
    if (currentAnalysis?.confirmed_root_cause) {
      // Find matching cause if already confirmed
      const matching = currentAnalysis.structured_output?.potential_root_causes?.find(
        (c) => c.is_confirmed_by_human || c.title === currentAnalysis.confirmed_root_cause
      );
      if (matching) {
        setSelectedConfirmedCauseId(matching.cause_id);
      }
    }
  }, [currentAnalysis]);

  const hasSources = attachedSources.length > 0;
  const hasTextContent = Boolean(
    (investigation?.incident_description && investigation.incident_description.trim().length > 5) ||
    (investigation?.title && investigation.title.trim().length > 5) ||
    hasSources
  );

  const handleRunFullAnalysis = async () => {
    if (!investigation?.id) return;
    setShowRunOptions(false);
    await dispatch(
      executeAnalysis({
        investigationId: investigation.id,
        payload: { include_five_whys: true, include_fishbone: true, include_capa: true },
      })
    );
    dispatch(fetchAnalysisHistory(investigation.id));
    dispatch(fetchAuditLogs(investigation.id));
  };

  const handleRunTargeted = async (method: 'fiveWhys' | 'fishbone' | 'capa') => {
    if (!investigation?.id) return;
    setShowRunOptions(false);
    if (method === 'fiveWhys') await dispatch(executeFiveWhys(investigation.id));
    if (method === 'fishbone') await dispatch(executeFishbone(investigation.id));
    if (method === 'capa') await dispatch(executeCapa(investigation.id));
    dispatch(fetchAnalysisHistory(investigation.id));
    dispatch(fetchAuditLogs(investigation.id));
  };

  const handleAcceptFact = async (fact: ExtractedFact, customValue?: string, notes?: string) => {
    if (!investigation?.id || !currentAnalysis?.id) return;
    const valToApply = customValue !== undefined ? customValue : fact.extracted_value;
    setAcceptedFacts((prev) => ({ ...prev, [fact.field_name]: true }));
    await dispatch(
      applyVerifiedFact({
        investigationId: investigation.id,
        analysisId: currentAnalysis.id,
        payload: {
          field_name: fact.field_name,
          extracted_value: valToApply,
          verification_notes: notes || 'Verified and applied by investigator.',
        },
      })
    );
    setEditingFact(null);
  };

  const handleRejectFact = (fact: ExtractedFact) => {
    setRejectedFacts((prev) => ({ ...prev, [fact.field_name]: true }));
  };

  const handleSaveReview = async () => {
    if (!investigation?.id || !currentAnalysis?.id) return;

    let confirmedTitle = currentAnalysis.confirmed_root_cause;
    let isConfirmed = currentAnalysis.is_confirmed_by_human;

    if (selectedConfirmedCauseId) {
      const selected = currentAnalysis.structured_output?.potential_root_causes?.find(
        (c) => c.cause_id === selectedConfirmedCauseId
      );
      if (selected) {
        confirmedTitle = selected.title;
        isConfirmed = true;
      }
    }

    const payload = {
      confirmed_root_cause: confirmedTitle || undefined,
      is_confirmed_by_human: isConfirmed,
      user_edits_json: JSON.stringify({
        notes: confirmationNotes || 'Human review updated via PharmaLens intelligence workspace.',
        saved_at: new Date().toISOString(),
      }),
    };

    await dispatch(
      saveAnalysisReview({
        investigationId: investigation.id,
        analysisId: currentAnalysis.id,
        payload,
      })
    );
    dispatch(fetchAuditLogs(investigation.id));
  };

  const handleDetachSource = async (doc: SourceDocument) => {
    if (!investigation?.id) return;
    const docName = doc.original_filename || doc.source_id;
    if (window.confirm(`Are you sure you want to detach source document "${docName}" from this investigation?`)) {
      await dispatch(
        detachSourceThunk({
          sourceId: doc.id || doc.source_id,
          investigationId: investigation.id,
        })
      );
    }
  };

  const structured = currentAnalysis?.structured_output;
  const isConfirmed = currentAnalysis?.is_confirmed_by_human;

  const panelContent = (
    <div className="bg-white border-2 border-ink shadow-brutal flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 bg-ink text-white border-b-2 border-ink">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal border-2 border-white flex items-center justify-center text-lime shadow-[2px_2px_0px_#000]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold tracking-wide uppercase text-white">
                  Investigation Intelligence
                </h3>
                {currentAnalysis && (
                  <span className="text-[10px] px-2 py-0.5 bg-lime text-ink font-mono font-bold border border-white">
                    v{currentAnalysis.version}
                  </span>
                )}
              </div>
              <p className="font-mono text-[11px] text-gray-300">
                LangGraph Multi-Node Orchestrator • {currentAnalysis?.model_identifier || 'Groq Llama-3.3-70b'}
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2">
            {/* Run Analysis Action Button with Dropdown */}
            <div className="relative">
              <div className="inline-flex shadow-[3px_3px_0px_#000]">
                <button
                  type="button"
                  onClick={handleRunFullAnalysis}
                  disabled={loading || !hasTextContent || !investigation?.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-lime hover:bg-white text-ink text-xs font-mono font-bold uppercase border-2 border-ink transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!investigation?.id ? 'Save the investigation first to run AI analysis' : !hasTextContent ? 'Provide incident description or attach sources first' : 'Run full AI analysis'}
                >
                  {loading ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>{loading ? 'Analyzing...' : 'Run Analysis'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRunOptions(!showRunOptions)}
                  disabled={loading || !hasTextContent || !investigation?.id}
                  className="px-2 bg-ink hover:bg-teal text-white border-2 border-l-0 border-ink transition-colors disabled:opacity-50"
                  aria-label="Analysis options"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Run Options Dropdown Menu */}
              {showRunOptions && (
                <div className="absolute right-0 mt-2 w-72 bg-paper border-2 border-ink shadow-brutal z-30 py-1 text-xs text-ink font-mono">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-muted border-b border-subtle">
                    Targeted Execution Scope
                  </div>
                  <button
                    type="button"
                    onClick={handleRunFullAnalysis}
                    className="w-full text-left px-3 py-2.5 hover:bg-lime/30 flex items-center justify-between border-b border-subtle/50"
                  >
                    <span className="font-bold text-teal">Full Intelligence (All 4 Nodes)</span>
                    <Sparkles className="w-3.5 h-3.5 text-teal" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRunTargeted('fiveWhys')}
                    className="w-full text-left px-3 py-2 hover:bg-white flex items-center justify-between"
                  >
                    <span>5 Whys Chain Only</span>
                    <GitBranch className="w-3.5 h-3.5 text-muted" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRunTargeted('fishbone')}
                    className="w-full text-left px-3 py-2 hover:bg-white flex items-center justify-between"
                  >
                    <span>Fishbone (6M Matrix) Only</span>
                    <Network className="w-3.5 h-3.5 text-muted" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRunTargeted('capa')}
                    className="w-full text-left px-3 py-2 hover:bg-white flex items-center justify-between"
                  >
                    <span>CAPA Recommendations Only</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-muted" />
                  </button>
                </div>
              )}
            </div>

            {mode === 'drawer' && onCloseDrawer && (
              <button
                type="button"
                onClick={onCloseDrawer}
                className="p-1.5 text-white hover:text-lime hover:bg-white/10 border border-white/20 transition-colors ml-1 shadow-brutal-xs"
                title="Close AI Intelligence Drawer"
                aria-label="Close Intelligence Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mandatory Quality & Regulatory Disclaimer Banner */}
      <div className="p-3 bg-[#FEF3C7] border-b-2 border-ink flex items-start gap-2.5 text-xs text-ink font-mono">
        <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="leading-snug text-[11px]">
          <strong className="font-bold uppercase tracking-wider text-amber-900 mr-1">[SAFEGUARD]</strong>
          All AI-generated causes, 5 Whys steps, and CAPA actions are unconfirmed hypotheses. Confirmation strictly requires qualified human quality investigator review.
        </div>
      </div>

      {/* Loading Stage Indicator */}
      {loading && (
        <div className="p-3 bg-[#CCFBF1] border-b-2 border-ink flex items-center gap-3 text-xs font-mono text-ink">
          <RotateCw className="w-4 h-4 text-teal animate-spin flex-shrink-0" />
          <div className="flex-1 font-bold">
            {stageMessage || 'Executing LangGraph multi-node analysis workflow...'}
          </div>
        </div>
      )}

      {/* Error Banner - only show genuine errors, never missing analysis / 404 */}
      {error && !error.toLowerCase().includes('no ai analysis') && !error.includes('404') && (
        <div className="p-3 bg-[#FEE2E2] border-b-2 border-ink flex items-start gap-2 text-xs font-mono text-ink font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="uppercase">Analysis Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="p-3 bg-lime border-b-2 border-ink flex items-center justify-between text-xs font-mono text-ink font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-ink" />
            <span>{saveSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => dispatch(clearSaveStatus())}
            className="text-ink hover:opacity-75 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Human Confirmed Root Cause Banner */}
      {isConfirmed && currentAnalysis?.confirmed_root_cause && (
        <div className="p-3.5 bg-teal text-white border-b-2 border-ink flex items-start gap-3">
          <Award className="w-5 h-5 text-lime flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 bg-lime text-ink border border-white font-mono">
                Confirmed Root Cause
              </span>
            </div>
            <p className="font-display font-bold text-sm text-white">
              {currentAnalysis.confirmed_root_cause}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs - Show full strip in drawer/embedded, or segmented for Stage 3 RCA */}
      {mode === 'drawer' || mode === 'embedded' ? (
        <div className="flex border-b-2 border-ink bg-paper text-xs font-mono font-bold overflow-x-auto scrollbar-thin">
          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`flex-1 py-2.5 px-3 text-center whitespace-nowrap transition-colors border-r-2 border-ink ${
              activeTab === 'evidence'
                ? 'bg-teal-primary text-white font-black'
                : 'bg-paper text-muted hover:text-ink hover:bg-white'
            }`}
          >
            Evidence &amp; Gaps
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('causes')}
            className={`flex-1 py-2.5 px-3 text-center whitespace-nowrap transition-colors border-r-2 border-ink ${
              activeTab === 'causes'
                ? 'bg-teal-primary text-white font-black'
                : 'bg-paper text-muted hover:text-ink hover:bg-white'
            }`}
          >
            Potential Causes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fiveWhys')}
            className={`flex-1 py-2.5 px-3 text-center whitespace-nowrap transition-colors border-r-2 border-ink ${
              activeTab === 'fiveWhys'
                ? 'bg-teal-primary text-white font-black'
                : 'bg-paper text-muted hover:text-ink hover:bg-white'
            }`}
          >
            5 Whys
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fishbone')}
            className={`flex-1 py-2.5 px-3 text-center whitespace-nowrap transition-colors border-r-2 border-ink ${
              activeTab === 'fishbone'
                ? 'bg-teal-primary text-white font-black'
                : 'bg-paper text-muted hover:text-ink hover:bg-white'
            }`}
          >
            Fishbone (6M)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('capa')}
            className={`flex-1 py-2.5 px-3 text-center whitespace-nowrap transition-colors border-r-2 border-ink ${
              activeTab === 'capa'
                ? 'bg-teal-primary text-white font-black'
                : 'bg-paper text-muted hover:text-ink hover:bg-white'
            }`}
          >
            CAPA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 px-3 text-center whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-teal-primary text-white font-black'
                : 'bg-paper text-muted hover:text-ink hover:bg-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
            {auditLogs.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 border font-mono font-bold ${
                activeTab === 'history' ? 'bg-white text-ink border-white/40' : 'bg-white text-ink border-ink'
              }`}>
                {auditLogs.length}
              </span>
            )}
          </button>
        </div>
      ) : (activeTab === 'causes' || activeTab === 'fiveWhys' || activeTab === 'fishbone') ? (
        <div className="flex border-b-2 border-ink bg-paper p-1.5 gap-1.5 font-mono text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('causes')}
            className={`flex-1 py-2 px-3 text-center border-2 border-ink transition-all ${
              activeTab === 'causes'
                ? 'bg-teal-primary text-white shadow-brutal-xs -translate-y-0.5'
                : 'bg-white text-ink hover:bg-teal-light'
            }`}
          >
            1. Candidate Causes ({structured?.potential_root_causes?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fiveWhys')}
            className={`flex-1 py-2 px-3 text-center border-2 border-ink transition-all ${
              activeTab === 'fiveWhys'
                ? 'bg-teal-primary text-white shadow-brutal-xs -translate-y-0.5'
                : 'bg-white text-ink hover:bg-teal-light'
            }`}
          >
            2. 5 Whys Sequence
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fishbone')}
            className={`flex-1 py-2 px-3 text-center border-2 border-ink transition-all ${
              activeTab === 'fishbone'
                ? 'bg-teal-primary text-white shadow-brutal-xs -translate-y-0.5'
                : 'bg-white text-ink hover:bg-teal-light'
            }`}
          >
            3. Fishbone (6M Matrix)
          </button>
        </div>
      ) : null}

      {/* Tab Content Container */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 bg-paper">
        {/* Informative Empty State for Missing Analysis (NEVER an error) */}
        {!currentAnalysis && !loading && activeTab !== 'history' && activeTab !== 'evidence' && (
          <div className="p-8 text-center bg-white border-2 border-ink shadow-brutal space-y-4 my-2">
            <div className="w-12 h-12 bg-lime border-2 border-ink shadow-brutal-xs flex items-center justify-center mx-auto text-ink">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-bold text-base text-ink uppercase tracking-wider">
                {!investigation?.id ? 'New Investigation Workspace' : 'No AI Analysis Executed Yet'}
              </h4>
              <p className="text-xs font-mono text-muted max-w-md mx-auto">
                {!investigation?.id
                  ? 'Add incident details and attach a source document to prepare for analysis. Save the investigation first to run AI Root Cause Analysis and CAPA recommendations.'
                  : 'Add incident details and attach a source document to prepare for analysis. Then click "Run Analysis" to generate causal hypotheses, 5 Whys, Fishbone, and CAPA recommendations.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              <button
                type="button"
                onClick={onOpenSourceIntake}
                className="inline-flex items-center justify-center gap-1.5 font-display font-bold text-xs uppercase tracking-wider
                           bg-amber-400 text-amber-950 border-2 border-ink px-3.5 py-2
                           shadow-brutal-sm transition-all duration-150
                           hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-brutal
                           active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Attach Source Document</span>
              </button>
              {investigation?.id ? (
                <button
                  type="button"
                  onClick={handleRunFullAnalysis}
                  disabled={loading || !hasTextContent}
                  className="btn-brutal-primary text-xs px-4 py-2 inline-flex items-center gap-2 shadow-brutal"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Investigation Analysis</span>
                </button>
              ) : onSavePrompt ? (
                <button
                  type="button"
                  onClick={onSavePrompt}
                  className="btn-brutal-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 shadow-brutal"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Investigation</span>
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* TAB 1: Evidence & Gaps */}
        {activeTab === 'evidence' && (
          <div className="space-y-4">
            {/* Attached Sources Summary */}
            <div className="border-2 border-ink bg-white p-4 shadow-brutal-sm">
              <div className="flex items-center justify-between mb-3 border-b-2 border-ink pb-2">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal" />
                  Attached Sources ({attachedSources.length})
                </span>
                <button
                  type="button"
                  onClick={onOpenSourceIntake}
                  className="inline-flex items-center justify-center gap-1 font-display font-bold text-[11px] uppercase tracking-wider
                             bg-amber-400 text-amber-950 border-2 border-ink py-1 px-2.5
                             shadow-[2px_2px_0px_#171717] transition-all duration-150
                             hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-amber-300
                             active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  + Add Source
                </button>
              </div>

              {attachedSources.length === 0 ? (
                <div className="text-center py-6 bg-paper border-2 border-dashed border-subtle">
                  <FileText className="w-8 h-8 text-muted mx-auto mb-2" />
                  <p className="text-xs font-mono text-muted">No source documents attached yet.</p>
                  <button
                    type="button"
                    onClick={onOpenSourceIntake}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-display font-bold uppercase tracking-wider
                               text-amber-700 border-b-2 border-amber-400 hover:border-amber-600 hover:text-amber-900 transition-colors"
                  >
                    Upload PDF or Paste Incident Text →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachedSources.map((doc) => (
                    <div
                      key={doc.id || doc.source_id}
                      className="p-3 bg-paper border-2 border-ink text-xs space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink truncate max-w-[240px]">
                          {doc.original_filename || doc.source_id}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-white text-ink border border-ink uppercase font-mono font-bold">
                          {doc.source_type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-muted pt-1 border-t border-subtle">
                        <span>
                          Status: <strong className="text-teal font-bold">{doc.extraction_status}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEvidenceModalDoc({
                                sourceId: doc.source_id,
                                snippet: doc.extracted_text || 'No text extracted.',
                                title: doc.original_filename || doc.source_id,
                              })
                            }
                            className="inline-flex items-center gap-1 font-display font-bold text-[10px] uppercase tracking-wider
                                       bg-slate-100 text-slate-700 border-2 border-slate-400 py-1 px-2
                                       shadow-[1px_1px_0px_#64748B] transition-all duration-150
                                       hover:bg-slate-200 hover:-translate-x-0.5 hover:-translate-y-0.5
                                       active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Text</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDetachSource(doc)}
                            className="btn-brutal-danger text-[10px] py-1 px-2 flex items-center gap-1"
                            title="Detach document from this investigation"
                          >
                            <Unlink className="w-3 h-3" />
                            <span>Detach</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Proposed Form Updates from Extracted Facts */}
            {structured?.extracted_facts && structured.extracted_facts.length > 0 && (
              <div className="border-2 border-ink bg-[#F0FDF4] p-4 shadow-brutal-sm space-y-3">
                <div className="flex items-center justify-between border-b-2 border-ink pb-2">
                  <h4 className="font-display text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal" />
                    AI-Proposed Form Updates ({structured.extracted_facts.length})
                  </h4>
                  <span className="font-mono text-[10px] bg-white px-2 py-0.5 border border-ink font-bold text-ink">
                    Review Before Applying
                  </span>
                </div>
                <div className="space-y-2">
                  {structured.extracted_facts.map((fact, idx) => {
                    const isAccepted = acceptedFacts[fact.field_name];
                    const isRejected = rejectedFacts[fact.field_name];

                    return (
                      <div
                        key={idx}
                        className={`p-3 bg-white border-2 border-ink text-xs space-y-2 transition-all shadow-xs ${
                          isAccepted
                            ? 'bg-[#ECFDF5] border-teal'
                            : isRejected
                            ? 'opacity-50 bg-gray-100'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-ink uppercase text-[11px]">
                            {fact.field_name.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-lime text-ink border border-ink font-mono font-bold">
                            {Math.round(fact.confidence_score * 100)}% match
                          </span>
                        </div>

                        <div className="p-2.5 bg-paper border border-ink font-mono text-[11px] text-ink font-semibold">
                          {fact.extracted_value}
                        </div>

                        {fact.source_snippet && (
                          <div className="text-[10px] font-mono text-muted italic bg-white p-1.5 border border-subtle">
                            Evidence: "{fact.source_snippet}" ({fact.source_id})
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
                          {isAccepted ? (
                            <span className="font-mono text-[11px] text-teal font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Applied to Record (Audited)
                            </span>
                          ) : isRejected ? (
                            <span className="font-mono text-[11px] text-muted italic">Dismissed</span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRejectFact(fact)}
                                className="inline-flex items-center gap-1 font-display font-bold text-[10px] uppercase tracking-wider
                                           bg-rose-100 text-rose-800 border-2 border-rose-400 py-1 px-2
                                           shadow-[1px_1px_0px_#F43F5E] transition-all duration-150
                                           hover:bg-rose-200 hover:-translate-x-0.5 hover:-translate-y-0.5
                                           active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingFact({
                                    fieldName: fact.field_name,
                                    originalValue: fact.extracted_value,
                                    currentValue: fact.extracted_value,
                                    notes: 'Verified and applied by investigator.',
                                  })
                                }
                                className="btn-brutal-secondary text-[10px] py-1 px-2.5 flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit & Apply</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAcceptFact(fact)}
                                className="btn-brutal-primary text-[10px] py-1 px-2.5 flex items-center gap-1 bg-teal"
                              >
                                <Check className="w-3 h-3" />
                                <span>Accept Update</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Evidence Gaps & Missing Records Checklist */}
            <div className="border-2 border-ink bg-[#FEF9C3] p-4 shadow-brutal-sm space-y-3">
              <div className="flex items-center justify-between border-b-2 border-ink pb-2">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  Identified Evidence Gaps
                </span>
                {structured?.evidence_gaps && structured.evidence_gaps.length > 0 ? (
                  <span className="font-mono text-[10px] bg-red-100 text-red-900 border border-ink px-2 py-0.5 font-bold uppercase">
                    {structured.evidence_gaps.length} Critical Record Gap{structured.evidence_gaps.length > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-muted">Run analysis to identify gaps</span>
                )}
              </div>

              {structured?.evidence_gaps && structured.evidence_gaps.length > 0 ? (
                <div className="space-y-2">
                  {structured.evidence_gaps.map((gap) => (
                    <div
                      key={gap.gap_id}
                      className="p-3 bg-white border-2 border-ink text-xs space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-ink text-lime font-mono text-[10px] font-bold">
                            {gap.gap_id}
                          </span>
                          <span className="font-mono text-xs uppercase">{gap.category}</span>
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 border border-ink font-mono font-bold uppercase ${
                            gap.priority === 'High'
                              ? 'bg-red-200 text-red-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {gap.priority} Priority
                        </span>
                      </div>
                      <p className="text-ink leading-snug">{gap.description}</p>
                      <div className="text-[11px] font-mono text-muted">
                        <strong className="text-ink">Recommended Evidence:</strong>{' '}
                        {gap.recommended_evidence_to_obtain}
                      </div>
                      <div className="text-[10px] font-mono text-muted italic">
                        Why it matters: {gap.why_it_matters}
                      </div>

                      {/* Investigator Gap Review Status */}
                      <div className="flex items-center justify-between pt-2 border-t border-subtle">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-ink font-bold uppercase">Review Status:</span>
                          <select
                            value={gap.status || 'open'}
                            onChange={(e) =>
                              dispatch(
                                updateLocalEvidenceGap({
                                  gapId: gap.gap_id,
                                  status: e.target.value,
                                })
                              )
                            }
                            className="input-brutal text-[10px] py-1 px-2 font-mono font-semibold"
                          >
                            <option value="open">Open (Unresolved)</option>
                            <option value="addressed">Addressed in Investigation</option>
                            <option value="resolved">Resolved (Evidence Acquired)</option>
                          </select>
                        </div>
                        {gap.status === 'resolved' && (
                          <span className="font-mono text-[10px] text-teal font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-muted italic text-center py-4 bg-white border border-subtle">
                  No evidence gaps recorded. Execute AI analysis to screen for missing batch, trend, or calibration records.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Potential Causes & Human Confirmation */}
        {activeTab === 'causes' && (
          <div className="space-y-4">
            <div className="p-3 bg-white border-2 border-ink shadow-brutal-sm text-xs space-y-1">
              <div className="font-display font-bold text-xs uppercase tracking-wider text-ink flex items-center justify-between">
                <span>Causal Hypotheses Evaluation</span>
                <span className="font-mono text-[10px] bg-paper px-2 py-0.5 border border-ink text-muted font-bold">
                  {structured?.potential_root_causes?.length || 0} candidate causes
                </span>
              </div>
              <p className="text-muted text-[11px] font-mono">
                Ranked by thermodynamic and process evidence. Review hypotheses and click "Confirm Cause" to persist as verified finding.
              </p>
            </div>

            {/* Potential Causes List */}
            {structured?.potential_root_causes && structured.potential_root_causes.length > 0 ? (
              <div className="space-y-3">
                {structured.potential_root_causes.map((cause) => {
                  const isSelected = selectedConfirmedCauseId === cause.cause_id;
                  const causeConfirmed = cause.is_confirmed_by_human || cause.review_status === 'confirmed';

                  return (
                    <div
                      key={cause.cause_id}
                      className={`p-4 border-2 border-ink text-xs space-y-3 transition-all ${
                        causeConfirmed
                          ? 'bg-[#F0FDFA] shadow-brutal-teal border-teal'
                          : isSelected
                          ? 'bg-lime/20 shadow-brutal'
                          : 'bg-white shadow-brutal-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] px-2 py-0.5 bg-ink text-white font-bold">
                              {cause.cause_id}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 bg-paper text-ink border border-ink font-mono font-bold uppercase">
                              {cause.category}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 border border-ink font-mono font-bold uppercase ${
                                causeConfirmed
                                  ? 'bg-teal text-white'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {causeConfirmed ? 'Confirmed' : cause.review_status}
                            </span>
                          </div>
                          <h5 className="font-display font-bold text-ink text-sm mt-1">{cause.title}</h5>
                        </div>

                        {/* Human Review Decision Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedConfirmedCauseId(cause.cause_id);
                              dispatch(
                                updateLocalCause({
                                  causeId: cause.cause_id,
                                  isConfirmed: true,
                                  reviewStatus: 'confirmed',
                                })
                              );
                            }}
                            className={`px-2.5 py-1.5 border-2 border-ink text-[10px] font-mono font-bold uppercase transition-all shadow-[2px_2px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] flex items-center gap-1 ${
                              causeConfirmed
                                ? 'bg-teal text-white'
                                : 'bg-lime text-ink hover:bg-white'
                            }`}
                          >
                            <Award className="w-3 h-3" />
                            <span>{causeConfirmed ? 'Confirmed' : 'Confirm Cause'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (selectedConfirmedCauseId === cause.cause_id) {
                                setSelectedConfirmedCauseId(null);
                              }
                              dispatch(
                                updateLocalCause({
                                  causeId: cause.cause_id,
                                  isConfirmed: false,
                                  reviewStatus: 'needs_evidence',
                                })
                              );
                            }}
                            className={`px-2.5 py-1.5 border-2 border-ink text-[10px] font-mono font-bold uppercase transition-all shadow-[2px_2px_0px_#171717] ${
                              cause.review_status === 'needs_evidence'
                                ? 'bg-amber-400 text-ink'
                                : 'bg-paper text-ink hover:bg-white'
                            }`}
                          >
                            <span>Needs Evidence</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (selectedConfirmedCauseId === cause.cause_id) {
                                setSelectedConfirmedCauseId(null);
                              }
                              dispatch(
                                updateLocalCause({
                                  causeId: cause.cause_id,
                                  isConfirmed: false,
                                  reviewStatus: 'rejected',
                                })
                              );
                            }}
                            className={`px-2.5 py-1.5 border-2 border-ink text-[10px] font-mono font-bold uppercase transition-all shadow-[2px_2px_0px_#171717] ${
                              cause.review_status === 'rejected'
                                ? 'bg-red-500 text-white'
                                : 'bg-white text-red-700 hover:bg-red-50'
                            }`}
                          >
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-ink leading-relaxed text-xs">{cause.explanation}</p>

                      {/* Supporting Evidence Excerpts */}
                      {cause.supporting_excerpts && cause.supporting_excerpts.length > 0 && (
                        <div className="p-3 bg-paper border-2 border-subtle space-y-1.5">
                          <span className="font-mono text-[10px] font-bold text-muted uppercase tracking-wider block">
                            Documented Supporting Excerpts
                          </span>
                          {cause.supporting_excerpts.map((exc, i) => (
                            <p key={i} className="font-mono text-[11px] text-ink italic border-l-2 border-teal pl-2">
                              "{exc}"
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Missing Evidence / Next Step */}
                      <div className="text-[11px] font-mono text-muted space-y-1 pt-2 border-t border-subtle">
                        {cause.recommended_next_step && (
                          <div>
                            <strong className="text-ink">Recommended Verification Step:</strong>{' '}
                            {cause.recommended_next_step}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-subtle bg-white">
                <HelpCircle className="w-8 h-8 text-muted mx-auto mb-2" />
                <p className="text-xs font-mono text-muted">No causal hypotheses generated yet.</p>
                <button
                  type="button"
                  onClick={handleRunFullAnalysis}
                  className="mt-2 text-xs font-mono font-bold text-teal hover:underline uppercase"
                >
                  Run Analysis to evaluate causes →
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: 5 Whys Analysis */}
        {activeTab === 'fiveWhys' && (
          <div className="space-y-4">
            <div className="p-3 bg-white border-2 border-ink shadow-brutal-sm text-xs space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-teal" />
                  Iterative 5 Whys Causal Sequence
                </h4>
                <button
                  type="button"
                  onClick={() => dispatch(addLocalFiveWhysStep())}
                  className="btn-brutal-secondary text-[10px] py-1 px-2.5 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Step
                </button>
              </div>
              <p className="text-muted text-[11px] font-mono">
                Grounds each deductive step in documented source facts without forcing unsupported speculation.
              </p>
            </div>

            {structured?.five_whys?.problem_statement && (
              <div className="p-3 bg-paper border-2 border-ink text-xs shadow-xs">
                <span className="font-mono text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                  Problem Statement
                </span>
                <p className="font-display font-bold text-ink text-sm">{structured.five_whys.problem_statement}</p>
              </div>
            )}

            {structured?.five_whys?.steps && structured.five_whys.steps.length > 0 ? (
              <div className="space-y-3">
                {structured.five_whys.steps.map((step, idx) => (
                  <div key={idx} className="p-4 bg-white border-2 border-ink shadow-brutal-sm text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-ink text-lime border-2 border-ink flex items-center justify-center font-mono font-bold text-xs">
                          {step.level}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 border border-ink font-mono font-bold uppercase ${
                            step.status === 'supported'
                              ? 'bg-lime text-ink'
                              : step.status === 'tentative'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-red-100 text-red-900'
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={step.status}
                          onChange={(e) =>
                            dispatch(
                              updateLocalFiveWhysStep({
                                index: idx,
                                status: e.target.value as any,
                              })
                            )
                          }
                          className="input-brutal text-[10px] py-1 px-2 font-mono font-semibold"
                        >
                          <option value="supported">Supported</option>
                          <option value="tentative">Tentative</option>
                          <option value="unresolved">Unresolved</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => dispatch(removeLocalFiveWhysStep(idx))}
                          className="text-muted hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="font-mono text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                        Question:
                      </label>
                      <input
                        type="text"
                        value={step.question}
                        onChange={(e) =>
                          dispatch(
                            updateLocalFiveWhysStep({
                              index: idx,
                              question: e.target.value,
                            })
                          )
                        }
                        className="input-brutal w-full text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-mono text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                        Answer:
                      </label>
                      <textarea
                        rows={2}
                        value={step.answer}
                        onChange={(e) =>
                          dispatch(
                            updateLocalFiveWhysStep({
                              index: idx,
                              answer: e.target.value,
                            })
                          )
                        }
                        className="input-brutal w-full text-xs"
                      />
                    </div>

                    {step.supporting_evidence && (
                      <div className="font-mono text-[11px] text-teal bg-[#F0FDFA] p-2 border border-teal">
                        <strong>Evidence:</strong> {step.supporting_evidence}
                      </div>
                    )}
                  </div>
                ))}

                {structured.five_whys.derived_root_cause_hypothesis && (
                  <div className="p-4 bg-teal text-white border-2 border-ink shadow-brutal-teal text-xs space-y-1.5">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-lime block">
                      Derived Root Cause Hypothesis
                    </span>
                    <p className="font-display font-bold text-sm text-white">
                      {structured.five_whys.derived_root_cause_hypothesis}
                    </p>
                    {structured.five_whys.evidence_limitation_note && (
                      <p className="font-mono text-[11px] text-teal-100 italic pt-1 border-t border-teal-600">
                        Limitation: {structured.five_whys.evidence_limitation_note}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-subtle bg-white">
                <GitBranch className="w-8 h-8 text-muted mx-auto mb-2" />
                <p className="text-xs font-mono text-muted">No 5 Whys sequence executed yet.</p>
                <button
                  type="button"
                  onClick={() => handleRunTargeted('fiveWhys')}
                  className="mt-2 text-xs font-mono font-bold text-teal hover:underline uppercase"
                >
                  Generate 5 Whys Analysis →
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Fishbone Analysis (6M Ishikawa) */}
        {activeTab === 'fishbone' && (
          <div className="space-y-4">
            <div className="p-3 bg-white border-2 border-ink shadow-brutal-sm text-xs space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-2">
                  <Network className="w-4 h-4 text-teal" />
                  Ishikawa 6M Cause Matrix
                </h4>
              </div>
              <p className="text-muted text-[11px] font-mono">
                Distributes verified and tentative contributing factors across the 6 standard pharmaceutical manufacturing domains.
              </p>
            </div>

            {structured?.fishbone ? (
              <div className="space-y-3">
                {[
                  { key: 'machine', label: 'Machine (Equipment & Instruments)', items: structured.fishbone.machine },
                  { key: 'method', label: 'Method (Process & SOPs)', items: structured.fishbone.method },
                  { key: 'material', label: 'Material (Raw Material & Solvents)', items: structured.fishbone.material },
                  { key: 'measurement', label: 'Measurement (QC & HPLC Assays)', items: structured.fishbone.measurement },
                  { key: 'milieu_environment', label: 'Milieu (Cleanroom & Humidity)', items: structured.fishbone.milieu_environment },
                  { key: 'manpower_people', label: 'Manpower (Training & Shift)', items: structured.fishbone.manpower_people },
                ].map((category) => (
                  <div key={category.key} className="border-2 border-ink bg-white p-3.5 shadow-brutal-sm">
                    <div className="flex items-center justify-between mb-2.5 border-b border-subtle pb-1.5">
                      <span className="font-display font-bold text-ink text-xs uppercase tracking-wide">
                        {category.label}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-paper text-ink border border-ink font-mono font-bold">
                        {category.items?.length || 0} factors
                      </span>
                    </div>

                    {category.items && category.items.length > 0 ? (
                      <div className="space-y-2">
                        {category.items.map((item) => (
                          <div
                            key={item.cause_id}
                            className="p-2.5 bg-paper border border-ink text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-ink">{item.cause}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 border border-ink font-mono font-bold uppercase ${
                                  item.status === 'supported'
                                    ? 'bg-lime text-ink'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                            {item.evidence && (
                              <p className="font-mono text-[10px] text-muted italic">
                                Evidence: "{item.evidence}"
                              </p>
                            )}
                            {item.verification_action && (
                              <p className="font-mono text-[10px] text-teal font-semibold">
                                Action: {item.verification_action}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] font-mono text-muted italic">
                        No supported causes identified from supplied evidence for this category.
                      </p>
                    )}
                  </div>
                ))}

                {structured.fishbone.summary_observations && (
                  <div className="p-3 bg-paper border-2 border-ink text-xs text-ink shadow-xs">
                    <span className="font-mono font-bold block text-[10px] uppercase text-muted mb-1">
                      Fishbone Summary Observations
                    </span>
                    <p className="font-mono text-[11px] leading-relaxed">
                      {structured.fishbone.summary_observations}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-subtle bg-white">
                <Network className="w-8 h-8 text-muted mx-auto mb-2" />
                <p className="text-xs font-mono text-muted">No Fishbone matrix generated yet.</p>
                <button
                  type="button"
                  onClick={() => handleRunTargeted('fishbone')}
                  className="mt-2 text-xs font-mono font-bold text-teal hover:underline uppercase"
                >
                  Generate 6M Fishbone Analysis →
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: CAPA Recommendations */}
        {activeTab === 'capa' && (
          <div className="space-y-4">
            <div className="p-3 bg-white border-2 border-ink shadow-brutal-sm text-xs space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal" />
                  Intelligent CAPA Recommendations
                </h4>
              </div>
              <p className="text-muted text-[11px] font-mono">
                Distinguishes immediate containment from permanent corrective and preventive actions.
              </p>
            </div>

            {structured?.capa_recommendations && structured.capa_recommendations.length > 0 ? (
              <div className="space-y-3">
                {structured.capa_recommendations.map((capa) => (
                  <div
                    key={capa.action_id}
                    className="p-4 bg-white border-2 border-ink shadow-brutal-sm text-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] px-2 py-0.5 bg-ink text-white font-bold">
                            {capa.action_id}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 border border-ink font-mono font-bold uppercase ${
                              capa.action_type.includes('Correction') || capa.action_type.includes('Containment')
                                ? 'bg-amber-100 text-amber-900'
                                : capa.action_type.includes('Corrective')
                                ? 'bg-teal text-white'
                                : 'bg-lime text-ink'
                            }`}
                          >
                            {capa.action_type}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-paper text-ink border border-ink font-mono font-bold uppercase">
                            {capa.suggested_priority} Priority
                          </span>
                        </div>
                        <h5 className="font-display font-bold text-ink text-sm mt-1.5">{capa.title}</h5>
                      </div>

                      {/* Review Status Selector */}
                      <select
                        value={capa.human_approval_status}
                        onChange={(e) =>
                          dispatch(
                            updateLocalCapa({
                              actionId: capa.action_id,
                              approvalStatus: e.target.value,
                            })
                          )
                        }
                        className="input-brutal text-[10px] py-1 px-2 font-mono font-bold"
                      >
                        <option value="Proposed">Proposed</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Modified">Modified</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <p className="text-ink leading-relaxed text-xs">{capa.description}</p>

                    <div className="p-3 bg-paper border-2 border-subtle space-y-1.5 text-[11px] font-mono">
                      <div>
                        <strong className="text-ink">Rationale:</strong> {capa.rationale}
                      </div>
                      <div>
                        <strong className="text-ink">Expected Outcome:</strong> {capa.expected_outcome}
                      </div>
                      <div>
                        <strong className="text-ink">Effectiveness Check:</strong>{' '}
                        {capa.effectiveness_check_method}
                      </div>
                      <div>
                        <strong className="text-ink">Closure Evidence Needed:</strong>{' '}
                        {capa.evidence_needed_for_closure}
                      </div>
                      {capa.suggested_owner_role && (
                        <div className="text-[10px] text-muted pt-1 border-t border-subtle">
                          Suggested Role: <strong className="text-ink">{capa.suggested_owner_role}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-subtle bg-white">
                <ShieldCheck className="w-8 h-8 text-muted mx-auto mb-2" />
                <p className="text-xs font-mono text-muted">No CAPA recommendations generated yet.</p>
                <button
                  type="button"
                  onClick={() => handleRunTargeted('capa')}
                  className="mt-2 text-xs font-mono font-bold text-teal hover:underline uppercase"
                >
                  Generate CAPA Actions →
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: Audit Trail & Historical Versions */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Regulatory Compliance / Audit Trail Explanation */}
            <div className="p-3 bg-white border-2 border-ink shadow-brutal-sm text-xs space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal" />
                  Audit Trail & Compliance History
                </h4>
                <span className="font-mono text-[10px] px-2 py-0.5 bg-lime text-ink border border-ink font-bold">
                  {auditLogs.length} Events Logged
                </span>
              </div>
              <p className="text-muted text-[11px] font-mono">
                Immutable, append-only record of all investigation updates, source attachments, LangGraph AI executions, and human quality review sign-offs.
              </p>
            </div>

            {/* Analysis Versions Card */}
            {history && history.length > 0 && (
              <div className="border-2 border-ink bg-white p-3.5 shadow-brutal-sm space-y-2">
                <h5 className="font-display text-xs font-bold uppercase tracking-wider text-ink flex items-center justify-between border-b border-subtle pb-1.5">
                  <span>Intelligence Version History ({history.length})</span>
                  <span className="font-mono text-[10px] text-muted">Preserved execution snapshots</span>
                </h5>
                <div className="space-y-2">
                  {history.map((ver) => (
                    <div
                      key={ver.id}
                      className={`p-2.5 border-2 text-xs flex items-center justify-between transition-colors ${
                        ver.id === currentAnalysis?.id
                          ? 'border-teal bg-[#F0FDFA]'
                          : 'border-ink bg-paper'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-ink text-white font-bold">
                            v{ver.version}
                          </span>
                          <span className="font-bold text-ink">
                            {ver.model_identifier || 'Groq Engine'}
                          </span>
                          {ver.id === currentAnalysis?.id && (
                            <span className="text-[9px] uppercase tracking-wide bg-lime text-ink border border-ink px-1.5 py-0.2 font-mono font-bold">
                              Current
                            </span>
                          )}
                          {ver.is_confirmed_by_human && (
                            <span className="text-[9px] uppercase tracking-wide bg-teal text-white px-1.5 py-0.2 font-mono font-bold flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> QA Confirmed
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-muted flex items-center gap-2">
                          <span>Created: {new Date(ver.created_at).toLocaleString()}</span>
                          {ver.confirmed_root_cause && (
                            <span>• Cause: <strong className="text-ink truncate max-w-[180px] inline-block align-bottom">{ver.confirmed_root_cause}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Trail Events Timeline */}
            <div className="border-2 border-ink bg-white p-3.5 shadow-brutal-sm space-y-3">
              <h5 className="font-display text-xs font-bold uppercase tracking-wider text-ink flex items-center justify-between border-b border-subtle pb-1.5">
                <span>Append-Only Chronological Log</span>
                <span className="font-mono text-[10px] text-muted">UTC Timestamps</span>
              </h5>

              {auditLoading ? (
                <div className="py-6 text-center text-xs font-mono text-muted flex items-center justify-center gap-2">
                  <RotateCw className="w-4 h-4 animate-spin text-teal" />
                  <span>Loading audit records...</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-6 text-center text-xs font-mono text-muted italic">
                  No audit trail events recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log) => {
                    const eventColors: Record<string, string> = {
                      investigation_created: 'bg-lime text-ink',
                      status_transitioned: 'bg-teal text-white',
                      reopened: 'bg-amber-200 text-amber-900',
                      source_attached: 'bg-paper text-ink',
                      source_detached: 'bg-red-200 text-red-900',
                      analysis_started: 'bg-blue-100 text-blue-900',
                      analysis_completed: 'bg-lime text-ink',
                      analysis_failed: 'bg-red-200 text-red-900',
                      root_cause_confirmed: 'bg-teal text-white',
                      fact_applied: 'bg-[#F0FDFA] text-teal border-teal',
                      analysis_reviewed: 'bg-paper text-ink',
                    };
                    const colorClass = eventColors[log.event_type] || 'bg-paper text-ink';

                    return (
                      <div key={log.id} className="p-3 bg-paper border-2 border-ink text-xs space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-mono px-2 py-0.5 border border-ink uppercase font-bold ${colorClass}`}>
                              {log.event_type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-ink">
                              Actor: <code className="text-teal bg-white px-1 py-0.2 border border-ink">{log.actor_id}</code>
                            </span>
                          </div>
                          <span className="text-[10px] text-muted font-mono">
                            {new Date(log.created_at).toISOString().replace('T', ' ').substring(0, 19)} UTC
                          </span>
                        </div>

                        <p className="text-ink text-[11px] font-sans leading-snug">
                          {log.summary || `Action performed on ${log.entity_type}`}
                        </p>

                        {log.details && (
                          <div className="flex items-center justify-end pt-1 border-t border-subtle">
                            <button
                              type="button"
                              onClick={() => setInspectAuditLog(log)}
                              className="btn-brutal-secondary text-[10px] py-0.5 px-2 flex items-center gap-1 font-mono"
                            >
                              <span>Inspect Payload</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Review Confirmation & Persistence Footer */}
      {currentAnalysis && (
        <div className="p-4 bg-paper border-t-2 border-ink flex flex-col gap-3">
          {saveError && (
            <div className="text-[11px] font-mono text-red-600 font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{saveError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-mono text-[11px] font-bold uppercase text-ink block">
              Quality Reviewer Sign-off Notes / Justification:
            </label>
            <input
              type="text"
              value={confirmationNotes}
              onChange={(e) => setConfirmationNotes(e.target.value)}
              placeholder="e.g., Reviewed against batch record API-2026-014; confirmed drying temperature profile deviation."
              className="input-brutal w-full text-xs"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-subtle">
            <div className="text-[11px] font-mono text-muted leading-tight">
              {currentAnalysis.is_confirmed_by_human ? (
                <span className="text-teal font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmed by Quality Reviewer
                </span>
              ) : (
                <span>Review decisions & edits require human save to persist.</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveReview}
              disabled={saveLoading}
              className="btn-brutal-primary text-xs py-2 px-4 flex items-center gap-2 bg-ink"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveLoading ? 'Saving to DB...' : 'Save Review Decisions'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Evidence Viewer Modal */}
      {evidenceModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4">
          <div className="bg-paper border-3 border-ink shadow-brutal-lg max-w-lg w-full overflow-hidden">
            <div className="p-3.5 bg-ink text-white flex items-center justify-between border-b-2 border-ink">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-lime" />
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white">
                  {evidenceModalDoc.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEvidenceModalDoc(null)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto font-mono text-xs text-ink bg-white whitespace-pre-wrap leading-relaxed border-b-2 border-ink">
              {evidenceModalDoc.snippet}
            </div>
            <div className="p-3 bg-paper flex justify-end">
              <button
                type="button"
                onClick={() => setEvidenceModalDoc(null)}
                className="btn-brutal-secondary text-xs py-1.5 px-3"
              >
                Close Evidence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fact Review & Correction Modal */}
      {editingFact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4">
          <div className="bg-paper border-3 border-ink shadow-brutal-lg max-w-md w-full overflow-hidden">
            <div className="p-3.5 bg-ink text-white flex items-center justify-between border-b-2 border-ink">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-lime" />
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white">
                  Review & Verify Extracted Fact
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingFact(null)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs bg-white border-b-2 border-ink">
              <div>
                <label className="font-mono text-[10px] font-bold uppercase text-muted block mb-1">Target Field Name:</label>
                <div className="p-2 bg-paper border border-ink text-ink font-mono text-xs uppercase font-bold">
                  {editingFact.fieldName.replace(/_/g, ' ')}
                </div>
              </div>
              <div>
                <label className="font-mono text-[10px] font-bold uppercase text-muted block mb-1">Extracted / Corrected Value:</label>
                <input
                  type="text"
                  value={editingFact.currentValue}
                  onChange={(e) => setEditingFact({ ...editingFact, currentValue: e.target.value })}
                  className="input-brutal w-full text-xs font-mono"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] font-bold uppercase text-muted block mb-1">Verification / Correction Notes:</label>
                <textarea
                  rows={2}
                  value={editingFact.notes}
                  onChange={(e) => setEditingFact({ ...editingFact, notes: e.target.value })}
                  placeholder="Reason for verification or correction..."
                  className="input-brutal w-full text-xs"
                />
              </div>
            </div>
            <div className="p-3 bg-paper flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingFact(null)}
                className="btn-brutal-secondary text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const fact = structured?.extracted_facts?.find((f) => f.field_name === editingFact.fieldName);
                  if (fact) {
                    handleAcceptFact(fact, editingFact.currentValue, editingFact.notes);
                  }
                }}
                className="btn-brutal-primary text-xs py-1.5 px-3 flex items-center gap-1.5 bg-teal"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Apply to Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Payload Inspector Modal */}
      {inspectAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4">
          <div className="bg-paper border-3 border-ink shadow-brutal-lg max-w-lg w-full overflow-hidden">
            <div className="p-3.5 bg-ink text-white flex items-center justify-between border-b-2 border-ink">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-lime" />
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white">
                  Audit Payload — {inspectAuditLog.event_type}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setInspectAuditLog(null)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto font-mono text-xs text-ink bg-white leading-relaxed border-b-2 border-ink">
              <div className="mb-3 text-muted text-[11px] border-b border-subtle pb-2">
                <div><strong>Event ID:</strong> {inspectAuditLog.id}</div>
                <div><strong>Actor:</strong> {inspectAuditLog.actor_id}</div>
                <div><strong>Timestamp:</strong> {inspectAuditLog.created_at}</div>
              </div>
              <pre className="p-3 bg-paper border border-ink whitespace-pre-wrap text-[11px]">
                {typeof inspectAuditLog.details === 'string'
                  ? inspectAuditLog.details
                  : JSON.stringify(inspectAuditLog.details, null, 2)}
              </pre>
            </div>
            <div className="p-3 bg-paper flex justify-end">
              <button
                type="button"
                onClick={() => setInspectAuditLog(null)}
                className="btn-brutal-secondary text-xs py-1.5 px-3"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (mode === 'drawer') {
    return (
      <>
        {isDrawerOpen && (
          <div
            onClick={onCloseDrawer}
            className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />
        )}
        <aside
          className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] md:w-[580px] bg-white border-l-2 border-ink shadow-brutal-xl flex flex-col transition-transform duration-200 ease-in-out ${
            isDrawerOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
          }`}
          aria-label="Investigation Intelligence Drawer"
        >
          {panelContent}
        </aside>
      </>
    );
  }

  return panelContent;
};
