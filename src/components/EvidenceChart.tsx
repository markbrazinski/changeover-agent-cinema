import React from 'react';

interface EvidenceChartProps {
  primaryOffset: number;
  postSwapOffset?: number;
  status: 'nominal' | 'frozen' | 'restored' | 'blind' | 'unconfirmed_backup';
  backupHealthy?: boolean;
}

export const EvidenceChart: React.FC<EvidenceChartProps> = ({
  primaryOffset = 2.996,
  postSwapOffset,
  status = 'frozen',
  backupHealthy = true,
}) => {
  if (status === 'blind') {
    return (
      <div
        className="hatch-no-data"
        style={{
          width: '100%',
          maxWidth: '760px',
          borderLeft: '2.5px solid var(--ink)',
          borderRight: '2.5px solid var(--ink)',
          borderBottom: '2.5px solid var(--ink)',
          backgroundColor: 'var(--panel-hi)',
          padding: '11px 13px',
          borderTop: '1px solid var(--border-soft)',
        }}
      >
        <div
          style={{
            border: '2px dashed var(--ghost-border)',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--ghost-2)',
              letterSpacing: '1px',
            }}
          >
            ——.——
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--alarm-ink)',
              margin: '6px 0 2px 0',
            }}
          >
            ✕ GRAFANA UNREACHABLE — NO SERIES RETURNED
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              color: 'var(--text-60)',
            }}
          >
            CAP · SIGN both unreadable · evidence plane dark
          </div>
        </div>

        {/* Legend Foot with Mandatory AD Static Row */}
        <div
          style={{
            marginTop: '10px',
            paddingTop: '8px',
            borderTop: '1px dashed var(--border-soft)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '7px',
            color: 'var(--text-60)',
          }}
        >
          <div>CAP · captions</div>
          <div>SIGN · feed-liveness (stand-in)</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.6 }}>
            <span className="hatch-ad-swatch" />
            AD — not monitored in this build · static
          </div>
        </div>
      </div>
    );
  }

  const isRestored = status === 'restored';
  const isFrozen = status === 'frozen' || status === 'unconfirmed_backup';
  const activeValue = isRestored && postSwapOffset !== undefined ? postSwapOffset : primaryOffset;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '760px',
        backgroundColor: 'var(--panel-hi)',
        backgroundImage: 'linear-gradient(180deg, var(--panel-hi) 0%, var(--panel-lo) 100%)',
        borderLeft: '2.5px solid var(--ink)',
        borderRight: '2.5px solid var(--ink)',
        borderBottom: '2.5px solid var(--ink)',
        borderRadius: '0 0 9px 9px',
        padding: '11px 13px',
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '8.5px',
          fontWeight: 700,
          letterSpacing: '1px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>LAYER TELEMETRY — LIVE MEASURED</span>
          {isRestored && (
            <span
              style={{
                backgroundColor: 'var(--restored)',
                color: '#f5f3ec',
                padding: '1px 6px',
                borderRadius: '3px',
                fontSize: '7.5px',
              }}
            >
              post-swap read ✓
            </span>
          )}
        </div>

        <span style={{ color: 'var(--text-60)', fontWeight: 400 }}>
          {isFrozen
            ? 'SIGN flat → peer ruled out · not program-wide'
            : isRestored
            ? 'CAP rejoined baseline · resynced'
            : 'CAP + SIGN both nominal'}
        </span>
      </div>

      {/* Body Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Readout Column (Left) */}
        <div style={{ minWidth: '125px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '7px',
              color: 'var(--text-60)',
              marginBottom: '2px',
            }}
          >
            <div
              className={isFrozen ? 'animate-pulse' : ''}
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: isFrozen
                  ? 'var(--alarm)'
                  : isRestored
                  ? 'var(--restored)'
                  : 'var(--nominal)',
              }}
            />
            caption-sync offset · live
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '24px',
              fontWeight: 700,
              color: isFrozen
                ? 'var(--alarm-ink)'
                : isRestored
                ? 'var(--restored-ink)'
                : 'var(--nominal-ink)',
              lineHeight: 1,
            }}
          >
            +{activeValue.toFixed(3)}s
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '7.5px',
              color: 'var(--text-50)',
              marginTop: '3px',
            }}
          >
            baseline 0.510s · {isFrozen ? 'climbing ▲' : isRestored ? 'rejoined baseline ✓' : 'nominal'}
          </div>
        </div>

        {/* Plot Area (SVG) */}
        <div style={{ flex: 1, height: '58px', position: 'relative' }}>
          <svg
            viewBox="0 0 300 72"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '58px', overflow: 'visible' }}
          >
            {/* Baseline y=58 */}
            <line x1="0" y1="58" x2="300" y2="58" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />

            {/* Alarm Threshold Line y=46 */}
            <line x1="0" y1="46" x2="300" y2="46" stroke="var(--alarm)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

            {/* SIGN Line (Feed-liveness flat green y=57) */}
            <polyline
              fill="none"
              stroke="var(--nominal)"
              strokeWidth="2"
              points="0,58 300,57"
            />

            {/* CAP Line */}
            {isFrozen && (
              <polyline
                fill="none"
                stroke="var(--alarm)"
                strokeWidth="2.4"
                points="0,58 96,58 110,46 300,12"
              />
            )}

            {isRestored && (
              <polyline
                fill="none"
                stroke="var(--restored)"
                strokeWidth="2.4"
                points="0,12 104,12 150,30 214,50 300,58"
              />
            )}

            {!isFrozen && !isRestored && (
              <polyline
                fill="none"
                stroke="var(--nominal)"
                strokeWidth="2.4"
                points="0,58 300,58"
              />
            )}

            {/* Backup Candidate Line (Dashed y=66 if backup present) */}
            {isFrozen && (
              <line
                x1="120"
                y1="66"
                x2="300"
                y2="66"
                stroke={backupHealthy ? 'var(--nominal)' : 'var(--ghost-1)'}
                strokeWidth="1.8"
                strokeDasharray="4 3"
              />
            )}
          </svg>
        </div>

        {/* Chips Column (Right) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '7px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              border: isFrozen ? '1.5px solid var(--alarm)' : '1.5px solid var(--nominal)',
              color: isFrozen ? 'var(--alarm-ink)' : 'var(--nominal-ink)',
              backgroundColor: isFrozen ? 'rgba(180, 35, 28, 0.08)' : 'rgba(59, 122, 75, 0.08)',
            }}
          >
            CAP {isFrozen ? '▲ FAIL' : '● OK'}
          </span>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '7px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1.5px solid var(--nominal)',
              color: 'var(--nominal-ink)',
              backgroundColor: 'rgba(59, 122, 75, 0.08)',
            }}
          >
            SIGN ● OK
          </span>

          {isFrozen && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '7px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                border: backupHealthy ? '1.5px solid var(--nominal)' : '1.5px dashed var(--ghost-1)',
                color: backupHealthy ? 'var(--nominal-ink)' : 'var(--ghost-2)',
              }}
            >
              BACKUP {backupHealthy ? '✔ HEALTHY' : '? UNKNOWN'}
            </span>
          )}
        </div>
      </div>

      {/* Legend Foot (Mandatory Honesty Labels) */}
      <div
        style={{
          marginTop: '10px',
          paddingTop: '8px',
          borderTop: '1px dashed var(--border-soft)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '7px',
          color: 'var(--text-60)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '2px', backgroundColor: 'var(--alarm)', display: 'inline-block' }} />
          CAP · captions
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '2px', backgroundColor: 'var(--nominal)', display: 'inline-block' }} />
          SIGN · feed-liveness (stand-in)
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.6 }}>
          <span className="hatch-ad-swatch" />
          AD — not monitored in this build · static
        </div>
      </div>
    </div>
  );
};
