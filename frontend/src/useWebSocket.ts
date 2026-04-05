import { useEffect, useRef, useState, useCallback } from 'react';
import type { SimulationSchema, MetricDataPoint, ConnectionStatus } from './types';

const MAX_HISTORY = 120;
const FLUSH_INTERVAL_MS = 200;
const RECONNECT_DELAY_MS = 3000;

interface UseWebSocketReturn {
  schema: SimulationSchema | null;
  metricHistory: MetricDataPoint[];
  status: ConnectionStatus;
  tick: number;
}

export function useWebSocket(url: string): UseWebSocketReturn {
  const [schema, setSchema] = useState<SimulationSchema | null>(null);
  const [metricHistory, setMetricHistory] = useState<MetricDataPoint[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnecting: false,
    lastPing: null,
  });
  const [tick, setTick] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef<SimulationSchema[]>([]);
  const tickRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (bufferRef.current.length === 0) return;
    const latest = bufferRef.current[bufferRef.current.length - 1];
    bufferRef.current = [];

    tickRef.current += 1;
    const point: MetricDataPoint = {
      tick: tickRef.current,
      time: new Date().toLocaleTimeString('en-US', {
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
      }),
      ...latest.global_metrics,
    };

    setSchema(latest);
    setTick(tickRef.current);
    setMetricHistory((prev) => {
      const next = [...prev, point];
      return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(flush, FLUSH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [flush]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setStatus((s) => ({ ...s, reconnecting: true }));
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setStatus({ connected: true, reconnecting: false, lastPing: Date.now() });
    ws.onmessage = (event) => {
      try {
        const data: SimulationSchema = JSON.parse(event.data as string);
        bufferRef.current.push(data);
        setStatus((s) => ({ ...s, lastPing: Date.now() }));
      } catch { /* ignore */ }
    };
    ws.onclose = () => {
      setStatus({ connected: false, reconnecting: true, lastPing: null });
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };
    ws.onerror = () => ws.close();
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { schema, metricHistory, status, tick };
}
