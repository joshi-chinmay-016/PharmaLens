import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  AnalysisResponse,
  RunAnalysisPayload,
  AnalysisReviewUpdatePayload,
  AIHealthResponse,
  FiveWhysStep,
  FishboneCause,
  CapaRecommendation,
  PotentialRootCause,
} from '../../types';
import { api } from '../../services/api';

interface AnalysisState {
  currentAnalysis: AnalysisResponse | null;
  history: AnalysisResponse[];
  loading: boolean;
  saveLoading: boolean;
  stageMessage: string | null;
  error: string | null;
  saveError: string | null;
  saveSuccess: string | null;
  aiHealth: AIHealthResponse | null;
}

const initialState: AnalysisState = {
  currentAnalysis: null,
  history: [],
  loading: false,
  saveLoading: false,
  stageMessage: null,
  error: null,
  saveError: null,
  saveSuccess: null,
  aiHealth: null,
};

// 1. Fetch AI Health Status
export const fetchAiHealth = createAsyncThunk(
  'analysis/fetchAiHealth',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getAiHealth();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to check AI health status');
    }
  }
);

// 2. Fetch Latest Saved Analysis for Investigation
export const fetchLatestAnalysis = createAsyncThunk(
  'analysis/fetchLatestAnalysis',
  async (investigationId: number, { rejectWithValue }) => {
    try {
      return await api.getLatestAnalysis(investigationId);
    } catch (err: any) {
      // 404 or missing analysis is normal if analysis has not been executed yet
      const msg = err.message ? err.message.toLowerCase() : '';
      if (msg.includes('404') || msg.includes('no ai analysis') || msg.includes('not found')) {
        return null;
      }
      return rejectWithValue(err.message || 'Failed to retrieve analysis');
    }
  }
);

// 3. Fetch Full Version History
export const fetchAnalysisHistory = createAsyncThunk(
  'analysis/fetchAnalysisHistory',
  async (investigationId: number, { rejectWithValue }) => {
    try {
      return await api.getAnalysisHistory(investigationId);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to retrieve version history');
    }
  }
);

// 4. Execute Full or Multi-Method Analysis (LangGraph Workflow)
export const executeAnalysis = createAsyncThunk(
  'analysis/executeAnalysis',
  async (
    params: { investigationId: number; payload?: RunAnalysisPayload },
    { rejectWithValue }
  ) => {
    try {
      return await api.runAnalysis(params.investigationId, params.payload);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to execute AI analysis workflow');
    }
  }
);

// 5. Targeted 5 Whys Execution
export const executeFiveWhys = createAsyncThunk(
  'analysis/executeFiveWhys',
  async (investigationId: number, { rejectWithValue }) => {
    try {
      return await api.runFiveWhys(investigationId);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to execute 5 Whys');
    }
  }
);

// 6. Targeted Fishbone 6M Execution
export const executeFishbone = createAsyncThunk(
  'analysis/executeFishbone',
  async (investigationId: number, { rejectWithValue }) => {
    try {
      return await api.runFishbone(investigationId);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to execute Fishbone analysis');
    }
  }
);

// 7. Targeted CAPA Execution
export const executeCapa = createAsyncThunk(
  'analysis/executeCapa',
  async (investigationId: number, { rejectWithValue }) => {
    try {
      return await api.runCapa(investigationId);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to execute CAPA recommendation engine');
    }
  }
);

// 8. Save Human Review, Edits, and Confirmed Cause
export const saveAnalysisReview = createAsyncThunk(
  'analysis/saveAnalysisReview',
  async (
    params: {
      investigationId: number;
      analysisId: number;
      payload: AnalysisReviewUpdatePayload;
    },
    { rejectWithValue }
  ) => {
    try {
      return await api.updateAnalysisReview(
        params.investigationId,
        params.analysisId,
        params.payload
      );
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to save analysis review');
    }
  }
);

