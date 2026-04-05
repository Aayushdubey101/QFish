from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from schema import SimulationSchema
from domain_extractor import extract_schema
from insight_engine import generate_insight
from typing import Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="QFish Python Brain")

class ExtractionRequest(BaseModel):
    document: str

class InsightRequest(BaseModel):
    state_snapshot: Dict[str, Any]
    
@app.post("/extract", response_model=SimulationSchema)
async def extract(req: ExtractionRequest):
    try:
        schema = extract_schema(req.document)
        return schema
    except Exception as e:
        print(f"LLM Error encountered: {e}. Falling back to default schema.")
        return SimulationSchema(
                domain="Financial/Tax Policy",
                entities=[
                    {"id": "Small Business Sector", "type": "Sector", "attributes": {"health": 80, "debt": 20}},
                    {"id": "Consumer", "type": "Actor", "attributes": {"spending": 100}}
                ],
                relations=[
                    {"source": "Small Business Sector", "target": "Consumer", "type": "Impacts", "attributes": {"strength": -0.5}}
                ],
                global_metrics={"corporate_tax_rate": 30.0, "recession_probability": 60.0}
            )
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/insights")
async def get_insights(req: InsightRequest):
    try:
        insight = generate_insight(req.state_snapshot)
        return {"insight": insight}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}
