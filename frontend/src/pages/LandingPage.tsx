import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  ArrowRight,
  FileText,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  Layers,
  History,
  Lock,
  ChevronRight,
  Menu,
  X,
  FileSpreadsheet,
  Cpu,
  Database,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHeroTab, setActiveHeroTab] = useState<'evidence' | 'causes' | 'capa'>('causes');

  return (
    <div className="min-h-screen bg-paper text-ink font-sans selection:bg-lime-accent selection:text-ink">
      {/* Top Banner: Strict Regulatory Stance */}
      <div className="bg-ink text-white border-b-2 border-ink px-4 py-2 text-center text-[11px] font-mono tracking-wider uppercase flex items-center justify-center gap-2">
        <span className="w-2 h-2 bg-lime-accent inline-block animate-pulse" />
        <span>Evidence-Driven Pharmaceutical Decision Support &bull; Human-in-the-Loop QA Verification Required</span>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur-md border-b-2 border-ink">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Mark & Wordmark */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-teal-primary border-2 border-ink flex items-center justify-center text-white shadow-brutal-sm group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-brutal transition-all">
              <ShieldCheck className="w-6 h-6 text-lime-accent" />
            </div>
            <div>
              <div className="flex items-center">
                <span className="font-display font-extrabold text-2xl tracking-tight text-ink">Pharma</span>
                <span className="font-display font-extrabold text-2xl tracking-tight text-teal-primary">Lens</span>
                <span className="ml-1.5 px-1.5 py-0.2 bg-lime-accent border border-ink text-[9px] font-mono font-bold tracking-widest uppercase">PRO</span>
              </div>
              <p className="text-[10px] font-mono font-semibold tracking-wider text-muted uppercase">RCA & CAPA Intelligence</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-display font-bold uppercase tracking-wider">
            <a href="#how-it-works" className="text-ink hover:text-teal-primary transition-colors">How It Works</a>
            <a href="#capabilities" className="text-ink hover:text-teal-primary transition-colors">Capabilities</a>
            <a href="#human-oversight" className="text-ink hover:text-teal-primary transition-colors">Human Review Gate</a>
            <a href="#architecture" className="text-ink hover:text-teal-primary transition-colors">Architecture</a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/dashboard"
              className="btn-brutal-secondary text-xs px-3.5 py-2"
            >
              <span>Quality Dashboard</span>
            </Link>
            <Link
              to="/investigations/new"
              className="btn-brutal-primary text-xs px-4 py-2"
            >
              <span>Open Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 border-2 border-ink bg-white shadow-brutal-xs"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-ink" /> : <Menu className="w-5 h-5 text-ink" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-paper border-b-2 border-ink px-4 py-6 space-y-4">
            <nav className="space-y-3 font-display font-bold text-sm uppercase">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-2 border border-ink bg-white shadow-brutal-xs"
              >
                How It Works
              </a>
              <a
                href="#capabilities"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-2 border border-ink bg-white shadow-brutal-xs"
              >
                Core Capabilities
              </a>
              <a
                href="#human-oversight"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-2 border border-ink bg-white shadow-brutal-xs"
              >
                Human Oversight Principle
              </a>
              <a
                href="#architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-2 border border-ink bg-white shadow-brutal-xs"
              >
                System Architecture
              </a>
            </nav>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-brutal-secondary w-full justify-center"
              >
                Quality Dashboard
              </Link>
              <Link
                to="/investigations/new"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-brutal-primary w-full justify-center"
              >
                Launch Workspace
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 border-b-2 border-ink overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Hero Copy (Left 7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-lime-accent border-2 border-ink shadow-brutal-xs">
                <span className="w-2 h-2 bg-ink inline-block" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                  INTELLIGENCE FOR PHARMACEUTICAL INVESTIGATIONS
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-ink leading-[1.05] tracking-tight">
                See beyond the <span className="bg-teal-primary text-white px-2 py-0.5 inline-block border-2 border-ink shadow-brutal">deviation.</span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-base sm:text-lg text-muted max-w-2xl leading-relaxed">
                Turn unstructured investigation documents into verified evidence, traceable root-cause hypotheses, and actionable CAPA recommendations—with every critical decision kept firmly in qualified human hands.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/dashboard"
                  className="btn-brutal-primary text-sm px-6 py-3.5 shadow-brutal-lg"
                >
                  <span>Explore the workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#how-it-works"
                  className="btn-brutal-secondary text-sm px-6 py-3.5 shadow-brutal-lg"
                >
                  <span>See how it works</span>
                </a>
              </div>

              {/* Principle Statement */}
              <div className="pt-4 flex items-center gap-3 text-xs font-mono font-semibold text-ink">
                <div className="p-1 bg-teal-primary text-white border border-ink">
                  <CheckCircle2 className="w-3.5 h-3.5 text-lime-accent" />
                </div>
                <span>AI-assisted analysis &bull; Investigator-led decisions &bull; Complete Audit Provenance</span>
              </div>
            </div>

            {/* Hero Product UI Slice Mockup (Right 5 cols) */}
            <div className="lg:col-span-5">
              <div className="card-brutal p-0 shadow-brutal-xl bg-white overflow-hidden">
                {/* Mockup Titlebar */}
                <div className="bg-ink text-white px-4 py-3 border-b-2 border-ink flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-rose-500 border border-white inline-block" />
                    <span className="w-3 h-3 bg-amber-400 border border-white inline-block" />
                    <span className="w-3 h-3 bg-emerald-400 border border-white inline-block" />
                    <span className="ml-2 font-mono text-xs font-bold uppercase text-paper tracking-wider">
                      DEV-2026-014 &bull; Fluid Bed Drying
                    </span>
                  </div>
                  <span className="bg-lime-accent text-ink px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-white">
                    LIVE RCA
                  </span>
                </div>

                {/* Subheader info bar */}
                <div className="bg-paper border-b-2 border-ink p-3 flex items-center justify-between text-[11px] font-mono">
                  <div>
                    <span className="text-muted">Batch: </span>
                    <strong className="text-ink">API-2026-014</strong>
                  </div>
                  <div>
                    <span className="text-muted">Status: </span>
                    <span className="bg-amber-100 text-ink border border-ink px-1.5 py-0.2 font-bold uppercase">
                      In Review
                    </span>
                  </div>
                </div>

                {/* Interactive Mockup Tabs */}
                <div className="flex border-b-2 border-ink bg-slate-100 text-[11px] font-display font-bold uppercase">
                  <button
                    type="button"
                    onClick={() => setActiveHeroTab('causes')}
                    className={`flex-1 py-2 text-center border-r-2 border-ink transition-colors ${
                      activeHeroTab === 'causes' ? 'bg-white text-ink border-b-2 border-b-white -mb-[2px]' : 'bg-paper text-muted hover:text-ink'
                    }`}
                  >
                    Root Causes (2)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHeroTab('evidence')}
                    className={`flex-1 py-2 text-center border-r-2 border-ink transition-colors ${
                      activeHeroTab === 'evidence' ? 'bg-white text-ink border-b-2 border-b-white -mb-[2px]' : 'bg-paper text-muted hover:text-ink'
                    }`}
                  >
                    Facts & Gaps (3)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHeroTab('capa')}
                    className={`flex-1 py-2 text-center transition-colors ${
                      activeHeroTab === 'capa' ? 'bg-white text-ink border-b-2 border-b-white -mb-[2px]' : 'bg-paper text-muted hover:text-ink'
                    }`}
                  >
                    CAPA Review (2)
                  </button>
                </div>

                {/* Mockup Tab Contents */}
                <div className="p-4 space-y-3 bg-white min-h-[290px]">
                  {activeHeroTab === 'causes' && (
                    <div className="space-y-3">
                      {/* Hypothesis 1 */}
                      <div className="border-2 border-ink p-3 bg-paper shadow-brutal-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-teal-primary text-white px-1.5 py-0.5">
                            Hypothesis 1 &bull; Mechanical
                          </span>
                          <span className="font-mono text-[10px] font-bold uppercase bg-amber-200 text-ink border border-ink px-1.5 py-0.5">
                            Pending Human Review
                          </span>
                        </div>
                        <p className="text-xs font-bold text-ink leading-snug">
                          Condenser chilled water temperature reached 18&deg;C (spec: 8-12&deg;C), degrading drying vacuum to 45 mbar.
                        </p>
                        <div className="text-[10px] text-muted font-mono bg-white p-1.5 border border-ink">
                          Provenance: Deviation_Log.pdf &bull; Page 2, Para 4
                        </div>
                        {/* Human Decision Triad Buttons */}
                        <div className="pt-1 flex items-center gap-1.5">
                          <span className="text-[10px] font-display font-bold uppercase text-ink">Action:</span>
                          <button type="button" className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 border border-ink text-[10px] font-mono font-bold text-emerald-900 shadow-brutal-xs">
                            &check; Accept
                          </button>
                          <button type="button" className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 border border-ink text-[10px] font-mono font-bold text-amber-900 shadow-brutal-xs">
                            ? Need Data
                          </button>
                          <button type="button" className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 border border-ink text-[10px] font-mono font-bold text-rose-900 shadow-brutal-xs">
                            &times; Reject
                          </button>
                        </div>
                      </div>

                      {/* Hypothesis 2 */}
                      <div className="border border-ink p-2.5 bg-white space-y-1 text-xs">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="font-semibold text-muted">Hypothesis 2 &bull; Method</span>
                          <span className="bg-rose-100 text-rose-800 border border-ink px-1 font-bold uppercase">Rejected by QA</span>
                        </div>
                        <p className="text-muted leading-tight text-[11px]">
                          Excessive nitrogen purge flow rate &mdash; ruled out (purge log verified at constant 15 Nm&sup3;/h).
                        </p>
                      </div>
                    </div>
                  )}

                  {activeHeroTab === 'evidence' && (
                    <div className="space-y-3">
                      <div className="border-2 border-ink p-2.5 bg-paper space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <strong className="text-teal-primary uppercase">Extracted Fact</strong>
                          <span className="text-emerald-800 bg-emerald-100 px-1 border border-ink font-bold">Verified</span>
                        </div>
                        <p className="text-xs font-semibold text-ink">
                          Residual Solvent: 0.65% Ethanol (OOS vs limit &le; 0.50%)
                        </p>
                        <p className="text-[10px] text-muted font-mono">Source: QC_Certificate_DEV014.pdf</p>
                      </div>

                      <div className="border-2 border-ink p-2.5 bg-rose-50 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <strong className="text-rose-800 uppercase flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-700" />
                            Evidence Gap Identified
                          </strong>
                          <span className="bg-rose-200 text-rose-900 px-1 border border-ink font-bold">Unresolved</span>
                        </div>
                        <p className="text-xs font-bold text-ink">
                          Tray loading depth unrecorded in batch execution record.
                        </p>
                        <p className="text-[10px] text-muted leading-snug">
                          Impact: Cannot conclusively eliminate cake depth resistance without calibration test.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeHeroTab === 'capa' && (
                    <div className="space-y-3">
                      <div className="border-2 border-ink p-2.5 bg-paper space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="bg-teal-primary text-white px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase">
                            Corrective Action
                          </span>
                          <span className="bg-emerald-100 text-emerald-900 border border-ink px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase">
                            QA Approved
                          </span>
                        </div>
                        <p className="text-xs font-bold text-ink">
                          Replace condenser cooling loop pneumatic actuator valve and verify seal pressure.
                        </p>
                        <div className="text-[10px] font-mono text-muted">
                          Target: Primary condenser circuit &bull; Due: Prior to Batch API-2026-015
                        </div>
                      </div>

                      <div className="border-2 border-ink p-2.5 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="bg-lime-accent text-ink px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase border border-ink">
                            Preventive Action
                          </span>
                          <span className="bg-amber-100 text-amber-900 border border-ink px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase">
                            Proposed
                          </span>
                        </div>
                        <p className="text-xs font-bold text-ink">
                          Implement continuous secondary chiller temperature alarm interlock with SCADA trip.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mockup Footer */}
                <div className="bg-paper border-t-2 border-ink p-2.5 flex items-center justify-between text-[10px] font-mono text-muted">
                  <span>FastAPI + PostgreSQL + LangGraph</span>
                  <span className="font-bold text-ink">&bull; Fictional Demo Instance</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Product Credibility Strip: The 4-Step Provenance Highway */}
      <section className="bg-ink text-white border-b-2 border-ink py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-white/30 p-3 bg-white/5 space-y-1">
              <span className="font-mono text-[10px] text-lime-accent font-bold uppercase">STEP 01</span>
              <h4 className="font-display font-bold text-sm tracking-wide text-white">SOURCE INTAKE</h4>
              <p className="text-[11px] text-slate-300">Pasted reports, emails &amp; local PDF parsing</p>
            </div>
            <div className="border border-white/30 p-3 bg-white/5 space-y-1">
              <span className="font-mono text-[10px] text-lime-accent font-bold uppercase">STEP 02</span>
              <h4 className="font-display font-bold text-sm tracking-wide text-white">FACTS &amp; GAPS</h4>
              <p className="text-[11px] text-slate-300">Evidence provenance &amp; unaddressed data tags</p>
            </div>
            <div className="border border-white/30 p-3 bg-white/5 space-y-1">
              <span className="font-mono text-[10px] text-lime-accent font-bold uppercase">STEP 03</span>
              <h4 className="font-display font-bold text-sm tracking-wide text-white">CAUSAL DEDUCTION</h4>
              <p className="text-[11px] text-slate-300">5 Whys chains &amp; 6M Ishikawa diagrams</p>
            </div>
            <div className="border border-white/30 p-3 bg-white/5 space-y-1">
              <span className="font-mono text-[10px] text-lime-accent font-bold uppercase">STEP 04</span>
              <h4 className="font-display font-bold text-sm tracking-wide text-white">HUMAN SIGN-OFF</h4>
              <p className="text-[11px] text-slate-300">QA decision triad &amp; append-only audit log</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution Editorial Section */}
      <section className="py-20 border-b-2 border-ink bg-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl space-y-4">
            <div className="inline-block px-2.5 py-0.5 bg-paper border border-ink text-xs font-mono font-bold uppercase tracking-wider text-teal-deep">
              CRITICAL PRODUCT PHILOSOPHY
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-ink leading-tight">
              Generic AI invents answers. <br />
              <span className="bg-lime-accent px-2 py-0.5 inline-block border-2 border-ink">PharmaLens enforces evidence.</span>
            </h2>
            <p className="text-muted text-sm sm:text-base leading-relaxed">
              In Active Pharmaceutical Ingredient manufacturing, concluding a root cause without verifiable evidence creates catastrophic regulatory and batch-release risks. PharmaLens was engineered to stop speculative hallucinations before they enter quality records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Industry Failure Mode */}
            <div className="card-brutal p-6 bg-white border-2 border-ink shadow-brutal space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-ink">
                <h3 className="font-display font-bold text-lg text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  The Problem with Generic AI
                </h3>
                <span className="font-mono text-[11px] font-bold uppercase bg-rose-100 text-rose-800 px-2 py-0.5 border border-ink">
                  High Risk
                </span>
              </div>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-rose-600 text-sm">&times;</span>
                  <div>
                    <strong>Fabricated Confidence:</strong> Conflates speculative drying anomalies with proven mechanical failures without physical instrumentation data.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-rose-600 text-sm">&times;</span>
                  <div>
                    <strong>Invisible Evidence Gaps:</strong> Fails to notify the QA reviewer when batch logs, cleaning records, or calibration dates are absent.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-rose-600 text-sm">&times;</span>
                  <div>
                    <strong>Black-Box Automation:</strong> Silently signs off on CAPA implementations without an auditable human-in-the-loop signoff.
                  </div>
                </li>
              </ul>
            </div>

            {/* The PharmaLens Standard */}
            <div className="card-brutal p-6 bg-paper border-2 border-ink shadow-brutal space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-ink">
                <h3 className="font-display font-bold text-lg text-teal-deep flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-primary" />
                  The PharmaLens Guarantee
                </h3>
                <span className="font-mono text-[11px] font-bold uppercase bg-lime-accent text-ink px-2 py-0.5 border border-ink">
                  Audit-Ready
                </span>
              </div>
              <ul className="space-y-3 text-xs text-slate-800">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-teal-primary text-sm">&check;</span>
                  <div>
                    <strong>Every Fact Traced to Provenance:</strong> Extracted measurements link directly to original document page numbers and text excerpts.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-teal-primary text-sm">&check;</span>
                  <div>
                    <strong>Explicit Human Decision Triad:</strong> Hypotheses must be explicitly Accepted as Finding, Marked for Evidence, or Rejected by QA.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-teal-primary text-sm">&check;</span>
                  <div>
                    <strong>Append-Only Audit Log:</strong> Every status transition, fact application, and review decision is stored with full JSON diffs in PostgreSQL.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section id="capabilities" className="py-20 border-b-2 border-ink bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="px-2.5 py-0.5 bg-lime-accent border border-ink font-mono text-xs font-bold uppercase tracking-wider text-ink">
              ENGINEERED MODULES
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-ink">
              Comprehensive Root Cause Analysis Architecture
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Built on modern LangGraph multi-step orchestration, typed Pydantic contracts, and PostgreSQL transactional persistence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="card-brutal p-6 space-y-3 hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-teal-primary text-white border-2 border-ink flex items-center justify-center font-bold shadow-brutal-xs">
                <FileText className="w-5 h-5 text-lime-accent" />
              </div>
              <h3 className="font-display font-bold text-base text-ink">Source Intake &amp; Isolation</h3>
              <p className="text-xs text-muted leading-relaxed">
                Ingest pasted incident text, QA emails, or uploaded PDF deviation reports. Cross-investigation source isolation prevents unauthorized document access.
              </p>
              <div className="pt-2 font-mono text-[10px] text-teal-deep font-bold uppercase">
                &bull; PyPDF &bull; Multi-Part &bull; 409 Isolation Guard
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card-brutal p-6 space-y-3 hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-lime-accent text-ink border-2 border-ink flex items-center justify-center font-bold shadow-brutal-xs">
                <Sparkles className="w-5 h-5 text-ink" />
              </div>
              <h3 className="font-display font-bold text-base text-ink">Evidence-Linked Fact Extraction</h3>
              <p className="text-xs text-muted leading-relaxed">
                Extracts batch IDs, observed solvent levels, process parameters, and deviations. Investigators can review and commit verified facts directly into the formal record.
              </p>
              <div className="pt-2 font-mono text-[10px] text-teal-deep font-bold uppercase">
                &bull; Direct Form Application &bull; Full Delta Audit
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card-brutal p-6 space-y-3 hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-rose-100 text-rose-800 border-2 border-ink flex items-center justify-center font-bold shadow-brutal-xs">
                <AlertTriangle className="w-5 h-5 text-rose-700" />
              </div>
              <h3 className="font-display font-bold text-base text-ink">Evidence Gap Identification</h3>
              <p className="text-xs text-muted leading-relaxed">
                Identifies missing data points (such as unrecorded tray bed depths or absent temperature logs) and blocks investigation sign-off until addressed.
              </p>
              <div className="pt-2 font-mono text-[10px] text-rose-800 font-bold uppercase">
                &bull; Lifecycle Completion Guard &bull; Status Tracking
              </div>
            </div>

            {/* Feature 4 */}
            <div className="card-brutal p-6 space-y-3 hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-paper text-ink border-2 border-ink flex items-center justify-center font-bold shadow-brutal-xs">
                <GitBranch className="w-5 h-5 text-teal-primary" />
              </div>
              <h3 className="font-display font-bold text-base text-ink">5 Whys &amp; 6M Fishbone</h3>
              <p className="text-xs text-muted leading-relaxed">
                Deductive causal chaining that terminates early when evidence is exhausted, preventing forced speculation across Man, Machine, Method, Material, Measurement, and Milieu.
              </p>
              <div className="pt-2 font-mono text-[10px] text-teal-deep font-bold uppercase">
                &bull; Ishikawa Mapping &bull; Non-Forced Whys
              </div>
            </div>

            {/* Feature 5 */}
            <div className="card-brutal p-6 space-y-3 hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-teal-light text-teal-deep border-2 border-ink flex items-center justify-center font-bold shadow-brutal-xs">
                <ShieldCheck className="w-5 h-5 text-teal-primary" />
              </div>
              <h3 className="font-display font-bold text-base text-ink">Actionable CAPA Review</h3>
              <p className="text-xs text-muted leading-relaxed">
                Generates containment, corrective, and preventive recommendations tied directly to confirmed root causes. Human reviewers record accept/modify/reject decisions.
              </p>
              <div className="pt-2 font-mono text-[10px] text-teal-deep font-bold uppercase">
                &bull; Containment &bull; Corrective &bull; Preventive
              </div>
            </div>

            {/* Feature 6 */}
            <div className="card-brutal p-6 space-y-3 hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-amber-100 text-ink border-2 border-ink flex items-center justify-center font-bold shadow-brutal-xs">
                <History className="w-5 h-5 text-amber-800" />
              </div>
              <h3 className="font-display font-bold text-base text-ink">Append-Only Audit Trail</h3>
              <p className="text-xs text-muted leading-relaxed">
                Immutable event stream in PostgreSQL recording transitions, source actions, fact corrections, QA rationale, and before/after diffs with UTC timestamps.
              </p>
              <div className="pt-2 font-mono text-[10px] text-teal-deep font-bold uppercase">
                &bull; Indexed Timeline &bull; JSON Diff Inspector
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Human Oversight Banner */}
      <section id="human-oversight" className="py-16 border-b-2 border-ink bg-teal-deep text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-block px-3 py-1 bg-lime-accent border-2 border-white text-ink text-xs font-mono font-bold uppercase tracking-wider">
            NON-NEGOTIABLE CORE DIRECTIVE
          </div>
          <h2 className="font-display font-black text-3xl sm:text-5xl leading-tight text-white">
            &ldquo;AI can suggest a cause.<br />Only evidence and human review can establish a finding.&rdquo;
          </h2>
          <p className="text-teal-100 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            PharmaLens actively prohibits the system from auto-completing investigations, auto-closing CAPAs, or presenting model hypotheses as confirmed factual conclusions without qualified human QA signoff.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <Link
              to="/dashboard"
              className="btn-brutal-lime text-xs px-6 py-3 font-bold"
            >
              Open Active Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* Architecture & Verification Section */}
      <section id="architecture" className="py-20 border-b-2 border-ink bg-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-teal-deep bg-white px-2 py-0.5 border border-ink">
                TECHNICAL RIGOR
              </span>
              <h2 className="font-display font-black text-3xl text-ink mt-2">
                Production-Hardened System Architecture
              </h2>
            </div>
            <div className="font-mono text-xs text-muted">
              Built &amp; Verified in Phase 3
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card-brutal p-4 space-y-2">
              <span className="font-mono text-[10px] font-bold text-muted uppercase">BACKEND ENGINE</span>
              <h4 className="font-display font-bold text-sm text-ink">FastAPI (Python 3.12)</h4>
              <p className="text-xs text-muted">Pydantic validation, safe error classification, bounded retries &amp; secret sanitation.</p>
            </div>
            <div className="card-brutal p-4 space-y-2">
              <span className="font-mono text-[10px] font-bold text-muted uppercase">DATABASE ENGINE</span>
              <h4 className="font-display font-bold text-sm text-ink">PostgreSQL + SQLAlchemy</h4>
              <p className="text-xs text-muted">Alembic schema migrations, composite index audit logs &amp; cascaded entity isolation.</p>
            </div>
            <div className="card-brutal p-4 space-y-2">
              <span className="font-mono text-[10px] font-bold text-muted uppercase">AI ORCHESTRATION</span>
              <h4 className="font-display font-bold text-sm text-ink">LangGraph + Groq LLM</h4>
              <p className="text-xs text-muted">Deterministic multi-node flow with prompt injection defenses &amp; failure isolation.</p>
            </div>
            <div className="card-brutal p-4 space-y-2">
              <span className="font-mono text-[10px] font-bold text-muted uppercase">TEST COVERAGE</span>
              <h4 className="font-display font-bold text-sm text-ink">34 Verified Pytest Cases</h4>
              <p className="text-xs text-muted">Full regression suite covering lifecycle transitions, audit trail &amp; end-to-end demo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-20 bg-white border-b-2 border-ink">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="font-display font-black text-3xl sm:text-4xl text-ink">
            Ready to investigate with intelligence?
          </h2>
          <p className="text-muted text-sm max-w-xl mx-auto">
            Experience the complete Phase 3 PharmaLens workflow with the fictional Active Pharmaceutical Ingredient drying deviation scenario.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              to="/investigations/new"
              className="btn-brutal-primary text-sm px-8 py-4 shadow-brutal-lg"
            >
              <span>Create New Investigation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/investigations"
              className="btn-brutal-secondary text-sm px-8 py-4 shadow-brutal-lg"
            >
              <span>Browse Registry</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Technical Footer */}
      <footer className="bg-ink text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/20">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-lime-accent" />
                <span className="font-display font-bold text-lg text-white">PharmaLens</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                See Beyond the Deviation. Investigate with intelligence. Act with evidence.
              </p>
            </div>

            <div className="flex items-center gap-6 text-xs font-mono font-bold">
              <Link to="/dashboard" className="text-slate-300 hover:text-lime-accent">Dashboard</Link>
              <Link to="/investigations" className="text-slate-300 hover:text-lime-accent">Registry</Link>
              <Link to="/investigations/new" className="text-slate-300 hover:text-lime-accent">New Investigation</Link>
              <Link to="/settings" className="text-slate-300 hover:text-lime-accent">Platform Settings</Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-400 gap-4">
            <p>PharmaLens Prototype &bull; Engineered for Pharmaceutical Decision Support &bull; All data illustrative</p>
            <p>PostgreSQL 16 &bull; FastAPI &bull; LangGraph &bull; React 18</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
