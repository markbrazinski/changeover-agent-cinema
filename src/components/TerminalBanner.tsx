import React from 'react';

export const TerminalBanner: React.FC = () => {
  return (
    <div
      className="hatch-neutral"
      style={{
        width: '100%',
        maxWidth: '760px',
        borderLeft: '2.5px solid var(--ink)',
        borderRight: '2.5px solid var(--ink)',
        borderBottom: '2.5px solid var(--ink)',
        backgroundColor: 'var(--panel-sunken)',
        padding: '11px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderRadius: '0 0 13px 13px',
      }}
    >
      <div style={{ fontSize: '18px', color: 'var(--ink)' }}>◧</div>

      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '0.5px',
          }}
        >
          Partially mitigated — 1 restored, 1 incident open
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '8px',
            color: 'var(--text-60)',
            marginTop: '2px',
          }}
        >
          CH-14 restored · CH-27 still degraded — not a resolved / green close
        </div>
      </div>

      <div
        style={{
          marginLeft: 'auto',
          backgroundColor: 'var(--alarm)',
          color: '#f5f3ec',
          fontFamily: 'var(--font-mono)',
          fontSize: '8px',
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: '3px',
        }}
      >
        1 OPEN INCIDENT
      </div>
    </div>
  );
};
