import React, { useState } from 'react';
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
} from 'lucide-react';
import { Investigation, SourceDocument } from '../../types';

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
  const [activeTab, setActiveTab] = useState<'evidence' | 'fiveWhys' | 'fishbone' | 'capa'>('evidence');

  const hasMissingBatch = !investigation?.batch_number;
  const hasMissingResult = !investigation?.actual_result;
  const hasMissingCriteria = !investigation?.acceptance_criterion;
  const hasMissingProcessStep = !investigation?.process_step;

  const totalGaps = [hasMissingBatch, hasMissingResult, hasMissingCriteria, hasMissingProcessStep].filter(Boolean).length;

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
              <h3 className="text-sm font-bold text-white">Investigation Intelligence</h3>
              <p className="text-[11px] text-slate-400">Decision-Support & Evidence Context</p>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700 font-semibold">
            Phase 1 Foundation
          </span>
        </div>
      </div>

      {/* AI Roadmap Disclaimer Banner */}
      <div className="p-3 bg-blue-50/70 border-b border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="leading-snug">
          <strong className="font-semibold">AI Integration Boundary:</strong> Automated reasoning,
          LangGraph orchestration, 5 Whys deduction, and CAPA ranking are scheduled for Phase 2.
          All investigation conclusions currently require direct qualified human entry.
        </div>
      </div>

      {/* Assistance Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('evidence')}
          className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-colors ${
            activeTab === 'evidence'
              ? 'border-teal-600 text-teal-700 bg-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Evidence & Gaps
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fiveWhys')}
          className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-colors ${
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
          className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-colors ${
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
          className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-colors ${
            activeTab === 'capa'
              ? 'border-teal-600 text-teal-700 bg-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          CAPA Engine
        </button>
      </div>

      {/* Tab Content */}
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
                        <span>Status: <strong className="text-teal-700">{doc.extraction_status}</strong></span>
                        <span>{doc.extracted_text?.length || 0} chars extracted</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Evidence Completeness & Gaps Checklist */}
            <div className="border border-slate-200 rounded-lg p-3.5">
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span>Evidence Verification Checklist</span>
                {totalGaps === 0 ? (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Complete
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {totalGaps} Gap{totalGaps > 1 ? 's' : ''} Detected
                  </span>
                )}
              </h4>

              <ul className="space-y-2 text-xs">
                <li className={`flex items-start gap-2 p-2 rounded ${hasMissingBatch ? 'bg-amber-50/70 text-amber-900 border border-amber-200' : 'bg-slate-50 text-slate-700'}`}>
                  {hasMissingBatch ? (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block font-medium">Batch / Lot Identification</strong>
                    <span className="text-[11px] text-slate-500">
                      {hasMissingBatch ? 'Batch number missing from report. Batch tracing required.' : `Batch: ${investigation?.batch_number}`}
                    </span>
                  </div>
                </li>

                <li className={`flex items-start gap-2 p-2 rounded ${hasMissingResult ? 'bg-amber-50/70 text-amber-900 border border-amber-200' : 'bg-slate-50 text-slate-700'}`}>
                  {hasMissingResult ? (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block font-medium">Observed Test / Process Result</strong>
                    <span className="text-[11px] text-slate-500">
                      {hasMissingResult ? 'Quantitative or qualitative outcome not provided.' : `Observed: ${investigation?.actual_result}`}
                    </span>
                  </div>
                </li>

                <li className={`flex items-start gap-2 p-2 rounded ${hasMissingCriteria ? 'bg-amber-50/70 text-amber-900 border border-amber-200' : 'bg-slate-50 text-slate-700'}`}>
                  {hasMissingCriteria ? (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block font-medium">Acceptance Criterion / Specification Limit</strong>
                    <span className="text-[11px] text-slate-500">
                      {hasMissingCriteria ? 'Applicable specification limit not recorded.' : `Spec: ${investigation?.acceptance_criterion}`}
                    </span>
                  </div>
                </li>

                <li className={`flex items-start gap-2 p-2 rounded ${hasMissingProcessStep ? 'bg-amber-50/70 text-amber-900 border border-amber-200' : 'bg-slate-50 text-slate-700'}`}>
                  {hasMissingProcessStep ? (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block font-medium">Process Unit Operation</strong>
                    <span className="text-[11px] text-slate-500">
                      {hasMissingProcessStep ? 'Process unit step (e.g. Drying, Crystallization) not specified.' : `Step: ${investigation?.process_step}`}
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: 5 Whys Preview */}
        {activeTab === 'fiveWhys' && (
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-bold text-slate-800">5 Whys Root Cause Protocol</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                In Phase 2, the LangGraph reasoning engine will construct an iterative 5 Whys chain grounded in documented incident evidence.
              </p>
            </div>

            <div className="space-y-2 border border-dashed border-slate-200 rounded-lg p-3 bg-white">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Workflow Step Contract
              </div>
              {[1, 2, 3, 4, 5].map((level) => (
                <div key={level} className="flex items-center gap-2 p-2 rounded bg-slate-50/70 text-xs text-slate-500">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                    {level}
                  </span>
                  <span>Why #{level}: Awaiting Phase 2 AI Model Analysis...</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Fishbone Preview */}
        {activeTab === 'fishbone' && (
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Network className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-bold text-slate-800">Ishikawa 6M Cause Analysis</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluates contributing factors across the standard pharmaceutical 6M categories: Machine, Method, Material, Measurement, Milieu (Environment), and Manpower.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {['Machine (Dryer/Equip)', 'Method (SOP & Cycles)', 'Material (Solvents/API)', 'Measurement (HPLC/QC)', 'Milieu (Env/Humidity)', 'Manpower (Training/Shift)'].map((cat) => (
                <div key={cat} className="p-2.5 rounded border border-slate-200 bg-slate-50/50">
                  <p className="font-semibold text-slate-700 text-[11px]">{cat}</p>
                  <p className="text-[10px] text-slate-400 mt-1 italic">Structured for Phase 2</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CAPA Preview */}
        {activeTab === 'capa' && (
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-bold text-slate-800">Intelligent CAPA Recommendation Engine</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Will propose distinct <strong>Corrective Actions</strong> (addressing immediate containment and past units) and <strong>Preventive Actions</strong> (eliminating systemic recurrence).
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2 text-xs">
              <div className="p-2 bg-teal-50 border border-teal-200 rounded text-teal-900">
                <strong className="block text-[11px]">Corrective Action (Immediate)</strong>
                <span className="text-[10px] text-teal-700">Requires root-cause alignment before confirmation.</span>
              </div>
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-900">
                <strong className="block text-[11px]">Preventive Action (Systemic)</strong>
                <span className="text-[10px] text-blue-700">Calibrations, SOP revisions, or engineering controls.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Guidance */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
        <p className="leading-tight">
          PharmaLens supports qualified investigators. AI proposals are never pre-confirmed without human quality review.
        </p>
      </div>
    </div>
  );
};
