// ── Core domain types ────────────────────────────────────────────────────────

export interface EntitySchema {
  id: string;
  type: string;
  attributes: Record<string, string | number | boolean>;
}

export interface RelationSchema {
  source: string;
  target: string;
  type: string;
  attributes: Record<string, string | number | boolean>;
}

export interface SimulationSchema {
  domain: string;
  entities: EntitySchema[];
  relations: RelationSchema[];
  global_metrics: Record<string, number>;
}

// ── API request/response types ────────────────────────────────────────────────

export interface ExtractionRequest {
  document: string;
}

export interface InsightRequest {
  state_snapshot: Record<string, unknown>;
}

export interface InsightResponse {
  insight: string;
}

// ── App state types ───────────────────────────────────────────────────────────

export type AppPage = 'home' | 'configure' | 'simulate' | 'insights';

export interface MetricDataPoint {
  tick: number;
  time: string;
  [key: string]: number | string;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  lastPing: number | null;
}

export interface SimulationState {
  schema: SimulationSchema | null;
  metricHistory: MetricDataPoint[];
  currentTick: number;
  insight: string;
  connectionStatus: ConnectionStatus;
}

// ── Upload types ──────────────────────────────────────────────────────────────

export interface UploadFile {
  file: File;
  name: string;
  size: number;
  type: string;
}
