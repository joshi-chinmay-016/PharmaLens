import logging
from typing import Dict, Any, List
from app.ai.state import InvestigationGraphState
from app.core.config import settings

logger = logging.getLogger("pharmalens.ai.prepare_source")

def prepare_source_node(state: InvestigationGraphState) -> Dict[str, Any]:
    """
    Node 1: Normalizes and structures source documents and investigation context.
    Treats all incoming source content as untrusted data.
    Establishes strict source boundaries and source manifest.
    """
    investigation = state.get("investigation_snapshot", {})
    sources = state.get("source_documents", [])
    
    warnings: List[str] = list(state.get("analysis_warnings", []))
    manifest: List[Dict[str, Any]] = []
    text_blocks: List[str] = []

    # 1. Capture primary investigation context
    title = investigation.get("title", "Untitled Investigation")
    dev_ref = investigation.get("incident_reference") or "Not provided"
    inv_desc = investigation.get("incident_description") or "Not provided"
    actual_res = investigation.get("actual_result") or "Not provided"
    spec_crit = investigation.get("acceptance_criterion") or "Not provided"
    batch_num = investigation.get("batch_number") or "Not provided"
    prod_name = investigation.get("product_name") or "Not provided"
    proc_step = investigation.get("process_step") or "Not provided"
    known_facts = investigation.get("known_facts") or "Not provided"
    init_obs = investigation.get("initial_observations") or "Not provided"
    inv_notes = investigation.get("investigation_notes") or "Not provided"

    header_block = (
        f"=== INVESTIGATION CONTEXT ===\n"
        f"Investigation Title: {title}\n"
        f"Deviation Reference: {dev_ref}\n"
        f"Product Name: {prod_name}\n"
        f"Batch Number: {batch_num}\n"
        f"Process Step: {proc_step}\n"
        f"Observed Result: {actual_res}\n"
        f"Acceptance Criterion: {spec_crit}\n"
        f"Incident Description: {inv_desc}\n"
        f"Known Facts: {known_facts}\n"
        f"Initial Observations: {init_obs}\n"
        f"Investigation Notes: {inv_notes}\n"
        f"=============================\n"
    )
    text_blocks.append(header_block)

    # 2. Iterate and normalize attached source documents
    if not sources:
        warnings.append("No independent source documents attached; analysis relying solely on investigator form text.")
    else:
        for idx, src in enumerate(sources):
            s_id = src.get("source_id", f"SRC-{idx+1:02d}")
            s_type = src.get("source_type", "unknown")
            fname = src.get("original_filename") or "untitled_source"
            extracted_text = (src.get("extracted_text") or "").strip()
            
            manifest_item = {
                "source_id": s_id,
                "source_type": s_type,
                "original_filename": fname,
                "char_count": len(extracted_text),
                "extraction_status": src.get("extraction_status", "success"),
            }
            manifest.append(manifest_item)

            if not extracted_text:
                warnings.append(f"Source document '{fname}' ({s_id}) contains no extractable text.")
                continue

            # Demarcate untrusted source boundary clearly
            source_block = (
                f"\n--- BEGIN UNTRUSTED EVIDENCE SOURCE: {s_id} | Type: {s_type} | File: {fname} ---\n"
                f"{extracted_text}\n"
                f"--- END UNTRUSTED EVIDENCE SOURCE: {s_id} ---\n"
            )
            text_blocks.append(source_block)

    combined_text = "\n".join(text_blocks)

    # 3. Enforce context budget
    max_chars = settings.AI_MAX_SOURCE_CHARS
    if len(combined_text) > max_chars:
        combined_text = combined_text[:max_chars]
        warnings.append(
            f"Source content exceeded {max_chars} characters and was safely truncated. "
            f"All available evidence references were preserved where possible."
        )

    return {
        "source_manifest": manifest,
        "normalized_source_context": combined_text,
        "analysis_warnings": warnings,
        "execution_status": "running",
    }
