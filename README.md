# PharmaLens: AI-Powered Root Cause Analysis & CAPA
### *See Beyond the Deviation. Investigate with intelligence. Act with evidence.*

---

## 1. Product Overview

**PharmaLens** is a specialized quality-management and Root Cause Analysis (RCA) platform designed for pharmaceutical Active Pharmaceutical Ingredient (API) manufacturing environments. 

When deviations, Out-Of-Specification (OOS) analytical results, or process anomalies occur, investigators must navigate incomplete initial data, unstructured batch records, and strict regulatory expectations. PharmaLens establishes a rigorous **evidence-before-conclusions** investigative workflow:

$$\text{Deviation Intake} \longrightarrow \text{Evidence Capture} \longrightarrow \text{Structured Investigation} \longrightarrow \text{Root Cause Analysis} \longrightarrow \text{CAPA Formulation} \longrightarrow \text{Human Review \& Signoff}$$

This repository contains the **Phase 1 Production Foundation**, implementing full multi-source intake (Pasted text, Email, PDF with local text extraction), editable investigation registries, PostgreSQL persistence with Alembic migrations, real-time dashboard analytics, and typed contract interfaces for Phase 2 LangGraph & Groq AI orchestration.

---

## 2. Core Architecture

PharmaLens is architected with a strict separation of concerns across presentation, service logic, persistence, and future AI reasoning:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PharmaLens Architecture                         │
└────────────────────────────────────────────────────────────────────────┘

  [ Client Tier: React 18 + Vite + Redux Toolkit + Tailwind CSS ]
    ├── Quality Dashboard (Real aggregate metrics, recent deviations)
    ├── Investigations Registry (Search by ID/title/batch, status filtering)
    ├── Investigation Workspace (Editable forms with Sections A, B, & C)
    ├── Intelligence Assistance Panel (Evidence checklist & Phase 2 preview)
    └── Multi-Source Intake Modal (Pasted text, PDF parsing, Email memo)
                            │
                            ▼ (REST API / CORS / Typed Fetch Client)
  [ Application Tier: FastAPI (Python 3.12) ]
    ├── API Routers (/api/health, /api/investigations, /api/sources)
    ├── Service Layer (InvestigationService, DocumentService)
    ├── Local PDF Engine (PyPDF local text extraction & scanned detection)
    ├── Schema Validation (Pydantic v2 BaseModels & ConfigDict)
    └── Phase 2 AI Contracts (Typed schemas for LangGraph & Groq models)
                            │
                            ▼ (SQLAlchemy 2.0 ORM / Connection Pooling)
  [ Persistence Tier: PostgreSQL 17 + Alembic Migrations ]
    ├── investigations Table (DEV references, batch, limits, observations)
    └── source_documents Table (Provenance, raw text, mime type, audit links)
```

### Key Design Tenets
1. **Evidence Before Conclusions:** Missing parameters (e.g., missing batch number, missing acceptance criteria, or unverified drying logs) are explicitly highlighted as *Unresolved Evidence Gaps* rather than silently inferred or hallucinated.
2. **Qualified Human Authority:** AI proposals (scheduled for Phase 2) provide decision-support only; all causes and CAPAs require human review and confirmation.
3. **Zero Secrets in Code:** Sensitive database credentials and future AI keys are managed via server-side environment variables (`.env`) and excluded from client bundles and version control.
4. **Local Document Processing:** PDF extraction is performed locally using pure Python libraries (`pypdf`), eliminating dependencies on third-party paid document APIs.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Redux Toolkit, React Router v6, Tailwind CSS, Lucide Icons |
| **Backend** | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, PyPDF, Uvicorn |
| **Database** | PostgreSQL 17 (Default persistent database), Alembic (Schema migrations) |
| **Testing** | Pytest, Pytest-Asyncio, HTTPX, Vite build verification, Playwright/Browser Subagent |
| **AI Roadmap (Phase 2)** | LangGraph workflow orchestration, Groq API (`llama-3.3-70b-versatile`) |

---

## 4. API Endpoints Reference

All endpoints return consistent JSON structures and standard HTTP status codes. Documentation is interactively browsable via Swagger UI at `/docs`.

### Health & System
- `GET /api/health` — System health check, PostgreSQL connectivity test, and active phase report.

### Investigations
- `GET /api/investigations/metrics` — Aggregate metrics (total, drafts, in review, unresolved gaps) calculated from database records.
- `GET /api/investigations` — Paginated registry search with query parameter filtering (`?search=DEV-2026-014&status=Draft`).
- `POST /api/investigations` — Create a new investigation record; auto-generates sequential IDs (e.g., `INV-2026-0001`).
- `GET /api/investigations/{id_or_code}` — Retrieve full investigation record including linked source documents.
- `PATCH /api/investigations/{id_or_code}` — Update editable fields with audit timestamping.
- `DELETE /api/investigations/{id_or_code}` — Safe deletion of investigation record.

### Source Intake
- `POST /api/sources/text` — Ingest raw incident notes or pasted reports with character validation.
- `POST /api/sources/email` — Ingest incident email notification preserving sender, subject, date, and body metadata.
- `POST /api/sources/pdf` — Multipart file upload (max 10MB). Extracts text locally; automatically flags scanned/image-based files.
- `GET /api/sources/{id_or_code}` — Retrieve source document details, provenance, and extracted text.
- `PATCH /api/sources/{id_or_code}/attach` — Associate an existing source document with an investigation.

---

## 5. Local Setup & Execution Guide

### Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js v18+ and npm v10+
- PostgreSQL 14+ (running on port 5432)

### Step 1: Clone and Configure Environment

```bash
# Copy template environment file
cp .env.example .env
```

Edit `.env` to configure your local PostgreSQL credentials:
```ini
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/pharmalens
PORT=8000
FRONTEND_ORIGIN=http://localhost:5173
UPLOAD_DIR=./storage/uploads
MAX_UPLOAD_SIZE_MB=10

