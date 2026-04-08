import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { AppPage, SimulationSchema, MetricDataPoint } from './types';
import { useWebSocket } from './useWebSocket';
import { getInsight } from './api';
import { Navbar } from './Navbar';

interface SimulatePageProps {
  schema: SimulationSchema;
  onNavigate: (page: AppPage) => void;
  onInsightReady: (insight: string) => void;
  onHistoryUpdate: (history: MetricDataPoint[]) => void;
}

const ENGINE_WS = import.meta.env.VITE_ENGINE_WS || 'ws://localhost:8080/ws';

const METRIC_COLORS = [
  '#FF4500', '#3b82f6', '#22c55e',
  '#f59e0b', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f97316',
];

type LayoutMode = 'split' | 'chart' | 'entities';

function MetricKPI({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      border: `1px solid ${color}22`,
      background: '#111',
      padding: '16px 20px',
      borderLeft: `3px solid ${color}`,
      flex: '1 1 160px',
      minWidth: 0,
    }}>
      <div style={{
        fontFamily: 'DM Mono, monospace', fontSize: 10,
        color: '#555', marginBottom: 8, letterSpacing: '0.05em',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {label.toUpperCase()}
      </div>
      <div style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 700,
        fontSize: 28, color: '#FAFAFA',
      }}>
        {value.toFixed(1)}
      </div>
    </div>
  );
}

