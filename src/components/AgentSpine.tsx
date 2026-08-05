import React from 'react';

export interface SpineStep {
  title: string;
  sub: string;
  tone?: 'done' | 'active' | 'fill' | 'pending' | 'refuse';
  timestamp?: string;
  toolCall?: string;
}

interface AgentSpineProps {
  substate?: string;
  steps?: SpineStep[];
  showGate?: boolean;
  showContentionGate?: boolean;
  onApprove?: () => void;
  onAlternativeApprove?: () => void;
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
  onAlternativeApprove,
  onHold,
  holdNote,
  isSolidHoldNote = false,
}) => {
  return (
    <div
      data-testid="agent-spine"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        paddingLeft: '16px',
        borderLeft: '2.5px solid var(--ink)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', overflow: 'hidden' }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
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

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              backgroundColor: 'var(--ink)',
              color: '#f5f3ec',
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 700,
            }}
          >
            ADK + MCP
          </div>
        </div>

        {/* --- PINNED TOP ACTION GATE (NEVER BURIED BELOW FOLD) --- */}

        {/* CTA 1: Single-Channel Failover Authorization Gate */}
        {showGate && (
          <div
            data-testid="single-channel-gate"
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: 'var(--panel-sunken)',
              border: '2.5px solid var(--accent)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(184, 100, 27, 0.25)',
              animation: 'pulse-border 2s infinite',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, textAlign: 'center', color: 'var(--ink)' }}>
              ⏸ OPERATOR AUTHORIZATION REQUIRED
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--text-60)', textAlign: 'center' }}>
              Caption drift +2.996s · Backup verified healthy
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                data-testid="authorize-failover-button"
                onClick={onApprove}
                style={{
                  padding: '10px 8px',
                  backgroundColor: 'var(--nominal)',
                  color: '#f5f3ec',
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(59,122,75,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <span>AUTHORIZE FAILOVER</span>
                <span style={{ fontSize: '7.5px', opacity: 0.9, fontWeight: 400 }}>
                  Switch CH-14 to backup stream · Restore sync
                </span>
              </button>

              <button
                onClick={onHold}
                style={{
                  padding: '6px 8px',
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
                HOLD (Remain Drifting)
              </button>
            </div>
          </div>
        )}

        {/* CTA 2: Two-Channel Contention Explicit Choice Trade-Off Gate */}
        {showContentionGate && (
          <div
            data-testid="contention-decision-card"
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: 'var(--panel-sunken)',
              border: '2.5px solid var(--accent)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(184, 100, 27, 0.25)',
              animation: 'pulse-border 2s infinite',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 700, color: 'var(--ink)', textAlign: 'center' }}>
              ⚠ CAPACITY EXHAUSTED · 2 FAILURES vs 1 BACKUP
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--ink)', lineHeight: 1.35 }}>
              Select policy trade-off to execute:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Option A (Recommended) */}
              <button
                data-testid="authorize-prioritization-button"
                onClick={onApprove}
                style={{
                  padding: '9px 8px',
                  backgroundColor: 'var(--nominal)',
                  color: '#f5f3ec',
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(59,122,75,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '2px',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>AUTHORIZE PRIORITIZATION</span>
                  <span style={{ fontSize: '7px', backgroundColor: 'rgba(255,255,255,0.25)', padding: '1px 4px', borderRadius: '3px' }}>RECOMMENDED</span>
                </div>
                <span style={{ fontSize: '7.5px', opacity: 0.95, fontWeight: 400 }}>
                  ✓ Restore CH-14 (Emergency Tier) · CH-27 stays degraded
                </span>
              </button>

              {/* Option B (Alternative) */}
              <button
                onClick={onAlternativeApprove || onApprove}
                style={{
                  padding: '8px 8px',
                  backgroundColor: 'var(--panel-hi)',
                  color: 'var(--ink)',
                  border: '1.5px solid var(--ink)',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '2px',
                  textAlign: 'left',
                }}
              >
                <span>RESTORE CH-27 INSTEAD</span>
                <span style={{ fontSize: '7.5px', opacity: 0.75, fontWeight: 400 }}>
                  ⚠ Restore CH-27 (General Tier) · CH-14 stays degraded
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Hold Note Banner */}
        {holdNote && (
          <div
            data-testid="refusal-banner"
            style={{
              padding: '8px 10px',
              borderRadius: '4px',
              border: isSolidHoldNote ? '2px solid var(--ink)' : '1.5px dashed var(--alarm)',
              backgroundColor: isSolidHoldNote ? 'var(--panel-hi)' : 'var(--surface)',
              color: isSolidHoldNote ? 'var(--ink)' : 'var(--alarm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {holdNote}
          </div>
        )}

        {/* --- SCROLLABLE ACCRUING TOOL CALL TIMELINE --- */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
            paddingRight: '4px',
            flexGrow: 1,
          }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--text-50)', letterSpacing: '0.5px' }}>
            ACCRUING TOOL CALL HISTORY
          </div>

          {steps.map((step, idx) => {
            const isDone = step.tone === 'done';
            const isActive = step.tone === 'active';
            const isFill = step.tone === 'fill';
            const isRefuse = step.tone === 'refuse';

            return (
              <div
                key={idx}
                data-testid={`spine-step-${idx}`}
                style={{
                  padding: '9px 11px',
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
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 700 }}>
                    {step.title}
                  </div>
                  {step.timestamp && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7.5px', opacity: 0.6 }}>
                      {step.timestamp}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8px',
                    opacity: isActive ? 0.85 : 0.65,
                    lineHeight: 1.3,
                  }}
                >
                  {step.sub}
                </div>

                {step.toolCall && (
                  <div
                    style={{
                      marginTop: '3px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '7.5px',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                      padding: '2px 5px',
                      borderRadius: '3px',
                      color: isActive ? '#f5f3ec' : 'var(--ink)',
                    }}
                  >
                    <code>{step.toolCall}</code>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Invariant Line */}
      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(0, 0, 0, 0.2)', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7.5px', color: 'var(--text-42)', lineHeight: 1.4 }}>
          value carries state · alarm never sole-encodes · accent #b8641b reserved
        </div>
      </div>
    </div>
  );
};
