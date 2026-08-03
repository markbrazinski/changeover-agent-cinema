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

  const isAlarm = isFrozen || isBlind || isUnconfirmed;

  // Format offset readout string
  const displayOffset = isFrozen
    ? `+${primaryOffset.toFixed(2)}s`
    : isRestored
    ? `+${(postSwapOffset ?? 0.486).toFixed(3)}s`
    : isBlind
    ? `+${primaryOffset.toFixed(2)}s?`
    : `+${primaryOffset.toFixed(2)}s`;

  return (
    <div
      style={{
        margin: '10px 14px 14px 14px',
        padding: '14px 16px',
        backgroundColor: '#fcfbf7',
        border: '2.5px solid var(--ink)',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
      }}
    >
      {/* Telemetry Card Subheader Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
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
            fontSize: '8px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: isAlarm ? 'var(--text-50)' : 'var(--text-42)',
          }}
        >
          {isAlarm
            ? 'SIGN FLAT → PEER RULED OUT · NOT PROGRAM-WIDE'
            : 'CAP + SIGN BOTH NOMINAL'}
        </div>
      </div>

      {/* Main Telemetry Body: Big Readout Left vs SVG Graph Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: '16px', alignItems: 'center' }}>
        {/* Left Side: Big Live Measured Offset Readout */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              fontWeight: 700,
              letterSpacing: '1px',
              color: 'var(--text-50)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '2px',
            }}
          >
            <div
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: isAlarm ? 'var(--alarm)' : 'var(--nominal)',
              }}
            />
            CAPTION-SYNC OFFSET · LIVE
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '32px',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.5px',
              color: isAlarm ? 'var(--alarm)' : isRestored ? 'var(--restored)' : 'var(--nominal)',
            }}
          >
            {displayOffset}
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              color: 'var(--text-50)',
              marginTop: '4px',
            }}
          >
            {isAlarm ? 'baseline 0.510s · climbing ▲' : 'baseline 0.510s · nominal'}
          </div>
        </div>

        {/* Right Side: Live Measured SVG Plot & Layer Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* SVG Plot */}
            <div style={{ flex: 1, height: '62px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 340 62" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                {/* Ceiling threshold line (derived 0.759s) */}
                <line x1="0" y1="22" x2="340" y2="22" stroke="var(--alarm)" strokeWidth="1" strokeDasharray="3 3" opacity="0.45" />

                {/* Nominal Baseline (0.510s) */}
                <line x1="0" y1="46" x2="340" y2="46" stroke="var(--nominal)" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />

                {/* SIGN Layer Line (Flat Green Nominal) */}
                <line x1="0" y1="48" x2="340" y2="48" stroke="var(--nominal)" strokeWidth="2" strokeDasharray={isBlind ? '2 2' : 'none'} />
                <circle cx="340" cy="48" r="2.5" fill="var(--nominal)" />

                {/* CAP Layer Line (Climbing Red on Fault, Low on Restored) */}
                {isAlarm ? (
                  <>
                    <line x1="0" y1="44" x2="110" y2="44" stroke="var(--nominal)" strokeWidth="2.5" />
                    <line x1="110" y1="44" x2="340" y2="10" stroke="var(--alarm)" strokeWidth="2.5" />
                    <circle cx="340" cy="10" r="3.5" fill="var(--alarm)" />
                  </>
                ) : (
                  <>
                    <line x1="0" y1="44" x2="340" y2="44" stroke={isRestored ? 'var(--restored)' : 'var(--nominal)'} strokeWidth="2.5" />
                    <circle cx="340" cy="44" r="3" fill={isRestored ? 'var(--restored)' : 'var(--nominal)'} />
                  </>
                )}
              </svg>
            </div>

            {/* Right Status Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '105px' }}>
              <div
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: isAlarm ? '1.5px solid var(--alarm)' : '1.5px solid var(--nominal)',
                  backgroundColor: isAlarm ? 'var(--surface)' : 'var(--panel-hi)',
                  color: isAlarm ? 'var(--alarm)' : 'var(--nominal)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                {isAlarm ? 'CAP ▲ CLIMBING' : 'CAP ● OK'}
              </div>

              <div
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1.5px solid var(--nominal)',
                  backgroundColor: 'var(--panel-hi)',
                  color: 'var(--nominal)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                SIGN ● HEALTHY
              </div>

              {isRestored && (
                <div
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1.5px solid var(--restored)',
                    backgroundColor: 'var(--panel-hi)',
                    color: 'var(--restored)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8px',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  BACKUP ✓ HEALTHY
                </div>
              )}
            </div>
          </div>

          {/* Enforced Legend Foot */}
          <div
            style={{
              paddingTop: '6px',
              borderTop: '1px dashed rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '7.5px',
              color: 'var(--text-60)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '2.5px', backgroundColor: 'var(--alarm)' }} />
              <strong>CAP</strong> · captions
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '2.5px', backgroundColor: 'var(--nominal)' }} />
              <strong>SIGN</strong> · feed-liveness (stand-in)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className="hatch-ad-swatch" />
              <strong>AD</strong> — not monitored in this build · static
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
