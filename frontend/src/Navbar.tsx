import React from 'react';
import type { AppPage } from './types';

interface NavbarProps {
  page: AppPage;
  domain?: string;
  tick?: number;
  connected?: boolean;
  onNavigate: (page: AppPage) => void;
}

const steps: { id: AppPage; label: string; num: string }[] = [
  { id: 'home', label: 'Upload', num: '01' },
  { id: 'configure', label: 'Configure', num: '02' },
  { id: 'simulate', label: 'Simulate', num: '03' },
  { id: 'insights', label: 'Insights', num: '04' },
];

export function Navbar({ page, domain, tick, connected, onNavigate }: NavbarProps) {
  const currentIdx = steps.findIndex((s) => s.id === page);

  return (
    <nav
      style={{
        height: 60,
        background: '#0A0A0A',
        borderBottom: '1px solid #1E1E1E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Brand */}
      <button
        onClick={() => onNavigate('home')}
        style={{
          fontFamily: 'DM Mono, monospace',
          fontWeight: 500,
          fontSize: 16,
          letterSpacing: '0.08em',
          color: '#FAFAFA',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        QFISH
      </button>

      {/* Step indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {steps.map((step, idx) => {
          const isActive = step.id === page;
          const isDone = idx < currentIdx;
          const isClickable = isDone || step.id === page;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => isClickable && onNavigate(step.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 16px',
                  background: isActive ? '#1E1E1E' : 'transparent',
                  border: 'none',
                  cursor: isClickable ? 'pointer' : 'default',
                  borderRadius: 4,
                  opacity: !isClickable && !isActive ? 0.35 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <span
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: 10,
                    color: isActive ? '#FF4500' : isDone ? '#888' : '#444',
                    fontWeight: 500,
                  }}
                >
                  {step.num}
                </span>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#FAFAFA' : isDone ? '#888' : '#444',
                    letterSpacing: '0.02em',
                  }}
                >
                  {step.label}
                </span>
                {isDone && (
                  <span style={{ color: '#FF4500', fontSize: 10 }}>✓</span>
                )}
              </button>
              {idx < steps.length - 1 && (
                <span style={{ color: '#222', fontSize: 12, padding: '0 2px' }}>
                  /
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Right: domain + connection */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {domain && (
          <span
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: 11,
              color: '#666',
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {domain}
          </span>
        )}
        {tick !== undefined && tick > 0 && (
          <span
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: 11,
              color: '#444',
            }}
          >
            tick:{tick}
          </span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: connected ? '#22c55e' : '#EF4444',
              display: 'inline-block',
              animation: connected ? 'pulseDot 2s ease-in-out infinite' : 'none',
            }}
          />
          <span
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: 10,
              color: connected ? '#22c55e' : '#EF4444',
            }}
          >
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </nav>
  );
}
