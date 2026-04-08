import React, { useState, useRef, useCallback } from 'react';
import type { AppPage, UploadFile } from './types';

interface HomePageProps {
  onNavigate: (page: AppPage, documentText?: string) => void;
}

// PDF removed — FileReader.readAsText() produces garbled output for binary PDF files.
// Support MD and TXT only. PDF support requires pdf.js (future task).
const ACCEPTED = ['.md', '.txt', '.markdown'];
const ACCEPTED_LABEL = 'MD · TXT';

const STEPS = [
  { num: '01', title: 'Upload Reality Seed', desc: 'Any text document — news, policy, research, novel.' },
  { num: '02', title: 'LLM Schema Extraction', desc: 'Python brain calls your LLM to extract entities, relations, and metrics.' },
  { num: '03', title: 'Rust Engine Runs', desc: 'Compiled simulation loop evolves agents at sub-millisecond speed.' },
  { num: '04', title: 'Live Streaming Dashboard', desc: 'WebSocket pushes real-time metric charts and entity panels.' },
  { num: '05', title: 'AI Insight Report', desc: 'LLM summarises what emerged — domain-aware, no templates.' },
];

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = files.length > 0 && prompt.trim().length > 0 && !loading;

  const addFiles = useCallback((rawFiles: FileList | File[]) => {
    const valid = Array.from(rawFiles).filter((f) => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return ACCEPTED.includes(ext);
    });
    if (valid.length === 0) {
      setError(`Only ${ACCEPTED_LABEL} files accepted.`);
      return;
    }
    setError('');
    setFiles((prev) => [
      ...prev,
      ...valid.map((f) => ({ file: f, name: f.name, size: f.size, type: f.type })),
    ]);
  }, []);

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleStart = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const texts = await Promise.all(files.map((f) => readFileAsText(f.file)));
      const combined = texts.join('\n\n---\n\n');
      const documentText = `USER GOAL: ${prompt}\n\n---\n\n${combined}`;
      onNavigate('configure', documentText);
    } catch {
      setError('Failed to read file. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', color: '#FAFAFA' }}>
      {/* Navbar */}
      <nav style={{
        height: 60, background: '#0A0A0A', borderBottom: '1px solid #1E1E1E',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px',
      }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: 16, letterSpacing: '0.08em' }}>
          QFISH
        </span>
        <a
          href="https://github.com/666ghj/MiroFish"
          target="_blank"
          rel="noreferrer"
          style={{
            fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#555',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          Based on MiroFish ↗
        </a>
      </nav>

      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '64px 40px 80px' }}>

        {/* ── Hero ── */}
        <section style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 88, gap: 60,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <span style={{
                background: '#FF4500', color: '#fff',
                fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 500,
                padding: '4px 10px', letterSpacing: '0.1em',
              }}>
                UNIVERSAL ENGINE
              </span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#555' }}>
                v0.1 · Rust + Python + React
              </span>
            </div>

            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: 'clamp(2.8rem, 5vw, 5rem)', lineHeight: 1.05,
              letterSpacing: '-0.03em', marginBottom: 36, color: '#FAFAFA',
            }}>
              Predict Anything<br />
              <span style={{ color: '#FF4500' }}>From Any Document</span>
            </h1>

            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: 16,
              lineHeight: 1.8, color: '#666', maxWidth: 560, marginBottom: 48,
            }}>
              QFish is a domain-agnostic multi-agent simulation engine. Upload
              any real-world document — news article, policy draft, supply chain
              data, clinical trial, or a novel — describe your prediction goal,
              and let{' '}
              <span style={{ color: '#FAFAFA', fontWeight: 500 }}>autonomous agents</span> evolve
              inside a{' '}
              <span style={{ color: '#FF4500', fontFamily: 'DM Mono, monospace', fontSize: 14 }}>
                Rust simulation loop
              </span>{' '}
              while an LLM reads the results.
            </p>

            <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #1E1E1E', paddingTop: 32 }}>
              {[
                { val: '50+', label: 'Agents per run' },
                { val: '<1ms', label: 'Tick latency' },
                { val: '∞', label: 'Domains supported' },
              ].map((stat, i) => (
                <div key={i} style={{
                  paddingRight: 40, marginRight: 40,
                  borderRight: i < 2 ? '1px solid #1E1E1E' : 'none',
                }}>
                  <div style={{
                    fontFamily: 'Syne, sans-serif', fontWeight: 700,
                    fontSize: 28, color: '#FAFAFA', marginBottom: 4,
                  }}>
                    {stat.val}
                  </div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#555' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Steps sidebar */}
          <div style={{ width: 320, flexShrink: 0, border: '1px solid #1E1E1E', padding: 28 }}>
            <div style={{
              fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#555',
              letterSpacing: '0.1em', marginBottom: 24,
            }}>
              ◇ WORKFLOW
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {STEPS.map((step) => (
                <div key={step.num} style={{ display: 'flex', gap: 16 }}>
                  <span style={{
                    fontFamily: 'DM Mono, monospace', fontSize: 11,
                    color: '#333', flexShrink: 0, paddingTop: 2,
                  }}>
                    {step.num}
                  </span>
                  <div>
                    <div style={{
                      fontFamily: 'Inter, sans-serif', fontWeight: 600,
                      fontSize: 13, color: '#FAFAFA', marginBottom: 3,
                    }}>
                      {step.title}
                    </div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#555', lineHeight: 1.5 }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Upload console ── */}
        <section style={{ borderTop: '1px solid #1E1E1E', paddingTop: 60, display: 'flex', gap: 60 }}>
          <div style={{ width: 280, flexShrink: 0 }}>
            <div style={{
              fontFamily: 'DM Mono, monospace', fontSize: 10,
              color: '#555', letterSpacing: '0.1em', marginBottom: 16,
            }}>
              ■ SYSTEM READY
            </div>
            <h2 style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: 26, color: '#FAFAFA', marginBottom: 12, lineHeight: 1.2,
            }}>
              Launch Simulation
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#555', lineHeight: 1.6 }}>
              Upload a reality seed document and describe what you want to predict.
            </p>
          </div>

          <div style={{ flex: 1, border: '1px solid #1E1E1E', padding: 8 }}>

            {/* Upload zone */}
            <div style={{ padding: 20, borderBottom: '1px solid #1E1E1E' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontFamily: 'DM Mono, monospace', fontSize: 10,
                color: '#555', marginBottom: 14, letterSpacing: '0.05em',
              }}>
                <span>REALITY SEED</span>
                <span>{ACCEPTED_LABEL}</span>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => !loading && fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                style={{
                  border: `1px dashed ${isDragOver ? '#FF4500' : files.length > 0 ? '#333' : '#2a2a2a'}`,
                  minHeight: 160,
                  background: isDragOver ? 'rgba(255,69,0,0.04)' : '#0d0d0d',
                  cursor: loading ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: files.length > 0 ? 'flex-start' : 'center',
                  justifyContent: files.length > 0 ? 'flex-start' : 'center',
                  padding: files.length > 0 ? 16 : 0,
                  flexDirection: 'column',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED.join(',')}
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />

                {files.length === 0 ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 36, height: 36, border: '1px solid #2a2a2a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 12px', color: '#555', fontSize: 18,
                    }}>↑</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#555', marginBottom: 4 }}>
                      Drop files here or click to browse
                    </div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#333' }}>
                      {ACCEPTED_LABEL} accepted
                    </div>
                  </div>
                ) : (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {files.map((f, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', background: '#111', border: '1px solid #1E1E1E',
                      }}>
                        <span style={{ color: '#FF4500', fontSize: 13 }}>◈</span>
                        <span style={{
                          flex: 1, fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#FAFAFA',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {f.name}
                        </span>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#555' }}>
                          {(f.size / 1024).toFixed(1)}kb
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          style={{
                            background: 'none', border: 'none', color: '#555',
                            cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px',
                          }}
                        >×</button>
                      </div>
                    ))}
                    <button
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      style={{
                        background: 'none', border: '1px dashed #2a2a2a',
                        color: '#555', fontFamily: 'DM Mono, monospace',
                        fontSize: 11, padding: '8px', cursor: 'pointer', textAlign: 'center',
                      }}
                    >
                      + add more files
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: 36 }}>
              <div style={{ flex: 1, height: 1, background: '#1E1E1E' }} />
              <span style={{
                padding: '0 14px', fontFamily: 'DM Mono, monospace',
                fontSize: 9, color: '#444', letterSpacing: '0.1em',
              }}>INPUT PARAMETERS</span>
              <div style={{ flex: 1, height: 1, background: '#1E1E1E' }} />
            </div>

            {/* Prompt */}
            <div style={{ padding: '0 20px 20px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontFamily: 'DM Mono, monospace', fontSize: 10,
                color: '#555', marginBottom: 12, letterSpacing: '0.05em',
              }}>
                <span>SIMULATION PROMPT</span>
                <span style={{ color: prompt.length > 0 ? '#FF4500' : '#333' }}>
                  {prompt.length} chars
                </span>
              </div>
              <div style={{ position: 'relative', border: '1px solid #1E1E1E', background: '#0d0d0d' }}>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Predict how public opinion will shift after this tax policy is announced..."
                  rows={5}
                  disabled={loading}
                  style={{
                    width: '100%', background: 'transparent', border: 'none',
                    padding: '16px 16px 40px',
                    fontFamily: 'DM Mono, monospace', fontSize: 13,
                    color: '#FAFAFA', resize: 'vertical', outline: 'none', lineHeight: 1.6,
                  }}
                />
                <div style={{
                  position: 'absolute', bottom: 10, right: 14,
                  fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#333',
                }}>
                  QFish Engine · Multi-provider LLM
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                margin: '0 20px 12px',
                padding: '10px 14px', background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#ef4444',
              }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ padding: '0 20px 20px' }}>
              <button
                onClick={handleStart}
                disabled={!canSubmit}
                style={{
                  width: '100%',
                  background: canSubmit ? '#FF4500' : '#1A1A1A',
                  color: canSubmit ? '#fff' : '#444',
                  border: 'none', padding: '18px 24px',
                  fontFamily: 'DM Mono, monospace', fontWeight: 500,
                  fontSize: 14, letterSpacing: '0.08em',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                }}
              >
                <span>{loading ? 'READING DOCUMENT...' : 'LAUNCH SIMULATION'}</span>
                <span>{loading ? '◌' : '→'}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
