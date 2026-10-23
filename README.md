# PharmaLens: AI-Powered Root Cause Analysis & CAPA
### *See Beyond the Deviation. Investigate with Intelligence. Act with Evidence.*

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg?style=flat-square&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![LangGraph](https://img.shields.io/badge/Orchestrator-LangGraph-FF6F00.svg?style=flat-square)](https://langchain-ai.github.io/langgraph/)
[![Groq](https://img.shields.io/badge/Inference-Groq_LPU-F55036.svg?style=flat-square)](https://groq.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org)
[![TailwindCSS](https://img.shields.io/badge/Style-Neo--Brutalist-000000.svg?style=flat-square)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-34%2F34%20Passing-brightgreen.svg?style=flat-square)]()

---

## 1. Executive Overview

**PharmaLens** is an enterprise-grade AI decision-support platform engineered specifically for pharmaceutical manufacturing, Active Pharmaceutical Ingredient (API) synthesis, and GxP quality assurance operations.

When deviations, Out-of-Specification (OOS) laboratory results, or process anomalies occur, investigators face fragmented data, unstructured batch records, high regulatory stakes, and strict 30-day deviation closure mandates under **FDA 21 CFR 211.192** and **EU GMP Chapter 1**. 

PharmaLens eliminates chaotic, speculative investigation workflows by enforcing an **evidence-first investigative methodology**. Combining local document intelligence (PyPDF) with a stateful **LangGraph multi-agent orchestration engine**, PharmaLens parses raw deviation reports, pinpoints empirical evidence gaps, reconstructs deductive **5 Whys** chains, populates **Ishikawa (6M)** fishbones, and formulates verifiable **CAPA** (Corrective and Preventive Action) programs—all under strict **Human-in-the-Loop** control.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THE PHARMALENS INVESTIGATION LIFECYCLE                                 │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  Source Ingestion      Empirical Evidence       Multi-Agent RCA           CAPA Engine        Quality Closure
 ┌────────────────┐    ┌──────────────────┐    ┌─────────────────┐      ┌───────────────┐   ┌─────────────────┐
 │ PDF / Text /   │ ──►│ Fact Extraction  │ ──►│ 5 Whys Deduction│ ───► │ Corrective    │──►│ QA Confirmation │
 │ Email Intake   │    │ & Evidence Gaps  │    │ & Fishbone (6M) │      │ & Preventive  │   │ & Audit Freeze  │
 └────────────────┘    └──────────────────┘    └─────────────────┘      └───────────────┘   └─────────────────┘
         ▲                      ▲                       ▲                       ▲                    ▲
         └──────────────────────┴───────────────────────┴───────────────────────┴────────────────────┘
                                  Immutable Append-Only Compliance Audit Trail
```

---

## 2. Key Product Capabilities

### ⚡ Multi-Modal Source Document Intake
- **Universal Ingestion:** Ingest incident reports from unstructured text memos, QA email threads, and official laboratory PDFs.
- **Local PDF Parsing (PyPDF):** Extracts text locally within your security boundary—zero unredacted external document leakage.
- **Automatic Form Population:** Intelligently maps extracted metadata (Deviation IDs, Product, Batch, Manufacturing Site, Observations) straight into investigation records with preserved source provenance.
- **Cross-Investigation Isolation:** Built-in cryptographic provenance prevents source document hijacking across different investigations.

### 🧠 LangGraph Stateful Multi-Agent Reasoning Tier
Rather than relying on a single, brittle prompt, PharmaLens runs a multi-node **LangGraph StateGraph** pipeline powered by ultra-low-latency Groq inference:
1. **Source Isolation:** Demarcates untrusted inputs with boundary tokens to prevent prompt-injection attacks.
2. **Fact Extraction:** Dissects unstructured narrative into structured, verified parameters.
3. **Evidence Gap Analysis:** Contrasts known facts against missing empirical data (SCADA trend logs, calibration certificates, environmental readings).
4. **Causal Hypothesis Engine:** Generates ranked root causes backed by empirical probability scores and recommended verification actions.
5. **Deductive 5 Whys Sequence:** Unrolls the causal chain from observed symptom to underlying operational root cause.
6. **Ishikawa Fishbone (6M):** Categorizes factors across *Machine, Method, Material, Manpower, Measurement, and Milieu*.
7. **CAPA Formulation:** Proposes targeted immediate containment, corrective actions, and preventive safeguards with verifiable effectiveness criteria.

### 🛡️ Human-in-the-Loop Regulatory Governance
- **Zero Automated Closures:** Under GxP standards, an AI hypothesis can never close an investigation. Every root cause requires an explicit QA decision: **Accept as Confirmed Finding**, **Needs More Evidence**, or **Reject Hypothesis**.
- **Immutable Audit Trail:** Append-only database ledger (`investigation_audit_logs`) recording every state transition, source attachment, AI execution, fact correction, and QA sign-off with UTC timestamps and actor attribution.
- **Strict 5-Stage Lifecycle Machine:** Enforces transition logic (`Draft` $\to$ `Under Investigation` $\to$ `AI Analysis Available` $\to$ `In Review` $\to$ `Completed`). Completed investigations are cryptographically locked against unauthorized modification and require formal regulatory justification to reopen.

### 🎨 Neo-Brutalist Product Interface
- High-contrast, typography-driven SaaS interface crafted for maximum cognitive clarity during high-pressure QA reviews.
- Semantic action color system:
  - **Amber (`#F59E0B`):** Data ingestion & document intake.
  - **Violet (`#8B5CF6`) & Ink (`#1A1A1A`):** AI Intelligence drawer & multi-agent execution.
  - **Teal (`#0D9488`):** Safe commits, primary progression, and verified confirmations.
  - **Rose (`#E11D48`):** Destructive actions, rejections, and quarantine notices.
- Responsive dual-panel workspace with slide-out intelligence drawers and stage-based navigation tabs.

---

## 3. System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PharmaLens Full-Stack Topology                            │
└────────────────────────────────────────────────────────────────────────────────────────┘

  [ Client Tier: React 18 + TypeScript + Redux Toolkit + Vite ]
    ├── Operational Metrics Dashboard (Real-time active, in-review, and closed counts)
    ├── Investigation Registry (Batch & deviation search, severity tags, lifecycle filtering)
    ├── Multi-Stage Investigation Workspace
    │     ├── Stage 01: Intake & Context (Batch traceability, incident timing, immediate containment)
    │     ├── Stage 02: Evidence & Gaps (Ingested source documents, verified facts, missing records)
    │     ├── Stage 03: Root Cause RCA (Hypotheses review, interactive 5 Whys, 6M Fishbone)
    │     ├── Stage 04: CAPA Actions (Containment, corrective & preventive programs with owners)
    │     └── Stage 05: Review & Closure (Quality sign-off, regulatory rationale, audit trail)
    └── Slide-out AI Intelligence Drawer (Instant execution, version history, fact application)
                            │
                            ▼ (REST API / JSON / Strict CORS)
  [ Application Tier: FastAPI (Python 3.12) ]
    ├── API Routers:
    │     ├── /api/investigations (CRUD, /transition, /reopen, /audit-logs, /metrics)
    │     ├── /api/sources (Text, email, and PDF intake, /attach, /detach)
    │     ├── /api/ai (/health, /analysis, /analysis/history, /apply-fact, /review)
    │     └── /api/health (System and database readiness)
    ├── Investigation Lifecycle Service (State transition machine & completion guards)
    ├── Document Service (PyPDF extraction, mime validation, safe storage)
    ├── Compliance Audit Service (Append-only transactional audit trail)
    └── AI Orchestrator (LangGraph workflow coordination & Groq exception isolation)
                            │
                            ▼ (LangGraph StateGraph Workflow)
  [ AI Reasoning Engine: LangGraph + Groq Cloud LPU ]
    ├── Node 1: Untrusted Evidence Demarcation
    ├── Node 2: Fact Extraction & Parameter Normalization
    ├── Node 3: Extraction Schema Validation
    ├── Node 4: Empirical Evidence Gap Analysis
    ├── Node 5: Ranked Causal Hypotheses Formulation
    ├── Node 6: 5 Whys Deductive Sequence
    ├── Node 7: Ishikawa 6M Classification
    ├── Node 8: CAPA Recommendations & Effectiveness Criteria
    └── Node 9: Pydantic Contract Enforcement
                            │
                            ▼ (SQLAlchemy 2.0 ORM / PostgreSQL 17)
  [ Persistence Tier: PostgreSQL 17 + Alembic ]
    ├── investigations Table
    ├── source_documents Table
    ├── investigation_analyses Table (Versioned AI snapshots & review states)
    └── investigation_audit_logs Table (Immutable GxP history)
```

---

## 4. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | **React 18 + Vite** | Fast, component-driven UI with instant Hot Module Replacement. |
| **Language & State** | **TypeScript + Redux Toolkit** | Strict type safety across investigation domains and predictable state management. |
| **Styling & Icons** | **Tailwind CSS + Lucide React** | Custom Neo-Brutalist design tokens, crisp offset shadows, and semantic icons. |
| **Backend API** | **FastAPI (Python 3.12)** | Asynchronous, high-throughput REST API with automated OpenAPI 3.0 schema generation. |
| **AI Orchestrator** | **LangGraph (`StateGraph`)** | Stateful multi-node workflow enabling verifiable, step-by-step causal deduction. |
| **Inference Hardware** | **Groq LPU (`openai/gpt-oss-120b`)** | Near-instantaneous token generation speeds essential for real-time investigation workflows. |
| **Document Intelligence** | **PyPDF** | Local text extraction without external data transmission. |
| **Database & ORM** | **PostgreSQL 17 + SQLAlchemy 2.0** | Enterprise relational storage with transactional integrity, foreign keys, and JSONB support. |
| **Schema Migrations** | **Alembic** | Controlled, repeatable database schema versioning. |
| **Testing** | **Pytest + HTTPX + Vitest** | End-to-end integration, mock AI harnesses, and UI verification. |

---

## 5. Quickstart & Installation

### Prerequisites
- **Python:** 3.12 or higher
- **Node.js:** 18 or higher (with `npm`)
- **Database:** PostgreSQL 14+ running locally (or via Docker)
- **AI Inference:** [Groq Cloud API Key](https://console.groq.com)

### 1. Repository Setup
```bash
git clone https://github.com/joshi-chinmay-016/PharmaLens.git
cd PharmaLens
```

### 2. Environment Configuration
Create a `.env` file in the project root:
```env
# Application
PORT=8000
FRONTEND_ORIGIN=http://localhost:5173

# Database
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/pharmalens

# AI Engine (Groq)
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
GROQ_TIMEOUT_SECONDS=60
GROQ_MAX_RETRIES=2

# Document Storage
UPLOAD_DIR=./storage/uploads
MAX_UPLOAD_SIZE_MB=10
```

### 3. Database Initialization
Ensure your PostgreSQL instance is running and create the database:
```bash
psql -U postgres -c "CREATE DATABASE pharmalens;"
```
Run database migrations:
```bash
alembic upgrade head
```

### 4. Start the Backend API
```bash
# Windows PowerShell
.\.venv\Scripts\activate
uvicorn backend.app.main:app --reload --port 8000

# macOS / Linux
source .venv/bin/activate
uvicorn backend.app.main:app --reload --port 8000
```
Interactive API docs: **`http://localhost:8000/docs`**

### 5. Start the Frontend Application
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open your browser to: **`http://localhost:5173`**

---

## 6. End-to-End Product Demonstration

PharmaLens includes a realistic, pre-configured pharmaceutical deviation scenario for testing:

### Demonstration Incident: Batch MET-2026-B849
> **Incident Title:** Out-of-Specification (OOS) Dissolution Failure in Metformin HCl 500mg Tablets  
> **Deviation Code:** `DEV-2026-019`  
> **Classification:** Critical Deviation (Stage 1 Dissolution: 68.4% vs NLT 80% Specification)

```bash
# Generate the realistic test PDF on your machine:
python generate_demo_pdf.py
```
*(Generated at `sample_deviation_report.pdf` and on your Desktop)*

### Live Walkthrough Steps:
1. **Launch Workspace:** Navigate to `http://localhost:5173/investigations/new`.
2. **Ingest Document:** Click the **amber** **`Source Intake`** button in the header bar.
3. **Upload PDF:** Select the **PDF Upload** tab, drag and drop `sample_deviation_report.pdf`, and click **Upload & Extract PDF**.
4. **Auto-Populate:** Preview the locally extracted text and click **Apply Extracted Text to Investigation**. The form instantly populates the Title, Reference, Product, Batch, Site, and Observations.
5. **Persist Record:** Click **Save Investigation** to transition the record into the database.
6. **Trigger AI Reasoning:** Click the **violet** **`AI Intelligence`** button in the top action bar and select **Run Root Cause Analysis**.
7. **Review Multi-Agent Findings:**
   - **Evidence & Gaps:** Review the 8 verified extracted facts and identified operational gaps (e.g., missing relief operator training logs).
   - **5 Whys:** Follow the causal sequence from OOS dissolution failure down to manual compression force override.
   - **Fishbone (6M):** Inspect the distribution of factors across Machine (over-compression), Manpower (relief operator absence of sign-off), and Method.
   - **CAPA Recommendations:** Inspect immediate quarantine hold (`QHN-2026-118`), corrective tablet press recalibration, and preventive SOP sign-off locks.
8. **Human Confirmation:** In **Stage 03 (Root Cause)**, click **Accept Cause** to mark the root cause as **Confirmed by QA**.
9. **Regulatory Closure:** Advance the investigation to **Stage 05 (Review & Closure)**, provide the final QA justification, and click **Sign & Complete Investigation** to lock the record.
10. **Audit Verification:** Inspect the chronological audit ledger in the Intelligence Drawer to view the immutable GxP event history.

---

## 7. Testing & Quality Assurance

PharmaLens maintains a comprehensive test suite covering API contracts, state transitions, prompt injection isolation, and mock AI orchestration:

```bash
# Run backend test suite
pytest backend/tests -v
```

### Automated Suite Results (34/34 Passing)
```
backend/tests/test_ai_workflow.py::test_ai_health_endpoint PASSED                  [ 3%]
backend/tests/test_ai_workflow.py::test_analysis_missing_investigation_returns_404 PASSED [ 6%]
backend/tests/test_ai_workflow.py::test_analysis_empty_investigation_returns_400 PASSED [ 9%]
backend/tests/test_ai_workflow.py::test_full_ai_workflow_execution_and_persistence PASSED [12%]
backend/tests/test_ai_workflow.py::test_human_review_and_cause_confirmation PASSED [15%]
backend/tests/test_ai_workflow.py::test_prompt_injection_safety_in_source PASSED   [18%]
backend/tests/test_ai_workflow.py::test_cross_investigation_source_isolation PASSED [21%]
backend/tests/test_audit_trail.py::test_audit_logs_on_investigation_lifecycle PASSED [24%]
backend/tests/test_audit_trail.py::test_audit_logs_on_source_attachment_and_detachment PASSED [27%]
backend/tests/test_audit_trail.py::test_audit_logs_on_ai_analysis_and_human_review PASSED [30%]
backend/tests/test_lifecycle.py::test_lifecycle_allowed_transitions PASSED         [33%]
backend/tests/test_lifecycle.py::test_completion_guard_requires_confirmed_cause_and_resolved_gaps PASSED [36%]
backend/tests/test_lifecycle.py::test_completed_investigation_is_locked_and_can_be_reopened PASSED [39%]
backend/tests/test_phase3_human_review_and_security.py::test_apply_verified_fact_to_investigation PASSED [42%]
backend/tests/test_sources.py::test_pdf_intake_success PASSED                      [45%]
...
============================= 34 passed in 1.15s ==============================
```

### Frontend Production Validation
```bash
cd frontend && npm run build
```
```
✓ 1502 modules transformed.
dist/index.html                   1.43 kB │ gzip:   0.81 kB
dist/assets/index-CIqWlQzf.css   51.66 kB │ gzip:   7.18 kB
dist/assets/index-CtPJPIBG.js   412.45 kB │ gzip: 105.57 kB
✓ built in 4.62s with 0 errors
```

---

## 8. Security & Compliance Boundaries

- **GxP Decision Support:** PharmaLens is strictly engineered as a specialized investigative decision-support tool. Final lot disposition, regulatory submissions, and formal CAPA closures remain under the authoritative control of qualified Quality Assurance professionals.
- **Untrusted Source Demarcation:** All uploaded documents and email texts are sequestered behind explicit demarcation tokens to protect the LangGraph engine against malicious or accidental prompt injections.
- **Zero Secret Exposure:** Groq API keys and database credentials operate exclusively on the backend. Client responses are strictly sanitized to prevent credential or system trace leaks.
- **Data Isolation:** Uploaded documents are restricted to their assigned investigation records, preventing unauthorized multi-investigation data leakage.

---

## 9. License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

Developed with precision for modern pharmaceutical quality engineering.  
*PharmaLens — Investigate with intelligence. Act with evidence.*