export function SimulatePage({ schema, onNavigate, onInsightReady, onHistoryUpdate }: SimulatePageProps) {
  const { schema: live, metricHistory, status, tick } = useWebSocket(ENGINE_WS);
  const [layout, setLayout] = useState<LayoutMode>('split');
  const [insight, setInsight] = useState('');
  const [fetchingInsight, setFetchingInsight] = useState(false);
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(
    () => new Set(Object.keys(schema.global_metrics))
  );
  const insightIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentMetrics = live?.global_metrics ?? schema.global_metrics;
  const metricKeys = Object.keys(currentMetrics);

  // Propagate history up to App so InsightsPage gets it
  useEffect(() => {
    onHistoryUpdate(metricHistory);
  }, [metricHistory, onHistoryUpdate]);

  // Auto-fetch insight every 8 seconds
  useEffect(() => {
    const fetchInsight = async () => {
      if (!live || fetchingInsight) return;
      setFetchingInsight(true);
      try {
        const res = await getInsight(live as unknown as Record<string, unknown>);
        if (res.insight) setInsight(res.insight);
      } catch { /* silent */ }
      finally { setFetchingInsight(false); }
    };

    insightIntervalRef.current = setInterval(fetchInsight, 8000);
    return () => {
      if (insightIntervalRef.current) clearInterval(insightIntervalRef.current);
    };
  }, [live, fetchingInsight]);

  const handleGoToInsights = useCallback(async () => {
    if (live) {
      try {
        const res = await getInsight(live as unknown as Record<string, unknown>);
        onInsightReady(res.insight || insight);
      } catch {
        onInsightReady(insight);
      }
    }
    onNavigate('insights');
  }, [live, insight, onInsightReady, onNavigate]);

  const toggleMetric = useCallback((key: string) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  return (
    <div style={{
      height: '100vh', background: '#0A0A0A', color: '#FAFAFA',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <Navbar
        page="simulate"
        domain={schema.domain}
        tick={tick}
        connected={status.connected}
        onNavigate={onNavigate}
      />

      {/* Sub-toolbar */}
      <div style={{
        height: 52, borderBottom: '1px solid #1E1E1E',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', background: '#0d0d0d', flexShrink: 0, gap: 16,
      }}>
        {/* Layout switcher */}
        <div style={{
          display: 'flex', background: '#111',
          border: '1px solid #1E1E1E', padding: 3, gap: 2, flexShrink: 0,
        }}>
          {(['split', 'chart', 'entities'] as LayoutMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setLayout(m)}
              style={{
                padding: '5px 12px', border: 'none',
                background: layout === m ? '#1E1E1E' : 'transparent',
                color: layout === m ? '#FAFAFA' : '#555',
                fontFamily: 'DM Mono, monospace', fontSize: 10,
                cursor: 'pointer', letterSpacing: '0.05em',
                transition: 'all 0.15s',
              }}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Metric toggles */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1, overflow: 'hidden' }}>
          {metricKeys.map((key, i) => (
            <button
              key={key}
              onClick={() => toggleMetric(key)}
              style={{
                padding: '3px 9px',
                border: `1px solid ${activeMetrics.has(key) ? METRIC_COLORS[i % METRIC_COLORS.length] : '#1E1E1E'}`,
                background: activeMetrics.has(key) ? `${METRIC_COLORS[i % METRIC_COLORS.length]}18` : 'transparent',
                color: activeMetrics.has(key) ? METRIC_COLORS[i % METRIC_COLORS.length] : '#555',
                fontFamily: 'DM Mono, monospace', fontSize: 10,
                cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.03em',
                whiteSpace: 'nowrap',
              }}
            >
              {key}
            </button>
          ))}
        </div>

        {/* View insights */}
        <button
          onClick={handleGoToInsights}
          style={{
            padding: '7px 16px', background: 'transparent',
            border: '1px solid #FF4500', color: '#FF4500',
            fontFamily: 'DM Mono, monospace', fontSize: 10,
            cursor: 'pointer', letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 6,
            flexShrink: 0,
          }}
        >
          INSIGHTS →
        </button>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Chart panel ── */}
        {(layout === 'split' || layout === 'chart') && (
          <div style={{
            flex: layout === 'chart' ? 1 : 1.6,
            borderRight: layout === 'split' ? '1px solid #1E1E1E' : 'none',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            transition: 'flex 0.3s ease',
          }}>
            {/* KPI row */}
            <div style={{
              display: 'flex', gap: 1, padding: '14px 16px',
              borderBottom: '1px solid #1E1E1E', flexWrap: 'wrap',
              background: '#0d0d0d', flexShrink: 0,
            }}>
              {metricKeys.filter((k) => activeMetrics.has(k)).map((key, i) => (
                <MetricKPI
                  key={key}
                  label={key}
                  value={currentMetrics[key] ?? 0}
                  color={METRIC_COLORS[i % METRIC_COLORS.length]}
                />
              ))}
            </div>

            {/* Chart */}
            <div style={{
              flex: 1, padding: '16px 12px 12px 8px',
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                fontFamily: 'DM Mono, monospace', fontSize: 9,
                color: '#444', marginBottom: 10, letterSpacing: '0.08em',
                paddingLeft: 8,
              }}>
                REAL-TIME METRICS — {metricHistory.length} ticks
              </div>
              <div style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricHistory} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <defs>
                      {metricKeys.filter((k) => activeMetrics.has(k)).map((key, i) => (
                        <linearGradient key={key} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={METRIC_COLORS[i % METRIC_COLORS.length]} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={METRIC_COLORS[i % METRIC_COLORS.length]} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="2 6" stroke="#191919" />
                    <XAxis
                      dataKey="tick"
                      tick={{ fontSize: 9, fontFamily: 'DM Mono, monospace', fill: '#3a3a3a' }}
                      axisLine={{ stroke: '#1E1E1E' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 9, fontFamily: 'DM Mono, monospace', fill: '#3a3a3a' }}
                      axisLine={false}
                      tickLine={false}
                      width={32}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0d0d0d', border: '1px solid #2a2a2a',
                        borderRadius: 0, fontFamily: 'DM Mono, monospace', fontSize: 10,
                        padding: '8px 12px',
                      }}
                      labelStyle={{ color: '#555', fontSize: 9, marginBottom: 4 }}
                      itemStyle={{ color: '#FAFAFA', fontSize: 10 }}
                      formatter={(v: number) => v.toFixed(2)}
                      labelFormatter={(l) => `tick ${l}`}
                    />
                    {metricKeys.filter((k) => activeMetrics.has(k)).map((key, i) => (
                      <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={METRIC_COLORS[i % METRIC_COLORS.length]}
                        strokeWidth={1.5}
                        fill={`url(#grad-${i})`}
                        dot={false}
                        isAnimationActive={false}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Insight strip */}
            {insight && (
              <div style={{
                borderTop: '1px solid #1E1E1E',
                padding: '12px 20px',
                background: '#0d0d0d', flexShrink: 0,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <span style={{
                  fontFamily: 'DM Mono, monospace', fontSize: 9,
                  color: '#FF4500', flexShrink: 0, paddingTop: 3, letterSpacing: '0.06em',
                }}>
                  AI
                </span>
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 12,
                  color: '#FAFAFA', lineHeight: 1.6, margin: 0,
                }}>
                  {insight}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Entities panel ── */}
        {(layout === 'split' || layout === 'entities') && (
          <div style={{
            flex: layout === 'entities' ? 1 : 0.85,
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
            transition: 'flex 0.3s ease',
          }}>
            <div style={{
              padding: '10px 16px', borderBottom: '1px solid #1E1E1E',
              fontFamily: 'DM Mono, monospace', fontSize: 9,
              color: '#555', letterSpacing: '0.08em',
              flexShrink: 0, display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', background: '#0d0d0d',
            }}>
              <span>ENTITIES · {schema.entities.length}</span>
              <span style={{
                color: status.connected ? '#22c55e' : '#555',
                fontSize: 9,
              }}>
                {status.connected ? '● LIVE' : '○ OFFLINE'}
              </span>
            </div>

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {schema.entities.map((ent, i) => {
                const liveAttr =
                  live?.entities?.find((e) => e.id === ent.id)?.attributes ??
                  ent.attributes;
                return (
                  <div
                    key={ent.id}
                    style={{
                      border: '1px solid #1E1E1E',
                      borderLeft: `3px solid ${METRIC_COLORS[i % METRIC_COLORS.length]}`,
                      background: '#111', padding: '12px 14px',
                    }}
                  >
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 10,
                    }}>
                      <span style={{
                        fontFamily: 'DM Mono, monospace', fontWeight: 500,
                        fontSize: 12, color: METRIC_COLORS[i % METRIC_COLORS.length],
                      }}>
                        {ent.id}
                      </span>
                      <span style={{
                        fontFamily: 'DM Mono, monospace', fontSize: 9,
                        color: '#444', letterSpacing: '0.06em',
                        background: '#161616', padding: '2px 6px',
                      }}>
                        {ent.type}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {Object.entries(liveAttr).map(([k, v]) => {
                        const numVal = typeof v === 'number' ? v : parseFloat(String(v));
                        const isNum = !isNaN(numVal);
                        const pct = isNum ? Math.min(100, Math.max(0, numVal)) : 0;
                        return (
                          <div key={k}>
                            <div style={{
                              display: 'flex', justifyContent: 'space-between',
                              fontFamily: 'DM Mono, monospace', fontSize: 10,
                              marginBottom: 3,
                            }}>
                              <span style={{ color: '#555' }}>{k}</span>
                              <span style={{ color: '#FAFAFA' }}>
                                {isNum ? numVal.toFixed(1) : String(v)}
                              </span>
                            </div>
                            {isNum && (
                              <div style={{ height: 2, background: '#1A1A1A' }}>
                                <div style={{
                                  height: '100%', width: `${pct}%`,
                                  background: METRIC_COLORS[i % METRIC_COLORS.length],
                                  transition: 'width 0.4s ease',
                                }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {schema.relations.length > 0 && (
              <>
                <div style={{
                  padding: '10px 16px',
                  borderTop: '1px solid #1E1E1E', borderBottom: '1px solid #1E1E1E',
                  fontFamily: 'DM Mono, monospace', fontSize: 9,
                  color: '#555', letterSpacing: '0.08em', background: '#0d0d0d',
                }}>
                  RELATIONS · {schema.relations.length}
                </div>
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {schema.relations.map((rel, i) => (
                    <div key={i} style={{
                      padding: '8px 12px', border: '1px solid #1E1E1E',
                      background: '#0d0d0d', fontFamily: 'DM Mono, monospace', fontSize: 10,
                    }}>
                      <span style={{ color: '#FF4500' }}>{rel.source}</span>
                      <span style={{ color: '#333', padding: '0 6px' }}>—[{rel.type}]→</span>
                      <span style={{ color: '#3b82f6' }}>{rel.target}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
