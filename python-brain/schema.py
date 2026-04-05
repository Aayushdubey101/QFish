from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class EntitySchema(BaseModel):
    id: str
    type: str
    attributes: Dict[str, Any] = Field(default_factory=dict)
    
class RelationSchema(BaseModel):
    source: str
    target: str
    type: str
    attributes: Dict[str, Any] = Field(default_factory=dict)

class SimulationSchema(BaseModel):
    domain: str
    entities: List[EntitySchema]
    relations: List[RelationSchema]
    global_metrics: Dict[str, float] = Field(default_factory=dict)
