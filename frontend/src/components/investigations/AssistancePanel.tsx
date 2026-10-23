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
  clearSaveStatus,
} from '../../store/slices/analysisSlice';
import { updateInvestigation } from '../../store/investigationsSlice';

interface AssistancePanelProps {
  investigation: Investigation | null;
  onOpenSourceIntake: () => void;
  attachedSources: SourceDocument[];
}

export const AssistancePanel: React.FC<AssistancePanelProps> = ({
  investigation,
  onOpenSourceIntake,
  attachedSources,
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

  const [activeTab, setActiveTab] = useState<'evidence' | 'causes' | 'fiveWhys' | 'fishbone' | 'capa'>('evidence');
  const [showRunOptions, setShowRunOptions] = useState(false);
  const [evidenceModalDoc, setEvidenceModalDoc] = useState<{
    sourceId: string;
    snippet: string;
    title: string;
  } | null>(null);

  // Form fact update state
  const [acceptedFacts, setAcceptedFacts] = useState<Record<string, boolean>>({});
  const [rejectedFacts, setRejectedFacts] = useState<Record<string, boolean>>({});

  // Human confirmation notes state
  const [confirmationNotes, setConfirmationNotes] = useState('');
  const [selectedConfirmedCauseId, setSelectedConfirmedCauseId] = useState<string | null>(null);

  useEffect(() => {
    if (investigation?.id) {
      dispatch(fetchLatestAnalysis(investigation.id));
      dispatch(fetchAnalysisHistory(investigation.id));
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
  };

  const handleRunTargeted = async (method: 'fiveWhys' | 'fishbone' | 'capa') => {
    if (!investigation?.id) return;
    setShowRunOptions(false);
    if (method === 'fiveWhys') await dispatch(executeFiveWhys(investigation.id));
    if (method === 'fishbone') await dispatch(executeFishbone(investigation.id));
    if (method === 'capa') await dispatch(executeCapa(investigation.id));
    dispatch(fetchAnalysisHistory(investigation.id));
  };

  const handleAcceptFact = async (fact: ExtractedFact) => {
    if (!investigation?.id) return;
    setAcceptedFacts((prev) => ({ ...prev, [fact.field_name]: true }));
    // Update the investigation field directly in the backend and Redux
    await dispatch(
      updateInvestigation({
        idOrCode: investigation.id,
        payload: { [fact.field_name]: fact.extracted_value },
      })
    );
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
  };

  const structured = currentAnalysis?.structured_output;
  const isConfirmed = currentAnalysis?.is_confirmed_by_human;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Panel Header */}
      <div className="p-4 bg-slate-900 text-white border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Investigation Intelligence
                {currentAnalysis && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-900 text-teal-300 border border-teal-700 font-mono font-semibold">
                    v{currentAnalysis.version}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                LangGraph RCA Orchestrator • {currentAnalysis?.model_identifier || 'Groq Engine'}
              </p>
            </div>
          </div>

          {/* Run Analysis Action Button with Dropdown */}
          <div className="relative">
            <div className="inline-flex rounded-md shadow-xs">
              <button
                type="button"
                onClick={handleRunFullAnalysis}
                disabled={loading || !hasTextContent}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 text-white text-xs font-semibold rounded-l-md transition-colors"
                title={!hasTextContent ? 'Provide incident description or attach sources first' : 'Run full AI analysis'}
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
                disabled={loading || !hasTextContent}
                className="px-1.5 bg-teal-700 hover:bg-teal-600 disabled:bg-slate-700 text-white rounded-r-md border-l border-teal-800 transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Run Options Dropdown Menu */}
            {showRunOptions && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 text-xs text-slate-800">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                  Execution Scope
                </div>
                <button
                  type="button"
                  onClick={handleRunFullAnalysis}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span className="font-medium text-teal-800">Full Intelligence (All Nodes)</span>
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRunTargeted('fiveWhys')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>5 Whys Chain Only</span>
                  <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRunTargeted('fishbone')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Fishbone (6M) Only</span>
                  <Network className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRunTargeted('capa')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>CAPA Recommendations Only</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mandatory Quality & Regulatory Disclaimer Banner */}
      <div className="p-2.5 bg-amber-50/90 border-b border-amber-200 flex items-start gap-2 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="leading-snug text-[11px]">
          <strong>Pharmaceutical Quality Safeguard:</strong> All AI-generated causes, 5 Whys steps, and CAPA actions are unconfirmed evidentiary hypotheses. Formal confirmation strictly requires qualified human quality investigator review.
        </div>
      </div>

      {/* Loading Stage Indicator */}
      {loading && (
        <div className="p-3 bg-teal-50 border-b border-teal-200 flex items-center gap-3 text-xs text-teal-900">
          <RotateCw className="w-4 h-4 text-teal-600 animate-spin flex-shrink-0" />
          <div className="flex-1 font-medium">
            {stageMessage || 'Executing LangGraph multi-node analysis workflow...'}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-rose-50 border-b border-rose-200 flex items-start gap-2 text-xs text-rose-900">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong>Analysis Warning / Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => dispatch(clearSaveStatus())}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Human Confirmed Root Cause Banner */}
      {isConfirmed && currentAnalysis?.confirmed_root_cause && (
        <div className="p-3 bg-emerald-50 border-b border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-950">
          <Award className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded font-mono">
                Human-Confirmed Root Cause
              </span>
            </div>
            <p className="mt-1 font-semibold text-emerald-900">
              {currentAnalysis.confirmed_root_cause}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('evidence')}
          className={`flex-1 py-2.5 px-2 text-center font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'evidence'
              ? 'border-teal-600 text-teal-700 bg-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Evidence & Gaps
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('causes')}
          className={`flex-1 py-2.5 px-2 text-center font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'causes'
              ? 'border-teal-600 text-teal-700 bg-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Potential Causes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fiveWhys')}
          className={`flex-1 py-2.5 px-2 text-center font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'fiveWhys'
              ? 'border-teal-600 text-teal-700 bg-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          5 Whys
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fishbone')}
          className={`flex-1 py-2.5 px-2 text-center font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'fishbone'
              ? 'border-teal-600 text-teal-700 bg-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Fishbone (6M)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('capa')}
          className={`flex-1 py-2.5 px-2 text-center font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'capa'
              ? 'border-teal-600 text-teal-700 bg-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          CAPA
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* TAB 1: Evidence & Gaps */}
        {activeTab === 'evidence' && (
          <div className="space-y-4">
            {/* Attached Sources Summary */}
            <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                  Attached Sources ({attachedSources.length})
                </span>
                <button
                  type="button"
                  onClick={onOpenSourceIntake}
                  className="text-xs text-teal-600 hover:text-teal-800 font-semibold"
                >
                  + Add Source
                </button>
              </div>

              {attachedSources.length === 0 ? (
                <div className="text-center py-4 bg-white border border-dashed border-slate-200 rounded-md">
                  <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                  <p className="text-xs text-slate-500 font-medium">No source documents attached yet.</p>
                  <button
                    type="button"
                    onClick={onOpenSourceIntake}
                    className="mt-2 text-xs text-teal-600 hover:underline font-semibold"
                  >
                    Upload PDF or Paste Incident Text
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachedSources.map((doc) => (
                    <div
                      key={doc.id || doc.source_id}
                      className="p-2.5 bg-white border border-slate-200 rounded-md text-xs space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                          {doc.original_filename || doc.source_id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase font-mono">
                          {doc.source_type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          Status: <strong className="text-teal-700">{doc.extraction_status}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEvidenceModalDoc({
                              sourceId: doc.source_id,
                              snippet: doc.extracted_text || 'No text extracted.',
                              title: doc.original_filename || doc.source_id,
                            })
                          }
                          className="text-teal-600 hover:text-teal-800 inline-flex items-center gap-1 font-medium"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Text</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Proposed Form Updates from Extracted Facts */}
            {structured?.extracted_facts && structured.extracted_facts.length > 0 && (
              <div className="border border-teal-200 bg-teal-50/40 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    AI-Proposed Form Updates ({structured.extracted_facts.length})
                  </h4>
                  <span className="text-[10px] text-teal-700 font-medium">Review before applying</span>
                </div>
                <div className="space-y-2">
                  {structured.extracted_facts.map((fact, idx) => {
                    const isAccepted = acceptedFacts[fact.field_name];
                    const isRejected = rejectedFacts[fact.field_name];

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 bg-white border rounded-md text-xs space-y-1.5 transition-colors ${
                          isAccepted
                            ? 'border-emerald-300 bg-emerald-50/40'
                            : isRejected
                            ? 'border-slate-200 opacity-50 bg-slate-50'
                            : 'border-teal-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 capitalize">
                            {fact.field_name.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-mono">
                            {Math.round(fact.confidence_score * 100)}% match
                          </span>
                        </div>

                        <div className="p-2 bg-slate-50 rounded border border-slate-100 font-mono text-[11px] text-slate-800">
                          {fact.extracted_value}
                        </div>

                        {fact.source_snippet && (
                          <div className="text-[10px] text-slate-500 italic">
                            Evidence: "{fact.source_snippet}" ({fact.source_id})
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                          {isAccepted ? (
                            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Applied to Form
                            </span>
                          ) : isRejected ? (
                            <span className="text-[11px] text-slate-400 italic">Dismissed</span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRejectFact(fact)}
                                className="px-2 py-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded text-[11px] font-medium"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAcceptFact(fact)}
                                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[11px] font-semibold flex items-center gap-1"
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
            <div className="border border-slate-200 rounded-lg p-3.5">
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span>Identified Evidence Gaps</span>
                {structured?.evidence_gaps && structured.evidence_gaps.length > 0 ? (
                  <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {structured.evidence_gaps.length} Critical Record Gap{structured.evidence_gaps.length > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Run analysis to identify gaps</span>
                )}
              </h4>

              {structured?.evidence_gaps && structured.evidence_gaps.length > 0 ? (
                <div className="space-y-2">
                  {structured.evidence_gaps.map((gap) => (
                    <div
                      key={gap.gap_id}
                      className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-md text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-950 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded font-mono text-[10px]">
                            {gap.gap_id}
                          </span>
                          {gap.category}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            gap.priority === 'High'
                              ? 'bg-rose-100 text-rose-700 border border-rose-300'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {gap.priority} Priority
                        </span>
                      </div>
                      <p className="text-slate-700 leading-snug">{gap.description}</p>
                      <div className="text-[11px] text-slate-500">
                        <strong className="text-slate-700">Recommended Evidence:</strong>{' '}
                        {gap.recommended_evidence_to_obtain}
                      </div>
                      <div className="text-[10px] text-slate-400 italic">
                        Why it matters: {gap.why_it_matters}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-2">
                  No evidence gaps recorded. Execute AI analysis to screen for missing batch, trend, or calibration records.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Potential Causes & Human Confirmation */}
        {activeTab === 'causes' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>Causal Hypotheses Evaluation</span>
                <span className="text-[10px] text-slate-500">
                  {structured?.potential_root_causes?.length || 0} candidate causes
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Ranked by thermodynamic and process evidence. Review hypotheses and select one to confirm.
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
                      className={`p-3.5 border rounded-lg text-xs space-y-2 transition-all ${
                        causeConfirmed
                          ? 'border-emerald-400 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-400'
                          : isSelected
                          ? 'border-teal-400 bg-teal-50/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                              {cause.cause_id}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase bg-teal-100 text-teal-800">
                              {cause.category}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                causeConfirmed
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {causeConfirmed ? 'Confirmed' : cause.review_status}
                            </span>
                          </div>
                          <h5 className="font-bold text-slate-900 mt-1.5 text-xs">{cause.title}</h5>
                        </div>

                        {/* Confirmation Radio or Action */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedConfirmedCauseId(cause.cause_id);
                            dispatch(
                              updateLocalCause({
                                causeId: cause.cause_id,
                                isConfirmed: true,
                              })
                            );
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                            causeConfirmed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{causeConfirmed ? 'Confirmed' : 'Select Root Cause'}</span>
                        </button>
                      </div>

                      <p className="text-slate-700 leading-relaxed text-[11px]">{cause.explanation}</p>

                      {/* Supporting Evidence Excerpts */}
                      {cause.supporting_excerpts && cause.supporting_excerpts.length > 0 && (
                        <div className="p-2 bg-slate-50 rounded border border-slate-100 space-y-1">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                            Supporting Excerpts
                          </span>
                          {cause.supporting_excerpts.map((exc, i) => (
                            <p key={i} className="text-[11px] text-slate-700 italic">
                              "{exc}"
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Missing Evidence / Next Step */}
                      <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                        {cause.recommended_next_step && (
                          <div>
                            <strong className="text-slate-800">Recommended Verification Step:</strong>{' '}
                            {cause.recommended_next_step}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg">
                <HelpCircle className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs text-slate-500 font-medium">No causal hypotheses generated yet.</p>
                <button
                  type="button"
                  onClick={handleRunFullAnalysis}
                  className="mt-2 text-xs text-teal-600 hover:underline font-semibold"
                >
                  Run Analysis to evaluate causes
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: 5 Whys Analysis */}
        {activeTab === 'fiveWhys' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-teal-600" />
                  Iterative 5 Whys Causal Sequence
                </h4>
                <button
                  type="button"
                  onClick={() => dispatch(addLocalFiveWhysStep())}
                  className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Step
                </button>
              </div>
              <p className="text-slate-600 text-[11px]">
                Grounds each deductive step in documented source facts without forcing unsupported speculation.
              </p>
            </div>

            {structured?.five_whys?.problem_statement && (
              <div className="p-2.5 bg-slate-100 rounded-md text-xs">
                <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider mb-0.5">
                  Initial Problem Statement
                </span>
                <p className="font-medium text-slate-900">{structured.five_whys.problem_statement}</p>
              </div>
            )}

            {structured?.five_whys?.steps && structured.five_whys.steps.length > 0 ? (
              <div className="space-y-3">
                {structured.five_whys.steps.map((step, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                          {step.level}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            step.status === 'supported'
                              ? 'bg-emerald-100 text-emerald-800'
                              : step.status === 'tentative'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
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
                          className="text-[11px] border border-slate-200 rounded px-1.5 py-0.5 bg-white text-slate-700"
                        >
                          <option value="supported">Supported</option>
                          <option value="tentative">Tentative</option>
                          <option value="unresolved">Unresolved</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => dispatch(removeLocalFiveWhysStep(idx))}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
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
                        className="w-full text-xs font-semibold text-slate-900 border border-slate-200 rounded px-2 py-1 focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
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
                        className="w-full text-xs text-slate-700 border border-slate-200 rounded px-2 py-1 focus:border-teal-500 outline-none"
                      />
                    </div>

                    {step.supporting_evidence && (
                      <div className="text-[10px] text-teal-800 bg-teal-50/50 p-1.5 rounded">
                        <strong>Evidence:</strong> {step.supporting_evidence}
                      </div>
                    )}
                  </div>
                ))}

                {structured.five_whys.derived_root_cause_hypothesis && (
                  <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-lg text-xs space-y-1">
                    <span className="font-bold text-teal-950 uppercase tracking-wider text-[10px] block">
                      Derived Root Cause Hypothesis
                    </span>
                    <p className="text-teal-900 font-medium">
                      {structured.five_whys.derived_root_cause_hypothesis}
                    </p>
                    {structured.five_whys.evidence_limitation_note && (
                      <p className="text-[11px] text-teal-700 italic">
                        Limitation: {structured.five_whys.evidence_limitation_note}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg">
                <GitBranch className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs text-slate-500 font-medium">No 5 Whys sequence executed yet.</p>
                <button
                  type="button"
                  onClick={() => handleRunTargeted('fiveWhys')}
                  className="mt-2 text-xs text-teal-600 hover:underline font-semibold"
                >
                  Generate 5 Whys Analysis
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Fishbone Analysis (6M Ishikawa) */}
        {activeTab === 'fishbone' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Network className="w-4 h-4 text-teal-600" />
                  Ishikawa 6M Cause Matrix
                </h4>
              </div>
              <p className="text-slate-600 text-[11px]">
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
                  <div key={category.key} className="border border-slate-200 rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 text-xs">{category.label}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-mono font-semibold">
                        {category.items?.length || 0} factors
                      </span>
                    </div>

                    {category.items && category.items.length > 0 ? (
                      <div className="space-y-2">
                        {category.items.map((item) => (
                          <div
                            key={item.cause_id}
                            className="p-2 bg-slate-50 rounded border border-slate-100 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900">{item.cause}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                  item.status === 'supported'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                            {item.evidence && (
                              <p className="text-[10px] text-slate-500 italic">
                                Evidence: "{item.evidence}"
                              </p>
                            )}
                            {item.verification_action && (
                              <p className="text-[10px] text-teal-700">
                                Action: {item.verification_action}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        No supported causes identified from supplied evidence for this category.
                      </p>
                    )}
                  </div>
                ))}

                {structured.fishbone.summary_observations && (
                  <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-800">
                    <span className="font-bold block text-[10px] uppercase text-slate-500 mb-0.5">
                      Fishbone Summary Observations
                    </span>
                    {structured.fishbone.summary_observations}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg">
                <Network className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs text-slate-500 font-medium">No Fishbone matrix generated yet.</p>
                <button
                  type="button"
                  onClick={() => handleRunTargeted('fishbone')}
                  className="mt-2 text-xs text-teal-600 hover:underline font-semibold"
                >
                  Generate 6M Fishbone Analysis
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: CAPA Recommendations */}
        {activeTab === 'capa' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Intelligent CAPA Recommendations
                </h4>
              </div>
              <p className="text-slate-600 text-[11px]">
                Distinguishes immediate quarantine containment from permanent corrective and preventive actions.
              </p>
            </div>

            {structured?.capa_recommendations && structured.capa_recommendations.length > 0 ? (
              <div className="space-y-3">
                {structured.capa_recommendations.map((capa) => (
                  <div
                    key={capa.action_id}
                    className="p-3.5 bg-white border border-slate-200 rounded-lg text-xs space-y-2 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                            {capa.action_id}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              capa.action_type.includes('Correction') || capa.action_type.includes('Containment')
                                ? 'bg-amber-100 text-amber-900'
                                : capa.action_type.includes('Corrective')
                                ? 'bg-teal-100 text-teal-900'
                                : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            {capa.action_type}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                            {capa.suggested_priority} Priority
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-900 mt-1.5 text-xs">{capa.title}</h5>
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
                        className="text-[11px] border border-slate-200 rounded px-2 py-1 bg-white font-medium text-slate-700"
                      >
                        <option value="Proposed">Proposed</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Modified">Modified</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <p className="text-slate-700 leading-relaxed text-[11px]">{capa.description}</p>

                    <div className="p-2 bg-slate-50 rounded border border-slate-100 space-y-1 text-[11px]">
                      <div>
                        <strong className="text-slate-700">Rationale:</strong> {capa.rationale}
                      </div>
                      <div>
                        <strong className="text-slate-700">Expected Outcome:</strong> {capa.expected_outcome}
                      </div>
                      <div>
                        <strong className="text-slate-700">Effectiveness Check:</strong>{' '}
                        {capa.effectiveness_check_method}
                      </div>
                      <div>
                        <strong className="text-slate-700">Closure Evidence Needed:</strong>{' '}
                        {capa.evidence_needed_for_closure}
                      </div>
                      {capa.suggested_owner_role && (
                        <div className="text-[10px] text-slate-500">
                          Suggested Role: {capa.suggested_owner_role}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg">
                <ShieldCheck className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs text-slate-500 font-medium">No CAPA recommendations generated yet.</p>
                <button
                  type="button"
                  onClick={() => handleRunTargeted('capa')}
                  className="mt-2 text-xs text-teal-600 hover:underline font-semibold"
                >
                  Generate CAPA Actions
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Confirmation & Persistence Footer */}
      {currentAnalysis && (
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
          {saveError && (
            <div className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{saveError}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500 leading-tight">
              {currentAnalysis.is_confirmed_by_human ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
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
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveLoading ? 'Saving to DB...' : 'Save Review Decisions'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Evidence Viewer Modal */}
      {evidenceModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <h4 className="text-xs font-bold text-white">{evidenceModalDoc.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setEvidenceModalDoc(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto font-mono text-xs text-slate-700 bg-slate-50 whitespace-pre-wrap leading-relaxed">
              {evidenceModalDoc.snippet}
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setEvidenceModalDoc(null)}
                className="px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-medium"
              >
                Close Evidence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
