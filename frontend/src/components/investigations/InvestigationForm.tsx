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
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-teal-700 px-2 py-0.5 rounded bg-teal-50 border border-teal-200">
                {initialData?.investigation_id || 'NEW INVESTIGATION (DRAFT)'}
              </span>
              <StatusBadge status={formData.status} />
              {isDirty && (
                <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
                  • Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {initialData ? `Last updated: ${new Date(initialData.updated_at).toLocaleString()}` : 'Complete incident details below. Missing fields will be retained as unverified.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={loadFictionalScenario}
              className="text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-md font-medium transition-colors"
              title="Loads the fictional DEV-2026-014 scenario for rapid verification"
            >
              Fill Example DEV-2026-014
            </button>
            <button
              type="button"
              onClick={onOpenSourceIntake}
              className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-md font-medium transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-teal-600" />
              Source Intake
            </button>
            <button
              type="submit"
              disabled={isSaving || isCompleted}
              className="inline-flex items-center gap-1.5 text-xs text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 px-4 py-1.5 rounded-md font-semibold shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : isCompleted ? 'Record Sealed (Completed)' : initialData ? 'Update Record' : 'Save Investigation'}
            </button>
          </div>
        </div>

        {/* Completed status banner */}
        {isCompleted && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Investigation Completed & Sealed:</strong> Direct form edits are locked per GxP record integrity. To modify, use the <em>Reopen Investigation</em> action above.
              </span>
            </div>
          </div>
        )}

        {/* Feedback banners */}
        {validationError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
        {saveError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
        {saveSuccessMessage && (
          <div className="mt-4 p-3 bg-teal-50 border border-teal-200 text-teal-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* Section A: Investigation Identification */}
        <div className="mt-5 space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-teal-600" />
            Section A: Investigation Identification
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Investigation Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                minLength={3}
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Residual Solvent Result Outside Acceptance Criteria"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deviation / Incident Reference
              </label>
              <input
                type="text"
                name="incident_reference"
                value={formData.incident_reference}
                onChange={handleChange}
                placeholder="e.g., DEV-2026-014"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Workflow Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 bg-white"
              >
                <option value="Draft">Draft</option>
                <option value="In Review">In Review</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Incident Category</label>
              <select
                name="incident_category"
                value={formData.incident_category}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 bg-white"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reporter / Lead Investigator</label>
              <input
                type="text"
                name="reporter_name"
                value={formData.reporter_name}
                onChange={handleChange}
                placeholder="e.g., QC Team / J. Doe (QA)"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section B: Incident Details */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <AlertCircle className="w-4 h-4 text-teal-600" />
          Section B: Incident Details & Physical Parameters
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product / API Name</label>
            <input
              type="text"
              name="product_name"
              value={formData.product_name}
              onChange={handleChange}
              placeholder="e.g., Example API"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Batch / Lot Number</label>
            <input
              type="text"
              name="batch_number"
              value={formData.batch_number}
              onChange={handleChange}
              placeholder="e.g., API-2026-014"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturing Site / Area</label>
            <input
              type="text"
              name="manufacturing_site"
              value={formData.manufacturing_site}
              onChange={handleChange}
              placeholder="e.g., Building 04, Suite 2"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Process Step Involved</label>
            <input
              type="text"
              name="process_step"
              value={formData.process_step}
              onChange={handleChange}
              placeholder="e.g., Drying, Synthesis, Filtration"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Incident Date & Time</label>
            <input
              type="datetime-local"
              name="incident_datetime"
              value={formData.incident_datetime}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Discovery Date & Time</label>
            <input
              type="datetime-local"
              name="discovery_datetime"
              value={formData.discovery_datetime}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Incident / Deviation Description
          </label>
          <textarea
            rows={3}
            name="incident_description"
            value={formData.incident_description}
            onChange={handleChange}
            placeholder="Detailed factual description of what occurred, where, and how it was observed..."
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 leading-relaxed font-sans"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Actual Observed Result
            </label>
            <input
              type="text"
              name="actual_result"
              value={formData.actual_result}
              onChange={handleChange}
              placeholder="e.g., Residual solvent reported as 0.65%"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-mono text-rose-700 font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Applicable Acceptance Criterion / Spec
            </label>
            <input
              type="text"
              name="acceptance_criterion"
              value={formData.acceptance_criterion}
              onChange={handleChange}
              placeholder="e.g., NMT 0.50% (Illustrative limit)"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-mono text-teal-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expected Result / Standard Condition
            </label>
            <input
              type="text"
              name="expected_result"
              value={formData.expected_result}
              onChange={handleChange}
              placeholder="e.g., <= 0.50% after standard drying profile"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Immediate Impact & Product Safety Assessment
            </label>
            <textarea
              rows={2}
              name="immediate_impact"
              value={formData.immediate_impact}
              onChange={handleChange}
              placeholder="Document observed or potential impact on product quality, safety, and release..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Immediate Containment Action
            </label>
            <textarea
              rows={2}
              name="immediate_containment"
              value={formData.immediate_containment}
              onChange={handleChange}
              placeholder="Quarantine status, physical segregation, lot hold applied..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Section C: Investigation Context */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Clock className="w-4 h-4 text-teal-600" />
          Section C: Investigative Context & Evidence Ledger
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Known Facts (Source-Supported)
            </label>
            <textarea
              rows={3}
              name="known_facts"
              value={formData.known_facts}
              onChange={handleChange}
              placeholder="Facts directly supported by analytical records, equipment charts, or logs..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-mono text-[11px]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Observations & Walkthrough Notes
            </label>
            <textarea
              rows={3}
              name="initial_observations"
              value={formData.initial_observations}
              onChange={handleChange}
              placeholder="Investigator observations from equipment inspection or operator interviews..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-mono text-[11px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Evidence Already Collected & Available
            </label>
            <textarea
              rows={3}
              name="evidence_available"
              value={formData.evidence_available}
              onChange={handleChange}
              placeholder="List certificate of analysis, SCADA trends, logbooks, calibration certificates..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-mono text-[11px]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Additional Investigation Notes & Follow-up Areas
            </label>
            <textarea
              rows={3}
              name="investigation_notes"
              value={formData.investigation_notes}
              onChange={handleChange}
              placeholder="Potential investigation areas, equipment checks, or questions for QA..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-mono text-[11px]"
            />
          </div>
        </div>

        {/* Evidence Gap Checkbox */}
        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="has_unresolved_gaps"
              name="has_unresolved_gaps"
              checked={formData.has_unresolved_gaps}
              onChange={handleChange}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
            />
            <label htmlFor="has_unresolved_gaps" className="text-xs font-medium text-slate-800">
              Flag as having unresolved evidence gaps or missing calibration/batch data
            </label>
          </div>
          <span className="text-[11px] text-amber-700 font-medium">
            Evidence before conclusions principle
          </span>
        </div>
      </div>
    </form>
  );
};
