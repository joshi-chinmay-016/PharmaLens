# PharmaLens: AI-Powered Root Cause Analysis & CAPA
### *See Beyond the Deviation. Investigate with intelligence. Act with evidence.*

---

## 1. Product Overview

**PharmaLens** is a specialized quality-management and Root Cause Analysis (RCA) platform designed for pharmaceutical Active Pharmaceutical Ingredient (API) manufacturing environments. 

When deviations, Out-Of-Specification (OOS) analytical results, or process anomalies occur, investigators must navigate incomplete initial data, unstructured batch records, and strict regulatory expectations. PharmaLens establishes a rigorous **evidence-before-conclusions** investigative workflow:

$$\text{Deviation Intake} \longrightarrow \text{Evidence Capture} \longrightarrow \text{Fact Extraction} \longrightarrow \text{Evidence Gaps} \longrightarrow \text{Hypotheses (5 Whys / 6M)} \longrightarrow \text{CAPA Engine} \longrightarrow \text{Human Review \& Signoff}$$

### Phase 2 Implementation Summary
Phase 2 extends the Phase 1 foundation into a functional **AI-Powered Root Cause Analysis & Evidence Intelligence** system:
- **LangGraph Multi-Node Workflow:** Sequential, testable nodes coordinating source preparation, fact extraction, validation, evidence-gap analysis, causal hypothesis generation, 5 Whys derivation, Ishikawa 6M categorization, CAPA recommendation, and output contract validation.
- **Groq Model Inference:** Uses live model inference (`openai/gpt-oss-120b`) via official Groq client with JSON response modes, bounded retries, and strict token budgets.
- **Strict Evidence Provenance:** Every extracted fact, gap, and causal hypothesis is linked to source document IDs and exact excerpts.
- **Human Authority Safeguards:** AI conclusions remain unconfirmed suggestions (`review_status = suggested`). Root causes and CAPAs strictly require human investigator confirmation.
- **PostgreSQL Persistence & Versioning:** Every analysis run is persisted with an incremental version number in the `investigation_analyses` table. Human review decisions and edits are stored separately without altering AI original outputs.

---

## 2. Core Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PharmaLens Architecture                                │
└────────────────────────────────────────────────────────────────────────────────────────┘

  [ Client Tier: React 18 + Vite + Redux Toolkit + Tailwind CSS ]
    ├── Quality Dashboard (Aggregated metrics, recent deviations)
    ├── Investigations Registry (Search by DEV ID/batch/status)
    ├── Dual-Panel Investigation Workspace (Editable forms + Real-time intelligence)
    ├── Intelligence Assistance Panel
    │     ├── Tab 1: Evidence & Gaps (Extracted facts, proposed form updates, gap tracker)
    │     ├── Tab 2: Potential Causes (Ranked hypotheses, evidence links, human confirmation)
    │     ├── Tab 3: 5 Whys Analysis (Interactive deductive chain, editable steps, limitation notes)
    │     ├── Tab 4: Fishbone Analysis (Ishikawa 6M categories: Machine, Method, Material, etc.)
    │     └── Tab 5: CAPA Engine (Containment vs Corrective vs Preventive actions)
    └── Multi-Source Intake Modal (Pasted text, PDF parsing, Email headers)
                            │
                            ▼ (REST API / CORS / Typed Fetch Client)
  [ Application Tier: FastAPI (Python 3.12) ]
    ├── API Routers (/api/health, /api/investigations, /api/sources, /api/ai)
    ├── AI Orchestrator (LangGraph workflow invocation & state synchronization)
    ├── Groq Client Manager (Bounded retries, JSON mode, timeout controls)
    ├── Schema Validation (Pydantic v2 BaseModels & ConfigDict)
    └── Local PDF Engine (PyPDF local text extraction & scanned detection)
                            │
                            ▼ (LangGraph StateGraph Workflow)
  [ AI Reasoning Tier: LangGraph + Groq API ]
    ├── Node 1: Source Preparation (Untrusted evidence demarcation, source manifest)
    ├── Node 2: Fact Extraction (Structured parameter extraction & form mapping)
    ├── Node 3: Extraction Validation (Deterministic schema & provenance verification)
    ├── Node 4: Evidence Gaps (Missing fields vs unsubmitted real-world records)
    ├── Node 5: Potential Root Causes (Ranked causal hypotheses, next verification steps)
    ├── Node 6: 5 Whys Analysis (Deductive why sequence, status badges)
    ├── Node 7: Fishbone Analysis (6M Ishikawa classification, empty category handling)
    ├── Node 8: CAPA Recommendations (Containment, corrective, preventive actions)
    └── Node 9: Output Contract Validation (Pydantic contract enforcement, metadata compilation)
                            │
                            ▼ (SQLAlchemy 2.0 ORM / PostgreSQL 17)
  [ Persistence Tier: PostgreSQL 17 + Alembic Migrations ]
    ├── investigations Table (DEV references, batch numbers, specifications)
    ├── source_documents Table (Provenance, raw text, mime type, audit links)
    └── investigation_analyses Table (Versioned structured output, review state, user edits)
