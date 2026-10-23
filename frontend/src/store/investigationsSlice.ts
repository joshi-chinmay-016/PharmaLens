import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Investigation,
  InvestigationSummary,
  InvestigationCreatePayload,
  InvestigationUpdatePayload,
  DashboardMetrics,
  InvestigationAuditLog,
  TransitionPayload,
  ReopenPayload,
  ApplyFactPayload,
} from '../types';
import { api } from '../services/api';

interface InvestigationsState {
  investigations: InvestigationSummary[];
  currentInvestigation: Investigation | null;
  metrics: DashboardMetrics | null;
  auditLogs: InvestigationAuditLog[];
  auditLoading: boolean;
  auditError: string | null;
  loading: boolean;
  saveLoading: boolean;
  error: string | null;
  saveError: string | null;
  saveSuccessMessage: string | null;
}

const initialState: InvestigationsState = {
  investigations: [],
  currentInvestigation: null,
  metrics: null,
  auditLogs: [],
  auditLoading: false,
  auditError: null,
  loading: false,
  saveLoading: false,
  error: null,
  saveError: null,
  saveSuccessMessage: null,
};

export const fetchMetrics = createAsyncThunk(
  'investigations/fetchMetrics',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getDashboardMetrics();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch dashboard metrics');
    }
  }
);

export const fetchInvestigations = createAsyncThunk(
  'investigations/fetchInvestigations',
  async (params: { search?: string; status?: string } | undefined, { rejectWithValue }) => {
    try {
      return await api.getInvestigations(params?.search, params?.status);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch investigations');
    }
  }
);

export const fetchInvestigationById = createAsyncThunk(
  'investigations/fetchInvestigationById',
  async (idOrCode: string | number, { dispatch, rejectWithValue }) => {
    try {
      const inv = await api.getInvestigationById(idOrCode);
      dispatch(fetchAuditLogs(idOrCode));
      return inv;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to load investigation details');
    }
  }
);

export const fetchAuditLogs = createAsyncThunk(
  'investigations/fetchAuditLogs',
  async (idOrCode: string | number, { rejectWithValue }) => {
    try {
      return await api.getAuditLogs(idOrCode);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to retrieve audit trail');
    }
  }
);

export const createInvestigation = createAsyncThunk(
  'investigations/createInvestigation',
  async (payload: InvestigationCreatePayload, { dispatch, rejectWithValue }) => {
    try {
      const created = await api.createInvestigation(payload);
      dispatch(fetchMetrics());
      return created;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create investigation');
    }
  }
);

export const updateInvestigation = createAsyncThunk(
  'investigations/updateInvestigation',
  async (
    { idOrCode, payload }: { idOrCode: string | number; payload: InvestigationUpdatePayload },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const updated = await api.updateInvestigation(idOrCode, payload);
      dispatch(fetchMetrics());
      dispatch(fetchAuditLogs(idOrCode));
      return updated;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update investigation');
    }
  }
);

export const transitionInvestigationStatus = createAsyncThunk(
  'investigations/transitionStatus',
  async (
    { idOrCode, payload }: { idOrCode: string | number; payload: TransitionPayload },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const updated = await api.transitionInvestigation(idOrCode, payload);
      dispatch(fetchMetrics());
      dispatch(fetchAuditLogs(idOrCode));
      return updated;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to transition investigation status');
    }
  }
);

export const reopenInvestigation = createAsyncThunk(
  'investigations/reopenInvestigation',
  async (
    { idOrCode, payload }: { idOrCode: string | number; payload: ReopenPayload },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const reopened = await api.reopenInvestigation(idOrCode, payload);
      dispatch(fetchMetrics());
      dispatch(fetchAuditLogs(idOrCode));
      return reopened;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to reopen investigation');
    }
  }
);

export const applyVerifiedFact = createAsyncThunk(
  'investigations/applyVerifiedFact',
  async (
    {
      investigationId,
      analysisId,
      payload,
    }: { investigationId: number; analysisId: number; payload: ApplyFactPayload },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const res = await api.applyFact(investigationId, analysisId, payload);
      dispatch(fetchInvestigationById(investigationId));
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to apply verified fact');
    }
  }
);

export const deleteInvestigation = createAsyncThunk(
  'investigations/deleteInvestigation',
  async (idOrCode: string | number, { dispatch, rejectWithValue }) => {
    try {
      await api.deleteInvestigation(idOrCode);
      dispatch(fetchInvestigations());
      dispatch(fetchMetrics());
      return idOrCode;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete investigation');
    }
  }
);

