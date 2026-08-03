import React from 'react';

export type VideoState = 'clean' | 'fine' | 'frozen' | 'restored' | 'blind';

interface SplitHeroProps {
  rightState: VideoState;
  channelName?: string;
}

export const SplitHero: React.FC<SplitHeroProps> = ({
  rightState = 'frozen',
  channelName = 'TEARS OF STEEL',
}) => {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '760px',
        backgroundColor: 'var(--panel-hi)',
        padding: '15px 17px 17px 17px',
        borderLeft: '2.5px solid var(--ink)',
        borderRight: '2.5px solid var(--ink)',
        position: 'relative',
      }}
    >
      {/* Centered THE SPLIT Pill Header */}
      <div
        style={{
          position: 'absolute',
          top: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--ink)',
          color: '#f5f3ec',
          fontFamily: 'var(--font-mono)',
          fontSize: '8px',
          fontWeight: 700,
          letterSpacing: '1.5px',
          padding: '2px 10px',
          borderRadius: '10px',
          zIndex: 10,
        }}
      >
        THE SPLIT
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
        }}
      >
        {/* LEFT COLUMN: Clean PGM 1 (What most people see) */}
        <div style={{ paddingRight: '11px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--text-60)',
              marginBottom: '6px',
            }}
          >
            CLEAN PGM 1 · MAIN FEED
          </div>

          {/* Left Video Tile (Clean) */}
          <div
            style={{
              height: '158px',
              borderRadius: '6px',
              border: '2px solid #3b3a34',
              backgroundColor: '#0b0f11',
              backgroundImage: 'radial-gradient(circle at 50% 40%, #1e262c 0%, #0b0f11 80%)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Source Chip */}
            <div
              style={{
                margin: '8px',
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                color: '#f5f3ec',
                fontFamily: 'var(--font-mono)',
                fontSize: '7px',
                padding: '2px 6px',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--nominal)' }} />
              PRIMARY FEED · {channelName}
            </div>

            {/* Bottom Caption Bar */}
            <div
              style={{
                backgroundColor: 'rgba(22, 20, 15, 0.85)',
                color: '#f5f3ec',
                padding: '6px 10px',
                fontFamily: 'var(--font-grotesk)',
                fontSize: '11px',
                textAlign: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              — sample caption dialogue, in sync —
            </div>
          </div>

          {/* Left Status Pill */}
          <div
            style={{
              marginTop: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1.5px solid var(--nominal)',
              backgroundColor: 'var(--panel-hi)',
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              color: 'var(--nominal-ink)',
            }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--nominal)' }} />
            CAPTIONS LIVE · IN SYNC
          </div>
        </div>

        {/* RIGHT COLUMN: What this viewer gets */}
        <div
          style={{
            borderLeft: '2px dashed var(--ink)',
            paddingLeft: '11px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: rightState === 'frozen' ? 'var(--alarm-ink)' : 'var(--text-60)',
              marginBottom: '6px',
            }}
          >
            WHAT THIS VIEWER GETS
          </div>

          {/* Right Video Tile */}
          {rightState === 'frozen' && (
            <div
              className="hatch-alarm"
              style={{
                height: '158px',
                borderRadius: '6px',
                border: '3px solid var(--alarm)',
                boxShadow: 'inset 0 0 12px rgba(180, 35, 28, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  margin: '8px',
                  alignSelf: 'flex-start',
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  color: '#f5f3ec',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '7px',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <div style={{ width: '5px', height: '5px', backgroundColor: 'var(--alarm)' }} />
                FAILING STREAM · {channelName}
              </div>

              {/* Frozen Bottom Bar */}
              <div
                style={{
                  backgroundColor: 'rgba(8, 6, 4, 0.92)',
                  color: 'var(--alarm)',
                  padding: '6px 10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderTop: '2px solid var(--alarm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <div className="animate-pulse" style={{ width: '6px', height: '6px', backgroundColor: 'var(--alarm)' }} />
                CAPTIONS FROZEN
              </div>
            </div>
          )}

          {rightState === 'restored' && (
            <div
              style={{
                height: '158px',
                borderRadius: '6px',
                border: '2.5px solid var(--ink)',
                backgroundColor: '#0b0f11',
                backgroundImage: 'radial-gradient(circle at 50% 40%, #172a38 0%, #0b0f11 80%)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  margin: '8px',
                  alignSelf: 'flex-start',
                  backgroundColor: 'var(--restored)',
                  color: '#f5f3ec',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '7px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '3px',
                }}
              >
                BACKUP FEED ACTIVE
              </div>

              {/* Restored Surface Bar */}
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  color: 'var(--ink)',
                  padding: '6px 10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderTop: '2.5px solid var(--ink)',
                }}
              >
                ✓ CAPTIONS RESTORED
              </div>
            </div>
          )}

          {rightState === 'blind' && (
            <div
              className="hatch-no-data animate-flicker"
              style={{
                height: '158px',
                borderRadius: '6px',
                border: '3px dashed var(--ghost-3)',
                backgroundColor: '#07090b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ghost-border)',
                textAlign: 'center',
                padding: '12px',
              }}
            >
              <div className="animate-spin" style={{ width: '22px', height: '22px', border: '2px solid var(--ghost-border)', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '8px' }} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, letterSpacing: '2px', color: '#f5f3ec' }}>
                WHICH LAYER?
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', opacity: 0.7, marginTop: '4px' }}>
                telemetry unreadable · cannot confirm
              </div>
            </div>
          )}

          {(rightState === 'clean' || rightState === 'fine') && (
            <div
              style={{
                height: '158px',
                borderRadius: '6px',
                border: '2px solid #3b3a34',
                backgroundColor: '#0b0f11',
                backgroundImage: 'radial-gradient(circle at 50% 40%, #1e262c 0%, #0b0f11 80%)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  margin: '8px',
                  alignSelf: 'flex-start',
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  color: '#f5f3ec',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '7px',
                  padding: '2px 6px',
                  borderRadius: '3px',
                }}
              >
                SAME STREAM · {channelName}
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(22, 20, 15, 0.85)',
                  color: '#f5f3ec',
                  padding: '6px 10px',
                  fontFamily: 'var(--font-grotesk)',
                  fontSize: '11px',
                  textAlign: 'center',
                }}
              >
                — sample caption dialogue, in sync —
              </div>
            </div>
          )}

          {/* Right Status Pill */}
          <div
            style={{
              marginTop: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              border:
                rightState === 'frozen'
                  ? '2px solid var(--alarm)'
                  : rightState === 'restored'
                  ? '2px solid var(--ink)'
                  : rightState === 'blind'
                  ? '2px dashed var(--ghost-3)'
                  : '1.5px solid var(--nominal)',
              backgroundColor:
                rightState === 'frozen' ? 'var(--ink)' : 'var(--panel-hi)',
              color:
                rightState === 'frozen'
                  ? '#f5f3ec'
                  : rightState === 'restored'
                  ? 'var(--restored-ink)'
                  : rightState === 'blind'
                  ? 'var(--ghost-2)'
                  : 'var(--nominal-ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              fontWeight: 700,
              letterSpacing: '0.5px',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: rightState === 'frozen' ? '0' : '50%',
                backgroundColor:
                  rightState === 'frozen'
                    ? 'var(--alarm)'
                    : rightState === 'restored'
                    ? 'var(--restored)'
                    : rightState === 'blind'
                    ? 'var(--ghost-3)'
                    : 'var(--nominal)',
              }}
            />
            {rightState === 'frozen'
              ? 'CAPTIONS FROZEN · ALARM'
              : rightState === 'restored'
              ? '✓ ACCESS RESTORED'
              : rightState === 'blind'
              ? 'EVIDENCE BLIND · UNREADABLE'
              : 'LOOKS FINE · IN SYNC'}
          </div>
        </div>
      </div>
    </div>
  );
};
