import React, { useState, useRef, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { AppPage, SimulationSchema } from './types';
import { useWebSocket } from './useWebSocket';
import { getInsight } from './api';
import { Navbar } from './Navbar';

interface SimulatePageProps {
  schema: SimulationSchema;
  onNavigate: (page: AppPage) => void;
  onInsightReady: (insight: string) => void;
}

const ENGINE_WS = import.meta.env.VITE_ENGINE_URL
  ? import.meta.env.VITE_ENGINE_URL.replace('http', 'ws') + '/ws'
  : 'ws://localhost:8080/ws';

const METRIC_COLORS = [
  '#FF4500', '#3b82f6', '#22c55e',
  '#f59e0b', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f97316',
];

type LayoutMode = 'split' | 'chart' | 'entities';

function formatMetricName(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function MetricKPI({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      border: `1px solid ${color}22`,
      background: '#111',
      padding: '16px 20px',
      borderLeft: `3px solid ${color}`,
      flex: '1 1 160px',
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

export function SimulatePage({ schema, onNavigate, onInsightReady }: SimulatePageProps) {
  const { schema: live, metricHistory, status, tick } = useWebSocket(ENGINE_WS);
  const [layout, setLayout] = useState<LayoutMode>('split');
  const [insight, setInsight] = useState('');
  const [fetchingInsight, setFetchingInsight] = useState(false);
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(
    new Set(Object.keys(schema.global_metrics))
  );
  const insightIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentMetrics = live?.global_metrics ?? schema.global_metrics;
  const metricKeys = Object.keys(currentMetrics);

  // Auto-fetch insight every 8 seconds when connected
  useEffect(() => {
    const fetchInsight = async () => {
      if (!live || fetchingInsight) return;
      setFetchingInsight(true);
      try {
        const res = await getInsight({ ...live });
        if (res.insight) setInsight(res.insight);
      } catch { /* silent */ }
      finally { setFetchingInsight(false); }
    };

    insightIntervalRef.current = setInterval(fetchInsight, 8000);
    return () => {
      if (insightIntervalRef.current) clearInterval(insightIntervalRef.current);
    };
  }, [live, fetchingInsight]);

  const handleGoToInsights = async () => {
    if (live) {
      try {
        const res = await getInsight({ ...live });
        onInsightReady(res.insight || insight);
      } catch {
        onInsightReady(insight);
      }
    }
    onNavigate('insights');
  };

  const toggleMetric = (key: string) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); }
      else next.add(key);
      return next;
    });
  };

  return (
    <div style={{
      height: '100vh', background: '#0A0A0A', color: '#FAFAFA',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Navbar */}
      <Navbar
        page="simulate"
        domain={schema.domain}
        tick={tick}
        connected={status.connected}
        onNavigate={onNavigate}
      />

      {/* Sub-header toolbar */}
      <div style={{
        height: 52, borderBottom: '1px solid #1E1E1E',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', background: '#0d0d0d', flexShrink: 0,
      }}>
        {/* Layout switcher */}
        <div style={{
          display: 'flex', background: '#111',
          border: '1px solid #1E1E1E', padding: 3, gap: 2,
        }}>
          {(['split', 'chart', 'entities'] as LayoutMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setLayout(m)}
              style={{
                padding: '5px 14px', border: 'none',
                background: layout === m ? '#1E1E1E' : 'transparent',
                color: layout === m ? '#FAFAFA' : '#555',
                fontFamily: 'DM Mono, monospace', fontSize: 11,
                cursor: 'pointer', letterSpacing: '0.05em',
                transition: 'all 0.15s',
              }}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Metric toggles */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {metricKeys.map((key, i) => (
            <button
              key={key}
              onClick={() => toggleMetric(key)}
              style={{
                padding: '4px 10px',
                border: `1px solid ${activeMetrics.has(key) ? METRIC_COLORS[i % METRIC_COLORS.length] : '#1E1E1E'}`,
                background: activeMetrics.has(key) ? `${METRIC_COLORS[i % METRIC_COLORS.length]}18` : 'transparent',
                color: activeMetrics.has(key) ? METRIC_COLORS[i % METRIC_COLORS.length] : '#555',
                fontFamily: 'DM Mono, monospace', fontSize: 10,
                cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.04em',
              }}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Go to insights */}
        <button
          onClick={handleGoToInsights}
          style={{
            padding: '8px 18px', background: 'transparent',
            border: '1px solid #FF4500', color: '#FF4500',
            fontFamily: 'DM Mono, monospace', fontSize: 11,
            cursor: 'pointer', letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          VIEW INSIGHTS →
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Chart panel */}
        {(layout === 'split' || layout === 'chart') && (
          <div style={{
            flex: layout === 'chart' ? 1 : 1.6,
            borderRight: layout === 'split' ? '1px solid #1E1E1E' : 'none',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            transition: 'flex 0.3s ease',
          }}>
            {/* KPI row */}
            <div style={{
              display: 'flex', gap: 1, padding: '16px 20px',
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

            {/* Chart area */}
            <div style={{ flex: 1, padding: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{
                fontFamily: 'DM Mono, monospace', fontSize: 10,
                color: '#555', marginBottom: 12, letterSpacing: '0.08em',
              }}>
                REAL-TIME GLOBAL METRICS — last {metricHistory.length} ticks
              </div>

              <div style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricHistory} margin={{ top: 4, right: 16, bottom: 0, left: -10 }}>
                    <defs>
                      {metricKeys.filter((k) => activeMetrics.has(k)).map((key, i) => (
                        <linearGradient key={key} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={METRIC_COLORS[i % METRIC_COLORS.length]} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={METRIC_COLORS[i % METRIC_COLORS.length]} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="#1A1A1A" />
                    <XAxis
                      dataKey="tick"
                      tick={{ fontSize: 10, fontFamily: 'DM Mono, monospace', fill: '#444' }}
                      axisLine={{ stroke: '#1E1E1E' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fontFamily: 'DM Mono, monospace', fill: '#444' }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#111', border: '1px solid #2a2a2a',
                        borderRadius: 0, fontFamily: 'DM Mono, monospace', fontSize: 11,
                      }}
                      labelStyle={{ color: '#666', fontSize: 10 }}
                      itemStyle={{ color: '#FAFAFA', fontSize: 11 }}
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
                padding: '14px 20px',
                background: '#0d0d0d', flexShrink: 0,
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <span style={{
                  fontFamily: 'DM Mono, monospace', fontSize: 10,
                  color: '#FF4500', flexShrink: 0, paddingTop: 2, letterSpacing: '0.05em',
                }}>
                  AI
                </span>
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 13,
                  color: '#FAFAFA', lineHeight: 1.6, margin: 0,
                }}>
                  {insight}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Entities panel */}
        {(layout === 'split' || layout === 'entities') && (
          <div style={{
            flex: layout === 'entities' ? 1 : 0.9,
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
            transition: 'flex 0.3s ease',
          }}>
            {/* Entities header */}
            <div style={{
              padding: '12px 20px', borderBottom: '1px solid #1E1E1E',
              fontFamily: 'DM Mono, monospace', fontSize: 10,
              color: '#555', letterSpacing: '0.08em',
              flexShrink: 0, display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', background: '#0d0d0d',
            }}>
              <span>ENTITIES · {schema.entities.length}</span>
              <span style={{ color: '#333' }}>LIVE</span>
            </div>

            <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {schema.entities.map((ent, i) => {
                const liveAttr = live?.entities?.find((e) => e.id === ent.id)?.attributes ?? ent.attributes;
                return (
                  <div
                    key={ent.id}
                    style={{
                      border: '1px solid #1E1E1E',
                      borderLeft: `3px solid ${METRIC_COLORS[i % METRIC_COLORS.length]}`,
                      background: '#111', padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{
                        fontFamily: 'DM Mono, monospace', fontWeight: 500,
                        fontSize: 12, color: METRIC_COLORS[i % METRIC_COLORS.length],
                      }}>
                        {ent.id}
                      </span>
                      <span style={{
                        fontFamily: 'DM Mono, monospace', fontSize: 9,
                        color: '#555', letterSpacing: '0.08em',
                        background: '#1A1A1A', padding: '2px 6px',
                      }}>
                        {ent.type}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                              <div style={{ height: 2, background: '#1A1A1A', borderRadius: 1 }}>
                                <div style={{
                                  height: '100%', width: `${pct}%`,
                                  background: METRIC_COLORS[i % METRIC_COLORS.length],
                                  borderRadius: 1,
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

            {/* Relations */}
            {schema.relations.length > 0 && (
              <>
                <div style={{
                  padding: '12px 20px', borderTop: '1px solid #1E1E1E', borderBottom: '1px solid #1E1E1E',
                  fontFamily: 'DM Mono, monospace', fontSize: 10,
                  color: '#555', letterSpacing: '0.08em',
                  background: '#0d0d0d',
                }}>
                  RELATIONS · {schema.relations.length}
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {schema.relations.map((rel, i) => (
                    <div key={i} style={{
                      padding: '10px 14px', border: '1px solid #1E1E1E',
                      background: '#0d0d0d',
                      fontFamily: 'DM Mono, monospace', fontSize: 11,
                    }}>
                      <span style={{ color: '#FF4500' }}>{rel.source}</span>
                      <span style={{ color: '#333', padding: '0 8px' }}>—[{rel.type}]→</span>
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
