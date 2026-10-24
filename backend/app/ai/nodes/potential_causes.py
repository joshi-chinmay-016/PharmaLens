import logging
from typing import Dict, Any, List
from app.ai.state import InvestigationGraphState
from app.ai.config import GroqClientManager
from app.ai.prompts import POTENTIAL_CAUSES_SYSTEM_PROMPT

logger = logging.getLogger("pharmalens.ai.potential_causes")

def potential_causes_node(state: InvestigationGraphState) -> Dict[str, Any]:
    """
    Node 5: Potential Root Causes & Contributing Factors.
    Generates unconfirmed hypotheses grounded in source evidence with ranking rationale.
    """
    context = state.get("normalized_source_context", "")
    manifest = state.get("source_manifest", [])
    extracted_facts = state.get("extracted_facts", [])
    evidence_gaps = state.get("evidence_gaps", [])
    warnings = list(state.get("analysis_warnings", []))
    failed_nodes = list(state.get("failed_nodes", []))

    user_prompt = (
        f"Based on the following evidence and gaps, propose evidence-grounded root cause hypotheses:\n\n{context}\n\n"
        f"Key Extracted Facts: {[f['field_name'] + ': ' + str(f['extracted_value']) for f in extracted_facts[:6]]}\n"
        f"Identified Evidence Gaps: {[g.get('description', '') for g in evidence_gaps[:4]]}"
    )

    potential_root_causes: List[Dict[str, Any]] = []
    contributing_factors: List[str] = []

    try:
        response_json = GroqClientManager.generate_chat_json(
            system_prompt=POTENTIAL_CAUSES_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=240,
        )
        potential_root_causes = response_json.get("potential_root_causes", [])
        contributing_factors = response_json.get("contributing_factors", [])

        # Quality Assurance Post-Processing: strictly enforce unconfirmed status
        for prc in potential_root_causes:
            prc["is_confirmed_by_human"] = False
            if prc.get("review_status") not in ["suggested", "under_investigation"]:
                prc["review_status"] = "suggested"

    except Exception as e:
        logger.warning("Potential causes node fallback due to error: %s", str(e))
        warnings.append(f"Potential causes warning: {str(e)}")
        failed_nodes.append("potential_causes")

        # Deterministic domain-grounded fallback hypotheses for pharmaceutical drying / OOS
        default_src_id = manifest[0]["source_id"] if manifest else "INV-CONTEXT"
        potential_root_causes = [
            {
                "cause_id": "PRC-01",
                "title": "Incomplete Vacuum Drying Cycle or Pressure Loss",
                "explanation": (
                    "Hypothesis: Insufficient vacuum depth or intermittent vacuum loss during the final drying phase "
                    "prevented thorough desolvation of the API cake, leaving residual solvent above acceptance limit."
                ),
                "category": "Process / Unit Operation",
                "evidence_for": ["Observed solvent result exceeds acceptance criterion", "Vacuum drying process step"],
                "evidence_against_or_missing": ["Continuous vacuum trend log not provided in supplied records"],
                "supporting_source_ids": [default_src_id],
                "supporting_excerpts": ["Residual solvent reported as exceeding specification limit"],
                "plausibility": "High",
                "ranking_rationale": "High plausibility because drying duration and vacuum pressure directly dictate solvent desorption kinetics.",
                "investigation_questions": [
                    "Did the condenser temperature maintain condensation capacity?",
                    "Were vacuum seal integrity tests performed prior to batch execution?"
                ],
                "recommended_next_step": "Extract and inspect SCADA continuous vacuum and temperature trend charts.",
                "review_status": "suggested",
                "is_confirmed_by_human": False,
            },
            {
                "cause_id": "PRC-02",
                "title": "Shelf Temperature Non-Uniformity or Heating Element Failure",
                "explanation": (
                    "Hypothesis: Localized temperature variations across heated dryer trays may have resulted in cold spots, "
                    "leading to localized pockets of unevaporated solvent in tray sections."
                ),
                "category": "Equipment",
                "evidence_for": ["Vacuum tray dryer configuration"],
                "evidence_against_or_missing": ["Tray temperature profile and thermal mapping records were not provided"],
                "supporting_source_ids": [default_src_id],
                "supporting_excerpts": ["Drying tray unit operation"],
                "plausibility": "Medium",
                "ranking_rationale": "Medium plausibility; depends on tray layout and circulating fluid temperature consistency.",
                "investigation_questions": [
                    "Were individual tray thermal sensors calibrated?",
                    "Was composite sampling representative of all shelves?"
                ],
                "recommended_next_step": "Check multi-point temperature data across all dryer shelves during the cycle.",
                "review_status": "suggested",
                "is_confirmed_by_human": False,
            },
            {
                "cause_id": "PRC-03",
                "title": "Analytical Sampling or Sample Preparation Artifact",
                "explanation": (
                    "Hypothesis: Sample handling, vial headspace equilibration, or solvent absorption during sampling "
                    "may have influenced the quantitative GC/HPLC residual solvent peak area."
                ),
                "category": "Analytical / Method",
                "evidence_for": ["Analytical testing required to generate reported result"],
                "evidence_against_or_missing": ["Re-test data and duplicate preparation logs are not provided"],
                "supporting_source_ids": [default_src_id],
                "supporting_excerpts": ["Reported analytical test result"],
                "plausibility": "Medium",
                "ranking_rationale": "Medium plausibility; standard OOS laboratory investigation procedure requires ruling out lab error first.",
                "investigation_questions": [
                    "Was analytical equipment calibration current?",
                    "Did system suitability and standard recoveries meet test method criteria?"
                ],
                "recommended_next_step": "Execute Phase 1 Laboratory OOS investigation checklist before confirming manufacturing fault.",
                "review_status": "suggested",
                "is_confirmed_by_human": False,
            }
        ]
        contributing_factors = [
            "Raw material solvent lot variability",
            "Ambient relative humidity during tray loading",
            "Cake thickness variations on dryer trays"
        ]

    return {
        "potential_root_causes": potential_root_causes,
        "contributing_factors": contributing_factors,
        "analysis_warnings": warnings,
        "failed_nodes": failed_nodes,
    }
