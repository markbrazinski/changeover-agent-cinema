import React from 'react';

interface LaneStripProps {
  isExpanded?: boolean;
}

export const LaneStrip: React.FC<LaneStripProps> = ({ isExpanded = false }) => {
  if (!isExpanded) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: '760px',
          backgroundColor: 'var(--panel-lo)',
          borderLeft: '2.5px solid var(--ink)',
          borderRight: '2.5px solid var(--ink)',
          borderBottom: '1px solid var(--border-soft)',
          padding: '6px 13px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '7.5px',
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--text-60)' }}>LAYERS</span>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 6px',
            borderRadius: '10px',
            backgroundColor: 'rgba(180, 35, 28, 0.1)',
            border: '1px solid var(--alarm)',
            color: 'var(--alarm-ink)',
            fontWeight: 700,
          }}
        >
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--alarm)' }} />
          CAP
        </span>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 6px',
            borderRadius: '10px',
            backgroundColor: 'rgba(59, 122, 75, 0.08)',
            border: '1px solid var(--nominal)',
            color: 'var(--nominal-ink)',
            fontWeight: 700,
          }}
        >
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--nominal)' }} />
          SIGN
        </span>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 6px',
            borderRadius: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            border: '1px solid var(--border-soft)',
            color: 'var(--text-50)',
          }}
        >
          AD (static)
        </span>

        <div style={{ marginLeft: 'auto', color: 'var(--text-50)' }}>
          1 layer failing · 1 stand-in healthy · 1 static
        </div>
      </div>
    );
  }

  // Expanded Peer Cards (Investigation beat 02->03)
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '760px',
        backgroundColor: 'var(--panel-mute)',
        borderLeft: '2.5px solid var(--ink)',
        borderRight: '2.5px solid var(--ink)',
        borderBottom: '1.5px solid var(--ink)',
        padding: '10px 13px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '8px',
          fontWeight: 700,
          letterSpacing: '1px',
          color: 'var(--text-60)',
          marginBottom: '8px',
        }}
      >
        PEER LAYER ISOLATION — 1 BEAT EXPAND
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {/* CAP Card */}
        <div
          className="hatch-alarm"
          style={{
            border: '2px solid var(--alarm)',
            borderRadius: '5px',
            padding: '8px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ fontSize: '8.5px', fontWeight: 700, color: 'var(--alarm-ink)' }}>CAP · CAPTIONS</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--alarm-ink)', marginTop: '2px' }}>▲ FAIL</div>
          <div style={{ fontSize: '7px', color: 'var(--text-60)', marginTop: '4px' }}>offset +2.996s &gt; 0.759s</div>
        </div>

        {/* SIGN Card */}
        <div
          style={{
            border: '1.5px solid var(--nominal)',
            backgroundColor: 'var(--panel-hi)',
            borderRadius: '5px',
            padding: '8px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ fontSize: '8.5px', fontWeight: 700, color: 'var(--nominal-ink)' }}>SIGN · LIVENESS</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--nominal-ink)', marginTop: '2px' }}>✓ NOMINAL</div>
          <div style={{ fontSize: '7px', color: 'var(--text-60)', marginTop: '4px' }}>stand-in gap 0.000s</div>
        </div>

        {/* AD Card */}
        <div
          style={{
            border: '1px dashed var(--border-soft)',
            backgroundColor: 'var(--panel-hi)',
            borderRadius: '5px',
            padding: '8px',
            fontFamily: 'var(--font-mono)',
            opacity: 0.7,
          }}
        >
          <div style={{ fontSize: '8.5px', fontWeight: 700, color: 'var(--text-60)' }}>AD · AUDIO DESC</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-50)', marginTop: '2px' }}>STATIC</div>
          <div style={{ fontSize: '7px', color: 'var(--text-50)', marginTop: '4px' }}>not monitored in build</div>
        </div>
      </div>

      <div
        style={{
          marginTop: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '7px',
          color: 'var(--text-50)',
          textAlign: 'right',
        }}
      >
        spine ▶ isolates captions layer
      </div>
    </div>
  );
};
