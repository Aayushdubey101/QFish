import os
from langchain_core.prompts import ChatPromptTemplate
from schema import SimulationSchema
from llm_factory import get_llm

def extract_schema(document: str) -> SimulationSchema:
    """
    Extract a simulation schema (entities, relations, metrics) from unstructured text.
    """
    llm = get_llm(temperature=0.0)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert system that extracts simulation parameters from text. Given a document describing a scenario (e.g. tax policy, supply chain, medical trial), extract individuals/organizations as entities and their interactions as relations. Output exactly in the provided schema structure."),
        ("user", "Document: {document}")
    ])
    
    chain = prompt | llm.with_structured_output(SimulationSchema)
    
    return chain.invoke({"document": document})
