import React, { useRef, useEffect } from 'react';

export type VideoState = 'clean' | 'fine' | 'frozen' | 'restored' | 'blind';

interface SplitHeroProps {
  rightState: VideoState;
  channelName?: string;
  sourceVideoUrl?: string;
  backupVideoUrl?: string;
  captionsVttUrl?: string;
  isFaultInjected?: boolean;
}

export const SplitHero: React.FC<SplitHeroProps> = ({
  rightState = 'frozen',
  channelName = 'TEARS OF STEEL',
  sourceVideoUrl = 'http://localhost:8008/films/tears_of_steel/source.mp4',
  backupVideoUrl = 'http://localhost:8008/films/tears_of_steel/backup.mp4',
  captionsVttUrl = 'http://localhost:8008/films/tears_of_steel/captions.vtt',
  isFaultInjected = false,
}) => {
  const leftVideoRef = useRef<HTMLVideoElement>(null);
  const rightVideoRef = useRef<HTMLVideoElement>(null);

  // Sync playback between left and right video elements
  useEffect(() => {
    const left = leftVideoRef.current;
    const right = rightVideoRef.current;
    if (left && right) {
      left.currentTime = 10.0;
      right.currentTime = 10.0;
      left.play().catch(() => {});
      right.play().catch(() => {});
    }
  }, [sourceVideoUrl, rightState]);

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: 'var(--panel-hi)',
        padding: '20px 24px 22px 24px',
        position: 'relative',
      }}
    >
      {/* Centered THE SPLIT Pill Header */}
      <div
        style={{
          position: 'absolute',
          top: '-11px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--ink)',
          color: '#f5f3ec',
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '2px',
          padding: '3px 14px',
          borderRadius: '12px',
          zIndex: 10,
        }}
      >
        THE SPLIT
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {/* LEFT COLUMN: Clean PGM 1 (What most people see) */}
        <div style={{ paddingRight: '16px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--text-60)',
              marginBottom: '8px',
            }}
          >
            CLEAN PGM 1 · MAIN FEED
          </div>

          {/* Left Real Video Element (Scaled to 320px height) */}
          <div
            style={{
              height: '320px',
              borderRadius: '6px',
              border: '2px solid #3b3a34',
              backgroundColor: '#0b0f11',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <video
              ref={leftVideoRef}
              src={sourceVideoUrl}
              muted
              loop
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
            >
              <track src={captionsVttUrl} kind="subtitles" srcLang="en" label="English" default />
            </video>

            {/* Source Chip Overlay */}
            <div
              style={{
                margin: '12px',
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                color: '#f5f3ec',
                fontFamily: 'var(--font-mono)',
                fontSize: '8px',
                padding: '4px 10px',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                zIndex: 2,
              }}
            >
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--nominal)' }} />
              PRIMARY FEED · {channelName}
            </div>

            {/* Bottom Caption Overlay Bar */}
            <div
              style={{
                backgroundColor: 'rgba(22, 20, 15, 0.90)',
                color: '#f5f3ec',
                padding: '10px 14px',
                fontFamily: 'var(--font-grotesk)',
                fontSize: '13px',
                textAlign: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                zIndex: 2,
              }}
            >
              — sample caption dialogue, in sync —
            </div>
          </div>

          {/* Left Status Pill */}
          <div
            style={{
              marginTop: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1.5px solid var(--nominal)',
              backgroundColor: 'var(--panel-hi)',
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
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
        <div style={{ borderLeft: '2px dashed var(--ink)', paddingLeft: '16px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: rightState === 'frozen' ? 'var(--alarm-ink)' : 'var(--text-60)',
              marginBottom: '8px',
            }}
          >
            WHAT THIS VIEWER GETS
          </div>

          {/* Right Video Tile (Scaled to 320px height) */}
          <div
            className={rightState === 'frozen' ? 'hatch-alarm' : rightState === 'blind' ? 'hatch-no-data animate-flicker' : ''}
            style={{
              height: '320px',
              borderRadius: '6px',
              border:
                rightState === 'frozen'
                  ? '3.5px solid var(--alarm)'
                  : rightState === 'restored'
                  ? '2.5px solid var(--ink)'
                  : rightState === 'blind'
                  ? '3px dashed var(--ghost-3)'
                  : '2px solid #3b3a34',
              backgroundColor: '#0b0f11',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {rightState !== 'blind' && (
              <video
                ref={rightVideoRef}
                src={rightState === 'restored' ? backupVideoUrl : sourceVideoUrl}
                muted
                loop
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  filter: rightState === 'frozen' ? 'brightness(0.82)' : 'none',
                }}
              />
            )}

            {/* Source Chip Overlay */}
            <div
              style={{
                margin: '12px',
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                color: '#f5f3ec',
                fontFamily: 'var(--font-mono)',
                fontSize: '8px',
                padding: '4px 10px',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                zIndex: 2,
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
                      : 'var(--nominal)',
                }}
              />
              {rightState === 'restored' ? 'BACKUP FEED ACTIVE' : rightState === 'frozen' ? 'FAILING STREAM' : 'SAME STREAM'} · {channelName}
            </div>

            {/* Blind State Content */}
            {rightState === 'blind' && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ghost-border)',
                  zIndex: 3,
                }}
              >
                <div className="animate-spin" style={{ width: '28px', height: '28px', border: '2.5px solid var(--ghost-border)', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '10px' }} />
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, letterSpacing: '2px', color: '#f5f3ec' }}>
                  WHICH LAYER?
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', opacity: 0.7, marginTop: '6px' }}>
                  telemetry unreadable · cannot confirm
                </div>
              </div>
            )}

            {/* Frozen / Restored / Normal Bottom Caption Overlay Bar */}
            {rightState === 'frozen' && (
              <div
                style={{
                  backgroundColor: 'rgba(8, 6, 4, 0.92)',
                  color: 'var(--alarm)',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderTop: '2px solid var(--alarm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  zIndex: 2,
                }}
              >
                <div className="animate-pulse" style={{ width: '7px', height: '7px', backgroundColor: 'var(--alarm)' }} />
                CAPTIONS FROZEN (OFFSET +2.996s)
              </div>
            )}

            {rightState === 'restored' && (
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  color: 'var(--ink)',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderTop: '2.5px solid var(--ink)',
                  zIndex: 2,
                }}
              >
                ✓ CAPTIONS RESTORED
              </div>
            )}

            {(rightState === 'clean' || rightState === 'fine') && (
              <div
                style={{
                  backgroundColor: 'rgba(22, 20, 15, 0.88)',
                  color: '#f5f3ec',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-grotesk)',
                  fontSize: '13px',
                  textAlign: 'center',
                  borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                  zIndex: 2,
                }}
              >
                — sample caption dialogue, in sync —
              </div>
            )}
          </div>

          {/* Right Status Pill */}
          <div
            style={{
              marginTop: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              border:
                rightState === 'frozen'
                  ? '2px solid var(--alarm)'
                  : rightState === 'restored'
                  ? '2px solid var(--ink)'
                  : rightState === 'blind'
                  ? '2px dashed var(--ghost-3)'
                  : '1.5px solid var(--nominal)',
              backgroundColor: rightState === 'frozen' ? 'var(--ink)' : 'var(--panel-hi)',
              color:
                rightState === 'frozen'
                  ? '#f5f3ec'
                  : rightState === 'restored'
                  ? 'var(--restored-ink)'
                  : rightState === 'blind'
                  ? 'var(--ghost-2)'
                  : 'var(--nominal-ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
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
