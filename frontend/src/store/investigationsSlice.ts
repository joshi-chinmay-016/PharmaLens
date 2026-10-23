import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Investigation,
  InvestigationSummary,
  InvestigationCreatePayload,
  InvestigationUpdatePayload,
  DashboardMetrics,
} from '../types';
import { api } from '../services/api';

interface InvestigationsState {
  investigations: InvestigationSummary[];
  currentInvestigation: Investigation | null;
  metrics: DashboardMetrics | null;
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
  async (idOrCode: string | number, { rejectWithValue }) => {
    try {
      return await api.getInvestigationById(idOrCode);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to load investigation details');
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
      return updated;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update investigation');
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
    builder
      .addCase(fetchMetrics.fulfilled, (state, action: PayloadAction<DashboardMetrics>) => {
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
  },
});

export const { clearCurrentInvestigation, clearSaveFeedback } = investigationsSlice.actions;
export default investigationsSlice.reducer;
