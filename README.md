# PharmaLens: AI-Powered Root Cause Analysis & CAPA
### *See Beyond the Deviation. Investigate with intelligence. Act with evidence.*

---

## 1. Product Overview

**PharmaLens** is an AI-augmented Root Cause Analysis (RCA) and Corrective and Preventive Action (CAPA) decision-support platform engineered specifically for pharmaceutical Active Pharmaceutical Ingredient (API) manufacturing and quality assurance operations.

When deviations, Out-Of-Specification (OOS) analytical results, or process anomalies occur, investigators must navigate incomplete initial data, unstructured batch records, and strict regulatory expectations. PharmaLens establishes a rigorous **evidence-before-conclusions** investigative workflow:

$$\text{Deviation Intake} \longrightarrow \text{Evidence Capture} \longrightarrow \text{Fact Extraction} \longrightarrow \text{Evidence Gaps} \longrightarrow \text{Hypotheses (5 Whys / 6M)} \longrightarrow \text{CAPA Engine} \longrightarrow \text{Human Review \& Signoff}$$

---

## 2. Phase 3 Production Hardening & Architectural Additions

Phase 3 achieves complete production-quality hardening across the application lifecycle, compliance auditability, and human-in-the-loop governance:

1. **Formal 5-State Investigation Lifecycle:**
   - `Draft`: Initial intake and incident framing.
   - `Under Investigation`: Empirical source evidence and records collection.
   - `AI Analysis Available`: LangGraph multi-node reasoning completed; awaiting human review.
   - `In Review`: Active quality review, hypothesis evaluation, and CAPA formulation.
   - `Completed`: Investigation formally closed by quality authority.
   - *Lifecycle Controls:* Strict state-transition validation rules, completion guards requiring a confirmed root cause and zero unaddressed evidence gaps, immutability locking of completed records, and an explicit reopen endpoint requiring documented regulatory justification.

2. **Append-Only Compliance Audit Trail (`investigation_audit_logs`):**
   - Immutably captures every material business and investigative action: investigation creation, updates, lifecycle transitions, reopenings, source attachments and detachments, AI analysis executions, fact corrections/applications, and granular review decisions on causes, CAPAs, and gaps.
   - Preserves actor attribution, UTC timestamps, entity references, action summaries, and detailed payload diffs without exposing credentials or internal prompts.
   - Accessible via `GET /api/investigations/{id}/audit-logs` and a dedicated UI panel with interactive payload inspector.

3. **Source Evidence Provenance & Cross-Investigation Isolation:**
   - Multi-format ingestion (`pasted_text`, `email`, `pdf`) with text extraction and scanned document detection.
   - Strict source isolation preventing cross-investigation leakage or source document hijacking (returns HTTP 409 Conflict if attempting to reassign attached sources).
   - Source document detachment endpoint (`PATCH /api/sources/{id}/detach`) with audit event tracking.

4. **Human-in-the-Loop Review & Fact Correction:**
   - Fact verification endpoint (`POST /api/investigations/{id}/analysis/{analysis_id}/apply-fact`) applying verified facts to the master investigation record with old/new value audit trails.
   - Potential root causes provide the full triad of reviewer decisions: *Accept as Confirmed Finding*, *Reject Hypothesis*, or *Needs More Evidence*.
   - Evidence gaps support explicit reviewer status updates (`open`, `addressed`, `resolved`).
   - CAPA recommendations require human approval status (`Proposed`, `Accepted`, `Modified`, `Rejected`) and closure criteria verification.

5. **AI Reliability & Failure Isolation:**
   - Safe error classification: provider rate limits (429), timeouts, and authentication failures are trapped safely, logging `analysis_failed` in the audit log without exposing API keys or stack traces.
   - Failure preservation: failed AI runs do NOT overwrite previously successful analysis versions in PostgreSQL.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Redux Toolkit, React Router v6, Tailwind CSS, Lucide Icons, Vite |
