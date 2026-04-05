mod schema;
mod state;

use axum::{
    extract::{State, WebSocketUpgrade, ws::{Message, WebSocket}},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use schema::SimulationSchema;
use state::AppState;
use std::sync::Arc;
use tokio::time::{sleep, Duration};
use tower_http::cors::CorsLayer;

#[tokio::main]
async fn main() {
    let shared_state = Arc::new(AppState::new());

    // Spawn a simulation loop
    let state_for_loop = shared_state.clone();
    tokio::spawn(async move {
        loop {
            sleep(Duration::from_millis(1000)).await;
            let schema_guard = state_for_loop.current_schema.lock().unwrap();
            if let Some(mut schema) = schema_guard.clone() {
                // Stochastic domain-agnostic update
                for (_, val) in schema.global_metrics.iter_mut() {
                    *val += (rand::random::<f64>() - 0.5) * 5.0; 
                }
                drop(schema_guard); // Drop early
                
                *state_for_loop.current_schema.lock().unwrap() = Some(schema.clone());
                let _ = state_for_loop.tx.send(schema);
            }
        }
    });

    let app = Router::new()
        .route("/init", post(init_simulation))
        .route("/state", get(get_state))
        .route("/ws", get(ws_handler))
        .layer(CorsLayer::permissive())
        .with_state(shared_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    println!("Rust engine running on http://0.0.0.0:8080");
    axum::serve(listener, app).await.unwrap();
}

async fn init_simulation(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SimulationSchema>,
) -> &'static str {
    *state.current_schema.lock().unwrap() = Some(payload);
    "Simulation initialized"
}

async fn get_state(
    State(state): State<Arc<AppState>>,
) -> Json<Option<SimulationSchema>> {
    let schema = state.current_schema.lock().unwrap().clone();
    Json(schema)
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(mut socket: WebSocket, state: Arc<AppState>) {
    let mut rx = state.tx.subscribe();
    
    if let Some(schema) = state.current_schema.lock().unwrap().clone() {
        if let Ok(json) = serde_json::to_string(&schema) {
            let _ = socket.send(Message::Text(axum::extract::ws::Utf8Bytes::from(json))).await;
        }
    }

    loop {
        if let Ok(schema) = rx.recv().await {
            if let Ok(json) = serde_json::to_string(&schema) {
                if socket.send(Message::Text(axum::extract::ws::Utf8Bytes::from(json))).await.is_err() {
                    break;
                }
            }
        }
    }
}
