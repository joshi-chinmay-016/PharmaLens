import React from 'react';
import {
  Save,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Upload,
  Layers,
  FileCheck2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { InvestigationStatus, SourceDocument } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

export interface InvestigationFormData {
  title: string;
  incident_reference: string;
  status: InvestigationStatus;
  incident_description: string;
  incident_datetime: string;
  discovery_datetime: string;
  product_name: string;
  batch_number: string;
  manufacturing_site: string;
  process_step: string;
  incident_category: string;
  expected_result: string;
  actual_result: string;
  acceptance_criterion: string;
  immediate_impact: string;
  immediate_containment: string;
  reporter_name: string;
  known_facts: string;
  initial_observations: string;
  evidence_available: string;
  investigation_notes: string;
  has_unresolved_gaps: boolean;
}

export interface InvestigationFormProps {
  formData: InvestigationFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSave: (e?: React.FormEvent) => Promise<void>;
  isSaving: boolean;
  saveSuccessMessage: string | null;
  saveError: string | null;
  validationError?: string | null;
  onOpenSourceIntake: () => void;
  attachedSources: SourceDocument[];
  pendingSourceDoc: SourceDocument | null;
  isCompleted?: boolean;
  isDirty: boolean;
  onLoadScenario?: () => void;
  investigationId?: string;
  isEditMode: boolean;
  onPreviewSourceDoc?: (doc: SourceDocument) => void;
}

export const InvestigationForm: React.FC<InvestigationFormProps> = ({
  formData,
  onChange,
  onSave,
  isSaving,
  saveSuccessMessage,
  saveError,
  validationError,
  onOpenSourceIntake,
  attachedSources,
  pendingSourceDoc,
  isCompleted = false,
  isDirty,
  onLoadScenario,
  investigationId,
  isEditMode,
  onPreviewSourceDoc,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(e);
  };

  const allSources = attachedSources.length > 0
    ? attachedSources
    : pendingSourceDoc
    ? [pendingSourceDoc]
    : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sticky Top Status & Action Bar */}
      <div className="bg-white border-2 border-ink shadow-brutal p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-paper border border-ink shadow-brutal-xs text-ink">
            {investigationId || 'NEW INVESTIGATION (DRAFT)'}
          </span>
          <StatusBadge status={formData.status} />
          {isDirty && (
            <span className="font-mono text-[10px] text-amber-900 bg-amber-100 px-2 py-0.5 border border-ink font-bold uppercase shadow-brutal-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
              Unsaved Changes
            </span>
          )}
          {isCompleted && (
            <span className="font-mono text-[10px] text-emerald-900 bg-emerald-100 px-2 py-0.5 border border-ink font-bold uppercase shadow-brutal-xs flex items-center gap-1">
              <FileCheck2 className="w-3 h-3 text-emerald-700" />
              Record Sealed
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
          {onLoadScenario && !isCompleted && !isEditMode && (
            <button
              type="button"
              onClick={onLoadScenario}
              className="inline-flex items-center justify-center gap-1.5 font-display font-bold text-xs uppercase tracking-wider
                         bg-indigo-50 text-indigo-800 border-2 border-indigo-400 px-3 py-1.5
                         shadow-[2px_2px_0px_#4F46E5] transition-all duration-150
                         hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-indigo-100 hover:shadow-[4px_4px_0px_#4F46E5]
                         active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              title="Loads the fictional DEV-2026-014 scenario for rapid verification"
            >
              ⚡ Prefill DEV-2026-014
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSourceIntake}
            className="inline-flex items-center justify-center gap-1.5 font-display font-bold text-xs uppercase tracking-wider
                       bg-amber-400 text-amber-950 border-2 border-ink px-3 py-1.5
                       shadow-brutal-sm transition-all duration-150
                       hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-brutal
                       active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Source Intake</span>
            {allSources.length > 0 && (
              <span className="text-[10px] bg-ink text-white px-1.5 py-0.5 font-mono font-bold">
                {allSources.length}
              </span>
            )}
          </button>

          <button
            type="submit"
            disabled={isSaving || isCompleted}
            className="btn-brutal-primary text-xs px-4 py-2 shadow-brutal inline-flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>
              {isSaving
                ? 'Saving Record...'
                : isCompleted
                ? 'Record Sealed (Completed)'
                : isEditMode
                ? 'Save Changes'
                : 'Create Investigation'}
            </span>
          </button>
        </div>
      </div>

      {/* Sealed Alert for Completed Investigations */}
      {isCompleted && (
        <div className="p-3.5 bg-emerald-50 border-2 border-ink shadow-brutal-xs flex items-center gap-2.5 text-xs font-mono text-emerald-950">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>
            <strong>GxP Record Integrity Sealed:</strong> This investigation is formally completed. Direct field edits are disabled. To amend details, use the <em>Reopen Investigation</em> workflow in Review &amp; Closure.
          </span>
        </div>
      )}

      {/* Validation or Save Errors */}
      {validationError && (
        <div className="p-3 bg-rose-50 border-2 border-ink text-rose-900 text-xs shadow-brutal-xs flex items-center gap-2 font-mono font-bold">
          <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
      {saveError && (
        <div className="p-3 bg-rose-50 border-2 border-ink text-rose-900 text-xs shadow-brutal-xs flex items-center gap-2 font-mono font-bold">
          <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}
      {saveSuccessMessage && (
        <div className="p-3 bg-emerald-100 border-2 border-ink text-emerald-950 text-xs shadow-brutal-xs flex items-center gap-2 font-mono font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Section A: Investigation Identification & Categorization */}
      <div className="card-brutal p-6 bg-white border-2 border-ink shadow-brutal space-y-5">
        <div className="flex items-center justify-between border-b-2 border-ink pb-3">
          <h3 className="font-display font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal" />
            <span>Section A: Investigation Identification</span>
          </h3>
          <span className="font-mono text-[11px] text-muted font-bold">
            Required Fields Marked <span className="text-rose-600 font-bold">*</span>
          </span>
        </div>

        {/* Title Input */}
        <div>
          <label htmlFor="inv-title" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
            Investigation Title <span className="text-rose-600">*</span>
          </label>
          <input
            id="inv-title"
            type="text"
            name="title"
            required
            disabled={isCompleted}
            minLength={3}
            value={formData.title}
            onChange={onChange}
            placeholder="e.g., Residual Solvent Result Outside Acceptance Criteria"
            className="w-full text-sm font-sans px-3.5 py-2.5 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed font-semibold text-ink placeholder:text-muted/60"
          />
        </div>

        {/* 4-Column Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="inv-ref" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Deviation Reference
            </label>
            <input
              id="inv-ref"
              type="text"
              name="incident_reference"
              disabled={isCompleted}
              value={formData.incident_reference}
              onChange={onChange}
              placeholder="e.g., DEV-2026-014"
              className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed font-medium"
            />
          </div>

          <div>
            <label htmlFor="inv-category" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Incident Category
            </label>
            <select
              id="inv-category"
              name="incident_category"
              disabled={isCompleted}
              value={formData.incident_category}
              onChange={onChange}
              className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed cursor-pointer font-medium"
            >
              <option value="OOS Result">OOS / Analytical Result</option>
              <option value="Equipment Failure">Equipment Failure / Sensor</option>
              <option value="Process Deviation">Process Parameter Deviation</option>
              <option value="Environmental">Environmental / HVAC Alert</option>
              <option value="Documentation">Documentation / BPR Recording</option>
              <option value="Packaging & Labeling">Packaging &amp; Labeling</option>
            </select>
          </div>

          <div>
            <label htmlFor="inv-status" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Workflow Status
            </label>
            <select
              id="inv-status"
              name="status"
              disabled={isCompleted}
              value={formData.status}
              onChange={onChange}
              className="w-full text-xs font-mono font-bold uppercase px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed cursor-pointer"
            >
              <option value="Draft">Draft</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="AI Analysis Available">AI Analysis Available</option>
              <option value="In Review">In Review</option>
              <option value="Completed">Completed</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <label htmlFor="inv-reporter" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Lead Investigator
            </label>
            <input
              id="inv-reporter"
              type="text"
              name="reporter_name"
              disabled={isCompleted}
              value={formData.reporter_name}
              onChange={onChange}
              placeholder="e.g., QC Lead / J. Doe (QA)"
              className="w-full text-xs font-sans px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed font-medium"
            />
          </div>
        </div>
      </div>

      {/* Section B: Incident Narrative & Physical Parameters */}
      <div className="card-brutal p-6 bg-white border-2 border-ink shadow-brutal space-y-5">
        <div className="flex items-center justify-between border-b-2 border-ink pb-3">
          <h3 className="font-display font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-teal" />
            <span>Section B: Incident Details &amp; Physical Parameters</span>
          </h3>
          <span className="font-mono text-[11px] text-muted">
            Batch &amp; Physical Processing Context
          </span>
        </div>

        {/* 4-Column Physical Batch Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="inv-product" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Product / API Name
            </label>
            <input
              id="inv-product"
              type="text"
              name="product_name"
              disabled={isCompleted}
              value={formData.product_name}
              onChange={onChange}
              placeholder="e.g., Example API"
              className="w-full text-xs font-sans px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed font-medium"
            />
          </div>

          <div>
            <label htmlFor="inv-batch" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Batch / Lot Number
            </label>
            <input
              id="inv-batch"
              type="text"
              name="batch_number"
              disabled={isCompleted}
              value={formData.batch_number}
              onChange={onChange}
              placeholder="e.g., API-2026-014"
              className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed font-bold"
            />
          </div>

          <div>
            <label htmlFor="inv-site" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Manufacturing Site / Suite
            </label>
            <input
              id="inv-site"
              type="text"
              name="manufacturing_site"
              disabled={isCompleted}
              value={formData.manufacturing_site}
              onChange={onChange}
              placeholder="e.g., Area C, Suite 04"
              className="w-full text-xs font-sans px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed font-medium"
            />
          </div>

          <div>
            <label htmlFor="inv-process-step" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Process Step Involved
            </label>
            <input
              id="inv-process-step"
              type="text"
              name="process_step"
              disabled={isCompleted}
              value={formData.process_step}
              onChange={onChange}
              placeholder="e.g., Drying, Synthesis"
              className="w-full text-xs font-sans px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed font-medium"
            />
          </div>
        </div>

        {/* 2-Column Datetime */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="inv-incident-time" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Incident Occurrence Date &amp; Time
            </label>
            <input
              id="inv-incident-time"
              type="datetime-local"
              name="incident_datetime"
              disabled={isCompleted}
              value={formData.incident_datetime}
              onChange={onChange}
              className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="inv-discovery-time" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Discovery / Observation Date &amp; Time
            </label>
            <input
              id="inv-discovery-time"
              type="datetime-local"
              name="discovery_datetime"
              disabled={isCompleted}
              value={formData.discovery_datetime}
              onChange={onChange}
              className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Full-width Narrative */}
        <div>
          <label htmlFor="inv-desc" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
            Incident / Deviation Narrative
          </label>
          <textarea
            id="inv-desc"
            rows={4}
            name="incident_description"
            disabled={isCompleted}
            value={formData.incident_description}
            onChange={onChange}
            placeholder="Document detailed, objective factual statement of what transpired, where, when, and how the discrepancy was identified..."
            className="w-full text-xs font-sans p-3 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed leading-relaxed text-ink"
          />
        </div>

        {/* 3-Column Comparative Analytical Specifications */}
        <div className="p-4 bg-paper border-2 border-ink shadow-brutal-xs space-y-3">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink block">
            Analytical Result &amp; Acceptance Specifications
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="inv-actual" className="block text-[11px] font-mono font-bold uppercase tracking-wider text-rose-800 mb-1">
                Actual Observed Result
              </label>
              <input
                id="inv-actual"
                type="text"
                name="actual_result"
                disabled={isCompleted}
                value={formData.actual_result}
                onChange={onChange}
                placeholder="e.g., Residual solvent reported as 0.65%"
                className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed text-rose-700 font-bold"
              />
            </div>

            <div>
              <label htmlFor="inv-spec" className="block text-[11px] font-mono font-bold uppercase tracking-wider text-teal mb-1">
                Acceptance Specification
              </label>
              <input
                id="inv-spec"
                type="text"
                name="acceptance_criterion"
                disabled={isCompleted}
                value={formData.acceptance_criterion}
                onChange={onChange}
                placeholder="e.g., NMT 0.50% (Specification limit)"
                className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed text-teal font-bold"
              />
            </div>

            <div>
              <label htmlFor="inv-expected" className="block text-[11px] font-mono font-bold uppercase tracking-wider text-ink mb-1">
                Expected Standard Condition
              </label>
              <input
                id="inv-expected"
                type="text"
                name="expected_result"
                disabled={isCompleted}
                value={formData.expected_result}
                onChange={onChange}
                placeholder="e.g., <= 0.50% after standard drying profile"
                className="w-full text-xs font-sans px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* 2-Column Impact & Containment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="inv-impact" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Immediate Impact &amp; Product Safety Assessment
            </label>
            <textarea
              id="inv-impact"
              rows={2}
              name="immediate_impact"
              disabled={isCompleted}
              value={formData.immediate_impact}
              onChange={onChange}
              placeholder="Batch release status, lot disposition, potential cross-batch impact..."
              className="w-full text-xs font-sans p-2.5 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed text-ink"
            />
          </div>

          <div>
            <label htmlFor="inv-containment" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Immediate Containment Action
            </label>
            <textarea
              id="inv-containment"
              rows={2}
              name="immediate_containment"
              disabled={isCompleted}
              value={formData.immediate_containment}
              onChange={onChange}
              placeholder="Physical quarantine tag applied, ERP lot status locked..."
              className="w-full text-xs font-sans p-2.5 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed text-ink"
            />
          </div>
        </div>
      </div>

      {/* Section C: Attached Source Documents (Intake Hub) */}
      <div className="card-brutal p-6 bg-white border-2 border-ink shadow-brutal space-y-4">
        <div className="flex items-center justify-between border-b-2 border-ink pb-3 flex-wrap gap-2">
          <h3 className="font-display font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal" />
            <span>Attached Source Documents ({allSources.length})</span>
          </h3>
          <button
            type="button"
            onClick={onOpenSourceIntake}
            className="btn-brutal-secondary text-xs px-3 py-1.5 shadow-brutal-xs inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-teal" />
            <span>Upload PDF / Text Intake</span>
          </button>
        </div>

        {allSources.length === 0 ? (
          <div className="p-6 bg-paper border-2 border-dashed border-ink/40 text-center space-y-2">
            <Layers className="w-8 h-8 text-muted mx-auto" />
            <p className="font-mono text-xs text-muted">
              No source documents attached yet. Documents provide verifiable provenance for root causes.
            </p>
            <button
              type="button"
              onClick={onOpenSourceIntake}
              className="font-mono text-xs font-bold text-teal hover:underline uppercase inline-flex items-center gap-1"
            >
              Upload PDF or paste incident notes &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allSources.map((doc) => (
              <div
                key={doc.id || doc.source_id}
                className="p-3.5 bg-paper border-2 border-ink shadow-brutal-xs flex flex-col justify-between space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-display font-bold text-xs text-ink truncate block">
                      {doc.original_filename || doc.source_id}
                    </span>
                    <span className="font-mono text-[10px] text-muted uppercase">
                      Type: {doc.source_type} &bull; Status: <strong className="text-teal font-bold">{doc.extraction_status}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-white border border-ink font-mono font-bold uppercase shrink-0">
                    {doc.source_type}
                  </span>
                </div>

                {onPreviewSourceDoc && doc.extracted_text && (
                  <button
                    type="button"
                    onClick={() => onPreviewSourceDoc(doc)}
                    className="btn-brutal-secondary text-[11px] py-1 px-2.5 self-start inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3 text-teal" />
                    <span>View Text Excerpt</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section D: Investigative Context & Evidence Ledger */}
      <div className="card-brutal p-6 bg-white border-2 border-ink shadow-brutal space-y-5">
        <div className="flex items-center justify-between border-b-2 border-ink pb-3">
          <h3 className="font-display font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal" />
            <span>Section D: Investigative Context &amp; Evidence Ledger</span>
          </h3>
          <span className="font-mono text-[11px] text-muted">
            Observations, Records &amp; Gaps Flag
          </span>
        </div>

        {/* 2-Column Known Facts vs Observations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="inv-known-facts" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Known Facts (Source-Supported)
            </label>
            <textarea
              id="inv-known-facts"
              rows={3}
              name="known_facts"
              disabled={isCompleted}
              value={formData.known_facts}
              onChange={onChange}
              placeholder="Facts verified by analytical certificates, equipment logs, or SCADA trends..."
              className="w-full text-xs font-mono p-2.5 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed text-[11px] leading-relaxed"
            />
          </div>

          <div>
            <label htmlFor="inv-observations" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Initial Observations &amp; Walkthrough Notes
            </label>
            <textarea
              id="inv-observations"
              rows={3}
              name="initial_observations"
              disabled={isCompleted}
              value={formData.initial_observations}
              onChange={onChange}
              placeholder="Investigator observations from equipment inspection or operator interviews..."
              className="w-full text-xs font-mono p-2.5 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed text-[11px] leading-relaxed"
            />
          </div>
        </div>

        {/* 2-Column Evidence Available vs Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="inv-evidence" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Evidence Already Collected &amp; Available
            </label>
            <textarea
              id="inv-evidence"
              rows={3}
              name="evidence_available"
              disabled={isCompleted}
              value={formData.evidence_available}
              onChange={onChange}
              placeholder="QC Test Certificate #, Batch Production Record BPR-..., sensor calibration logs..."
              className="w-full text-xs font-mono p-2.5 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed text-[11px] leading-relaxed"
            />
          </div>

          <div>
            <label htmlFor="inv-notes" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Additional Investigation Notes &amp; Follow-up Areas
            </label>
            <textarea
              id="inv-notes"
              rows={3}
              name="investigation_notes"
              disabled={isCompleted}
              value={formData.investigation_notes}
              onChange={onChange}
              placeholder="Potential areas to investigate: drying cycle duration, heated shelves temperature profile..."
              className="w-full text-xs font-mono p-2.5 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed text-[11px] leading-relaxed"
            />
          </div>
        </div>

        {/* Evidence Gap Checkbox */}
        <div className="p-3.5 bg-paper border-2 border-ink shadow-brutal-xs flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="has_unresolved_gaps"
              name="has_unresolved_gaps"
              disabled={isCompleted}
              checked={formData.has_unresolved_gaps}
              onChange={onChange}
              className="border-2 border-ink text-teal-deep focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="has_unresolved_gaps" className="text-xs font-mono font-bold text-ink cursor-pointer uppercase">
              Flag as having unresolved evidence gaps or missing calibration/batch data
            </label>
          </div>
          <span className="text-[10px] font-mono text-muted uppercase font-bold bg-white px-2 py-0.5 border border-ink">
            Evidence Before Conclusions Principle
          </span>
        </div>
      </div>

      {/* Form Bottom Save Bar */}
      <div className="flex items-center justify-between p-4 bg-white border-2 border-ink shadow-brutal">
        <div className="text-xs font-mono text-muted">
          {isDirty ? (
            <span className="text-amber-800 font-bold">&bull; Form contains unsaved modifications</span>
          ) : (
            <span>All changes saved to database</span>
          )}
        </div>
        <button
          type="submit"
          disabled={isSaving || isCompleted}
          className="btn-brutal-primary text-xs px-5 py-2.5 shadow-brutal inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Record...' : isCompleted ? 'Record Sealed' : isEditMode ? 'Save Changes' : 'Create Record'}</span>
        </button>
      </div>
    </form>
  );
};
