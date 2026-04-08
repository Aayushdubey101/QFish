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
    let tick_ms: u64 = std::env::var("TICK_INTERVAL_MS")
        .unwrap_or_else(|_| "1000".to_string())
        .parse()
        .unwrap_or(1000);

    let shared_state = Arc::new(AppState::new());

    let state_for_loop = shared_state.clone();
    tokio::spawn(async move {
        loop {
            sleep(Duration::from_millis(tick_ms)).await;

            let schema_opt = {
                state_for_loop.current_schema.lock().unwrap().clone()
            };

            if let Some(mut schema) = schema_opt {
                // Domain-agnostic stochastic update — values clamped to [0, 100]
                for (_, val) in schema.global_metrics.iter_mut() {
                    let delta = (rand::random::<f64>() - 0.5) * 2.0;
                    *val = (*val + delta).clamp(0.0, 100.0);
                }

                *state_for_loop.current_schema.lock().unwrap() = Some(schema.clone());
                let _ = state_for_loop.tx.send(schema);
            }
        }
    });

    let app = Router::new()
        .route("/init", post(init_simulation))
        .route("/reset", post(reset_simulation))
        .route("/state", get(get_state))
        .route("/ws", get(ws_handler))
        .layer(CorsLayer::permissive())
        .with_state(shared_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    println!("QFish Rust engine on http://0.0.0.0:8080  (tick: {}ms)", tick_ms);
    axum::serve(listener, app).await.unwrap();
}

async fn init_simulation(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SimulationSchema>,
) -> &'static str {
    println!("Engine initialised: domain={}", payload.domain);
    *state.current_schema.lock().unwrap() = Some(payload);
    "Simulation initialized"
}

async fn reset_simulation(
    State(state): State<Arc<AppState>>,
) -> &'static str {
    *state.current_schema.lock().unwrap() = None;
    println!("Engine reset.");
    "Simulation reset"
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

    // Send current state immediately on connect
    let initial = state.current_schema.lock().unwrap().clone();
    if let Some(schema) = initial {
        if let Ok(json) = serde_json::to_string(&schema) {
            let _ = socket.send(Message::Text(
                axum::extract::ws::Utf8Bytes::from(json)
            )).await;
        }
    }

    loop {
        match rx.recv().await {
            Ok(schema) => {
                if let Ok(json) = serde_json::to_string(&schema) {
                    if socket
                        .send(Message::Text(axum::extract::ws::Utf8Bytes::from(json)))
                        .await
                        .is_err()
                    {
                        break; // client disconnected
                    }
                }
            }
            Err(tokio::sync::broadcast::error::RecvError::Lagged(n)) => {
                // Client fell behind — skip missed ticks, continue
                eprintln!("WS client lagged by {} messages", n);
            }
            Err(_) => break,
        }
    }
}
