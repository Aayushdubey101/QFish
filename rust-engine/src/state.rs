use crate::schema::SimulationSchema;
use std::sync::{Arc, Mutex};
use tokio::sync::broadcast;

pub struct AppState {
    pub current_schema: Arc<Mutex<Option<SimulationSchema>>>,
    pub tx: broadcast::Sender<SimulationSchema>,
}

impl AppState {
    pub fn new() -> Self {
        let (tx, _rx) = broadcast::channel(100);
        Self {
            current_schema: Arc::new(Mutex::new(None)),
            tx,
        }
    }
}
