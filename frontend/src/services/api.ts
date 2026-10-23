import {
  Investigation,
  InvestigationSummary,
  InvestigationCreatePayload,
  InvestigationUpdatePayload,
  DashboardMetrics,
  SourceDocument,
  HealthResponse,
  InvestigationAuditLog,
  TransitionPayload,
  ReopenPayload,
  ApplyFactPayload,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        if (typeof errorJson.detail === 'string') {
          errorDetail = errorJson.detail;
        } else if (Array.isArray(errorJson.detail)) {
          errorDetail = errorJson.detail.map((err: any) => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
        }
      }
    } catch {
      // Body not JSON
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Health
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<HealthResponse>(res);
  },

  // Dashboard Metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const res = await fetch(`${API_BASE}/investigations/metrics`);
    return handleResponse<DashboardMetrics>(res);
  },

  // Investigations List
  async getInvestigations(search?: string, status?: string): Promise<InvestigationSummary[]> {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (status && status !== 'all') params.append('status', status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/investigations${queryString}`);
    return handleResponse<InvestigationSummary[]>(res);
  },

  // Investigation Detail
  async getInvestigationById(idOrCode: string | number): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/investigations/${idOrCode}`);
    return handleResponse<Investigation>(res);
  },

  // Create Investigation
  async createInvestigation(payload: InvestigationCreatePayload): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/investigations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Investigation>(res);
  },

  // Update Investigation
  async updateInvestigation(idOrCode: string | number, payload: InvestigationUpdatePayload): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/investigations/${idOrCode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Investigation>(res);
  },

  // Delete Investigation
  async deleteInvestigation(idOrCode: string | number): Promise<void> {
    const res = await fetch(`${API_BASE}/investigations/${idOrCode}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to delete investigation (${res.status})`);
    }
  },

  // Sources Intake: Pasted Text
  async intakeText(text: string, investigationId?: number, titleHint?: string): Promise<SourceDocument> {
    const res = await fetch(`${API_BASE}/sources/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        investigation_id: investigationId || null,
        title_hint: titleHint || null,
      }),
    });
    return handleResponse<SourceDocument>(res);
  },

  // Sources Intake: Pasted Email
  async intakeEmail(params: {
    subject: string;
    body: string;
    sender?: string;
    receivedDate?: string;
    investigationId?: number;
  }): Promise<SourceDocument> {
    const res = await fetch(`${API_BASE}/sources/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: params.subject,
        body: params.body,
        sender: params.sender || null,
        received_date: params.receivedDate || null,
        investigation_id: params.investigationId || null,
      }),
    });
    return handleResponse<SourceDocument>(res);
  },

  // Sources Intake: PDF Upload
  async uploadPdf(file: File, investigationId?: number): Promise<SourceDocument> {
    const formData = new FormData();
    formData.append('file', file);
    if (investigationId) {
      formData.append('investigation_id', investigationId.toString());
    }

    const res = await fetch(`${API_BASE}/sources/pdf`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<SourceDocument>(res);
  },

  // Attach Source to Investigation
  async attachSource(sourceIdOrPk: string | number, investigationId: number): Promise<SourceDocument> {
    const res = await fetch(`${API_BASE}/sources/${sourceIdOrPk}/attach?investigation_id=${investigationId}`, {
      method: 'PATCH',
    });
    return handleResponse<SourceDocument>(res);
  },

  // ==========================================
  // Phase 2: AI Investigation & RCA Endpoints
  // ==========================================

  // Check AI Engine Health & Configured Model
  async getAiHealth(): Promise<import('../types').AIHealthResponse> {
    const res = await fetch(`${API_BASE}/ai/health`);
    return handleResponse<import('../types').AIHealthResponse>(res);
  },

  // Run Investigation Analysis (LangGraph Workflow)
  async runAnalysis(
    investigationId: number,
    payload?: import('../types').RunAnalysisPayload
  ): Promise<import('../types').AnalysisResponse> {
    const res = await fetch(`${API_BASE}/investigations/${investigationId}/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    return handleResponse<import('../types').AnalysisResponse>(res);
  },

  // Targeted 5 Whys Run
  async runFiveWhys(investigationId: number): Promise<import('../types').AnalysisResponse> {
    const res = await fetch(`${API_BASE}/investigations/${investigationId}/analysis/five-whys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<import('../types').AnalysisResponse>(res);
  },

  // Targeted Fishbone 6M Run
  async runFishbone(investigationId: number): Promise<import('../types').AnalysisResponse> {
    const res = await fetch(`${API_BASE}/investigations/${investigationId}/analysis/fishbone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<import('../types').AnalysisResponse>(res);
  },

  // Targeted CAPA Recommendations Run
  async runCapa(investigationId: number): Promise<import('../types').AnalysisResponse> {
    const res = await fetch(`${API_BASE}/investigations/${investigationId}/analysis/capa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<import('../types').AnalysisResponse>(res);
  },

  // Retrieve Latest Saved Analysis
  async getLatestAnalysis(investigationId: number): Promise<import('../types').AnalysisResponse | null> {
    const res = await fetch(`${API_BASE}/investigations/${investigationId}/analysis`);
    if (res.status === 404) {
      return null;
    }
    return handleResponse<import('../types').AnalysisResponse>(res);
  },

  // Retrieve Full Analysis Version History
  async getAnalysisHistory(investigationId: number): Promise<import('../types').AnalysisResponse[]> {
    const res = await fetch(`${API_BASE}/investigations/${investigationId}/analysis/history`);
    return handleResponse<import('../types').AnalysisResponse[]>(res);
  },

  // Update Human Review State, Edits, or Confirm Root Cause
  async updateAnalysisReview(
    investigationId: number,
    analysisId: number,
    payload: import('../types').AnalysisReviewUpdatePayload
  ): Promise<import('../types').AnalysisResponse> {
    const res = await fetch(`${API_BASE}/investigations/${investigationId}/analysis/${analysisId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<import('../types').AnalysisResponse>(res);
  },

  // Retrieve Chronological Audit Trail
  async getAuditLogs(idOrCode: string | number): Promise<InvestigationAuditLog[]> {
    const res = await fetch(`${API_BASE}/investigations/${idOrCode}/audit-logs`);
    return handleResponse<InvestigationAuditLog[]>(res);
  },

  // Transition Lifecycle State
  async transitionInvestigation(
    idOrCode: string | number,
    payload: TransitionPayload
  ): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/investigations/${idOrCode}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Investigation>(res);
  },

  // Reopen Completed Investigation
  async reopenInvestigation(
    idOrCode: string | number,
    payload: ReopenPayload
  ): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/investigations/${idOrCode}/reopen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Investigation>(res);
  },

  // Apply Fact to Investigation Record
  async applyFact(
    investigationId: number,
    analysisId: number,
    payload: ApplyFactPayload
  ): Promise<{ status: string; message: string; field_name: string; new_value: any }> {
    const res = await fetch(`${API_BASE}/investigations/${investigationId}/analysis/${analysisId}/apply-fact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ status: string; message: string; field_name: string; new_value: any }>(res);
  },

  // Detach Source Document from Investigation
  async detachSource(sourceIdOrPk: string | number, investigationId: number): Promise<SourceDocument> {
    const res = await fetch(`${API_BASE}/sources/${sourceIdOrPk}/detach?investigation_id=${investigationId}`, {
      method: 'PATCH',
    });
    return handleResponse<SourceDocument>(res);
  },
};
