import React from 'react';

interface EvidenceChartProps {
  primaryOffset?: number;
  postSwapOffset?: number;
  status?: 'nominal' | 'frozen' | 'restored' | 'blind' | 'unconfirmed_backup';
  backupHealthy?: boolean;
}

export const EvidenceChart: React.FC<EvidenceChartProps> = ({
  primaryOffset = 2.996,
  postSwapOffset,
  status = 'frozen',
  backupHealthy = true,
}) => {
  const isFrozen = status === 'frozen';
  const isRestored = status === 'restored';
  const isBlind = status === 'blind';
  const isUnconfirmed = status === 'unconfirmed_backup';

  const isAlarm = isFrozen || isUnconfirmed;

  // Format offset readout string
  const displayOffset = isBlind
    ? '—.—s'
    : isRestored
    ? `+${(postSwapOffset ?? 0.486).toFixed(3)}s`
    : isFrozen
    ? `+${primaryOffset.toFixed(3)}s`
    : `+${primaryOffset.toFixed(3)}s`;

  return (
    <div
      style={{
        margin: '10px 14px 14px 14px',
        padding: '14px 18px',
        backgroundColor: '#fcfbf7',
        border: '2.5px solid var(--ink)',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
      }}
    >
      {/* Telemetry Card Subheader Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'var(--ink)',
          }}
        >
          LAYER TELEMETRY — LIVE MEASURED
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9.5px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: isBlind ? 'var(--ghost-2)' : isAlarm ? 'var(--text-60)' : 'var(--text-50)',
          }}
        >
          {isBlind
            ? 'TELEMETRY UNREADABLE · EVIDENCE ABSENT'
            : isAlarm
            ? 'SIGN FLAT → PEER RULED OUT · NOT PROGRAM-WIDE'
            : isRestored
            ? 'POST-SWAP READ VERIFIED · SYNC RESTORED'
            : 'CAP + SIGN BOTH NOMINAL'}
        </div>
      </div>

      {/* Main Telemetry Body: Big Readout Left vs SVG Graph Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: '20px', alignItems: 'center' }}>
        {/* Left Side: Big Live Measured Offset Readout */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '1px',
              color: 'var(--text-60)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isBlind
                  ? 'var(--ghost-3)'
                  : isAlarm
                  ? 'var(--alarm)'
                  : isRestored
                  ? 'var(--restored)'
                  : 'var(--nominal)',
              }}
            />
            CAPTION-SYNC OFFSET · LIVE
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '36px',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.5px',
              color: isBlind
                ? 'var(--ghost-border)'
                : isAlarm
                ? 'var(--alarm)'
                : isRestored
                ? 'var(--restored)'
                : 'var(--nominal)',
            }}
          >
            {displayOffset}
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              color: 'var(--text-60)',
              marginTop: '6px',
            }}
          >
            {isBlind
              ? 'baseline unconfirmed · blackout'
              : isAlarm
              ? 'baseline 0.510s · climbing ▲'
              : isRestored
              ? 'baseline 0.510s · restored ✓'
              : 'baseline 0.510s · nominal'}
          </div>
        </div>

        {/* Right Side: Live Measured SVG Plot & Layer Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* SVG Plot */}
            <div style={{ flex: 1, height: '68px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 340 68" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                {/* Ceiling threshold line (derived 0.759s) */}
                <line x1="0" y1="24" x2="340" y2="24" stroke="var(--alarm)" strokeWidth="1" strokeDasharray="3 3" opacity={isBlind ? '0.2' : '0.45'} />

                {/* Nominal Baseline (0.510s) */}
                <line x1="0" y1="52" x2="340" y2="52" stroke="var(--nominal)" strokeWidth="1" strokeDasharray="3 3" opacity={isBlind ? '0.15' : '0.3'} />

                {/* Blind Ghost Mode vs Live Plot Lines */}
                {isBlind ? (
                  <>
                    <line x1="0" y1="52" x2="340" y2="52" stroke="var(--ghost-border)" strokeWidth="2" strokeDasharray="4 4" />
                    <line x1="0" y1="24" x2="340" y2="24" stroke="var(--ghost-border)" strokeWidth="2" strokeDasharray="4 4" />
                  </>
                ) : isAlarm ? (
                  <>
                    <line x1="0" y1="52" x2="340" y2="52" stroke="var(--nominal)" strokeWidth="2" />
                    <circle cx="340" cy="52" r="2.5" fill="var(--nominal)" />

                    <line x1="0" y1="50" x2="100" y2="50" stroke="var(--nominal)" strokeWidth="2.5" />
                    <line x1="100" y1="50" x2="340" y2="12" stroke="var(--alarm)" strokeWidth="2.5" />
                    <circle cx="340" cy="12" r="4" fill="var(--alarm)" />
                  </>
                ) : (
                  <>
                    <line x1="0" y1="52" x2="340" y2="52" stroke="var(--nominal)" strokeWidth="2" />
                    <circle cx="340" cy="52" r="2.5" fill="var(--nominal)" />

                    <line x1="0" y1="48" x2="340" y2="48" stroke={isRestored ? 'var(--restored)' : 'var(--nominal)'} strokeWidth="2.5" />
                    <circle cx="340" cy="48" r="3.5" fill={isRestored ? 'var(--restored)' : 'var(--nominal)'} />
                  </>
                )}
              </svg>
            </div>

            {/* Right Status Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '115px' }}>
              <div
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: isBlind
                    ? '1.5px dashed var(--ghost-3)'
                    : isAlarm
                    ? '1.5px solid var(--alarm)'
                    : '1.5px solid var(--nominal)',
                  backgroundColor: isBlind
                    ? 'var(--panel-lo)'
                    : isAlarm
                    ? 'var(--surface)'
                    : 'var(--panel-hi)',
                  color: isBlind
                    ? 'var(--ghost-2)'
                    : isAlarm
                    ? 'var(--alarm)'
                    : 'var(--nominal)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8.5px',
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                {isBlind ? 'CAP · BLIND' : isAlarm ? 'CAP ▲ FAIL' : 'CAP ● OK'}
              </div>

              <div
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: isBlind ? '1.5px dashed var(--ghost-3)' : '1.5px solid var(--nominal)',
                  backgroundColor: isBlind ? 'var(--panel-lo)' : 'var(--panel-hi)',
                  color: isBlind ? 'var(--ghost-2)' : 'var(--nominal)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8.5px',
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                {isBlind ? 'SIGN · BLIND' : 'SIGN ● OK'}
              </div>

              {isRestored && (
                <div
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1.5px solid var(--restored)',
                    backgroundColor: 'var(--panel-hi)',
                    color: 'var(--restored)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8.5px',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  BACKUP ✓ RESTORED
                </div>
              )}
            </div>
          </div>

          {/* Enforced Readable Legend Foot */}
          <div
            style={{
              paddingTop: '8px',
              borderTop: '1px dashed rgba(0, 0, 0, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--ink)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '14px', height: '3px', backgroundColor: 'var(--alarm)' }} />
              <strong>CAP</strong> · captions
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '14px', height: '3px', backgroundColor: 'var(--nominal)' }} />
              <strong>SIGN</strong> · feed-liveness (stand-in)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="hatch-ad-swatch" />
              <strong>AD</strong> — not monitored in this build · static
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