```

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Redux Toolkit, React Router v6, Tailwind CSS, Lucide Icons |
| **Backend** | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, PyPDF, Uvicorn |
| **AI Orchestration** | LangGraph (`StateGraph`, `END`), LangChain Core |
| **LLM Inference** | Groq API (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`) |
| **Database** | PostgreSQL 17 (Default persistent database), Alembic (Schema migrations) |
| **Testing** | Pytest, Pytest-Asyncio, HTTPX, Deterministic Groq Mocks, Playwright / Browser Subagent |

---

## 4. LangGraph Multi-Node Workflow

The AI engine executes a 9-node sequential pipeline:

1. **`prepare_source`**: Loads investigation snapshot and attached source documents (`pasted_text`, `pdf`, `email`). Demarcates content within `--- BEGIN UNTRUSTED EVIDENCE SOURCE ---` boundaries to defend against prompt injection. Enforces context length budget.
2. **`extract_facts`**: Maps source material to investigation schema (`product_name`, `batch_number`, `process_step`, `actual_result`, `acceptance_criterion`, `incident_description`). Assigns extraction confidence and source provenance.
3. **`validate_extraction`**: Runs deterministic Python validation ensuring source IDs exist in the manifest, dates are plausible, and conflicting statements are preserved and flagged.
4. **`evidence_gaps`**: Distinguishes missing form fields from missing empirical records (e.g., vacuum sensor calibration certs, SCADA trend curves, BMR logs). Prioritizes gaps by investigative impact.
5. **`potential_causes`**: Formulates evidence-supported causal hypotheses. Computes plausibility rankings based on physical evidence without declaring any cause as confirmed.
6. **`five_whys`**: Generates an iterative deductive 5 Whys sequence. Assigns step statuses (`supported`, `tentative`, `unresolved`) and records limitation notes when evidentiary limits are reached.
7. **`fishbone`**: Classifies causes across the 6M domains: Machine, Method, Material, Measurement, Milieu (Environment), and Manpower. Correctly leaves irrelevant categories empty rather than inventing speculation.
8. **`capa`**: Proposes actionable CAPA measures categorized into:
   - **Correction / Containment:** Immediate hold or quarantine.
   - **Corrective Action:** Eliminating established causal factors.
   - **Preventive Action:** Systemic SOP revisions, maintenance schedules, and engineering controls.
9. **`validate_output`**: Validates the complete output against `InvestigationAIAnalysisContract`. Assembles provenance manifests and runtime metadata.

---

## 5. API Endpoints Reference

### Health & System
- `GET /api/health` — PostgreSQL connectivity and Phase status.
- `GET /api/ai/health` — AI readiness check, configured Groq model ID, supported RCA methods, and source token budget (safe; never leaks keys).

### Investigations
- `GET /api/investigations/metrics` — Aggregate metrics (total, drafts, in review, unresolved gaps).
- `GET /api/investigations` — Paginated registry search with query parameter filtering (`?search=DEV-2026-014&status=Draft`).
- `POST /api/investigations` — Create a new investigation record; auto-generates sequential IDs (`INV-2026-0001`).
- `GET /api/investigations/{id}` — Retrieve full investigation record including linked source documents.
- `PATCH /api/investigations/{id}` — Update editable fields with audit timestamping.
- `DELETE /api/investigations/{id}` — Safe deletion of investigation record.

