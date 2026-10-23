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

// ==========================================
// Phase 2 AI Intelligence & Contract Types
// ==========================================

export interface ExtractedFact {
  field_name: string;
  extracted_value: string;
  confidence_score: number;
  source_id: string;
  source_snippet: string | null;
  verification_status: string;
  proposed_for_form: boolean;
  current_form_value?: string | null;
}

export interface EvidenceGap {
  gap_id: string;
  category: string;
  description: string;
  why_it_matters: string;
  recommended_evidence_to_obtain: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  status: string;
  supporting_source_ids: string[];
}

export interface PotentialRootCause {
  cause_id: string;
  title: string;
  explanation: string;
  category: string;
  evidence_for: string[];
  evidence_against_or_missing: string[];
  supporting_source_ids: string[];
  supporting_excerpts: string[];
  plausibility: string;
  ranking_rationale: string;
  investigation_questions: string[];
  recommended_next_step: string;
  review_status: 'suggested' | 'under_investigation' | 'supported' | 'rejected' | 'confirmed';
  is_confirmed_by_human: boolean;
}

export interface FiveWhysStep {
  level: number;
  question: string;
  answer: string;
  status: 'supported' | 'tentative' | 'unresolved';
  supporting_evidence: string | null;
  source_id: string | null;
  missing_evidence_to_verify: string | null;
}

export interface FiveWhysAnalysis {
  problem_statement: string;
  steps: FiveWhysStep[];
  derived_root_cause_hypothesis: string | null;
  is_chain_complete: boolean;
  evidence_limitation_note: string | null;
}

export interface FishboneCause {
  cause_id: string;
  cause: string;
  category: string;
  status: 'supported' | 'tentative' | 'unresolved';
  evidence: string | null;
  source_id: string | null;
  verification_action: string | null;
  review_status: string;
}

export interface FishboneAnalysis {
  machine: FishboneCause[];
  method: FishboneCause[];
  material: FishboneCause[];
  measurement: FishboneCause[];
  milieu_environment: FishboneCause[];
  manpower_people: FishboneCause[];
  summary_observations: string | null;
}

export interface CapaRecommendation {
  action_id: string;
  action_type: 'Correction / Containment' | 'Corrective Action' | 'Preventive Action' | string;
  title: string;
  description: string;
  rationale: string;
  target_root_cause_or_gap: string;
  expected_outcome: string;
  suggested_owner_role: string;
  suggested_priority: 'High' | 'Medium' | 'Low' | string;
  proposed_due_date?: string | null;
  effectiveness_check_method: string;
  evidence_needed_for_closure: string;
  human_approval_status: 'Proposed' | 'Accepted' | 'Modified' | 'Rejected' | string;
}

export interface ProvenanceSource {
  source_id: string;
  source_type: string;
  original_filename: string;
  char_count: number;
}

export interface InvestigationAIAnalysisContract {
  investigation_id: number;
  extracted_facts: ExtractedFact[];
  missing_fields: string[];
  evidence_gaps: EvidenceGap[];
  potential_root_causes: PotentialRootCause[];
  contributing_factors: string[];
  five_whys: FiveWhysAnalysis | null;
  fishbone: FishboneAnalysis | null;
  capa_recommendations: CapaRecommendation[];
  analysis_warnings: string[];
  provenance_sources: ProvenanceSource[];
  model_metadata: Record<string, any>;
  disclaimer?: string;
}

export interface AnalysisResponse {
  id: number;
  investigation_id: number;
  version: number;
  status: 'pending' | 'running' | 'completed' | 'completed_with_warnings' | 'failed';
  requested_methods: string;
  structured_output: InvestigationAIAnalysisContract;
  user_edits: Record<string, any> | null;
  confirmed_root_cause: string | null;
  is_confirmed_by_human: boolean;
  model_identifier: string;
  prompt_version: string;
  created_at: string;
  completed_at: string | null;
}

export interface RunAnalysisPayload {
  include_five_whys?: boolean;
  include_fishbone?: boolean;
  include_capa?: boolean;
}

export interface AnalysisReviewUpdatePayload {
  confirmed_root_cause?: string;
  is_confirmed_by_human?: boolean;
  user_edits_json?: string;
}

export interface AIHealthResponse {
  ai_status: string;
  configured_model: string;
  supported_methods: string[];
  max_source_chars: number;
}
