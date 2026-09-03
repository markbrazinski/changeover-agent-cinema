import React from 'react';

interface EndingSlideProps {
  currentStage: '13_ending_slide' | '14_attribution_slide' | '15_completed' | string;
}

export const EndingSlide: React.FC<EndingSlideProps> = ({ currentStage }) => {
  const isAttribution = currentStage === '14_attribution_slide';

  if (isAttribution) {
    return (
      <div
        data-testid="attribution-slide"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '480px',
          backgroundColor: '#0a0907',
          color: '#f5f3ec',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          fontFamily: 'var(--font-mono)',
          border: '3.5px solid var(--ink)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: '780px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ borderBottom: '2px solid var(--accent)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '2px' }}>CHANGEOVER</div>
              <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '1px' }}>ATTRIBUTION & CREDITS</div>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>CC BY 3.0 / APACHE 2.0</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '11px' }}>
            <div style={{ backgroundColor: '#14130f', padding: '16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ color: '#ff9800', fontWeight: 700, marginBottom: '6px' }}>🎬 OPEN CINEMA ASSETS</div>
              <div style={{ opacity: 0.9, lineHeight: 1.5 }}>
                • <strong>Tears of Steel</strong> (CC BY 3.0 Blender Foundation)<br />
                • <strong>Sintel</strong> (CC BY 3.0 Blender Foundation)
              </div>
            </div>

            <div style={{ backgroundColor: '#14130f', padding: '16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ color: '#38d39f', fontWeight: 700, marginBottom: '6px' }}>🤖 AGENTIC FRAMEWORK</div>
              <div style={{ opacity: 0.9, lineHeight: 1.5 }}>
                • <strong>Google ADK</strong> (Agent Development Kit)<br />
                • <strong>gemini-2.5-flash</strong> via <code>google.adk.Runner</code>
              </div>
            </div>

            <div style={{ backgroundColor: '#14130f', padding: '16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ color: '#4cc9f0', fontWeight: 700, marginBottom: '6px' }}>📊 OBSERVABILITY ENGINE</div>
              <div style={{ opacity: 0.9, lineHeight: 1.5 }}>
                • <strong>Grafana MCP</strong> Dual-Signal Metrics<br />
                • Idempotent Annotation Audit Write-Back
              </div>
            </div>

            <div style={{ backgroundColor: '#14130f', padding: '16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ color: '#f72585', fontWeight: 700, marginBottom: '6px' }}>🔍 INSPECTION & HUMAN GATE</div>
              <div style={{ opacity: 0.9, lineHeight: 1.5 }}>
                • Native <code>ffprobe</code> Container Verification<br />
                • Mandatory Human-in-the-Loop Authorization
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="ending-slide"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '480px',
        backgroundColor: '#0f0e0b',
        color: '#f5f3ec',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        fontFamily: 'var(--font-mono)',
        border: '3.5px solid var(--ink)',
        textAlign: 'center',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '3px' }}>
          CHANGEOVER BROADCAST CINEMA
        </div>

        <div style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '2px', lineHeight: 1.2 }}>
          DETERMINISTIC AGENTIC FAILOVER
        </div>

        <div style={{ fontSize: '13px', opacity: 0.8, lineHeight: 1.6, maxWidth: '520px' }}>
          Real-time television telemetry monitoring, Gemini 2.5 Flash ADK diagnosis, Grafana MCP evidence verification, and policy-driven human-in-the-loop authorization.
        </div>

        <div style={{ marginTop: '12px', padding: '8px 20px', backgroundColor: 'var(--nominal)', color: '#f5f3ec', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
          ✓ DEMO COMPLETED · ALL 3 ACTS EXECUTED
        </div>
      </div>
    </div>
  );
};
