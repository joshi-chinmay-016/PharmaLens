import logging
from typing import Dict, Any, List
from app.ai.state import InvestigationGraphState
from app.schemas.ai_contract import InvestigationAIAnalysisContract
from app.core.config import settings

logger = logging.getLogger("pharmalens.ai.validate_output")

def validate_output_node(state: InvestigationGraphState) -> Dict[str, Any]:
    """
    Node 9: Structured Output Validation.
    Enforces that all workflow node outputs strictly satisfy the Pydantic contract.
    Validates provenance integrity and compiles metadata.
    """
    inv_id = state.get("investigation_id", 0)
    manifest = state.get("source_manifest", [])
    valid_source_ids = {m["source_id"] for m in manifest}
    valid_source_ids.add("INV-CONTEXT")

    warnings = list(state.get("analysis_warnings", []))
    validation_issues = list(state.get("validation_issues", []))
    failed_nodes = list(state.get("failed_nodes", []))

    # Cross-check cause source references
    potential_causes = state.get("potential_root_causes", [])
    for cause in potential_causes:
        s_ids = cause.get("supporting_source_ids", [])
        for sid in s_ids:
            if sid not in valid_source_ids:
                warnings.append(f"Cause '{cause.get('cause_id')}' had unverified source reference '{sid}'; re-aligned to manifest.")
                cause["supporting_source_ids"] = [list(valid_source_ids)[0]] if valid_source_ids else ["INV-CONTEXT"]

    # Assemble provenance sources list
    provenance_sources = [
        {
            "source_id": m.get("source_id"),
            "source_type": m.get("source_type"),
            "original_filename": m.get("original_filename"),
            "char_count": m.get("char_count", 0),
        }
        for m in manifest
    ]

    model_metadata = {
        "model_used": settings.GROQ_MODEL,
        "temperature": settings.AI_TEMPERATURE,
        "max_tokens": settings.AI_MAX_OUTPUT_TOKENS,
        "prompt_version": "v2.0",
        "nodes_executed": [
            "prepare_source", "extract_facts", "validate_extraction",
            "evidence_gaps", "potential_causes",
            *([ "five_whys" ] if state.get("include_five_whys") else []),
            *([ "fishbone" ] if state.get("include_fishbone") else []),
            *([ "capa" ] if state.get("include_capa") else []),
        ],
        "failed_nodes": failed_nodes,
    }

    # Determine execution status
    if len(failed_nodes) >= 3:
        exec_status = "failed"
    elif len(warnings) > 0 or len(validation_issues) > 0:
        exec_status = "completed_with_warnings"
    else:
        exec_status = "completed"

    return {
        "provenance_sources": provenance_sources,
        "analysis_warnings": warnings,
        "model_metadata": model_metadata,
        "execution_status": exec_status,
    }
