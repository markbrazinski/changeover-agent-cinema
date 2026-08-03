import React from 'react';

export interface SpineStep {
  title: string;
  sub?: string;
  tone: 'done' | 'active' | 'fill' | 'pending' | 'refuse';
}

interface AgentSpineProps {
  substate: string;
  steps: SpineStep[];
  showGate?: boolean;
  onApprove?: () => void;
  onHold?: () => void;
  holdNote?: string;
  isSolidHoldNote?: boolean;
}

export const AgentSpine: React.FC<AgentSpineProps> = ({
  substate = 'ANOMALY DETECTED',
  steps = [],
  showGate = false,
  onApprove,
  onHold,
  holdNote,
  isSolidHoldNote = false,
}) => {
  return (
    <div
      style={{
        width: '238px',
        borderLeft: '2.5px solid var(--ink)',
        paddingLeft: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Head */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '1.5px',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              border: '1.5px solid var(--ink)',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                position: 'absolute',
                top: '2px',
                right: '2px',
              }}
            />
          </div>
          AGENT SPINE
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '7.5px',
            color: 'var(--text-42)',
            marginTop: '2px',
          }}
        >
          T+00:14 · {substate}
        </div>
      </div>

      {/* Stacked Step Tiles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {steps.map((step, idx) => {
          if (step.tone === 'refuse') {
            return (
              <div
                key={idx}
                style={{
                  borderRadius: '5px',
                  padding: '8px 9px',
                  border: '3px double var(--ink)',
                  backgroundColor: '#e9e6df',
                  color: 'var(--ink)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.4px',
                  }}
                >
                  {step.title}
                </div>
                {step.sub && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '7.5px',
                      color: 'var(--text-60)',
                      marginTop: '2px',
                    }}
                  >
                    {step.sub}
                  </div>
                )}
              </div>
            );
          }

          if (step.tone === 'active') {
            return (
              <div
                key={idx}
                style={{
                  borderRadius: '5px',
                  padding: '8px 9px',
                  border: '2px solid var(--ink)',
                  backgroundColor: 'var(--ink)',
                  color: '#f5f3ec',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Accent Scan Sweep Bar */}
                <div
                  className="animate-scan"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2.5px',
                    backgroundColor: 'var(--accent)',
                  }}
                />
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8px',
                    fontWeight: 700,
                    letterSpacing: '0.3px',
                  }}
                >
                  {step.title}
                </div>
                {step.sub && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '7.5px',
                      opacity: 0.75,
                      marginTop: '2px',
                    }}
                  >
                    {step.sub}
                  </div>
                )}
              </div>
            );
          }

          if (step.tone === 'fill') {
            return (
              <div
                key={idx}
                style={{
                  borderRadius: '5px',
                  padding: '8px 9px',
                  border: '2px solid var(--ink)',
                  backgroundColor: 'var(--ink)',
                  color: '#f5f3ec',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8px',
                    fontWeight: 700,
                  }}
                >
                  {step.title}
                </div>
                {step.sub && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '7.5px',
                      opacity: 0.7,
                      marginTop: '2px',
                    }}
                  >
                    {step.sub}
                  </div>
                )}
              </div>
            );
          }

          if (step.tone === 'done') {
            return (
              <div
                key={idx}
                style={{
                  borderRadius: '5px',
                  padding: '8px 9px',
                  border: '1.5px solid var(--card-border)',
                  backgroundColor: 'var(--panel-hi)',
                  color: 'var(--text-60)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                  }}
                >
                  {step.title}
                </div>
                {step.sub && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '7.5px',
                      color: 'var(--text-50)',
                      marginTop: '2px',
                    }}
                  >
                    {step.sub}
                  </div>
                )}
              </div>
            );
          }

          // Pending Tone
          return (
            <div
              key={idx}
              style={{
                borderRadius: '5px',
                padding: '8px 9px',
                border: '1.5px dashed var(--ghost-border)',
                backgroundColor: 'transparent',
                color: 'var(--text-50)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  fontWeight: 600,
                }}
              >
                {step.title}
              </div>
              {step.sub && (
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '7.5px',
                    opacity: 0.7,
                    marginTop: '2px',
                  }}
                >
                  {step.sub}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Docked Action Gate */}
      {showGate && (
        <div
          style={{
            marginTop: '4px',
            borderRadius: '6px',
            border: '2px solid var(--ink)',
            backgroundColor: 'var(--panel-hi)',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '0.5px',
            }}
          >
            AUTHORIZATION REQUIRED
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={onApprove}
              style={{
                flex: 1,
                padding: '6px 0',
                backgroundColor: 'var(--ink)',
                color: '#f5f3ec',
                fontFamily: 'var(--font-mono)',
                fontSize: '8px',
                fontWeight: 700,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Approve
            </button>
            <button
              onClick={onHold}
              style={{
                flex: 1,
                padding: '6px 0',
                backgroundColor: 'transparent',
                color: 'var(--ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: '8px',
                fontWeight: 700,
                borderRadius: '4px',
                border: '1.5px solid var(--ink)',
                cursor: 'pointer',
              }}
            >
              Hold
            </button>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '7px',
              color: 'var(--text-50)',
              borderTop: '1px dashed var(--border-soft)',
              paddingTop: '6px',
            }}
          >
            will not switch without you
          </div>
        </div>
      )}

      {/* Docked Hold Note */}
      {holdNote && (
        <div
          style={{
            borderRadius: '5px',
            padding: '8px 9px',
            border: isSolidHoldNote ? '2px solid var(--ink)' : '1.5px dashed var(--ghost-border)',
            backgroundColor: isSolidHoldNote ? 'var(--ink)' : 'var(--panel-hi)',
            color: isSolidHoldNote ? '#f5f3ec' : 'var(--text-60)',
            fontFamily: 'var(--font-mono)',
            fontSize: '7.5px',
          }}
        >
          {holdNote}
        </div>
      )}

      {/* Foot Invariant */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '8px',
          borderTop: '1px dashed var(--border-soft)',
          fontFamily: 'var(--font-mono)',
          fontSize: '6.5px',
          color: 'var(--text-42)',
          letterSpacing: '0.3px',
        }}
      >
        evidence intact · action stopped · accent #b8641b reserved
      </div>
    </div>
  );
};