export const investigationsSlice = createSlice({
  name: 'investigations',
  initialState,
  reducers: {
    clearCurrentInvestigation: (state) => {
      state.currentInvestigation = null;
      state.auditLogs = [];
      state.saveError = null;
      state.saveSuccessMessage = null;
    },
    clearSaveFeedback: (state) => {
      state.saveError = null;
      state.saveSuccessMessage = null;
    },
  },
  extraReducers: (builder) => {
    // Metrics
    builder.addCase(fetchMetrics.fulfilled, (state, action: PayloadAction<DashboardMetrics>) => {
      state.metrics = action.payload;
    });

    // List
    builder
      .addCase(fetchInvestigations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvestigations.fulfilled, (state, action: PayloadAction<InvestigationSummary[]>) => {
        state.loading = false;
        state.investigations = action.payload;
      })
      .addCase(fetchInvestigations.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Network error occurred';
      });

    // Detail
    builder
      .addCase(fetchInvestigationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvestigationById.fulfilled, (state, action: PayloadAction<Investigation>) => {
        state.loading = false;
        state.currentInvestigation = action.payload;
      })
      .addCase(fetchInvestigationById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Unable to retrieve investigation';
      });

    // Audit logs
    builder
      .addCase(fetchAuditLogs.pending, (state) => {
        state.auditLoading = true;
        state.auditError = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action: PayloadAction<InvestigationAuditLog[]>) => {
        state.auditLoading = false;
        state.auditLogs = action.payload;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.auditLoading = false;
        state.auditError = (action.payload as string) || 'Failed to load audit logs';
      });

    // Create
    builder
      .addCase(createInvestigation.pending, (state) => {
        state.saveLoading = true;
        state.saveError = null;
        state.saveSuccessMessage = null;
      })
      .addCase(createInvestigation.fulfilled, (state, action: PayloadAction<Investigation>) => {
        state.saveLoading = false;
        state.currentInvestigation = action.payload;
        state.saveSuccessMessage = `Investigation ${action.payload.investigation_id} created successfully!`;
      })
      .addCase(createInvestigation.rejected, (state, action) => {
        state.saveLoading = false;
        state.saveError = (action.payload as string) || 'Failed to create record';
      });

    // Update
    builder
      .addCase(updateInvestigation.pending, (state) => {
        state.saveLoading = true;
        state.saveError = null;
        state.saveSuccessMessage = null;
      })
      .addCase(updateInvestigation.fulfilled, (state, action: PayloadAction<Investigation>) => {
        state.saveLoading = false;
        state.currentInvestigation = action.payload;
        state.saveSuccessMessage = `Investigation updated at ${new Date().toLocaleTimeString()}!`;
      })
      .addCase(updateInvestigation.rejected, (state, action) => {
        state.saveLoading = false;
        state.saveError = (action.payload as string) || 'Failed to update record';
      });

    // Transition
    builder
      .addCase(transitionInvestigationStatus.pending, (state) => {
        state.saveLoading = true;
        state.saveError = null;
      })
      .addCase(transitionInvestigationStatus.fulfilled, (state, action: PayloadAction<Investigation>) => {
        state.saveLoading = false;
        state.currentInvestigation = action.payload;
        state.saveSuccessMessage = `Status updated to '${action.payload.status}'!`;
      })
      .addCase(transitionInvestigationStatus.rejected, (state, action) => {
        state.saveLoading = false;
        state.saveError = (action.payload as string) || 'Failed to transition status';
      });

    // Reopen
    builder
      .addCase(reopenInvestigation.pending, (state) => {
        state.saveLoading = true;
        state.saveError = null;
      })
      .addCase(reopenInvestigation.fulfilled, (state, action: PayloadAction<Investigation>) => {
        state.saveLoading = false;
        state.currentInvestigation = action.payload;
        state.saveSuccessMessage = `Investigation reopened to '${action.payload.status}'!`;
      })
      .addCase(reopenInvestigation.rejected, (state, action) => {
        state.saveLoading = false;
        state.saveError = (action.payload as string) || 'Failed to reopen investigation';
      });
  },
});

export const { clearCurrentInvestigation, clearSaveFeedback } = investigationsSlice.actions;
export default investigationsSlice.reducer;
