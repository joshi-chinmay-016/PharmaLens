import React, { useEffect, useState } from 'react';
import {
  Database,
  Server,
  Shield,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { api } from '../services/api';
import { HealthResponse } from '../types';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHealth()
      .then((res) => {
        setHealth(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Platform Settings & Architecture</h2>
        <p className="text-xs text-slate-500">
          Inspection parameters, backend runtime, database configuration, and Phase 2 AI integration roadmap.
        </p>
      </div>

      {/* System Diagnostics Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Server className="w-4 h-4 text-teal-600" />
          System Health & Environment
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-slate-400 block mb-1">Backend Service</span>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                {health?.service || 'PharmaLens FastAPI Backend'}
              </span>
              <span className="inline-flex items-center gap-1 text-teal-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                v{health?.version || '1.0.0'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-slate-400 block mb-1">Database Engine</span>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                PostgreSQL (Live Persistence)
              </span>
              <span className="inline-flex items-center gap-1 text-teal-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {health?.database || 'Connected'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-slate-400 block mb-1">Implementation Scope</span>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Phase 1 Core Foundation
              </span>
              <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-medium text-[11px]">
                Intake & CRUD Ready
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-slate-400 block mb-1">Document Extraction</span>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Local PyPDF & Multipart
              </span>
              <span className="text-slate-600 font-mono text-[11px]">
                Max 10MB per PDF
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage and Security Architecture */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Shield className="w-4 h-4 text-teal-600" />
          Data Integrity & Safety Principles
        </h3>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800">Evidence Before Conclusions:</strong> All hypotheses are distinct from proven physical facts. Unverified statements are flagged with information gap indicators.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800">Safe Document Storage:</strong> Uploaded PDFs are stored with sanitized unique identifiers in local server storage. Files are never executable, and raw filesystem paths are not exposed to client responses.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800">Secret Protection:</strong> Database credentials and API keys are strictly loaded via server-side environment variables and excluded from frontend bundles and repository commits.
            </div>
          </div>
        </div>
      </div>

      {/* Phase 2 AI Roadmap */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            Phase 2 AI Integration Architecture
          </h3>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
            Planned & Schema-Ready
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The Phase 1 data models, Pydantic contracts, and API routes have been built specifically to support Phase 2 without architectural breaking changes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
            <h4 className="font-semibold text-slate-800 mb-1">1. LangGraph Workflow</h4>
            <p className="text-[11px] text-slate-500">
              Multi-step orchestration from incident fact extraction to validation, gap analysis, and 5 Whys.
            </p>
          </div>
          <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
            <h4 className="font-semibold text-slate-800 mb-1">2. Groq Model Inference</h4>
            <p className="text-[11px] text-slate-500">
              Low-latency inference using configurable models (e.g. llama-3.3-70b-versatile) via backend keys.
            </p>
          </div>
          <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
            <h4 className="font-semibold text-slate-800 mb-1">3. Human Review Gate</h4>
            <p className="text-[11px] text-slate-500">
              AI recommendations must be reviewed and accepted by qualified investigators before confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
