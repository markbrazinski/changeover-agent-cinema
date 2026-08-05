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
        paddingLeft: '18px',
        borderLeft: '2.5px solid var(--ink)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflow: 'hidden' }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '14px',
                height: '14px',
                border: '2.5px solid var(--ink)',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: '5px', height: '5px', backgroundColor: 'var(--ink)' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, letterSpacing: '1px' }}>
              AGENT SPINE
            </span>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              backgroundColor: 'var(--ink)',
              color: '#f5f3ec',
              padding: '3px 8px',
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
              padding: '14px',
              borderRadius: '8px',
              backgroundColor: 'var(--panel-sunken)',
              border: '2.5px solid var(--accent)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(184, 100, 27, 0.25)',
              animation: 'pulse-border 2s infinite',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textAlign: 'center', color: 'var(--ink)' }}>
              ⏸ OPERATOR AUTHORIZATION REQUIRED
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-60)', textAlign: 'center' }}>
              Caption drift +2.996s · Backup verified healthy
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                data-testid="authorize-failover-button"
                onClick={onApprove}
                style={{
                  padding: '12px 10px',
                  backgroundColor: 'var(--nominal)',
                  color: '#f5f3ec',
                  border: 'none',
                  borderRadius: '5px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(59,122,75,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <span>AUTHORIZE FAILOVER</span>
                <span style={{ fontSize: '9.5px', opacity: 0.9, fontWeight: 400 }}>
                  Switch CH-14 to backup stream · Restore sync
                </span>
              </button>

              <button
                onClick={onHold}
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--panel-hi)',
                  color: 'var(--ink)',
                  border: '1.5px solid var(--ink)',
                  borderRadius: '5px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
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
              padding: '14px',
              borderRadius: '8px',
              backgroundColor: 'var(--panel-sunken)',
              border: '2.5px solid var(--accent)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(184, 100, 27, 0.25)',
              animation: 'pulse-border 2s infinite',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', fontWeight: 700, color: 'var(--ink)', textAlign: 'center' }}>
              ⚠ CAPACITY EXHAUSTED · 2 FAILURES vs 1 BACKUP
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink)', lineHeight: 1.35 }}>
              Select policy trade-off to execute:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Option A (Recommended) */}
              <button
                data-testid="authorize-prioritization-button"
                onClick={onApprove}
                style={{
                  padding: '11px 10px',
                  backgroundColor: 'var(--nominal)',
                  color: '#f5f3ec',
                  border: 'none',
                  borderRadius: '5px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(59,122,75,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '3px',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>AUTHORIZE PRIORITIZATION</span>
                  <span style={{ fontSize: '8.5px', backgroundColor: 'rgba(255,255,255,0.25)', padding: '1px 5px', borderRadius: '3px' }}>RECOMMENDED</span>
                </div>
                <span style={{ fontSize: '9.5px', opacity: 0.95, fontWeight: 400 }}>
                  ✓ Restore CH-14 (Emergency Tier) · CH-27 stays degraded
                </span>
              </button>

              {/* Option B (Alternative) */}
              <button
                onClick={onAlternativeApprove || onApprove}
                style={{
                  padding: '9px 10px',
                  backgroundColor: 'var(--panel-hi)',
                  color: 'var(--ink)',
                  border: '1.5px solid var(--ink)',
                  borderRadius: '5px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '3px',
                  textAlign: 'left',
                }}
              >
                <span>RESTORE CH-27 INSTEAD</span>
                <span style={{ fontSize: '9px', opacity: 0.75, fontWeight: 400 }}>
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
              padding: '10px 12px',
              borderRadius: '5px',
              border: isSolidHoldNote ? '2px solid var(--ink)' : '1.5px dashed var(--alarm)',
              backgroundColor: isSolidHoldNote ? 'var(--panel-hi)' : 'var(--surface)',
              color: isSolidHoldNote ? 'var(--ink)' : 'var(--alarm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
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
            gap: '10px',
            overflowY: 'auto',
            paddingRight: '6px',
            flexGrow: 1,
          }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--text-50)', letterSpacing: '0.8px' }}>
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
                  padding: '12px 14px',
                  borderRadius: '7px',
                  border: isRefuse
                    ? '2.5px solid var(--alarm)'
                    : isActive
                    ? '2.5px solid var(--ink)'
                    : isDone
                    ? '2px solid #b8b4ad'
                    : '1.5px dashed #b8b4ad',
                  backgroundColor: isActive ? 'var(--ink)' : isFill ? 'var(--panel-sunken)' : 'var(--panel-hi)',
                  color: isActive ? '#f5f3ec' : 'var(--ink)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  flexShrink: 0,
                  boxShadow: isActive ? '0 3px 10px rgba(0,0,0,0.15)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', fontWeight: 700 }}>
                    {step.title}
                  </div>
                  {step.timestamp && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, opacity: 0.7 }}>
                      {step.timestamp}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 500,
                    opacity: isActive ? 0.9 : 0.75,
                    lineHeight: 1.35,
                  }}
                >
                  {step.sub}
                </div>

                {step.toolCall && (
                  <div
                    style={{
                      marginTop: '4px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10.5px',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.06)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      color: isActive ? '#f5f3ec' : 'var(--ink)',
                      border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.08)',
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
      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed rgba(0, 0, 0, 0.2)', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-42)', lineHeight: 1.4 }}>
          value carries state · alarm never sole-encodes · accent #b8641b reserved
        </div>
      </div>
    </div>
  );
};
