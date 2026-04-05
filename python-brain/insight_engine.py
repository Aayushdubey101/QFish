from langchain_core.prompts import ChatPromptTemplate
from typing import Dict, Any
from llm_factory import get_llm

def generate_insight(state_snapshot: Dict[str, Any]) -> str:
    """
    Generates a natural language summary of the current simulation state.
    """
    llm = get_llm(temperature=0.5)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an observer of a simulation. Provide a concise, 1-2 sentence real-time insight based on the current state and metrics."),
        ("user", "State Snapshot: {state}")
    ])
    
    chain = prompt | llm
    result = chain.invoke({"state": state_snapshot})
    return result.content
