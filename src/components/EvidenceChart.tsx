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

  // Dynamic SVG path for smooth animation transitions
  // L1: SIGN line stays flat at y=52 (nominal 0.51s)
  // L2: CAP line curves y=52 -> y=18 (alarm 2.996s) smoothly
  const capPathD = isBlind
    ? 'M 0 52 L 340 52'
    : isAlarm
    ? 'M 0 52 C 120 52, 160 18, 340 18'
    : isRestored
    ? 'M 0 52 C 120 52, 160 48, 340 48'
    : 'M 0 52 L 340 52';

  const capStrokeColor = isBlind
    ? 'var(--ghost-border)'
    : isAlarm
    ? 'var(--alarm)'
    : isRestored
    ? 'var(--restored)'
    : 'var(--nominal)';

  const capEndCy = isBlind ? 52 : isAlarm ? 18 : isRestored ? 48 : 52;

  return (
    <div
      data-testid="evidence-chart"
      style={{
        margin: '12px 18px 18px 18px',
        padding: '16px 20px',
        backgroundColor: '#fcfbf7',
        border: '2.5px solid var(--ink)',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* Telemetry Card Subheader Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'var(--ink)',
          }}
        >
          LAYER TELEMETRY — LIVE MEASURED
        </div>

        <div
          data-testid="peer-ruled-out-text"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px',
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
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px', alignItems: 'center' }}>
        {/* Left Side: Big Live Measured Offset Readout */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
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
                width: '8px',
                height: '8px',
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
            data-testid="offset-readout"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '44px',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-1px',
              color: isBlind
                ? 'var(--ghost-border)'
                : isAlarm
                ? 'var(--alarm)'
                : isRestored
                ? 'var(--restored)'
                : 'var(--nominal)',
              transition: 'color 0.4s ease',
            }}
          >
            {displayOffset}
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              fontWeight: 600,
              color: 'var(--text-60)',
              marginTop: '8px',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* SVG Plot */}
            <div style={{ flex: 1, height: '80px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 340 70" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                {/* Ceiling threshold line (derived 0.759s) */}
                <line x1="0" y1="20" x2="340" y2="20" stroke="var(--alarm)" strokeWidth="1.5" strokeDasharray="4 4" opacity={isBlind ? '0.2' : '0.45'} />

                {/* Nominal Baseline (0.510s) */}
                <line x1="0" y1="52" x2="340" y2="52" stroke="var(--nominal)" strokeWidth="1.5" strokeDasharray="4 4" opacity={isBlind ? '0.15' : '0.3'} />

                {/* SIGN Layer Line (Flat Line) */}
                <line
                  data-testid={isBlind ? 'sign-line-blind' : 'sign-line-nominal'}
                  x1="0"
                  y1="52"
                  x2="340"
                  y2="52"
                  stroke={isBlind ? 'var(--ghost-border)' : 'var(--nominal)'}
                  strokeWidth="2.5"
                  strokeDasharray={isBlind ? '4 4' : 'none'}
                />
                <circle cx="340" cy="52" r="3.5" fill={isBlind ? 'var(--ghost-border)' : 'var(--nominal)'} />

                {/* Smooth Animated CAP Layer Cubic Bezier Curve */}
                <path
                  data-testid={isBlind ? 'cap-line-blind' : isAlarm ? 'cap-line-alarm' : 'cap-line-nominal'}
                  d={capPathD}
                  fill="none"
                  stroke={capStrokeColor}
                  strokeWidth="3"
                  strokeDasharray={isBlind ? '4 4' : 'none'}
                  style={{ transition: 'd 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease' }}
                />

                {/* Animated End Indicator Dot */}
                <circle
                  cx="340"
                  cy={capEndCy}
                  r={isAlarm ? 5 : 4}
                  fill={capStrokeColor}
                  style={{ transition: 'cy 0.8s cubic-bezier(0.4, 0, 0.2, 1), fill 0.4s ease' }}
                />
              </svg>
            </div>

            {/* Right Status Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '135px' }}>
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: '5px',
                  border: isBlind
                    ? '1.5px dashed var(--ghost-3)'
                    : isAlarm
                    ? '2px solid var(--alarm)'
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
                  fontSize: '11px',
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                {isBlind ? 'CAP · BLIND' : isAlarm ? 'CAP ▲ FAIL' : 'CAP ● OK'}
              </div>

              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: '5px',
                  border: isBlind ? '1.5px dashed var(--ghost-3)' : '1.5px solid var(--nominal)',
                  backgroundColor: isBlind ? 'var(--panel-lo)' : 'var(--panel-hi)',
                  color: isBlind ? 'var(--ghost-2)' : 'var(--nominal)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                {isBlind ? 'SIGN · BLIND' : 'SIGN ● OK'}
              </div>

              {backupHealthy && (
                <div
                  data-testid="backup-healthy-badge"
                  style={{
                    padding: '6px 10px',
                    borderRadius: '5px',
                    border: '1.5px solid var(--restored)',
                    backgroundColor: 'var(--panel-hi)',
                    color: 'var(--restored)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  BACKUP ✓ HEALTHY
                </div>
              )}
            </div>
          </div>

          {/* Chart Legend Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '6px',
              borderTop: '1px dashed #d8d4cb',
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              fontWeight: 600,
              color: 'var(--text-60)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '3px', backgroundColor: 'var(--alarm)' }} />
                <span>CAP · captions</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '3px', backgroundColor: 'var(--nominal)' }} />
                <span>SIGN · feed-liveness</span>
              </div>
            </div>

            <div style={{ opacity: 0.65 }}>
              CEILING THRESHOLD: +0.759s
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
