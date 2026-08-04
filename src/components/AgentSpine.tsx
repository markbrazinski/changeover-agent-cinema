import React from 'react';

export interface SpineStep {
  title: string;
  sub: string;
  tone?: 'done' | 'active' | 'fill' | 'pending' | 'refuse';
}

interface AgentSpineProps {
  substate?: string;
  steps?: SpineStep[];
  showGate?: boolean;
  showContentionGate?: boolean;
  onApprove?: () => void;
  onHold?: () => void;
  holdNote?: string;
  isSolidHoldNote?: boolean;
}

export const AgentSpine: React.FC<AgentSpineProps> = ({
  substate = '01_AT_REST',
  steps = [],
  showGate = false,
  showContentionGate = false,
  onApprove,
  onHold,
  holdNote,
  isSolidHoldNote = false,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        paddingLeft: '16px',
        borderLeft: '2.5px solid var(--ink)',
      }}
    >
      {/* Top Header & Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              border: '2px solid var(--ink)',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: '4px', height: '4px', backgroundColor: 'var(--ink)' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
            AGENT SPINE
          </span>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--text-50)', letterSpacing: '0.5px' }}>
          T+00:14 · REASONING
        </div>

        {/* Stacked Step Tiles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {steps.map((step, idx) => {
            const isDone = step.tone === 'done';
            const isActive = step.tone === 'active';
            const isFill = step.tone === 'fill';
            const isRefuse = step.tone === 'refuse';

            return (
              <div
                key={idx}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: isRefuse
                    ? '2px solid var(--alarm)'
                    : isActive
                    ? '2px solid var(--ink)'
                    : isDone
                    ? '1.5px solid #c3bfb8'
                    : '1.5px dashed #c3bfb8',
                  backgroundColor: isActive ? 'var(--ink)' : isFill ? 'var(--panel-sunken)' : 'var(--panel-hi)',
                  color: isActive ? '#f5f3ec' : 'var(--ink)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700 }}>
                  {step.title}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8px',
                    opacity: isActive ? 0.8 : 0.65,
                  }}
                >
                  {step.sub}
                </div>
              </div>
            );
          })}
        </div>

        {/* Docked Single-Channel Approve / Hold Action Gate (State 05) */}
        {showGate && (
          <div
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: 'var(--panel-sunken)',
              border: '2px solid var(--ink)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '4px',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, textAlign: 'center' }}>
              SUMMON: AUTHORIZE CHANGE
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={onApprove}
                style={{
                  padding: '8px',
                  backgroundColor: 'var(--nominal)',
                  color: '#f5f3ec',
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                APPROVE
              </button>

              <button
                onClick={onHold}
                style={{
                  padding: '8px',
                  backgroundColor: 'var(--panel-hi)',
                  color: 'var(--ink)',
                  border: '1.5px solid var(--ink)',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                HOLD
              </button>
            </div>
          </div>
        )}

        {/* Docked Contention Decision Gate (State 10 Above-The-Fold) */}
        {showContentionGate && (
          <div
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: 'var(--panel-sunken)',
              border: '2.5px solid var(--accent)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '4px',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 700, color: 'var(--ink)' }}>
              SUMMON: CONTENTION TRADEOFF
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--ink)', lineHeight: 1.4 }}>
              <strong>Policy Precedence:</strong>
              <div style={{ marginTop: '2px', color: 'var(--nominal-ink)' }}>• CH-14: Emergency Tier → Restores</div>
              <div style={{ color: 'var(--alarm-ink)' }}>• CH-27: General Tier → Stays Degraded</div>
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7.5px', color: 'var(--text-60)' }}>
              Scarcity: 1 shared backup for 2 failures.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '2px' }}>
              <button
                onClick={onApprove}
                style={{
                  padding: '8px 4px',
                  backgroundColor: 'var(--nominal)',
                  color: '#f5f3ec',
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                AUTHORIZE RESTORE
              </button>

              <button
                onClick={onHold}
                style={{
                  padding: '8px 4px',
                  backgroundColor: 'var(--panel-hi)',
                  color: 'var(--ink)',
                  border: '1.5px solid var(--ink)',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                HOLD BOTH
              </button>
            </div>
          </div>
        )}

        {/* Hold Note Banner (Refusal / Blind) */}
        {holdNote && (
          <div
            style={{
              padding: '8px 10px',
              borderRadius: '4px',
              border: isSolidHoldNote ? '2px solid var(--ink)' : '1.5px dashed var(--alarm)',
              backgroundColor: isSolidHoldNote ? 'var(--panel-hi)' : 'var(--surface)',
              color: isSolidHoldNote ? 'var(--ink)' : 'var(--alarm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              fontWeight: 700,
            }}
          >
            {holdNote}
          </div>
        )}
      </div>

      {/* Footer Invariant Line with Dashed Separator Line */}
      <div style={{ marginTop: '16px', paddingTop: '10px', borderTop: '1px dashed rgba(0, 0, 0, 0.2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7.5px', color: 'var(--text-42)', lineHeight: 1.4 }}>
          value carries state · alarm never sole-encodes · accent #b8641b reserved
        </div>
      </div>
    </div>
  );
};
