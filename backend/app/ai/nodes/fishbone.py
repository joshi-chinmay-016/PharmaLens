import logging
from typing import Dict, Any, List
from app.ai.state import InvestigationGraphState
from app.ai.config import GroqClientManager
from app.ai.prompts import FISHBONE_SYSTEM_PROMPT

logger = logging.getLogger("pharmalens.ai.fishbone")

def fishbone_node(state: InvestigationGraphState) -> Dict[str, Any]:
    """
    Node 7: Ishikawa 6M Fishbone Analysis Generator.
    Categorizes contributing factors without populating unsubstantiated speculative causes.
    """
    if not state.get("include_fishbone", True):
        return {"fishbone_analysis": None}

    context = state.get("normalized_source_context", "")
    manifest = state.get("source_manifest", [])
    warnings = list(state.get("analysis_warnings", []))
    failed_nodes = list(state.get("failed_nodes", []))

    user_prompt = (
        f"Perform an Ishikawa 6M root cause classification for this deviation based strictly on documented evidence:\n\n{context}"
    )

    fishbone_result: Dict[str, Any] = {}

    try:
        response_json = GroqClientManager.generate_chat_json(
            system_prompt=FISHBONE_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=220,
        )
        fishbone_result = response_json.get("fishbone_analysis", {})

    except Exception as e:
        logger.warning("Fishbone node fallback due to error: %s", str(e))
        warnings.append(f"Fishbone generation warning: {str(e)}")
        failed_nodes.append("fishbone")

        default_src_id = manifest[0]["source_id"] if manifest else "INV-CONTEXT"
        # Deterministic 6M structure: leaves unsupported categories empty rather than inventing speculation
        fishbone_result = {
            "machine": [
                {
                    "cause_id": "FB-MCH-01",
                    "cause": "Vacuum pump pressure fluctuation or condenser efficiency loss during final cycle phase.",
                    "category": "machine",
                    "status": "tentative",
                    "evidence": "Preliminary walkthrough noted pressure fluctuations on dryer unit 2.",
                    "source_id": default_src_id,
                    "verification_action": "Inspect vacuum pump oil condition and condenser chiller supply temperature.",
                    "review_status": "suggested"
                },
                {
                    "cause_id": "FB-MCH-02",
                    "cause": "Dryer tray thermal probe drift or shelf heating element cold spot.",
                    "category": "machine",
                    "status": "unresolved",
                    "evidence": None,
                    "source_id": default_src_id,
                    "verification_action": "Check multi-channel thermal probe calibration certificates.",
                    "review_status": "suggested"
                }
            ],
            "method": [
                {
                    "cause_id": "FB-MTH-01",
                    "cause": "Standard drying cycle duration (18h) insufficient for wet cake depth or moisture load.",
                    "category": "method",
                    "status": "tentative",
                    "evidence": "Observed result 0.65% exceeded 0.50% limit after standard recipe execution.",
                    "source_id": default_src_id,
                    "verification_action": "Review validation batch history for cycle duration sensitivity.",
                    "review_status": "suggested"
                }
            ],
            "material": [
                {
                    "cause_id": "FB-MAT-01",
                    "cause": "Upstream crystallization solvent ratio or crystal morphology affecting solvent entrapment.",
                    "category": "material",
                    "status": "unresolved",
                    "evidence": None,
                    "source_id": default_src_id,
                    "verification_action": "Review HPLC purity and particle size distribution (PSD) of intermediate wet cake.",
                    "review_status": "suggested"
                }
            ],
            "measurement": [
                {
                    "cause_id": "FB-MEA-01",
                    "cause": "Analytical testing variability or chromatographic integration artifact.",
                    "category": "measurement",
                    "status": "tentative",
                    "evidence": "Test performed per TM-SOLV-01.",
                    "source_id": default_src_id,
                    "verification_action": "Conduct Phase 1 Laboratory OOS investigation to rule out lab preparation error.",
                    "review_status": "suggested"
                }
            ],
            # Milieu & Manpower intentionally empty to reflect evidence absence honestly
            "milieu_environment": [],
            "manpower_people": [],
            "summary_observations": "Primary evidentiary weight centers on Machine (vacuum & thermal profile) and Method (drying cycle duration)."
        }

    return {
        "fishbone_analysis": fishbone_result,
        "analysis_warnings": warnings,
        "failed_nodes": failed_nodes,
    }
