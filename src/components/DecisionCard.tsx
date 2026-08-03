import React from 'react';

interface DecisionCardProps {
  onAuthorize?: () => void;
  onHold?: () => void;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({
  onAuthorize,
  onHold,
}) => {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '760px',
        borderLeft: '2.5px solid var(--ink)',
        borderRight: '2.5px solid var(--ink)',
        backgroundColor: 'var(--surface)',
        padding: '12px 14px',
        borderBottom: '1px solid var(--border-soft)',
      }}
    >
      <div
        style={{
          border: '2px solid var(--accent)',
          borderRadius: '8px',
          backgroundColor: 'var(--panel-hi)',
          padding: '12px 14px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '1px',
              color: 'var(--ink)',
            }}
          >
            CONTENTION — AUTHORIZATION REQUIRED
          </span>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '7.5px',
              fontWeight: 700,
              border: '1.5px solid var(--alarm)',
              padding: '2px 6px',
              borderRadius: '3px',
              color: 'var(--alarm-ink)',
            }}
          >
            capacity verified = 1
          </span>
        </div>

        {/* Two-Column Tradeoff Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px', marginBottom: '12px' }}>
          {/* Winner Side: RESTORE ▸ CH-14 */}
          <div
            style={{
              border: '2px solid #1d6e8c',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              padding: '10px',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--restored-ink)', marginBottom: '4px' }}>
              RESTORE ▸ CH-14
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--text-60)' }}>
              Emergency / public-information tier
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '7px',
                color: 'var(--restored-ink)',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ▣ operator-declared · pre-incident
            </div>
          </div>

          {/* Loser Side: STAYS DEGRADED ▸ CH-27 */}
          <div
            className="hatch-alarm"
            style={{
              border: '2px solid var(--ink)',
              borderRadius: '6px',
              padding: '10px',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--alarm-ink)', marginBottom: '4px' }}>
              STAYS DEGRADED ▸ CH-27
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--text-60)' }}>
              General entertainment tier
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', color: 'var(--alarm-ink)', marginTop: '6px' }}>
              the explicit cost of 1-of-2 capacity
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border-soft)' }}>
          <button
            onClick={onAuthorize}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--ink)',
              color: '#f5f3ec',
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              fontWeight: 700,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Authorize restore
          </button>

          <button
            onClick={onHold}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: 'var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              fontWeight: 700,
              borderRadius: '4px',
              border: '1.5px solid var(--ink)',
              cursor: 'pointer',
            }}
          >
            Hold both
          </button>

          <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '7px', color: 'var(--text-50)' }}>
            agent proposes · human authorizes · policy read-only
          </div>
        </div>
      </div>
    </div>
  );
};
