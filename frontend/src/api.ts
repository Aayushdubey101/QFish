import type { SimulationSchema, InsightResponse } from './types';

const BRAIN_URL = import.meta.env.VITE_BRAIN_URL || 'http://localhost:8000';
const ENGINE_URL = import.meta.env.VITE_ENGINE_URL || 'http://localhost:8080';

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// Extract simulation schema from raw document text via python-brain
export async function extractSchema(document: string): Promise<SimulationSchema> {
  return post<SimulationSchema>(`${BRAIN_URL}/extract`, { document });
}

// Push schema to Rust engine to initialise simulation
export async function initEngine(schema: SimulationSchema): Promise<void> {
  await post<string>(`${ENGINE_URL}/init`, schema);
}

// Get a natural-language insight from python-brain
export async function getInsight(
  stateSnapshot: Record<string, unknown>
): Promise<InsightResponse> {
  return post<InsightResponse>(`${BRAIN_URL}/insights`, {
    state_snapshot: stateSnapshot,
  });
}

// Health checks
export async function checkBrainHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BRAIN_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function checkEngineHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${ENGINE_URL}/state`);
    return res.ok;
  } catch {
    return false;
  }
}
