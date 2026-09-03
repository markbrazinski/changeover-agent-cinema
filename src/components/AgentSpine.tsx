import React from 'react';

export interface DiagnosticLayer {
  layer: string;
  status: 'ok' | 'fail';
  detail: string;
}

export interface PolicyEntry {
  channel: string;
  tier: string;
  action: string;
  isRecommended?: boolean;
}

export interface AuditReceipt {
  status: string;
  hash: string;
  authorizer: string;
  restoredMetric: string;
}

export interface GrafanaRecord {
  runId: string;
  annotationId: number;
  why: string;
  action: string;
  followUp?: string;
  readBackVerified: boolean;
}

export interface SpineStep {
  title: string;
  sub: string;
  tone?: 'done' | 'active' | 'fill' | 'pending' | 'refuse';
  timestamp?: string;
  toolCall?: string;
  codeSnippet?: string;
  jsonPayload?: Record<string, any>;
  diagnosticMatrix?: DiagnosticLayer[];
  scarcityCapacity?: { available: number; demand: number };
  policyComparison?: PolicyEntry[];
  auditReceipt?: AuditReceipt;
  grafanaRecord?: GrafanaRecord;
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
  // Reverse steps array so newest tool calls always appear on top of stack above the fold
  const reversedSteps = [...steps].reverse();

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
        {/* Title & Badge Header */}
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

