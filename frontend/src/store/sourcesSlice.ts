import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SourceDocument } from '../types';
import { api } from '../services/api';
import { fetchInvestigationById, fetchAuditLogs } from './investigationsSlice';

interface SourcesState {
  activeSource: SourceDocument | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: SourcesState = {
  activeSource: null,
  loading: false,
  error: null,
  successMessage: null,
};

export const intakeTextThunk = createAsyncThunk(
  'sources/intakeText',
  async (
    { text, investigationId, titleHint }: { text: string; investigationId?: number; titleHint?: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const doc = await api.intakeText(text, investigationId, titleHint);
      if (investigationId) {
        dispatch(fetchInvestigationById(investigationId));
      }
      return doc;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to process pasted text');
    }
  }
);

export const intakeEmailThunk = createAsyncThunk(
  'sources/intakeEmail',
  async (
    payload: { subject: string; body: string; sender?: string; receivedDate?: string; investigationId?: number },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const doc = await api.intakeEmail(payload);
      if (payload.investigationId) {
        dispatch(fetchInvestigationById(payload.investigationId));
      }
      return doc;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to process email intake');
    }
  }
);

export const uploadPdfThunk = createAsyncThunk(
  'sources/uploadPdf',
  async (
    { file, investigationId }: { file: File; investigationId?: number },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const doc = await api.uploadPdf(file, investigationId);
      if (investigationId) {
        dispatch(fetchInvestigationById(investigationId));
      }
      return doc;
    } catch (err: any) {
      return rejectWithValue(err.message || 'PDF upload or text extraction failed');
    }
  }
);

export const detachSourceThunk = createAsyncThunk(
  'sources/detachSource',
  async (
    { sourceId, investigationId }: { sourceId: string | number; investigationId?: number },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const res = await api.detachSource(sourceId);
      if (investigationId) {
        dispatch(fetchInvestigationById(investigationId));
        dispatch(fetchAuditLogs(investigationId));
      }
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to detach source document');
    }
  }
);

export const sourcesSlice = createSlice({
  name: 'sources',
  initialState,
  reducers: {
    clearActiveSource: (state) => {
      state.activeSource = null;
      state.error = null;
      state.successMessage = null;
    },
    setActiveSource: (state, action: PayloadAction<SourceDocument>) => {
      state.activeSource = action.payload;
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state: SourcesState) => {
      state.loading = true;
      state.error = null;
      state.successMessage = null;
    };
    const handleFulfilled = (state: SourcesState, action: PayloadAction<SourceDocument>) => {
      state.loading = false;
      state.activeSource = action.payload;
      state.successMessage = `Source '${action.payload.original_filename || action.payload.source_id}' processed successfully!`;
    };
    const handleRejected = (state: SourcesState, action: any) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Document intake failed';
    };

    builder
      .addCase(intakeTextThunk.pending, handlePending)
      .addCase(intakeTextThunk.fulfilled, handleFulfilled)
      .addCase(intakeTextThunk.rejected, handleRejected)
      .addCase(intakeEmailThunk.pending, handlePending)
      .addCase(intakeEmailThunk.fulfilled, handleFulfilled)
      .addCase(intakeEmailThunk.rejected, handleRejected)
      .addCase(uploadPdfThunk.pending, handlePending)
      .addCase(uploadPdfThunk.fulfilled, handleFulfilled)
      .addCase(uploadPdfThunk.rejected, handleRejected);
  },
});

export const { clearActiveSource, setActiveSource } = sourcesSlice.actions;
export default sourcesSlice.reducer;
