import logging
from langgraph.graph import StateGraph, END
from app.ai.state import InvestigationGraphState
from app.ai.nodes.prepare_source import prepare_source_node
from app.ai.nodes.extract_facts import extract_facts_node
from app.ai.nodes.validate_extraction import validate_extraction_node
from app.ai.nodes.evidence_gaps import evidence_gaps_node
from app.ai.nodes.potential_causes import potential_causes_node
from app.ai.nodes.five_whys import five_whys_node
from app.ai.nodes.fishbone import fishbone_node
from app.ai.nodes.capa import capa_node
from app.ai.nodes.validate_output import validate_output_node

logger = logging.getLogger("pharmalens.ai.graph")

def create_investigation_workflow() -> StateGraph:
    """
    Constructs the typed LangGraph StateGraph workflow for pharmaceutical RCA & CAPA.
    Coordinates sequential nodes with typed state transitions and validation checkpoints.
    """
    workflow = StateGraph(InvestigationGraphState)

    # 1. Register workflow nodes
    workflow.add_node("prepare_source", prepare_source_node)
    workflow.add_node("extract_facts", extract_facts_node)
    workflow.add_node("validate_extraction", validate_extraction_node)
    workflow.add_node("evidence_gaps", evidence_gaps_node)
    workflow.add_node("potential_causes", potential_causes_node)
    workflow.add_node("five_whys", five_whys_node)
    workflow.add_node("fishbone", fishbone_node)
    workflow.add_node("capa", capa_node)
    workflow.add_node("validate_output", validate_output_node)

    # 2. Define workflow sequence
    workflow.set_entry_point("prepare_source")
    workflow.add_edge("prepare_source", "extract_facts")
    workflow.add_edge("extract_facts", "validate_extraction")
    workflow.add_edge("validate_extraction", "evidence_gaps")
    workflow.add_edge("evidence_gaps", "potential_causes")
    workflow.add_edge("potential_causes", "five_whys")
    workflow.add_edge("five_whys", "fishbone")
    workflow.add_edge("fishbone", "capa")
    workflow.add_edge("capa", "validate_output")
    workflow.add_edge("validate_output", END)

    return workflow

# Pre-compile graph instance for efficient reuse
investigation_graph = create_investigation_workflow().compile()
