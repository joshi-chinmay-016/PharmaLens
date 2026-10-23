import logging
from typing import Dict, Any, List
from app.ai.state import InvestigationGraphState
from app.ai.config import GroqClientManager
from app.ai.prompts import FACT_EXTRACTION_SYSTEM_PROMPT

logger = logging.getLogger("pharmalens.ai.extract_facts")

def extract_facts_node(state: InvestigationGraphState) -> Dict[str, Any]:
    """
    Node 2: Structured Fact Extraction.
    Extracts facts from source material and maps them to the investigation schema.
    """
    context = state.get("normalized_source_context", "")
    manifest = state.get("source_manifest", [])
    investigation = state.get("investigation_snapshot", {})
    warnings = list(state.get("analysis_warnings", []))
    failed_nodes = list(state.get("failed_nodes", []))

    user_prompt = f"Analyze the following investigation context and source documents to extract verifiable facts:\n\n{context}"

    extracted_facts: List[Dict[str, Any]] = []
    missing_fields: List[str] = []

    try:
        response_json = GroqClientManager.generate_chat_json(
            system_prompt=FACT_EXTRACTION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
        )
        raw_facts = response_json.get("extracted_facts", [])
        missing_fields = response_json.get("missing_fields", [])

        # Enrich and check against current investigation form values
        for f in raw_facts:
            f_name = f.get("field_name")
            val = f.get("extracted_value")
            if not f_name or val is None or val == "":
                continue

            current_val = str(investigation.get(f_name) or "").strip()
            extracted_str = str(val).strip()

            # Mark whether this extracted fact proposes a new or updated value
            is_proposed = bool(extracted_str and extracted_str.lower() != current_val.lower())

            fact_obj = {
                "field_name": f_name,
                "extracted_value": val,
                "confidence_score": float(f.get("confidence_score", 0.9)),
                "source_id": f.get("source_id") or (manifest[0]["source_id"] if manifest else "INV-CONTEXT"),
                "source_snippet": f.get("source_snippet") or "",
                "verification_status": f.get("verification_status", "extracted_from_source"),
                "proposed_for_form": is_proposed,
                "current_form_value": current_val or None,
            }
            extracted_facts.append(fact_obj)

    except Exception as e:
        logger.warning("Fact extraction node fallback due to error: %s", str(e))
        warnings.append(f"Fact extraction warning: {str(e)}")
        failed_nodes.append("extract_facts")
        
        # Fallback extraction from investigation snapshot directly to guarantee deterministic safety
        fallback_fields = ["product_name", "batch_number", "actual_result", "acceptance_criterion", "process_step"]
        for ff in fallback_fields:
            if investigation.get(ff):
                extracted_facts.append({
                    "field_name": ff,
                    "extracted_value": investigation[ff],
                    "confidence_score": 0.95,
                    "source_id": manifest[0]["source_id"] if manifest else "INV-CONTEXT",
                    "source_snippet": f"{ff}: {investigation[ff]}",
                    "verification_status": "extracted_from_source",
                    "proposed_for_form": False,
                    "current_form_value": str(investigation[ff]),
                })

    return {
        "extracted_facts": extracted_facts,
        "missing_fields": missing_fields,
        "analysis_warnings": warnings,
        "failed_nodes": failed_nodes,
    }
