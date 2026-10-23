export type InvestigationStatus = 'Draft' | 'In Review' | 'Completed' | 'Closed';

export interface SourceDocument {
  id: number;
  source_id: string;
  source_type: 'pasted_text' | 'pdf' | 'email';
  original_filename: string | null;
  file_size_bytes: number | null;
  extracted_text: string | null;
  extraction_status: 'success' | 'partial' | 'failed';
  extraction_warning: string | null;
  metadata_json: string | null;
  investigation_id: number | null;
  created_at: string;
}

export interface InvestigationSummary {
  id: number;
  investigation_id: string;
  title: string;
  incident_reference: string | null;
  status: InvestigationStatus;
  product_name: string | null;
  batch_number: string | null;
  incident_category: string | null;
  process_step: string | null;
  has_unresolved_gaps: boolean;
  created_at: string;
  updated_at: string;
  source_documents_count: number;
}

export interface Investigation {
  id: number;
  investigation_id: string;
  title: string;
  incident_reference: string | null;
  status: InvestigationStatus;
  
  // Incident Details
  incident_description: string | null;
  incident_datetime: string | null;
  discovery_datetime: string | null;
  product_name: string | null;
  batch_number: string | null;
  manufacturing_site: string | null;
  process_step: string | null;
  incident_category: string | null;
  expected_result: string | null;
  actual_result: string | null;
  acceptance_criterion: string | null;
  immediate_impact: string | null;
  immediate_containment: string | null;
  reporter_name: string | null;
  
  // Investigation Context
  known_facts: string | null;
  initial_observations: string | null;
  evidence_available: string | null;
  investigation_notes: string | null;
  
  has_unresolved_gaps: boolean;
  created_at: string;
  updated_at: string;
  source_documents: SourceDocument[];
}

export interface InvestigationCreatePayload {
  title: string;
  incident_reference?: string;
  status?: InvestigationStatus;
  incident_description?: string;
  incident_datetime?: string;
  discovery_datetime?: string;
  product_name?: string;
  batch_number?: string;
  manufacturing_site?: string;
  process_step?: string;
  incident_category?: string;
  expected_result?: string;
  actual_result?: string;
  acceptance_criterion?: string;
  immediate_impact?: string;
  immediate_containment?: string;
  reporter_name?: string;
  known_facts?: string;
  initial_observations?: string;
  evidence_available?: string;
  investigation_notes?: string;
  has_unresolved_gaps?: boolean;
  source_document_ids?: number[];
}

export interface InvestigationUpdatePayload {
  title?: string;
  incident_reference?: string;
  status?: InvestigationStatus;
  incident_description?: string;
  incident_datetime?: string;
  discovery_datetime?: string;
  product_name?: string;
  batch_number?: string;
  manufacturing_site?: string;
  process_step?: string;
  incident_category?: string;
  expected_result?: string;
  actual_result?: string;
  acceptance_criterion?: string;
  immediate_impact?: string;
  immediate_containment?: string;
  reporter_name?: string;
  known_facts?: string;
  initial_observations?: string;
  evidence_available?: string;
  investigation_notes?: string;
  has_unresolved_gaps?: boolean;
}

export interface DashboardMetrics {
  total_investigations: number;
  draft_investigations: number;
  in_review_investigations: number;
  unresolved_gaps_count: number;
  completed_investigations: number;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  database: string;
  phase: string;
}
