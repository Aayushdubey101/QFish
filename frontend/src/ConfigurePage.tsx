import React, { useEffect, useState, useCallback } from 'react';
import type { AppPage, SimulationSchema } from './types';
import { extractSchema, initEngine } from './api';
import { Navbar } from './Navbar';

interface ConfigurePageProps {
  documentText: string;
  onNavigate: (page: AppPage) => void;
  onSchemaReady: (schema: SimulationSchema) => void;
}

type Phase = 'extracting' | 'preview' | 'initializing' | 'ready' | 'error';

const ATTR_COLORS = [
  '#FF4500', '#3b82f6', '#22c55e', '#f59e0b',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];

function EntityCard({ entity, color }: { entity: SimulationSchema['entities'][0]; color: string }) {
  return (
    <div style={{
      border: `1px solid ${color}33`,
      background: '#111',
      padding: 16,
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{
        fontFamily: 'DM Mono, monospace', fontWeight: 500,
        fontSize: 13, color, marginBottom: 4,
      }}>
        {entity.id}
      </div>
      <div style={{
        fontFamily: 'DM Mono, monospace', fontSize: 10,
        color: '#555', letterSpacing: '0.08em', marginBottom: 10,
      }}>
        {entity.type.toUpperCase()}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {Object.entries(entity.attributes).map(([k, v]) => (
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
}

export function ConfigurePage({ documentText, onNavigate, onSchemaReady }: ConfigurePageProps) {
  const [phase, setPhase] = useState<Phase>('extracting');
  const [schema, setSchema] = useState<SimulationSchema | null>(null);
  const [error, setError] = useState('');
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLog((prev) => [...prev, `[${ts}] ${msg}`]);
  };

  const runExtraction = useCallback(async () => {
    setPhase('extracting');
    setError('');
    addLog('Sending document to python-brain /extract...');
    addLog(`Document length: ${documentText.length} chars`);
    try {
      const result = await extractSchema(documentText);
      setSchema(result);
      addLog(`Domain detected: ${result.domain}`);
      addLog(`Entities: ${result.entities.length}`);
      addLog(`Relations: ${result.relations.length}`);
      addLog(`Global metrics: ${Object.keys(result.global_metrics).join(', ')}`);
      addLog('Schema extraction complete. Review below.');
      setPhase('preview');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      addLog(`ERROR: ${msg}`);
      setPhase('error');
    }
  }, [documentText]);

  useEffect(() => {
    runExtraction();
  }, [runExtraction]);

  const handleInit = async () => {
    if (!schema) return;
    setPhase('initializing');
    addLog('Pushing SimulationSchema to Rust engine /init...');
    try {
      await initEngine(schema);
      addLog('Engine initialized. Starting simulation loop.');
      onSchemaReady(schema);
      setPhase('ready');
      setTimeout(() => onNavigate('simulate'), 600);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      addLog(`ENGINE INIT ERROR: ${msg}`);
      setPhase('error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', color: '#FAFAFA', display: 'flex', flexDirection: 'column' }}>
      <Navbar page="configure" onNavigate={onNavigate} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left: terminal log */}
        <div style={{
          width: 360, flexShrink: 0,
          borderRight: '1px solid #1E1E1E',
          display: 'flex', flexDirection: 'column',
          background: '#0d0d0d',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #1E1E1E',
            fontFamily: 'DM Mono, monospace', fontSize: 10,
            color: '#555', letterSpacing: '0.1em',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: phase === 'error' ? '#ef4444' : phase === 'preview' || phase === 'ready' ? '#22c55e' : '#FF4500',
              animation: phase === 'extracting' || phase === 'initializing' ? 'pulseDot 1.5s ease-in-out infinite' : 'none',
            }} />
            EXTRACTION LOG
          </div>
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px 20px',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {log.map((line, i) => (
              <div
                key={i}
                style={{
                  fontFamily: 'DM Mono, monospace', fontSize: 11,
                  color: line.includes('ERROR') ? '#ef4444' : line.includes('complete') || line.includes('detected') ? '#22c55e' : '#666',
                  lineHeight: 1.5,
                  animation: 'fadeIn 0.3s ease forwards',
                }}
              >
                {line}
              </div>
            ))}
            {(phase === 'extracting' || phase === 'initializing') && (
              <div style={{
                fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#FF4500',
              }}>
                ▋<span className="cursor-blink"> </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ padding: 20, borderTop: '1px solid #1E1E1E', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {phase === 'preview' && (
              <button
                onClick={handleInit}
                style={{
                  background: '#FF4500', color: '#fff', border: 'none',
                  padding: '14px 20px', fontFamily: 'DM Mono, monospace',
                  fontWeight: 500, fontSize: 13, letterSpacing: '0.06em',
                  cursor: 'pointer', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span>INIT ENGINE + START</span>
                <span>→</span>
              </button>
            )}
            {phase === 'error' && (
              <button
                onClick={runExtraction}
                style={{
                  background: '#1E1E1E', color: '#FAFAFA', border: '1px solid #333',
                  padding: '14px 20px', fontFamily: 'DM Mono, monospace',
                  fontSize: 13, cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span>RETRY EXTRACTION</span>
                <span>↺</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('home')}
              style={{
                background: 'none', color: '#555', border: '1px solid #1E1E1E',
                padding: '10px 20px', fontFamily: 'DM Mono, monospace',
                fontSize: 11, cursor: 'pointer', letterSpacing: '0.05em',
              }}
            >
              ← BACK TO UPLOAD
            </button>
          </div>
        </div>

        {/* Right: schema preview */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
          {phase === 'extracting' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 20 }}>
              <div style={{
                width: 48, height: 48, border: '2px solid #FF4500',
                borderTopColor: 'transparent', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#555' }}>
                LLM extracting simulation schema...
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {(phase === 'preview' || phase === 'initializing' || phase === 'ready') && schema && (
            <div style={{ animation: 'fadeIn 0.4s ease forwards' }}>
              {/* Domain header */}
              <div style={{ marginBottom: 40 }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#555', marginBottom: 8, letterSpacing: '0.1em' }}>
                  DETECTED DOMAIN
                </div>
                <h2 style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 700,
                  fontSize: 32, color: '#FAFAFA', marginBottom: 16,
                }}>
                  {schema.domain}
                </h2>
                {/* Metric pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(schema.global_metrics).map(([k, v], i) => (
                    <div key={k} style={{
                      padding: '6px 12px',
                      border: `1px solid ${ATTR_COLORS[i % ATTR_COLORS.length]}44`,
                      background: `${ATTR_COLORS[i % ATTR_COLORS.length]}11`,
                      fontFamily: 'DM Mono, monospace', fontSize: 11,
                      color: ATTR_COLORS[i % ATTR_COLORS.length],
                    }}>
                      {k}: <strong>{v.toFixed(1)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Entities grid */}
              <div style={{ marginBottom: 40 }}>
                <div style={{
                  fontFamily: 'DM Mono, monospace', fontSize: 10,
                  color: '#555', marginBottom: 16, letterSpacing: '0.1em',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  ENTITIES
                  <span style={{
                    background: '#1E1E1E', padding: '2px 8px',
                    borderRadius: 2, color: '#888',
                  }}>
                    {schema.entities.length}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                  {schema.entities.map((ent, i) => (
                    <EntityCard key={ent.id} entity={ent} color={ATTR_COLORS[i % ATTR_COLORS.length]} />
                  ))}
                </div>
              </div>

              {/* Relations */}
              {schema.relations.length > 0 && (
                <div>
                  <div style={{
                    fontFamily: 'DM Mono, monospace', fontSize: 10,
                    color: '#555', marginBottom: 16, letterSpacing: '0.1em',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    RELATIONS
                    <span style={{ background: '#1E1E1E', padding: '2px 8px', borderRadius: 2, color: '#888' }}>
                      {schema.relations.length}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                    {schema.relations.map((rel, i) => (
                      <div key={i} style={{
                        border: '1px solid #1E1E1E', padding: '12px 16px', background: '#111',
                        display: 'flex', flexDirection: 'column', gap: 6,
                      }}>
                        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>
                          <span style={{ color: '#FF4500' }}>{rel.source}</span>
                          <span style={{ color: '#555', padding: '0 8px' }}>→</span>
                          <span style={{ color: '#3b82f6' }}>{rel.target}</span>
                        </div>
                        <div style={{
                          fontFamily: 'DM Mono, monospace', fontSize: 10,
                          color: '#888', letterSpacing: '0.05em',
                        }}>
                          {rel.type}
                        </div>
                        {Object.keys(rel.attributes).length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {Object.entries(rel.attributes).map(([k, v]) => (
                              <span key={k} style={{
                                fontFamily: 'DM Mono, monospace', fontSize: 9,
                                color: '#555', background: '#161616',
                                padding: '2px 6px', border: '1px solid #1E1E1E',
                              }}>
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {phase === 'error' && (
            <div style={{
              padding: '40px', textAlign: 'center',
              border: '1px solid rgba(239,68,68,0.2)',
              background: 'rgba(239,68,68,0.05)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>⚠</div>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: 20, color: '#ef4444', marginBottom: 12,
              }}>
                Extraction Failed
              </div>
              <div style={{
                fontFamily: 'DM Mono, monospace', fontSize: 12,
                color: '#888', maxWidth: 500, margin: '0 auto',
              }}>
                {error}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