# Groq API Configuration (Planned for Phase 2 - Not required for Phase 1)
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
```

### Step 2: Initialize Database & Run Migrations

```bash
# Verify database creation
python backend/scripts/init_db.py

# Apply database migrations with Alembic
cd backend
alembic upgrade head
cd ..
```

### Step 3: Install Backend Dependencies & Start FastAPI Server

```bash
# Install backend requirements
python -m pip install -r backend/requirements.txt

# Start backend dev server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The backend API will be available at http://127.0.0.1:8000 and documentation at http://127.0.0.1:8000/docs.*

### Step 4: Install Frontend Dependencies & Start React App

Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
*The frontend application will be live at http://localhost:5173.*

---

## 6. Testing & Quality Verification

### Run Backend Pytest Suite
Execute the 14-test verification suite covering health checks, CRUD lifecycle, search filters, PDF extraction, email formatting, and database persistence:

```bash
pytest backend/tests -v
```

**Output:**
```
============================= 14 passed in 0.27s =============================
backend/tests/test_health.py::test_health_check PASSED                   [  7%]
backend/tests/test_health.py::test_root_endpoint PASSED                  [ 14%]
backend/tests/test_investigations.py::test_create_and_retrieve_investigation PASSED [ 21%]
backend/tests/test_investigations.py::test_update_investigation PASSED   [ 28%]
backend/tests/test_investigations.py::test_investigation_search_and_filter PASSED [ 35%]
backend/tests/test_investigations.py::test_investigation_validation_error PASSED [ 42%]
backend/tests/test_investigations.py::test_dashboard_metrics PASSED      [ 50%]
backend/tests/test_sources.py::test_pasted_text_intake PASSED            [ 57%]
backend/tests/test_sources.py::test_pasted_text_validation_failure PASSED [ 64%]
backend/tests/test_sources.py::test_email_intake PASSED                  [ 71%]
backend/tests/test_sources.py::test_pdf_intake_success PASSED            [ 78%]
backend/tests/test_sources.py::test_pdf_intake_invalid_extension PASSED  [ 85%]
backend/tests/test_sources.py::test_pdf_intake_empty_file PASSED         [ 92%]
backend/tests/test_sources.py::test_attach_source_to_investigation PASSED [100%]
```

### Run End-to-End API Integration Script
```bash
python backend/verify_flow.py
```

### Validate Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 7. Fictional Testing Scenario Walkthrough

To verify the complete workflow manually, PharmaLens includes an integrated test scenario loader based on an illustrative pharmaceutical drying deviation:

- **Investigation Title:** Residual Solvent Result Outside Acceptance Criteria
- **Incident Reference:** `DEV-2026-014`
- **Product:** Example API
- **Batch:** `API-2026-014`
- **Process Step:** Drying (Vacuum Tray Dryer Unit 2)
- **Observed Result:** Residual solvent reported as `0.65%`
- **Illustrative Limit:** NMT `0.50%`
- **Initial Observation:** Vacuum pressure profile fluctuated during final 3 hours.

**How to test:**
1. Navigate to http://localhost:5173/investigations/new
2. Click **"Fill Example DEV-2026-014"** in the top action bar to pre-populate all fields.
3. Click **"Save Investigation"**. The record will be persisted to PostgreSQL and assigned an ID (e.g., `INV-2026-0002`).
4. Click **"Source Intake"** to test attaching a PDF report or pasted incident memo.
5. Review the **Investigation Intelligence** assistance panel on the right: notice that all evidence parameters are tracked, with zero fabricated root causes presented.

---

## 8. Phase 2 Readiness: AI Integration Contract

Phase 1 establishes typed data structures and contracts in [`backend/app/schemas/ai_contract.py`](file:///c:/PharmaLens/backend/app/schemas/ai_contract.py) ready for additive Phase 2 implementation:

- **LangGraph Workflow Nodes:** Fact extraction $\to$ Validation $\to$ Gap Identification $\to$ 5 Whys Chain $\to$ Ishikawa 6M $\to$ CAPA Recommendation.
- **Model Configuration:** Backend loads Groq API Key and model identifier (`llama-3.3-70b-versatile`) securely from server `.env`.
- **Zero Breaking Changes:** Phase 2 will directly attach analysis responses to the `investigations` record via dedicated relationship tables without altering Phase 1 models.