### Source Intake
- `POST /api/sources/text` — Ingest raw incident notes or pasted reports.
- `POST /api/sources/email` — Ingest incident email notification preserving sender, subject, date, and body metadata.
- `POST /api/sources/pdf` — Multipart file upload (max 10MB). Local text extraction with scanned detection.
- `GET /api/sources/{id}` — Retrieve source document details, provenance, and extracted text.
- `PATCH /api/sources/{id}/attach` — Associate an existing source document with an investigation.

### Phase 2: AI Investigation & RCA Endpoints
- `POST /api/investigations/{id}/analysis` — Execute full multi-node LangGraph analysis workflow. Supports options payload (`include_five_whys`, `include_fishbone`, `include_capa`). Returns validated contract and saves incremental version.
- `POST /api/investigations/{id}/analysis/five-whys` — Targeted execution of 5 Whys causal sequence.
- `POST /api/investigations/{id}/analysis/fishbone` — Targeted execution of Ishikawa 6M matrix.
- `POST /api/investigations/{id}/analysis/capa` — Targeted execution of CAPA recommendations.
- `GET /api/investigations/{id}/analysis` — Retrieve the latest saved analysis version.
- `GET /api/investigations/{id}/analysis/history` — Retrieve all prior analysis versions for version comparison.
- `PATCH /api/investigations/{id}/analysis/{analysis_id}` — Human quality reviewer signoff: updates confirmed root cause, human confirmation flag, and reviewer notes without modifying AI raw outputs.

---

## 6. Local Setup & Configuration

### Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js v18+ and npm v10+
- PostgreSQL 14+ (running on port 5432)
- Groq API Key (from https://console.groq.com)

### Step 1: Configure Environment (`.env`)
```ini
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/pharmalens
PORT=8000
FRONTEND_ORIGIN=http://localhost:5173
UPLOAD_DIR=./storage/uploads
MAX_UPLOAD_SIZE_MB=10

# Groq AI Model Configuration (Backend-only; never exposed to browser)
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
GROQ_TIMEOUT_SECONDS=60
GROQ_MAX_RETRIES=2
AI_MAX_SOURCE_CHARS=40000
AI_MAX_OUTPUT_TOKENS=5000
AI_TEMPERATURE=0.0
```

### Step 2: Initialize Database & Run Migrations
```bash
# Verify database connection
python backend/scripts/init_db.py

# Apply Alembic migrations (creates investigations, source_documents, investigation_analyses)
cd backend
alembic upgrade head
cd ..
```

### Step 3: Start FastAPI Backend
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API available at http://127.0.0.1:8000, Swagger UI at http://127.0.0.1:8000/docs.*

### Step 4: Start React Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend live at http://localhost:5173.*

---

## 7. Quality Verification & Test Suite

### Run Pytest Suite (23 Tests)
The automated test suite runs deterministically using mock dispatchers to verify all contracts, persistence, prompt injection defenses, and cross-investigation source isolation without incurring paid API calls:

```bash
pytest backend/tests -v
```

**Results:**
```
============================= 23 passed in 1.12s ==============================
backend/tests/test_ai_workflow.py::test_ai_health_endpoint PASSED        [  4%]
backend/tests/test_ai_workflow.py::test_analysis_missing_investigation_returns_404 PASSED [  8%]
backend/tests/test_ai_workflow.py::test_analysis_empty_investigation_returns_400 PASSED [ 13%]
backend/tests/test_ai_workflow.py::test_missing_groq_config_error PASSED [ 17%]
backend/tests/test_ai_workflow.py::test_full_ai_workflow_execution_and_persistence PASSED [ 21%]
backend/tests/test_ai_workflow.py::test_targeted_rca_methods PASSED      [ 26%]
backend/tests/test_ai_workflow.py::test_human_review_and_cause_confirmation PASSED [ 30%]
backend/tests/test_ai_workflow.py::test_prompt_injection_safety_in_source PASSED [ 34%]
backend/tests/test_cross_investigation_source_isolation PASSED          [ 39%]
backend/tests/test_health.py::test_health_check PASSED                   [ 43%]
backend/tests/test_health.py::test_root_endpoint PASSED                  [ 47%]
backend/tests/test_investigations.py::test_create_and_retrieve_investigation PASSED [ 52%]
backend/tests/test_investigations.py::test_update_investigation PASSED   [ 56%]
backend/tests/test_investigations.py::test_investigation_search_and_filter PASSED [ 60%]
backend/tests/test_investigations.py::test_investigation_validation_error PASSED [ 65%]
backend/tests/test_investigations.py::test_dashboard_metrics PASSED      [ 69%]
backend/tests/test_sources.py::test_pasted_text_intake PASSED            [ 73%]
backend/tests/test_sources.py::test_pasted_text_validation_failure PASSED [ 78%]
backend/tests/test_sources.py::test_email_intake PASSED                  [ 82%]
backend/tests/test_sources.py::test_pdf_intake_success PASSED            [ 86%]
backend/tests/test_sources.py::test_pdf_intake_invalid_extension PASSED  [ 91%]
backend/tests/test_sources.py::test_pdf_intake_empty_file PASSED         [ 95%]
backend/tests/test_sources.py::test_attach_source_to_investigation PASSED [100%]
============================= 23 passed in 1.12s ==============================
```

### Validate Frontend Production Build
```bash
npm --prefix frontend run build
```
*Output: `✓ built in 25.22s` with 0 TypeScript compilation errors.*

---

## 8. Verified Test Scenario: DEV-2026-014

The workflow was verified on the fictional pharmaceutical drying deviation scenario:

- **Investigation Title:** Residual Solvent Result Outside Acceptance Criteria
- **Incident Reference:** `DEV-2026-014`
- **Product:** Example API | **Batch:** `API-2026-014` | **Process Step:** Drying
- **Observed Result:** Residual solvent reported as `0.65%` (Limit: NMT `0.50%`)
- **Initial Observation:** Vacuum pressure profile fluctuated down to 40 mbar during final 3 hours.

**Observed AI Outputs (Groq `openai/gpt-oss-120b`):**
1. **Extracted Facts:** 9 parameters extracted with 100% confidence from source evidence and mapped to form fields.
2. **Evidence Gaps:** 10 critical records identified (Vacuum pressure calibration certs, Shelf temperature uniformity logs, SCADA drying curve archives).
3. **Potential Causes:**
   - `[PRC-01]` "Incomplete Vacuum Drying Cycle or Pressure Loss" (High plausibility)
   - `[PRC-02]` "Shelf Temperature Non-Uniformity or Heating Element Failure"
   - `[PRC-03]` "Analytical Sampling or Headspace Equilibration Artifact"
4. **5 Whys:** Deductive chain progressing from OOS result $\to$ vacuum fluctuation $\to$ sensor calibration review $\to$ maintenance scheduling $\to$ real-time alarm thresholds.
5. **Fishbone (6M):** Machine & Method factors identified; Material category correctly left empty.
6. **CAPA Recommendations:**
   - *Containment:* Quarantine and duplicate re-test of Batch API-2026-014 (High priority).
   - *Corrective:* Sensor recalibration against traceable standard per SOP CAL-001 (High priority).
   - *Preventive:* Quarterly calibration schedule and automated SCADA archiving (Medium priority).
7. **Human Signoff:** Confirmed by investigator and persisted to PostgreSQL `investigation_analyses` table (Version 3).

---

## 9. Security & Regulatory Boundaries

- **Decision-Support Prototype:** PharmaLens is an investigative decision-support tool. It does not replace formal regulatory validation, 21 CFR Part 11 electronic signatures, or validated computerized system requirements.
- **Untrusted Source Demarcation:** All source content is quarantined within demarcated blocks. Attempts to issue system prompt overrides (e.g., "IGNORE INSTRUCTIONS") are rejected.
- **Data Isolation:** Cross-investigation document contamination is prevented by database query filtering and provenance verification.
