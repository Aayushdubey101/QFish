use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntitySchema {
    pub id: String,
    pub r#type: String,
    pub attributes: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelationSchema {
    pub source: String,
    pub target: String,
    pub r#type: String,
    pub attributes: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationSchema {
    pub domain: String,
    pub entities: Vec<EntitySchema>,
    pub relations: Vec<RelationSchema>,
    pub global_metrics: HashMap<String, f64>,
}
