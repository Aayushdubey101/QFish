import React, { useEffect, useState } from 'react';
import type { AppPage, SimulationSchema, MetricDataPoint } from './types';
import { Navbar } from './Navbar';

interface InsightsPageProps {
  schema: SimulationSchema;
  insight: string;
  metricHistory: MetricDataPoint[];
  onNavigate: (page: AppPage) => void;
}

function StatBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      border: '1px solid #1E1E1E', padding: '24px 28px',
      background: '#111', flex: '1 1 180px',
    }}>
      <div style={{
        fontFamily: 'DM Mono, monospace', fontSize: 10,
        color: '#555', marginBottom: 10, letterSpacing: '0.08em',
      }}>
        {label.toUpperCase()}
      </div>
      <div style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 700,
        fontSize: 36, color: '#FAFAFA', marginBottom: sub ? 6 : 0,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#555' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export function InsightsPage({ schema, insight, metricHistory, onNavigate }: InsightsPageProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  const lastSnapshot = metricHistory[metricHistory.length - 1];
  const firstSnapshot = metricHistory[0];

  const metricKeys = Object.keys(schema.global_metrics);

  const computeTrend = (key: string) => {
    if (metricHistory.length < 3) return 'stable';
    const vals = metricHistory.map((d) => Number(d[key]) || 0);
    const delta = vals[vals.length - 1] - vals[0];
    if (delta > 2) return 'rising';
    if (delta < -2) return 'falling';
    return 'stable';
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0A',
      color: '#FAFAFA', display: 'flex', flexDirection: 'column',
    }}>
      <Navbar page="insights" domain={schema.domain} onNavigate={onNavigate} />

      <div style={{
        maxWidth: 1080, margin: '0 auto', padding: '48px 40px 80px',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.5s ease',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            fontFamily: 'DM Mono, monospace', fontSize: 10,
            color: '#FF4500', letterSpacing: '0.12em', marginBottom: 16,
          }}>
            ■ SIMULATION COMPLETE
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: '#FAFAFA',
            lineHeight: 1.1, marginBottom: 8,
          }}>
            {schema.domain}
          </h1>
          <p style={{
            fontFamily: 'DM Mono, monospace', fontSize: 12,
            color: '#555', letterSpacing: '0.04em',
          }}>
            {metricHistory.length} data points · {schema.entities.length} entities ·{' '}
            {schema.relations.length} relations
          </p>
        </div>

        {/* AI Insight block */}
        {insight && (
          <div style={{
            border: '1px solid #FF450033',
            borderLeft: '4px solid #FF4500',
            background: '#FF450008', padding: '28px 32px',
            marginBottom: 48,
          }}>
            <div style={{
              fontFamily: 'DM Mono, monospace', fontSize: 10,
              color: '#FF4500', letterSpacing: '0.1em', marginBottom: 14,
            }}>
              AI INSIGHT
            </div>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: 17,
              lineHeight: 1.7, color: '#FAFAFA', fontWeight: 400,
              margin: 0,
            }}>
              {insight}
            </p>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 1, marginBottom: 48, flexWrap: 'wrap' }}>
          <StatBlock
            label="Total Ticks"
            value={String(metricHistory.length)}
            sub="simulation steps completed"
          />
          <StatBlock
            label="Entities"
            value={String(schema.entities.length)}
            sub={`types: ${[...new Set(schema.entities.map((e) => e.type))].join(', ')}`}
          />
          <StatBlock
            label="Relations"
            value={String(schema.relations.length)}
            sub="interactions modelled"
          />
        </div>

        {/* Per-metric final state */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            fontFamily: 'DM Mono, monospace', fontSize: 10,
            color: '#555', letterSpacing: '0.1em', marginBottom: 24,
          }}>
            METRIC OUTCOMES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {metricKeys.map((key, i) => {
              const finalVal = lastSnapshot ? Number(lastSnapshot[key]) || 0 : schema.global_metrics[key];
              const initVal = firstSnapshot ? Number(firstSnapshot[key]) || 0 : schema.global_metrics[key];
              const delta = finalVal - initVal;
              const trend = computeTrend(key);
              const colors = ['#FF4500', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];
              const color = colors[i % colors.length];

              return (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center',
                  border: '1px solid #1E1E1E', background: '#111',
                  padding: '20px 24px', gap: 24,
                }}>
                  {/* Color bar */}
                  <div style={{ width: 3, height: 48, background: color, flexShrink: 0 }} />

                  {/* Label */}
                  <div style={{ minWidth: 200 }}>
                    <div style={{
                      fontFamily: 'DM Mono, monospace', fontWeight: 500,
                      fontSize: 13, color: '#FAFAFA', marginBottom: 4,
                    }}>
                      {key}
                    </div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#555' }}>
                      started: {initVal.toFixed(2)}
                    </div>
                  </div>

                  {/* Final value */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'Syne, sans-serif', fontWeight: 700,
                      fontSize: 32, color: '#FAFAFA',
                    }}>
                      {finalVal.toFixed(2)}
                    </div>
                  </div>

                  {/* Delta */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontFamily: 'DM Mono, monospace', fontSize: 16, fontWeight: 500,
                      color: delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : '#888',
                    }}>
                      {delta > 0 ? '+' : ''}{delta.toFixed(2)}
                    </div>
                    <div style={{
                      fontFamily: 'DM Mono, monospace', fontSize: 10,
                      color: trend === 'rising' ? '#22c55e' : trend === 'falling' ? '#ef4444' : '#555',
                      letterSpacing: '0.06em',
                    }}>
                      {trend === 'rising' ? '↑ RISING' : trend === 'falling' ? '↓ FALLING' : '→ STABLE'}
                    </div>
                  </div>

                  {/* Mini spark bar */}
                  <div style={{ width: 120, height: 32, flexShrink: 0 }}>
                    <svg width="120" height="32" viewBox="0 0 120 32">
                      {metricHistory.length > 1 &&
                        (() => {
                          const vals = metricHistory.map((d) => Number(d[key]) || 0);
                          const min = Math.min(...vals);
                          const max = Math.max(...vals);
                          const range = max - min || 1;
                          const pts = vals.map((v, idx) =>
                            `${(idx / (vals.length - 1)) * 120},${32 - ((v - min) / range) * 28}`
                          ).join(' ');
                          return (
                            <polyline
                              points={pts}
                              fill="none"
                              stroke={color}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          );
                        })()
                      }
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Entity final states */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            fontFamily: 'DM Mono, monospace', fontSize: 10,
            color: '#555', letterSpacing: '0.1em', marginBottom: 20,
          }}>
            ENTITY FINAL STATES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {schema.entities.map((ent, i) => {
              const colors = ['#FF4500', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];
              const color = colors[i % colors.length];
              return (
                <div key={ent.id} style={{
                  border: '1px solid #1E1E1E',
                  borderLeft: `3px solid ${color}`,
                  background: '#111', padding: '16px 20px',
                }}>
                  <div style={{
                    fontFamily: 'DM Mono, monospace', fontWeight: 500,
                    fontSize: 12, color, marginBottom: 4,
                  }}>
                    {ent.id}
                  </div>
                  <div style={{
                    fontFamily: 'DM Mono, monospace', fontSize: 9,
                    color: '#555', letterSpacing: '0.08em', marginBottom: 12,
                  }}>
                    {ent.type.toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {Object.entries(ent.attributes).map(([k, v]) => (
                      <div key={k} style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontFamily: 'DM Mono, monospace', fontSize: 11,
                      }}>
                        <span style={{ color: '#666' }}>{k}</span>
                        <span style={{ color: '#FAFAFA' }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex', gap: 12,
          borderTop: '1px solid #1E1E1E', paddingTop: 40,
        }}>
          <button
            onClick={() => onNavigate('simulate')}
            style={{
              padding: '14px 28px', border: '1px solid #1E1E1E',
              background: '#111', color: '#FAFAFA',
              fontFamily: 'DM Mono, monospace', fontSize: 12,
              cursor: 'pointer', letterSpacing: '0.06em',
            }}
          >
            ← BACK TO SIMULATION
          </button>
          <button
            onClick={() => onNavigate('home')}
            style={{
              padding: '14px 28px', background: '#FF4500',
              border: 'none', color: '#fff',
              fontFamily: 'DM Mono, monospace', fontSize: 12,
              cursor: 'pointer', letterSpacing: '0.06em',
            }}
          >
            NEW SIMULATION →
          </button>
        </div>
      </div>
    </div>
  );
}