export const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    clearAnalysisState: (state) => {
      state.currentAnalysis = null;
      state.history = [];
      state.loading = false;
      state.error = null;
      state.saveError = null;
      state.saveSuccess = null;
      state.stageMessage = null;
    },
    clearSaveStatus: (state) => {
      state.saveError = null;
      state.saveSuccess = null;
    },
    setStageMessage: (state, action: PayloadAction<string | null>) => {
      state.stageMessage = action.payload;
    },
    // Interactive Review Modifications
    updateLocalFiveWhysStep: (
      state,
      action: PayloadAction<{
        index: number;
        question?: string;
        answer?: string;
        status?: 'supported' | 'tentative' | 'unresolved';
      }>
    ) => {
      if (!state.currentAnalysis?.structured_output?.five_whys?.steps) return;
      const { index, question, answer, status } = action.payload;
      const step = state.currentAnalysis.structured_output.five_whys.steps[index];
      if (step) {
        if (question !== undefined) step.question = question;
        if (answer !== undefined) step.answer = answer;
        if (status !== undefined) step.status = status;
      }
    },
    addLocalFiveWhysStep: (state) => {
      if (!state.currentAnalysis?.structured_output?.five_whys) return;
      const steps = state.currentAnalysis.structured_output.five_whys.steps;
      const nextLevel = steps.length + 1;
      steps.push({
        level: nextLevel,
        question: `Why #${nextLevel} (Investigator added)?`,
        answer: 'Pending investigation review and verification.',
        status: 'unresolved',
        supporting_evidence: null,
        source_id: null,
        missing_evidence_to_verify: null,
      });
    },
    removeLocalFiveWhysStep: (state, action: PayloadAction<number>) => {
      if (!state.currentAnalysis?.structured_output?.five_whys?.steps) return;
      state.currentAnalysis.structured_output.five_whys.steps.splice(action.payload, 1);
      // Re-index remaining levels
      state.currentAnalysis.structured_output.five_whys.steps.forEach((s, idx) => {
        s.level = idx + 1;
      });
    },
    updateLocalCause: (
      state,
      action: PayloadAction<{
        causeId: string;
        title?: string;
        explanation?: string;
        reviewStatus?: PotentialRootCause['review_status'];
        isConfirmed?: boolean;
      }>
    ) => {
      if (!state.currentAnalysis?.structured_output?.potential_root_causes) return;
      const cause = state.currentAnalysis.structured_output.potential_root_causes.find(
        (c) => c.cause_id === action.payload.causeId
      );
      if (cause) {
        if (action.payload.title !== undefined) cause.title = action.payload.title;
        if (action.payload.explanation !== undefined) cause.explanation = action.payload.explanation;
        if (action.payload.reviewStatus !== undefined) cause.review_status = action.payload.reviewStatus;
        if (action.payload.isConfirmed !== undefined) {
          cause.is_confirmed_by_human = action.payload.isConfirmed;
          if (action.payload.isConfirmed) {
            cause.review_status = 'confirmed';
            state.currentAnalysis.confirmed_root_cause = cause.title;
            state.currentAnalysis.is_confirmed_by_human = true;
          }
        }
      }
    },
    updateLocalFishboneCause: (
      state,
      action: PayloadAction<{
        category: 'machine' | 'method' | 'material' | 'measurement' | 'milieu_environment' | 'manpower_people';
        causeId: string;
        causeText?: string;
        status?: 'supported' | 'tentative' | 'unresolved';
      }>
    ) => {
      const fb = state.currentAnalysis?.structured_output?.fishbone;
      if (!fb) return;
      const list = fb[action.payload.category];
      if (!list) return;
      const item = list.find((c) => c.cause_id === action.payload.causeId);
      if (item) {
        if (action.payload.causeText !== undefined) item.cause = action.payload.causeText;
        if (action.payload.status !== undefined) item.status = action.payload.status;
      }
    },
    updateLocalCapa: (
      state,
      action: PayloadAction<{
        actionId: string;
        description?: string;
        approvalStatus?: 'Proposed' | 'Accepted' | 'Modified' | 'Rejected' | string;
        priority?: string;
      }>
    ) => {
      const capalist = state.currentAnalysis?.structured_output?.capa_recommendations;
      if (!capalist) return;
      const capa = capalist.find((c) => c.action_id === action.payload.actionId);
      if (capa) {
        if (action.payload.description !== undefined) capa.description = action.payload.description;
        if (action.payload.approvalStatus !== undefined) capa.human_approval_status = action.payload.approvalStatus;
        if (action.payload.priority !== undefined) capa.suggested_priority = action.payload.priority;
      }
    },
    updateLocalEvidenceGap: (
      state,
      action: PayloadAction<{
        gapId: string;
        status?: 'open' | 'addressed' | 'resolved' | string;
        description?: string;
      }>
    ) => {
      const gapList = state.currentAnalysis?.structured_output?.evidence_gaps;
      if (!gapList) return;
      const gap = gapList.find((g) => g.gap_id === action.payload.gapId);
      if (gap) {
        if (action.payload.status !== undefined) gap.status = action.payload.status as any;
        if (action.payload.description !== undefined) gap.description = action.payload.description;
      }
    },
  },
  extraReducers: (builder) => {
    // Health
    builder.addCase(fetchAiHealth.fulfilled, (state, action) => {
      state.aiHealth = action.payload;
    });

    // Fetch Latest Analysis
    builder
      .addCase(fetchLatestAnalysis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLatestAnalysis.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAnalysis = action.payload;
      })
      .addCase(fetchLatestAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Version History
    builder.addCase(fetchAnalysisHistory.fulfilled, (state, action) => {
      state.history = action.payload;
    });

    // Execute Analysis
    builder
      .addCase(executeAnalysis.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.stageMessage = 'Analyzing sources and executing LangGraph workflow...';
      })
      .addCase(executeAnalysis.fulfilled, (state, action) => {
        state.loading = false;
        state.stageMessage = null;
        state.currentAnalysis = action.payload;
      })
      .addCase(executeAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.stageMessage = null;
        state.error = action.payload as string;
      });

    // 5 Whys
    builder
      .addCase(executeFiveWhys.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.stageMessage = 'Deducing 5 Whys causal sequence...';
      })
      .addCase(executeFiveWhys.fulfilled, (state, action) => {
        state.loading = false;
        state.stageMessage = null;
        state.currentAnalysis = action.payload;
      })
      .addCase(executeFiveWhys.rejected, (state, action) => {
        state.loading = false;
        state.stageMessage = null;
        state.error = action.payload as string;
      });

    // Fishbone
    builder
      .addCase(executeFishbone.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.stageMessage = 'Categorizing 6M Ishikawa causes...';
      })
      .addCase(executeFishbone.fulfilled, (state, action) => {
        state.loading = false;
        state.stageMessage = null;
        state.currentAnalysis = action.payload;
      })
      .addCase(executeFishbone.rejected, (state, action) => {
        state.loading = false;
        state.stageMessage = null;
        state.error = action.payload as string;
      });

    // CAPA
    builder
      .addCase(executeCapa.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.stageMessage = 'Generating containment and preventive recommendations...';
      })
      .addCase(executeCapa.fulfilled, (state, action) => {
        state.loading = false;
        state.stageMessage = null;
        state.currentAnalysis = action.payload;
      })
      .addCase(executeCapa.rejected, (state, action) => {
        state.loading = false;
        state.stageMessage = null;
        state.error = action.payload as string;
      });

    // Save Review
    builder
      .addCase(saveAnalysisReview.pending, (state) => {
        state.saveLoading = true;
        state.saveError = null;
        state.saveSuccess = null;
      })
      .addCase(saveAnalysisReview.fulfilled, (state, action) => {
        state.saveLoading = false;
        state.currentAnalysis = action.payload;
        state.saveSuccess = 'Review decisions and edits successfully saved to PostgreSQL.';
      })
      .addCase(saveAnalysisReview.rejected, (state, action) => {
        state.saveLoading = false;
        state.saveError = action.payload as string;
      });
  },
});

export const {
  clearAnalysisState,
  clearSaveStatus,
  setStageMessage,
  updateLocalFiveWhysStep,
  addLocalFiveWhysStep,
  removeLocalFiveWhysStep,
  updateLocalCause,
  updateLocalFishboneCause,
  updateLocalCapa,
  updateLocalEvidenceGap,
} = analysisSlice.actions;

export default analysisSlice.reducer;
