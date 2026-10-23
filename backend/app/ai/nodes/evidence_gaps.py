import logging
from typing import Dict, Any, List
from app.ai.state import InvestigationGraphState
from app.ai.config import GroqClientManager
from app.ai.prompts import EVIDENCE_GAPS_SYSTEM_PROMPT

logger = logging.getLogger("pharmalens.ai.evidence_gaps")

def evidence_gaps_node(state: InvestigationGraphState) -> Dict[str, Any]:
    """
    Node 4: Missing Fields & Evidence Gap Analysis.
    Differentiates intake form omissions from investigative physical evidence gaps.
    """
    context = state.get("normalized_source_context", "")
    investigation = state.get("investigation_snapshot", {})
    manifest = state.get("source_manifest", [])
    existing_missing = list(state.get("missing_fields", []))
    warnings = list(state.get("analysis_warnings", []))
    failed_nodes = list(state.get("failed_nodes", []))

    user_prompt = (
        f"Identify all missing investigation fields and critical evidence gaps for this deviation:\n\n{context}"
    )

    evidence_gaps: List[Dict[str, Any]] = []

    try:
        response_json = GroqClientManager.generate_chat_json(
            system_prompt=EVIDENCE_GAPS_SYSTEM_PROMPT,
            user_prompt=user_prompt,
        )
        llm_missing = response_json.get("missing_fields", [])
        for mf in llm_missing:
            if mf not in existing_missing:
                existing_missing.append(mf)

        evidence_gaps = response_json.get("evidence_gaps", [])

    except Exception as e:
        logger.warning("Evidence gap node fallback due to error: %s", str(e))
        warnings.append(f"Evidence gaps warning: {str(e)}")
        failed_nodes.append("evidence_gaps")

        # Deterministic domain-specific fallback for pharmaceutical deviations
        evidence_gaps = [
            {
                "gap_id": "GAP-01",
                "category": "Process Log",
                "description": "Continuous process temperature and vacuum drying pressure trends for batch duration were not included in supplied materials.",
                "why_it_matters": "Critical to establish whether heating and vacuum cycles conformed to validated drying limits.",
                "recommended_evidence_to_obtain": "SCADA drying trend charts and Batch Production Record drying step signatures.",
                "priority": "High",
                "status": "missing",
                "supporting_source_ids": [m["source_id"] for m in manifest] if manifest else ["INV-CONTEXT"],
            },
            {
                "gap_id": "GAP-02",
                "category": "Equipment Calibration",
                "description": "Calibration and routine maintenance logs for the drying unit vacuum gauge and temperature probes were not provided.",
                "why_it_matters": "Uncalibrated instrumentation can lead to inaccurate process conditions without operator awareness.",
                "recommended_evidence_to_obtain": "Instrumentation calibration certificate and maintenance check records.",
                "priority": "Medium",
                "status": "missing",
                "supporting_source_ids": [m["source_id"] for m in manifest] if manifest else ["INV-CONTEXT"],
            },
            {
                "gap_id": "GAP-03",
                "category": "Analytical Method",
                "description": "Raw chromatographic test data, standard curve integration, and duplicate test records were not provided.",
                "why_it_matters": "Necessary to verify analytical method TM-SOLV-01 fidelity and rule out testing/sample preparation artifact.",
                "recommended_evidence_to_obtain": "QC Analytical test pack and chromatogram integration report.",
                "priority": "High",
                "status": "missing",
                "supporting_source_ids": [m["source_id"] for m in manifest] if manifest else ["INV-CONTEXT"],
            }
        ]

    # Additional deterministic check for essential missing fields
    essential_checks = {
        "batch_number": "Batch / lot number is not recorded in the investigation.",
        "actual_result": "Quantitative observed analytical/process result is missing.",
        "acceptance_criterion": "Approved specification acceptance criterion is missing.",
        "process_step": "Process unit operation step is not specified."
    }
    for field, desc in essential_checks.items():
        if not investigation.get(field) and field not in existing_missing:
            existing_missing.append(field)

    return {
        "missing_fields": existing_missing,
        "evidence_gaps": evidence_gaps,
        "analysis_warnings": warnings,
        "failed_nodes": failed_nodes,
    }