| **Backend** | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, PyPDF, Alembic, Uvicorn |
| **AI Reasoning Tier** | LangGraph (`StateGraph`), LangChain Core |
| **LLM Inference** | Groq Cloud API (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`) |
| **Persistence Tier** | PostgreSQL 17 (Production/Local), SQLite in-memory (Isolated automated test suite) |
| **Testing** | Pytest, Pytest-Asyncio, HTTPX, FastAPI TestClient, Deterministic Groq Mocks |

---

## 4. System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PharmaLens Architecture                                │
└────────────────────────────────────────────────────────────────────────────────────────┘

  [ Client Tier: React 18 + Vite + Redux Toolkit + Tailwind CSS ]
    ├── Quality Dashboard (Real-time DB-backed metrics: Draft, Under Inv, In Review, Completed)
    ├── Investigations Registry (Search by DEV ID/batch/status, filter by lifecycle state)
    ├── Dual-Panel Investigation Workspace
    │     ├── Left Panel: Investigation Details & Lifecycle Controls (Form, Transition Bar, Reopen)
    │     └── Right Panel: Intelligence Assistance Panel
    │           ├── Tab 1: Evidence & Gaps (Sources, Detach action, Verified Fact Application, Gaps)
    │           ├── Tab 2: Potential Causes (Triad decisions: Confirm / Needs Evidence / Reject)
    │           ├── Tab 3: 5 Whys Analysis (Interactive deductive chain, editable steps)
    │           ├── Tab 4: Fishbone Analysis (Ishikawa 6M categories: Machine, Method, Material...)
    │           ├── Tab 5: CAPA Engine (Containment, corrective, preventive review & closure checks)
    │           └── Tab 6: Audit Trail & History (Append-only compliance log & Version snapshots)
    └── Multi-Source Intake Modal (Pasted text, PDF parsing, Email headers)
                            │
                            ▼ (REST API / CORS / Typed Fetch Client)
  [ Application Tier: FastAPI (Python 3.12) ]
    ├── API Routers:
    │     ├── /api/health (Health check & DB connectivity)
    │     ├── /api/investigations (CRUD, /transition, /reopen, /audit-logs, /metrics)
    │     ├── /api/sources (Text, email, PDF intake, /attach, /detach)
    │     └── /api/ai (/health, /analysis, /analysis/history, /apply-fact, /review)
    ├── Audit Service (Append-only event logger with transactional integrity)
    ├── Investigation Service (Lifecycle state machine & completion validation rules)
    ├── AI Orchestrator (LangGraph workflow coordination & safe error handling)
    └── Groq Client Manager (Bounded retries, JSON response mode, timeout controls)
                            │
                            ▼ (LangGraph StateGraph Workflow)
  [ AI Reasoning Tier: LangGraph Multi-Node Engine ]
    ├── Node 1: Source Preparation (Untrusted demarcation: --- BEGIN UNTRUSTED EVIDENCE ---)
    ├── Node 2: Fact Extraction (Structured parameter extraction & form mapping)
    ├── Node 3: Extraction Validation (Deterministic schema & provenance verification)
    ├── Node 4: Evidence Gaps (Missing fields vs missing empirical records)
    ├── Node 5: Potential Root Causes (Ranked causal hypotheses, next verification steps)
    ├── Node 6: 5 Whys Analysis (Deductive why sequence, status badges)
    ├── Node 7: Fishbone Analysis (6M Ishikawa classification, empty category handling)
    ├── Node 8: CAPA Recommendations (Containment, corrective, preventive actions)
    └── Node 9: Output Contract Validation (Pydantic contract enforcement, metadata compilation)
                            │
                            ▼ (SQLAlchemy 2.0 ORM / PostgreSQL 17)
  [ Persistence Tier: PostgreSQL 17 + Alembic Migrations ]
    ├── investigations Table (DEV references, batch numbers, specifications, lifecycle status)
    ├── source_documents Table (Provenance, raw text, mime type, investigation links)
    ├── investigation_analyses Table (Versioned structured output, review state, user edits)
    └── investigation_audit_logs Table (Immutable chronological compliance history)
```

---

## 5. Getting Started & Installation

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm
- PostgreSQL 14+ running locally (or via Docker)

### 1. Environment Configuration
Create a `.env` file in the project root:
```bash
cp .env.example .env
```
Configure your PostgreSQL connection string and Groq API key:
```env
GROQ_API_KEY=gsk_your_actual_groq_key_here
GROQ_MODEL=openai/gpt-oss-120b
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/pharmalens
PORT=8000
FRONTEND_ORIGIN=http://localhost:5173
UPLOAD_DIR=./storage/uploads
MAX_UPLOAD_SIZE_MB=10
```

### 2. Database Setup & Migrations
Ensure the database `pharmalens` exists in PostgreSQL:
```bash
psql -U postgres -c "CREATE DATABASE pharmalens;"
```
Apply Alembic database migrations:
```bash
alembic upgrade head
```

### 3. Backend Startup
Activate virtual environment and run the FastAPI server:
```bash
# Windows
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

uvicorn backend.app.main:app --reload --port 8000
```
Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.

### 4. Frontend Startup
In a separate terminal:
```bash
npm --prefix frontend install
npm --prefix frontend run dev
```
Open `http://localhost:5173` in your browser.

---

## 6. Verification & Automated Test Suite

PharmaLens features an automated test suite covering unit behaviors, state machines, audit events, LangGraph execution, source security, and an end-to-end demo workflow:

```bash
pytest backend/tests -v
```

### Verified Test Results (34/34 Passed)
```
backend/tests/test_ai_workflow.py::test_ai_health_endpoint PASSED                  [  2%]
backend/tests/test_ai_workflow.py::test_analysis_missing_investigation_returns_404 PASSED [  5%]
backend/tests/test_ai_workflow.py::test_analysis_empty_investigation_returns_400 PASSED [  8%]
backend/tests/test_ai_workflow.py::test_missing_groq_config_error PASSED           [ 11%]
backend/tests/test_ai_workflow.py::test_full_ai_workflow_execution_and_persistence PASSED [ 14%]
backend/tests/test_ai_workflow.py::test_targeted_rca_methods PASSED                [ 17%]
backend/tests/test_ai_workflow.py::test_human_review_and_cause_confirmation PASSED [ 20%]
backend/tests/test_ai_workflow.py::test_prompt_injection_safety_in_source PASSED   [ 23%]
backend/tests/test_ai_workflow.py::test_cross_investigation_source_isolation PASSED [ 26%]
backend/tests/test_audit_trail.py::test_audit_logs_on_investigation_lifecycle PASSED [ 29%]
backend/tests/test_audit_trail.py::test_audit_logs_on_source_attachment_and_detachment PASSED [ 32%]
backend/tests/test_audit_trail.py::test_audit_logs_on_ai_analysis_and_human_review PASSED [ 35%]
backend/tests/test_demo_e2e_scenario.py::test_fictional_demo_end_to_end_scenario PASSED [ 38%]
backend/tests/test_health.py::test_health_check PASSED                             [ 41%]
backend/tests/test_health.py::test_root_endpoint PASSED                            [ 44%]
backend/tests/test_investigations.py::test_create_and_retrieve_investigation PASSED [ 47%]
backend/tests/test_investigations.py::test_update_investigation PASSED             [ 50%]
backend/tests/test_investigations.py::test_investigation_search_and_filter PASSED   [ 52%]
backend/tests/test_investigations.py::test_investigation_validation_error PASSED   [ 55%]
backend/tests/test_investigations.py::test_dashboard_metrics PASSED                [ 58%]
backend/tests/test_lifecycle.py::test_lifecycle_allowed_transitions PASSED         [ 61%]
backend/tests/test_lifecycle.py::test_lifecycle_invalid_transition_rejected PASSED [ 64%]
backend/tests/test_lifecycle.py::test_completion_guard_requires_confirmed_cause_and_resolved_gaps PASSED [ 67%]
backend/tests/test_lifecycle.py::test_completed_investigation_is_locked_and_can_be_reopened PASSED [ 70%]
backend/tests/test_phase3_human_review_and_security.py::test_apply_verified_fact_to_investigation PASSED [ 73%]
backend/tests/test_phase3_human_review_and_security.py::test_cross_investigation_source_hijacking_forbidden PASSED [ 76%]
backend/tests/test_phase3_human_review_and_security.py::test_failed_ai_analysis_does_not_overwrite_previous_successful_analysis PASSED [ 79%]
backend/tests/test_sources.py::test_pasted_text_intake PASSED                      [ 82%]
backend/tests/test_sources.py::test_pasted_text_validation_failure PASSED           [ 85%]
backend/tests/test_sources.py::test_email_intake PASSED                            [ 88%]
backend/tests/test_sources.py::test_pdf_intake_success PASSED                      [ 91%]
backend/tests/test_sources.py::test_pdf_intake_invalid_extension PASSED            [ 94%]
backend/tests/test_sources.py::test_pdf_intake_empty_file PASSED                   [ 97%]
backend/tests/test_sources.py::test_attach_source_to_investigation PASSED          [100%]

============================= 34 passed in 1.10s ==============================
```

### Validate Frontend Production Build
```bash
npm --prefix frontend run build
```
*Output: `✓ built in 39.48s` with 0 TypeScript compilation or packaging errors.*

---

## 7. Fictional Demonstration Workflow: Batch API-2026-014

> [!NOTE]
> All batch references, analytical values, and event descriptions in this scenario are illustrative, fictional demonstration data created specifically for technical validation.

### Step-by-Step Demo Guide:

1. **Create the Deviation:**
   - Click **+ New Investigation**.
   - Title: `Elevated Residual Solvent Result Outside Acceptance Criteria`
   - Batch Number: `API-2026-014`
   - Process Step: `Drying`
   - Severity: `Major`
   - Incident Category: `OOS Result`
   - Observed Result: `0.65% acetone` | Acceptance Limit: `0.50% max`
   - Click **Create Investigation**. Status initializes in `Draft`.

2. **Ingest Source Evidence:**
   - Transition status to `Under Investigation`.
   - Click **+ Add Source** and paste the following report:
     ```
     QUALITY DEVIATION REPORT (Fictional Demonstration)
     Incident Ref: DEV-2026-014
     Batch ID: API-2026-014
     Unit Operation: Final Drying in Vacuum Tray Dryer D-104
     Analytical Observation: Gas chromatography release testing for Batch API-2026-014 exhibited 0.65% w/w residual acetone, exceeding internal acceptance limit of 0.50% w/w.
     Process Observations: During cycle hours 04:00 to 08:00, condenser coolant temperature transmitter TT-104 indicated temperature fluctuations up to 18C against the 10C setpoint. Vacuum chamber pressure drifted up to 40 mbar. Operator observed normal cake depth of 25 mm on tray carts A and B.
     ```
   - Click **Ingest & Attach**. Document appears with extraction status `success`.

3. **Execute AI Investigation Intelligence:**
   - Click **Run Analysis** in the right panel.
   - The LangGraph multi-node orchestrator executes sequentially.
   - Upon completion, the investigation automatically advances to `AI Analysis Available`.

4. **Review Extracted Facts & Apply to Master Record:**
   - Open **Tab 1: Evidence & Gaps**.
   - Review AI-extracted facts (`batch_number: API-2026-014`, `process_step: Drying`).
   - Click **Edit & Apply** or **Accept Update** to commit the verified facts directly into the investigation record.
   - Observe the immediate audit log event recorded in the Audit Trail tab.

5. **Examine Evidence Gaps:**
   - Note critical record gaps identified by the AI (e.g., `SCADA condenser coolant flow rate logs`).
   - Investigator updates gap review status from `Open` to `Resolved (Evidence Acquired)`.

6. **Evaluate Hypotheses & Human Root Cause Confirmation:**
   - Open **Tab 2: Potential Causes**.
   - Note candidate causes ranked by evidence.
   - Select `Sub-optimal Vacuum Condenser Cooling during Final 4 Hours of Drying Cycle` and click **Accept Cause**.
   - Mark alternative hypotheses (e.g., `Uneven Cake Depth`) as **Reject** or **Needs Evidence**.
   - In the footer, enter Quality Reviewer Sign-off justification:
     `Reviewed against batch record API-2026-014; confirmed drying temperature profile deviation.`
   - Click **Save Review Decisions**.

7. **Review 5 Whys & Fishbone (6M):**
   - Open **Tab 3: 5 Whys** to inspect the grounded causal chain.
   - Open **Tab 4: Fishbone (6M)** to view Ishikawa category distributions.

8. **Review CAPA Recommendations:**
   - Open **Tab 5: CAPA**.
   - Review immediate containment action (`Quarantine Batch API-2026-014`) $\to$ Status: `Accepted`.
   - Review corrective action (`Pneumatic bypass valve actuator maintenance WO-2026-8812`) $\to$ Status: `Accepted`.

9. **Complete Investigation with Quality Disposition:**
   - Click **Complete Investigation** on the lifecycle bar.
   - Enter final QA rationale: `Confirmed root cause addressed. Material quarantined for rework.`
   - Click **Sign & Complete Investigation**.
   - Note that the investigation is now locked against direct form edits.

10. **Inspect Append-Only Audit Trail:**
    - Open **Tab 6: Audit Trail**.
    - Verify all 10+ events chronologically logged with exact UTC timestamps, actor attribution, and inspectable payload diffs.
    - Test the **Reopen Investigation** action with documented justification to observe complete audit trail tracking.

---

## 8. Security & Regulatory Boundaries

- **Decision-Support Prototype:** PharmaLens is designed strictly as an investigative decision-support system to assist qualified quality assurance personnel. It does not replace formal regulatory validation, 21 CFR Part 11 electronic signatures, or validated computerized system requirements.
- **Untrusted Source Demarcation:** All source document text is quarantined within designated boundaries to prevent prompt-injection attacks from altering system directives.
- **Cross-Investigation Isolation:** Attached source documents cannot be reassigned or hijacked across investigations.
- **Zero Secret Leakage:** Database credentials and Groq API keys remain strictly server-side. Errors returned to the client are sanitized into safe, actionable messages.