        {/* --- SCROLLABLE ACCRUING TOOL CALL TIMELINE (NEWEST ON TOP) --- */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
            paddingRight: '6px',
            flexGrow: 1,
          }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--text-50)', letterSpacing: '0.8px' }}>
            ACCRUING TOOL CALL HISTORY (NEWEST ON TOP)
          </div>

          {reversedSteps.length === 0 ? (
            <div
              data-testid="spine-idle-card"
              style={{
                padding: '16px 14px',
                borderRadius: '7px',
                border: '1.5px dashed #d8d4cd',
                backgroundColor: 'var(--panel-hi)',
                color: 'var(--text-50)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              — Agent idle · System nominal at rest —
            </div>
          ) : (
            reversedSteps.map((step, idx) => {
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
                    gap: '6px',
                    flexShrink: 0,
                    boxShadow: isActive ? '0 4px 14px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.04)',
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
                      opacity: isActive ? 0.9 : 0.8,
                      lineHeight: 1.35,
                    }}
                  >
                    {step.sub}
                  </div>

                  {/* CODE SNIPPET / TOOL CALL INVOCATION */}
                  {step.toolCall && (
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
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

                  {/* --- RICH VISUAL INSPECTOR WIDGETS --- */}

                  {/* WIDGET 1: TERMINAL / FFPROBE / PROMQL OUTPUT CARD */}
                  {step.codeSnippet && (
                    <div
                      style={{
                        borderRadius: '5px',
                        backgroundColor: '#181a1b',
                        color: '#38d39f',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9.5px',
                        padding: '8px 10px',
                        border: '1px solid #2a2d2f',
                        lineHeight: 1.4,
                        whiteSpace: 'pre-wrap',
                        boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.5)',
                        marginTop: '2px',
                      }}
                    >
                      <div style={{ color: '#888888', fontSize: '8.5px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        ⚡ TERMINAL OUTPUT INVENT
                      </div>
                      <code>{step.codeSnippet}</code>
                    </div>
                  )}

                  {/* WIDGET 2: JSON RESPONSE PAYLOAD INSPECTOR */}
                  {step.jsonPayload && (
                    <div
                      style={{
                        borderRadius: '5px',
                        backgroundColor: '#121415',
                        color: '#4cc9f0',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9.5px',
                        padding: '8px 10px',
                        border: '1px solid #2b3034',
                        lineHeight: 1.35,
                        whiteSpace: 'pre-wrap',
                        marginTop: '2px',
                      }}
                    >
                      <div style={{ color: '#f72585', fontSize: '8.5px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                        📊 LIVE MCP TELEMETRY PAYLOAD
                      </div>
                      <pre style={{ margin: 0 }}>{JSON.stringify(step.jsonPayload, null, 2)}</pre>
                    </div>
                  )}

                  {/* WIDGET 3: DIAGNOSTIC LAYER ISOLATION MATRIX */}
                  {step.diagnosticMatrix && step.diagnosticMatrix.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        padding: '8px',
                        borderRadius: '5px',
                        backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'var(--panel-sunken)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        marginTop: '2px',
                      }}
                    >
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, opacity: 0.8, letterSpacing: '0.5px' }}>
                        DIAGNOSTIC LAYER MATRIX
                      </div>
                      {step.diagnosticMatrix.map((diag, dIdx) => (
                        <div
                          key={dIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9.5px',
                            padding: '3px 6px',
                            borderRadius: '3px',
                            backgroundColor: diag.status === 'fail' ? 'rgba(189,38,27,0.15)' : 'rgba(59,122,75,0.12)',
                            color: diag.status === 'fail' ? 'var(--alarm)' : 'var(--nominal)',
                            fontWeight: 600,
                          }}
                        >
                          <span>{diag.layer}: {diag.detail}</span>
                          <span>{diag.status === 'ok' ? '✔ RULED OUT' : '✖ FAULT ISOLATED'}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* WIDGET 4: SCARCITY CAPACITY ENGINE GAUGE */}
                  {step.scarcityCapacity && (
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '5px',
                        backgroundColor: 'rgba(184, 100, 27, 0.1)',
                        border: '1px solid var(--accent)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginTop: '2px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, color: 'var(--accent)' }}>
                        <span>BACKUP RESOURCE SCARCITY</span>
                        <span>{step.scarcityCapacity.available} AVAILABLE / {step.scarcityCapacity.demand} DEMAND</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${(step.scarcityCapacity.available / step.scarcityCapacity.demand) * 100}%`, height: '100%', backgroundColor: 'var(--accent)' }} />
                      </div>
                    </div>
                  )}

                  {/* WIDGET 5: POLICY COMPARISON MATRIX */}
                  {step.policyComparison && step.policyComparison.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        padding: '8px',
                        borderRadius: '5px',
                        backgroundColor: 'var(--panel-sunken)',
                        border: '1px solid rgba(0,0,0,0.12)',
                        marginTop: '2px',
                      }}
                    >
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, color: 'var(--text-60)' }}>
                        OPERATOR DECLARATION PRECEDENCE
                      </div>
                      {step.policyComparison.map((pol, pIdx) => (
                        <div
                          key={pIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9.5px',
                            padding: '3px 6px',
                            borderRadius: '3px',
                            backgroundColor: pol.isRecommended ? 'rgba(59,122,75,0.12)' : 'rgba(0,0,0,0.05)',
                            fontWeight: 600,
                          }}
                        >
                          <span>{pol.channel} ({pol.tier})</span>
                          <span style={{ color: pol.isRecommended ? 'var(--nominal)' : 'var(--alarm)' }}>{pol.action}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* WIDGET 6: CRYPTOGRAPHIC AUDIT RECEIPT */}
                  {step.auditReceipt && (
                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: '5px',
                        backgroundColor: '#1b1d1e',
                        color: '#f5f3ec',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                        border: '1px solid #333',
                        marginTop: '2px',
                      }}
                    >
                      <div style={{ color: '#4cc9f0', fontWeight: 700, letterSpacing: '0.5px' }}>
                        🔒 AUDIT RECEIPT · SIGNED & VERIFIED
                      </div>
                      <div>HASH: <code>{step.auditReceipt.hash}</code></div>
                      <div>AUTHORIZER: <strong>{step.auditReceipt.authorizer}</strong></div>
                      <div>RESTORED METRIC: <strong style={{ color: '#38d39f' }}>{step.auditReceipt.restoredMetric}</strong></div>
                    </div>
                  )}

                  {/* WIDGET 7: GRAFANA OPERATIONAL RECORD CARD */}
                  {step.grafanaRecord && (
                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: '5px',
                        backgroundColor: '#1b1d1e',
                        color: '#f5f3ec',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        border: '1px solid #ff9800',
                        marginTop: '2px',
                      }}
                    >
                      <div style={{ color: '#ff9800', fontWeight: 700, letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>OPERATIONAL RECORD WRITTEN</span>
                        <span style={{ color: '#38d39f', fontSize: '8.5px' }}>✓ READ-BACK VERIFIED</span>
                      </div>
                      <div>RUN ID: <code>{step.grafanaRecord.runId}</code> (Annotation #{step.grafanaRecord.annotationId})</div>
                      <div>WHY: <strong style={{ color: '#f5f3ec' }}>{step.grafanaRecord.why}</strong></div>
                      <div>ACTION: <strong style={{ color: '#38d39f' }}>{step.grafanaRecord.action}</strong></div>
                      {step.grafanaRecord.followUp && (
                        <div>FOLLOW-UP: <strong style={{ color: '#f72585' }}>{step.grafanaRecord.followUp}</strong></div>
                      )}
                      <div style={{ fontSize: '8.5px', color: '#888888', fontStyle: 'italic', marginTop: '2px' }}>
                        RECORDED ONCE · Idempotent Grafana Cloud Annotation
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
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
