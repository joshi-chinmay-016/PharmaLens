import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchInvestigationById,
  createInvestigation,
  updateInvestigation,
  clearCurrentInvestigation,
  clearSaveFeedback,
} from '../store/investigationsSlice';
import { InvestigationForm } from '../components/investigations/InvestigationForm';
import { AssistancePanel } from '../components/investigations/AssistancePanel';
import { SourceIntakeModal } from '../components/investigations/SourceIntakeModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
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

  const isEditMode = Boolean(id && id !== 'new');

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
        // Navigate to the newly created investigation record URL
        navigate(`/investigations/${created.id}`, { replace: true });
      }
    }
  };

  const handleApplyExtractedText = (text: string, titleHint?: string, sourceDoc?: SourceDocument) => {
    if (sourceDoc) {
      setPendingSourceDoc(sourceDoc);
    }
    // We can also notify the user
  };

  return (
    <div className="space-y-6">
      {/* Back and Action bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/investigations')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Registry</span>
        </button>

        {isEditMode && (
          <button
            type="button"
            onClick={() => navigate('/investigations/new')}
            className="inline-flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1 rounded-md font-medium transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Another Record</span>
          </button>
        )}
      </div>

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
          {/* Primary Form Area (7 cols on lg, full on sm/md) */}
          <div className="lg:col-span-7 space-y-6">
            <InvestigationForm
              initialData={currentInvestigation}
              onSave={handleSave}
              isSaving={saveLoading}
              saveSuccessMessage={saveSuccessMessage}
              saveError={saveError}
              onOpenSourceIntake={() => setIsIntakeOpen(true)}
              pendingSourceDoc={pendingSourceDoc}
            />
          </div>

          {/* Secondary Assistance & Intelligence Panel (5 cols on lg) */}
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
