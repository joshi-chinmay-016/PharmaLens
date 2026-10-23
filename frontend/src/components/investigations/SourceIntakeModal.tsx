import React, { useState } from 'react';
import {
  X,
  FileText,
  Upload,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { intakeTextThunk, intakeEmailThunk, uploadPdfThunk, clearActiveSource } from '../../store/sourcesSlice';
import { SourceDocument } from '../../types';

interface SourceIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  investigationId?: number;
  onApplyExtractedText?: (text: string, titleHint?: string, sourceDoc?: SourceDocument) => void;
}

export const SourceIntakeModal: React.FC<SourceIntakeModalProps> = ({
  isOpen,
  onClose,
  investigationId,
  onApplyExtractedText,
}) => {
  const dispatch = useAppDispatch();
  const { activeSource, loading, error, successMessage } = useAppSelector((state) => state.sources);

  const [activeTab, setActiveTab] = useState<'text' | 'pdf' | 'email'>('text');

  // Text Tab State
  const [pastedText, setPastedText] = useState('');
  const [textTitleHint, setTextTitleHint] = useState('');

  // Email Tab State
  const [emailSubject, setEmailSubject] = useState('');
  const [emailSender, setEmailSender] = useState('');
  const [emailDate, setEmailDate] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // PDF Tab State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim() || pastedText.trim().length < 5) return;
    await dispatch(
      intakeTextThunk({
        text: pastedText,
        investigationId,
        titleHint: textTitleHint || undefined,
      })
    );
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailBody.trim() || emailBody.trim().length < 5) return;
    await dispatch(
      intakeEmailThunk({
        subject: emailSubject,
        sender: emailSender || undefined,
        receivedDate: emailDate || undefined,
        body: emailBody,
        investigationId,
      })
    );
  };

  const handlePdfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    await dispatch(
      uploadPdfThunk({
        file: selectedFile,
        investigationId,
      })
    );
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFile(file);
      }
    }
  };

  const handleApplyToForm = () => {
    if (!activeSource) return;
    if (onApplyExtractedText) {
      let titleHint = '';
      if (activeSource.source_type === 'email' && activeSource.metadata_json) {
        try {
          const meta = JSON.parse(activeSource.metadata_json);
          titleHint = meta.subject || '';
        } catch {
          // ignore
        }
      } else if (textTitleHint) {
        titleHint = textTitleHint;
      } else if (activeSource.original_filename) {
        titleHint = activeSource.original_filename.replace('.pdf', '');
      }

      onApplyExtractedText(activeSource.extracted_text || '', titleHint, activeSource);
    }
    handleClose();
  };

  const handleClose = () => {
    dispatch(clearActiveSource());
    setPastedText('');
    setTextTitleHint('');
    setEmailSubject('');
    setEmailSender('');
    setEmailDate('');
    setEmailBody('');
    setSelectedFile(null);
    onClose();
  };

  // Sample incident loader helper for manual testing
  const loadFictionalSolventSample = () => {
    setActiveTab('text');
    setTextTitleHint('DEV-2026-014: Residual Solvent Result Outside Acceptance Criteria');
    setPastedText(
      `INCIDENT INVESTIGATION REPORT\n` +
      `Deviation Reference: DEV-2026-014\n` +
      `Product Name: Example API\n` +
      `Batch Number: API-2026-014\n` +
      `Process Step: Drying\n` +
      `Manufacturing Site: Area C, Building 04, Vacuum Tray Dryer Unit 2\n` +
      `Incident Category: OOS Result / Analytical\n\n` +
      `OBSERVED RESULT:\n` +
      `Residual solvent reported as 0.65%.\n` +
      `Applicable Acceptance Limit: NMT 0.50%.\n\n` +
      `INITIAL OBSERVATION:\n` +
      `The reported residual solvent result exceeds the illustrative acceptance limit of 0.50%.\n\n` +
      `IMMEDIATE CONTAINMENT ACTION:\n` +
      `Batch API-2026-014 placed in physical and electronic quarantine status pending investigation.\n\n` +
      `KNOWN FACTS & INITIAL NOTES:\n` +
      `- Drying cycle completed on 2026-10-22.\n` +
      `- QC Analytical log confirmed test method TM-SOLV-01 executed.\n` +
      `- Preliminary review indicates vacuum pressure profile was lower than standard specification.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Incident Source Document Intake</h3>
            <p className="text-xs text-slate-400">
              Supply source material via pasted text, email details, or PDF report.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'text'
                ? 'bg-white text-slate-900 border-slate-200 -mb-[1px] shadow-sm'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            Pasted Text
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'pdf'
                ? 'bg-white text-slate-900 border-slate-200 -mb-[1px] shadow-sm'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            PDF Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'email'
                ? 'bg-white text-slate-900 border-slate-200 -mb-[1px] shadow-sm'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            Pasted Email
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Result Preview if activeSource exists */}
          {activeSource ? (
            <div className="border border-teal-200 bg-teal-50/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  Source Intake Processed ({activeSource.source_type.replace('_', ' ')})
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  ID: {activeSource.source_id}
                </span>
              </div>

              {activeSource.extraction_warning && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-md flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{activeSource.extraction_warning}</span>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded p-3 max-h-48 overflow-y-auto">
                <p className="text-[11px] font-mono font-medium text-slate-400 mb-1 uppercase tracking-wider">
                  Extracted Content Preview ({activeSource.extracted_text?.length || 0} chars)
                </p>
                <pre className="text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                  {activeSource.extracted_text || 'No extractable text extracted from this document.'}
                </pre>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleApplyToForm}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
                >
                  <span>Apply & Populate Form</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab 1: Pasted Text */}
              {activeTab === 'text' && (
                <form onSubmit={handleTextSubmit} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700">
                      Incident or Deviation Notes <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={loadFictionalSolventSample}
                      className="text-[11px] text-teal-600 hover:text-teal-800 font-medium underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Load Fictional DEV-2026-014 Scenario
                    </button>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={textTitleHint}
                      onChange={(e) => setTextTitleHint(e.target.value)}
                      placeholder="Optional reference / title hint (e.g., DEV-2026-014)"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <textarea
                      rows={8}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Paste incident description, deviation notes, or lab investigation findings here..."
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-mono leading-relaxed"
                      required
                      minLength={5}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400">
                      Minimum 5 characters. Retains source provenance.
                    </span>
                    <button
                      type="submit"
                      disabled={loading || pastedText.trim().length < 5}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
                    >
                      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Process & Extract Text</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: PDF Upload */}
              {activeTab === 'pdf' && (
                <form onSubmit={handlePdfSubmit} className="space-y-4">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleFileDrop}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive ? 'border-teal-500 bg-teal-50/30' : 'border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">
                      Drag and drop your incident PDF here, or browse
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Text-based PDF up to 10MB. Text extracted locally with PyPDF.
                    </p>
                    <input
                      type="file"
                      accept=".pdf"
                      id="pdf-upload-input"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                    />
                    <label
                      htmlFor="pdf-upload-input"
                      className="inline-block mt-3 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded cursor-pointer shadow-sm"
                    >
                      Browse Files
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="flex items-center justify-between p-3 bg-slate-100 rounded-md border border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-rose-600" />
                        <div>
                          <p className="font-semibold text-slate-800">{selectedFile.name}</p>
                          <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400">
                      Scanned PDFs will be detected and flagged.
                    </span>
                    <button
                      type="submit"
                      disabled={loading || !selectedFile}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
                    >
                      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Upload & Extract PDF</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 3: Pasted Email */}
              {activeTab === 'email' && (
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-700">
                        Email Subject <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="e.g., URGENT: Deviation Notification DEV-2026-014"
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">Sender</label>
                      <input
                        type="text"
                        value={emailSender}
                        onChange={(e) => setEmailSender(e.target.value)}
                        placeholder="e.g., QA Lead <qa@pharmamfg.com>"
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Received Date & Time</label>
                    <input
                      type="text"
                      value={emailDate}
                      onChange={(e) => setEmailDate(e.target.value)}
                      placeholder="e.g., 2026-10-23 08:45 AM"
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Email Body <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={6}
                      required
                      minLength={5}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Paste the raw email notification or incident memo content..."
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-mono leading-relaxed"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400">
                      Treated as unverified source material.
                    </span>
                    <button
                      type="submit"
                      disabled={loading || !emailSubject.trim() || emailBody.trim().length < 5}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
                    >
                      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Save Email Source</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
