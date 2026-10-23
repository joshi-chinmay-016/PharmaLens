import logging
from typing import Dict, Any, List
from app.ai.state import InvestigationGraphState

logger = logging.getLogger("pharmalens.ai.validate_extraction")

VALID_INVESTIGATION_FIELDS = {
    "title", "incident_reference", "status", "incident_description",
    "incident_datetime", "discovery_datetime", "product_name", "batch_number",
    "manufacturing_site", "process_step", "incident_category", "expected_result",
    "actual_result", "acceptance_criterion", "immediate_impact", "immediate_containment",
    "reporter_name", "known_facts", "initial_observations", "evidence_available", "investigation_notes"
}

def validate_extraction_node(state: InvestigationGraphState) -> Dict[str, Any]:
    """
    Node 3: Deterministic Python validation of extracted facts and provenance references.
    Flags discrepancies, unknown fields, and invalid source IDs.
    """
    extracted_facts = state.get("extracted_facts", [])
    manifest = state.get("source_manifest", [])
    valid_source_ids = {m["source_id"] for m in manifest}
    valid_source_ids.add("INV-CONTEXT")

    validation_issues: List[str] = list(state.get("validation_issues", []))
    validated_facts: List[Dict[str, Any]] = []

    seen_fields: Dict[str, str] = {}

    for fact in extracted_facts:
        field_name = fact.get("field_name")
        val = fact.get("extracted_value")
        s_id = fact.get("source_id")

        # 1. Field name check
        if field_name not in VALID_INVESTIGATION_FIELDS:
            validation_issues.append(f"Extracted field '{field_name}' is not in standard investigation schema.")

        # 2. Source ID provenance check
        if s_id and s_id not in valid_source_ids:
            validation_issues.append(f"Fact '{field_name}' referenced source '{s_id}' which was not in the source manifest.")
            # Auto-realign to first valid source or investigation context
            fact["source_id"] = list(valid_source_ids)[0] if valid_source_ids else "INV-CONTEXT"

        # 3. Detect conflicting values between multiple sources
        val_str = str(val).strip()
        if field_name in seen_fields and seen_fields[field_name].lower() != val_str.lower():
            issue = f"Potential conflicting values detected for '{field_name}': '{seen_fields[field_name]}' vs '{val_str}'"
            validation_issues.append(issue)
            fact["verification_status"] = "contradictory"
        else:
            seen_fields[field_name] = val_str

        validated_facts.append(fact)

    return {
        "extracted_facts": validated_facts,
        "validation_issues": validation_issues,
    }
