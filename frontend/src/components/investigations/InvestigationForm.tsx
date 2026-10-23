import React, { useState, useEffect } from 'react';
import {
  Save,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { Investigation, InvestigationStatus, SourceDocument } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface InvestigationFormProps {
  initialData: Investigation | null;
  onSave: (formData: any) => Promise<void>;
  isSaving: boolean;
  saveSuccessMessage: string | null;
  saveError: string | null;
  onOpenSourceIntake: () => void;
  pendingSourceDoc: SourceDocument | null;
  isCompleted?: boolean;
}

export const InvestigationForm: React.FC<InvestigationFormProps> = ({
  initialData,
  onSave,
  isSaving,
  saveSuccessMessage,
  saveError,
  onOpenSourceIntake,
  pendingSourceDoc,
  isCompleted: propIsCompleted,
}) => {
  const isCompleted = propIsCompleted || initialData?.status === 'Completed';
  const [formData, setFormData] = useState({
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
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        incident_reference: initialData.incident_reference || '',
        status: initialData.status || 'Draft',
        incident_description: initialData.incident_description || '',
        incident_datetime: initialData.incident_datetime ? initialData.incident_datetime.substring(0, 16) : '',
        discovery_datetime: initialData.discovery_datetime ? initialData.discovery_datetime.substring(0, 16) : '',
        product_name: initialData.product_name || '',
        batch_number: initialData.batch_number || '',
        manufacturing_site: initialData.manufacturing_site || '',
        process_step: initialData.process_step || '',
        incident_category: initialData.incident_category || 'OOS Result',
        expected_result: initialData.expected_result || '',
        actual_result: initialData.actual_result || '',
        acceptance_criterion: initialData.acceptance_criterion || '',
        immediate_impact: initialData.immediate_impact || '',
        immediate_containment: initialData.immediate_containment || '',
        reporter_name: initialData.reporter_name || '',
        known_facts: initialData.known_facts || '',
        initial_observations: initialData.initial_observations || '',
        evidence_available: initialData.evidence_available || '',
        investigation_notes: initialData.investigation_notes || '',
        has_unresolved_gaps: initialData.has_unresolved_gaps ?? false,
      });
      setIsDirty(false);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setIsDirty(true);
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setValidationError('Investigation title is required and must be at least 3 characters.');
      return;
    }

    const payload: any = {
      ...formData,
      incident_datetime: formData.incident_datetime ? new Date(formData.incident_datetime).toISOString() : null,
      discovery_datetime: formData.discovery_datetime ? new Date(formData.discovery_datetime).toISOString() : null,
    };

    if (pendingSourceDoc && !initialData) {
      payload.source_document_ids = [pendingSourceDoc.id];
    }

    await onSave(payload);
    setIsDirty(false);
  };

  // Helper to load fictional scenario for testing
  const loadFictionalScenario = () => {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Banner & Status Controls */}
      <div className="card-brutal p-6 bg-white border-2 border-ink shadow-brutal space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-ink">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-ink px-2 py-0.5 bg-paper border border-ink shadow-brutal-xs">
                {initialData?.investigation_id || 'NEW INVESTIGATION (DRAFT)'}
              </span>
              <StatusBadge status={formData.status} />
              {isDirty && (
                <span className="font-mono text-[10px] text-amber-900 bg-amber-100 px-2 py-0.5 border border-ink font-bold uppercase shadow-brutal-xs">
                  &bull; Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-muted">
              {initialData ? `Last updated: ${new Date(initialData.updated_at).toLocaleString()}` : 'Complete incident details below. Missing fields will be retained as unverified.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={loadFictionalScenario}
              className="btn-brutal-secondary text-xs px-3 py-1.5 shadow-brutal-xs text-teal-deep"
              title="Loads the fictional DEV-2026-014 scenario for rapid verification"
            >
              Fill Example DEV-2026-014
            </button>
            <button
              type="button"
              onClick={onOpenSourceIntake}
              className="btn-brutal-secondary text-xs px-3 py-1.5 shadow-brutal-xs inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-teal-deep" />
              <span>Source Intake</span>
            </button>
            <button
              type="submit"
              disabled={isSaving || isCompleted}
              className="btn-brutal-primary text-xs px-4 py-2 shadow-brutal inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : isCompleted ? 'Record Sealed (Completed)' : initialData ? 'Update Record' : 'Save Investigation'}</span>
            </button>
          </div>
        </div>

        {/* Completed status banner */}
        {isCompleted && (
          <div className="p-3 bg-emerald-100 border-2 border-ink text-ink text-xs shadow-brutal-xs flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-800 flex-shrink-0" />
              <span>
                <strong>Investigation Completed &amp; Sealed:</strong> Direct form edits are locked per GxP record integrity. To modify, use the <em>Reopen Investigation</em> action above.
              </span>
            </div>
          </div>
        )}

        {/* Feedback banners */}
        {validationError && (
          <div className="p-3 bg-rose-100 border-2 border-ink text-rose-900 text-xs shadow-brutal-xs flex items-center gap-2 font-mono font-bold">
            <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
        {saveError && (
          <div className="p-3 bg-rose-100 border-2 border-ink text-rose-900 text-xs shadow-brutal-xs flex items-center gap-2 font-mono font-bold">
            <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
        {saveSuccessMessage && (
          <div className="p-3 bg-emerald-100 border-2 border-ink text-emerald-900 text-xs shadow-brutal-xs flex items-center gap-2 font-mono font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* Section A: Investigation Identification */}
        <div className="mt-6 space-y-4 pt-2">
          <h4 className="font-display font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-2 border-b-2 border-ink pb-2">
            <FileText className="w-4 h-4 text-teal-deep" />
            Section A: Investigation Identification
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">
                Investigation Title <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                disabled={isCompleted}
                minLength={3}
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Residual Solvent Result Outside Acceptance Criteria"
                className="w-full text-xs font-sans px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">
                Deviation / Incident Reference
              </label>
              <input
                type="text"
                name="incident_reference"
                disabled={isCompleted}
                value={formData.incident_reference}
                onChange={handleChange}
                placeholder="e.g., DEV-2026-014"
                className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">Workflow Status</label>
              <select
                name="status"
                disabled={isCompleted}
                value={formData.status}
                onChange={handleChange}
                className="w-full text-xs font-mono font-bold uppercase px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="Draft">Draft</option>
                <option value="In Review">In Review</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">Incident Category</label>
              <select
                name="incident_category"
                disabled={isCompleted}
                value={formData.incident_category}
                onChange={handleChange}
                className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="OOS Result">OOS / Analytical Result</option>
                <option value="Equipment Failure">Equipment Failure / Sensor Malfunction</option>
                <option value="Process Deviation">Process Parameter Deviation</option>
                <option value="Environmental">Environmental / HVAC Alert</option>
                <option value="Documentation">Documentation / BPR Recording</option>
                <option value="Packaging & Labeling">Packaging & Labeling</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">Reporter / Lead Investigator</label>
              <input
                type="text"
                name="reporter_name"
                disabled={isCompleted}
                value={formData.reporter_name}
                onChange={handleChange}
                placeholder="e.g., QC Team / J. Doe (QA)"
                className="w-full text-xs font-sans px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section B: Incident Details */}
      <div className="card-brutal p-6 bg-white border-2 border-ink shadow-brutal space-y-4">
        <h4 className="font-display font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-2 border-b-2 border-ink pb-2">
          <AlertCircle className="w-4 h-4 text-teal-deep" />
          Section B: Incident Details &amp; Physical Parameters
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">Product / API Name</label>
            <input
              type="text"
              name="product_name"
              disabled={isCompleted}
              value={formData.product_name}
              onChange={handleChange}
              placeholder="e.g., Example API"
              className="w-full text-xs font-sans px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">Batch / Lot Number</label>
            <input
              type="text"
              name="batch_number"
              disabled={isCompleted}
              value={formData.batch_number}
              onChange={handleChange}
              placeholder="e.g., API-2026-014"
              className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">Manufacturing Site / Area</label>
            <input
              type="text"
              name="manufacturing_site"
              disabled={isCompleted}
              value={formData.manufacturing_site}
              onChange={handleChange}
              placeholder="e.g., Building 04, Suite 2"
              className="w-full text-xs font-sans px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">Process Step Involved</label>
            <input
              type="text"
              name="process_step"
              disabled={isCompleted}
              value={formData.process_step}
              onChange={handleChange}
              placeholder="e.g., Drying, Synthesis, Filtration"
              className="w-full text-xs font-sans px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">Incident Date &amp; Time</label>
            <input
              type="datetime-local"
              name="incident_datetime"
              disabled={isCompleted}
              value={formData.incident_datetime}
              onChange={handleChange}
              className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">Discovery Date &amp; Time</label>
            <input
              type="datetime-local"
              name="discovery_datetime"
              disabled={isCompleted}
              value={formData.discovery_datetime}
              onChange={handleChange}
              className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">
            Incident / Deviation Description
          </label>
          <textarea
            rows={3}
            name="incident_description"
            disabled={isCompleted}
            value={formData.incident_description}
            onChange={handleChange}
            placeholder="Detailed factual description of what occurred, where, and how it was observed..."
            className="w-full text-xs font-sans px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">
              Actual Observed Result
            </label>
            <input
              type="text"
              name="actual_result"
              disabled={isCompleted}
              value={formData.actual_result}
              onChange={handleChange}
              placeholder="e.g., Residual solvent reported as 0.65%"
              className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed text-rose-700 font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">
              Applicable Acceptance Criterion / Spec
            </label>
            <input
              type="text"
              name="acceptance_criterion"
              disabled={isCompleted}
              value={formData.acceptance_criterion}
              onChange={handleChange}
              placeholder="e.g., NMT 0.50% (Illustrative limit)"
              className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed text-teal-deep font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">
              Expected Result / Standard Condition
            </label>
            <input
              type="text"
              name="expected_result"
              disabled={isCompleted}
              value={formData.expected_result}
              onChange={handleChange}
              placeholder="e.g., <= 0.50% after standard drying profile"
              className="w-full text-xs font-sans px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">
              Immediate Impact &amp; Product Safety Assessment
            </label>
            <textarea
              rows={2}
              name="immediate_impact"
              disabled={isCompleted}
              value={formData.immediate_impact}
              onChange={handleChange}
              placeholder="Document observed or potential impact on product quality, safety, and release..."
              className="w-full text-xs font-sans px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">
              Immediate Containment Action
            </label>
            <textarea
              rows={2}
              name="immediate_containment"
              disabled={isCompleted}
              value={formData.immediate_containment}
              onChange={handleChange}
              placeholder="Quarantine status, physical segregation, lot hold applied..."
              className="w-full text-xs font-sans px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Section C: Investigation Context */}
      <div className="card-brutal p-6 bg-white border-2 border-ink shadow-brutal space-y-4">
        <h4 className="font-display font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-2 border-b-2 border-ink pb-2">
          <Clock className="w-4 h-4 text-teal-deep" />
          Section C: Investigative Context &amp; Evidence Ledger
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">
              Known Facts (Source-Supported)
            </label>
            <textarea
              rows={3}
              name="known_facts"
              disabled={isCompleted}
              value={formData.known_facts}
              onChange={handleChange}
              placeholder="Facts directly supported by analytical records, equipment charts, or logs..."
              className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed text-[11px]"
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">
              Initial Observations &amp; Walkthrough Notes
            </label>
            <textarea
              rows={3}
              name="initial_observations"
              disabled={isCompleted}
              value={formData.initial_observations}
              onChange={handleChange}
              placeholder="Investigator observations from equipment inspection or operator interviews..."
              className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed text-[11px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">
              Evidence Already Collected &amp; Available
            </label>
            <textarea
              rows={3}
              name="evidence_available"
              disabled={isCompleted}
              value={formData.evidence_available}
              onChange={handleChange}
              placeholder="List certificate of analysis, SCADA trends, logbooks, calibration certificates..."
              className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed text-[11px]"
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1">
              Additional Investigation Notes &amp; Follow-up Areas
            </label>
            <textarea
              rows={3}
              name="investigation_notes"
              disabled={isCompleted}
              value={formData.investigation_notes}
              onChange={handleChange}
              placeholder="Potential investigation areas, equipment checks, or questions for QA..."
              className="w-full text-xs font-mono px-3 py-2 border-2 border-ink bg-white shadow-brutal-xs focus:shadow-brutal focus:outline-none disabled:bg-paper disabled:cursor-not-allowed text-[11px]"
            />
          </div>
        </div>

        {/* Evidence Gap Checkbox */}
        <div className="p-3 bg-paper border-2 border-ink shadow-brutal-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="has_unresolved_gaps"
              name="has_unresolved_gaps"
              disabled={isCompleted}
              checked={formData.has_unresolved_gaps}
              onChange={handleChange}
              className="border-2 border-ink text-teal-primary focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="has_unresolved_gaps" className="text-xs font-mono font-bold text-ink cursor-pointer uppercase">
              Flag as having unresolved evidence gaps or missing calibration/batch data
            </label>
          </div>
          <span className="text-[10px] font-mono text-muted uppercase font-bold">
            Evidence before conclusions principle
          </span>
        </div>
      </div>
    </form>
  );
};
