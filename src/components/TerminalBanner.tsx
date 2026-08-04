import React from 'react';

interface TerminalBannerProps {
  statusText?: string;
}

export const TerminalBanner: React.FC<TerminalBannerProps> = ({
  statusText = 'Partially mitigated — 1 restored, 1 incident open',
}) => {
  return (
    <div
      data-testid="terminal-banner"
      style={{
        backgroundColor: '#16140f',
        color: '#f5f3ec',
        padding: '12px 18px',
        borderTop: '2.5px solid var(--ink)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          data-testid="terminal-alarm-chip"
          style={{
            padding: '3px 8px',
            backgroundColor: 'var(--alarm)',
            color: '#f5f3ec',
            fontFamily: 'var(--font-mono)',
            fontSize: '9.5px',
            fontWeight: 700,
            borderRadius: '3px',
            letterSpacing: '1px',
          }}
        >
          ▲ 1 OPEN INCIDENT
        </div>

        <span
          data-testid="terminal-text"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px',
          }}
        >
          {statusText}
        </span>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8.5px', color: 'rgba(255, 255, 255, 0.45)' }}>
        State logged: logs/contention_authorized.json
      </div>
    </div>
  );
};
