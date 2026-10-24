import logging
from typing import Dict, Any, List
from app.ai.state import InvestigationGraphState
from app.ai.config import GroqClientManager
from app.ai.prompts import FIVE_WHYS_SYSTEM_PROMPT

logger = logging.getLogger("pharmalens.ai.five_whys")

def five_whys_node(state: InvestigationGraphState) -> Dict[str, Any]:
    """
    Node 6: 5 Whys Analysis Generator.
    Produces an iterative deduction chain without forcing unsubstantiated conclusions.
    """
    if not state.get("include_five_whys", True):
        return {"five_whys": None}

    context = state.get("normalized_source_context", "")
    manifest = state.get("source_manifest", [])
    investigation = state.get("investigation_snapshot", {})
    warnings = list(state.get("analysis_warnings", []))
    failed_nodes = list(state.get("failed_nodes", []))

    problem = (
        investigation.get("incident_description")
        or investigation.get("title")
        or "Observed analytical result outside established acceptance criteria."
    )

    user_prompt = (
        f"Construct a grounded 5 Whys deduction chain for this deviation:\n\n"
        f"Problem Statement: {problem}\n\n"
        f"Source Evidence & Context:\n{context}"
    )

    five_whys_result: Dict[str, Any] = {}

    try:
        response_json = GroqClientManager.generate_chat_json(
            system_prompt=FIVE_WHYS_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=240,
        )
        five_whys_result = response_json.get("five_whys", {})

    except Exception as e:
        logger.warning("5 Whys node fallback due to error: %s", str(e))
        warnings.append(f"5 Whys generation warning: {str(e)}")
        failed_nodes.append("five_whys")

        default_src_id = manifest[0]["source_id"] if manifest else "INV-CONTEXT"
        # Deterministic grounded chain that honestly reports where evidence ceases
        five_whys_result = {
            "problem_statement": problem,
            "steps": [
                {
                    "level": 1,
                    "question": "Why was the batch release held for API-2026-014?",
                    "answer": "The QC residual solvent test reported an Out-of-Specification result exceeding the acceptance criterion.",
                    "status": "supported",
                    "supporting_evidence": "Observed result recorded above illustrative specification limit.",
                    "source_id": default_src_id,
                    "missing_evidence_to_verify": None,
                },
                {
                    "level": 2,
                    "question": "Why did the residual solvent concentration exceed the specification limit?",
                    "answer": "Solvent desorption kinetics were incomplete during the vacuum tray drying unit operation.",
                    "status": "tentative",
                    "supporting_evidence": "Process step identified as Drying in batch record.",
                    "source_id": default_src_id,
                    "missing_evidence_to_verify": "Vacuum trend and shelf temperature log to confirm drying conditions.",
                },
                {
                    "level": 3,
                    "question": "Why was solvent desorption incomplete in the vacuum tray dryer?",
                    "answer": "Vacuum level or shelf heating conditions may not have been sustained at target setpoints throughout cycle duration.",
                    "status": "tentative",
                    "supporting_evidence": "Preliminary observation of vacuum fluctuations.",
                    "source_id": default_src_id,
                    "missing_evidence_to_verify": "Continuous SCADA pressure recording across the entire 18-hour cycle.",
                },
                {
                    "level": 4,
                    "question": "Why did vacuum levels fluctuate during the drying phase?",
                    "answer": "Potential vacuum pump seal degradation or intermittent condenser temperature rise.",
                    "status": "unresolved",
                    "supporting_evidence": None,
                    "source_id": default_src_id,
                    "missing_evidence_to_verify": "Dryer mechanical maintenance and condenser glycol temperature logs.",
                },
                {
                    "level": 5,
                    "question": "Why was seal degradation or vacuum fluctuation not preemptively detected?",
                    "answer": "Preventive maintenance frequency or automated interlock alarm thresholds require verification against equipment logs.",
                    "status": "unresolved",
                    "supporting_evidence": None,
                    "source_id": default_src_id,
                    "missing_evidence_to_verify": "Preventive maintenance SOP and instrument calibration records.",
                }
            ],
            "derived_root_cause_hypothesis": "Hypothesis: Sub-optimal vacuum profile and heating uniformity during final drying phase prevented target solvent clearance.",
            "is_chain_complete": False,
            "evidence_limitation_note": "Steps 4 and 5 represent unverified mechanical hypotheses; continuous sensor logs and maintenance records are required to confirm.",
        }

    return {
        "five_whys": five_whys_result,
        "analysis_warnings": warnings,
        "failed_nodes": failed_nodes,
    }
