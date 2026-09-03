import React, { useState } from 'react';

export const ReplayProvenanceBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      data-testid="replay-provenance-banner"
      style={{
        backgroundColor: '#1b1915',
        color: '#f5f3ec',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        padding: '6px 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              backgroundColor: 'rgba(255, 152, 0, 0.2)',
              border: '1px solid #ff9800',
              color: '#ffe0b2',
              borderRadius: '3px',
              padding: '2px 7px',
              fontSize: '9.5px',
              fontWeight: 700,
              letterSpacing: '0.5px',
            }}
          >
            ● REPLAY — DETERMINISTIC
          </span>
          <span style={{ opacity: 0.8, fontSize: '10.5px' }}>
            Recorded run · No live external calls
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: '#38d39f',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 700,
            textDecoration: 'underline',
          }}
        >
          {isOpen ? '▲ Hide provenance details' : '▼ How this relates to the real build'}
        </button>
      </div>

      {isOpen && (
        <div
          style={{
            marginTop: '8px',
            padding: '10px 14px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            lineHeight: 1.5,
            fontSize: '10px',
            color: '#d0ccc4',
          }}
        >
          <p style={{ margin: '0 0 6px 0', color: '#f5f3ec', fontWeight: 700 }}>
            How this relates to the real build:
          </p>
          <p style={{ margin: '0 0 6px 0' }}>
            This page replays a previously validated Changeover execution. Every number shown — the{' '}
            <strong style={{ color: '#ffe0b2' }}>+2.996s</strong> caption offset, the{' '}
            <strong style={{ color: '#ffe0b2' }}>0.759s</strong> derived ceiling, the{' '}
            <strong style={{ color: '#ffe0b2' }}>0.486s</strong> post-swap offset — was measured during a real run, not invented for this demo.
          </p>
          <p style={{ margin: '0 0 6px 0' }}>
            The real build queries Grafana through the official Grafana Labs MCP server, diagnoses the failed accessibility layer with Gemini 2.5 Flash through Google ADK, and verifies the backup with ffprobe.{' '}
            <strong style={{ color: '#38d39f' }}>This hosted page makes no external calls of any kind.</strong>
          </p>
          <p style={{ margin: '0 0 6px 0' }}>
            Two things on this page are the real product logic running live: the deterministic capacity and service-tier policy, and the operator authorization gate. The feed cannot change over until you click.
          </p>
          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed rgba(255, 255, 255, 0.15)', display: 'flex', gap: '16px' }}>
            <span>📄 Sponsor-Path Integration Test: <code style={{ color: '#38d39f' }}>tests/test_sponsor_path.py</code></span>
            <span>🐍 Python Agent Engine: <code style={{ color: '#38d39f' }}>changeover/agent/</code></span>
          </div>
        </div>
      )}
    </div>
  );
};
