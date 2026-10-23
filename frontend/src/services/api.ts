import {
  Investigation,
  InvestigationSummary,
  InvestigationCreatePayload,
  InvestigationUpdatePayload,
  DashboardMetrics,
  SourceDocument,
  HealthResponse,
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
};
