import React, { useRef, useEffect, useState } from 'react';
import { TEARS_OF_STEEL_CUES, SINTEL_CUES, getCueForTime } from '../data/vttParser';

export type VideoState = 'clean' | 'fine' | 'frozen' | 'restored' | 'blind';

interface SplitHeroProps {
  rightState: VideoState;
  channelName?: string;
  sourceVideoUrl?: string;
  backupVideoUrl?: string;
  captionsVttUrl?: string;
  isFaultInjected?: boolean;
  // Contention mode props
  isContention?: boolean;
  ch14Restored?: boolean;
  ch27Degraded?: boolean;
}

export const SplitHero: React.FC<SplitHeroProps> = ({
  rightState = 'frozen',
  channelName = 'TEARS OF STEEL',
  sourceVideoUrl = 'http://localhost:8008/films/tears_of_steel/source.mp4',
  backupVideoUrl = 'http://localhost:8008/films/tears_of_steel/backup.mp4',
  captionsVttUrl = 'http://localhost:8008/films/tears_of_steel/captions.vtt',
  isFaultInjected = false,
  isContention = false,
  ch14Restored = false,
  ch27Degraded = false,
}) => {
  const leftVideoRef = useRef<HTMLVideoElement>(null);
  const rightVideoRef = useRef<HTMLVideoElement>(null);

  // Frame-synced timecode playhead ref
  const savedPlayheadRef = useRef<number>(28.0);

  // Moving caption states
  const [leftTime, setLeftTime] = useState<number>(28.0);
  const [rightTime, setRightTime] = useState<number>(28.0);

  // Single-channel frozen cue (Tears of Steel)
  const [frozenRightCue, setFrozenRightCue] = useState<string | null>(null);
  const frozenRightCueRef = useRef<string | null>(null);

  // Contention frozen cue (Sintel)
  const [frozenSintelCue, setFrozenSintelCue] = useState<string | null>(null);
  const frozenSintelCueRef = useRef<string | null>(null);

  // Reset ref locks when state changes
  useEffect(() => {
    if (rightState !== 'frozen' && !(isContention && !ch14Restored)) {
      frozenRightCueRef.current = null;
      setFrozenRightCue(null);
    }
    if (!isContention) {
      frozenSintelCueRef.current = null;
      setFrozenSintelCue(null);
    }
  }, [rightState, isContention, ch14Restored]);

  // Sync video playback and track currentTime for frame-accurate failover cutover
  useEffect(() => {
    const left = leftVideoRef.current;
    const right = rightVideoRef.current;
    let animationFrameId: number;

    if (left && right) {
      // Lockstep timecode alignment: Preserve exact playhead position on backup failover switch
      const activeTime = savedPlayheadRef.current > 2.0 ? savedPlayheadRef.current : 28.0;
      if (left.currentTime === 0 || left.currentTime < 2.0) {
        left.currentTime = activeTime;
      }
      if (right.currentTime === 0 || right.currentTime < 2.0) {
        right.currentTime = activeTime;
      }

      left.play().catch(() => {});
      right.play().catch(() => {});

      const updateTimes = () => {
        if (left) {
          setLeftTime(left.currentTime);
          if (left.currentTime > 2.0) {
            savedPlayheadRef.current = left.currentTime;
          }
        }
        if (right) {
          if (rightState === 'frozen' || (isContention && !ch14Restored)) {
            // Lock the frozen cue text for Tears of Steel
            if (!frozenRightCueRef.current) {
              const cueText = getCueForTime(TEARS_OF_STEEL_CUES, right.currentTime);
              frozenRightCueRef.current = cueText;
              setFrozenRightCue(cueText);
            }
          } else {
            setRightTime(right.currentTime);
          }

          if (isContention) {
            // Lock distinct frozen cue text for Sintel
            if (!frozenSintelCueRef.current) {
              const sintelCueText = getCueForTime(SINTEL_CUES, right.currentTime);
              frozenSintelCueRef.current = sintelCueText;
              setFrozenSintelCue(sintelCueText);
            }
          }
        }
        animationFrameId = requestAnimationFrame(updateTimes);
      };
      animationFrameId = requestAnimationFrame(updateTimes);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [sourceVideoUrl, backupVideoUrl, rightState, isContention, ch14Restored]);

  // Compute active caption strings
  const leftCaptionText = getCueForTime(TEARS_OF_STEEL_CUES, leftTime);
  const rightCaptionText = frozenRightCue || getCueForTime(TEARS_OF_STEEL_CUES, rightTime);
  const sintelCaptionText = frozenSintelCue || getCueForTime(SINTEL_CUES, rightTime);

  // CONTENTION MODE (09–12): In-Player Two Different Movies Transformation
  if (isContention) {
    return (
      <div
        data-testid="facility-view"
        style={{
          width: '100%',
          backgroundColor: 'var(--panel-hi)',
          padding: '18px 20px 16px 20px',
          position: 'relative',
        }}
      >
        {/* Centered CONTENTION POOL Pill Header */}
        <div
          style={{
            position: 'absolute',
            top: '-11px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--alarm)',
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
          CONTENTION SCENARIO · 2 FAILURES vs 1 BACKUP
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* LEFT COLUMN: CH-14 TEARS OF STEEL (Emergency / Public-Information Tier) */}
          <div style={{ paddingRight: '14px' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '8.5px',
                fontWeight: 700,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>CH-14 · TEARS OF STEEL</span>
              <span
                style={{
                  fontSize: '7.5px',
                  backgroundColor: 'rgba(184, 100, 27, 0.2)',
                  border: '1px solid var(--accent)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >
                Emergency Tier
              </span>
            </div>

            {/* Left Movie Player - Tears of Steel */}
            <div
              data-testid="ch14-card"
              style={{
                height: '320px',
                borderRadius: '8px',
                border: ch14Restored ? '3.5px solid var(--restored)' : '3.5px solid var(--alarm)',
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
                data-testid="ch14-video"
                src={ch14Restored ? backupVideoUrl : sourceVideoUrl}
                muted
                loop
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
              />

              {/* Source Chip Overlay */}
              <div
                style={{
                  margin: '10px',
                  alignSelf: 'flex-start',
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  color: '#f5f3ec',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  padding: '4px 10px',
                  borderRadius: '4px',
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
                    borderRadius: '50%',
                    backgroundColor: ch14Restored ? 'var(--restored)' : 'var(--alarm)',
                  }}
                />
                {ch14Restored ? 'BACKUP ACTIVE · CH-14' : 'PRIMARY FAILING · CH-14'}
              </div>

              {/* Bottom Moving Caption Bar */}
              <div
                data-testid="ch14-caption"
                style={{
                  backgroundColor: ch14Restored ? 'var(--surface)' : 'rgba(8, 6, 4, 0.94)',
                  color: ch14Restored ? 'var(--ink)' : 'var(--alarm)',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderTop: ch14Restored ? '2.5px solid var(--ink)' : '2.5px solid var(--alarm)',
                  zIndex: 2,
                }}
              >
                {ch14Restored ? `✓ ${leftCaptionText}` : `⚠ [FROZEN] ${rightCaptionText}`}
              </div>
            </div>

            {/* Left Status Pill */}
            <div
              style={{
                marginTop: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '20px',
                border: ch14Restored ? '2px solid var(--ink)' : '2px solid var(--alarm)',
                backgroundColor: ch14Restored ? 'var(--panel-hi)' : 'var(--ink)',
                color: ch14Restored ? 'var(--restored-ink)' : '#f5f3ec',
                fontFamily: 'var(--font-mono)',
                fontSize: '8.5px',
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: ch14Restored ? 'var(--restored)' : 'var(--alarm)',
                }}
              />
              {ch14Restored ? '✓ PRIORITY RESTORED' : 'CAPTIONS FROZEN · ALARM'}
            </div>
          </div>

          {/* RIGHT COLUMN: CH-27 SINTEL (General Entertainment Tier) */}
          <div style={{ borderLeft: '2.5px dashed var(--ink)', paddingLeft: '14px' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '8.5px',
                fontWeight: 700,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                color: 'var(--alarm-ink)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>CH-27 · SINTEL</span>
              <span
                style={{
                  fontSize: '7.5px',
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(0, 0, 0, 0.2)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >
                General Tier
              </span>
            </div>

            {/* Right Movie Player - Sintel */}
            <div
              data-testid="ch27-card"
              className="hatch-alarm"
              style={{
                height: '320px',
                borderRadius: '8px',
                border: '3.5px solid var(--alarm)',
                backgroundColor: '#0b0f11',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <video
                ref={rightVideoRef}
                data-testid="ch27-video"
                src="http://localhost:8008/films/sintel/source.mp4"
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
                  filter: 'brightness(0.82)',
                }}
              />

              {/* Source Chip Overlay */}
              <div
                style={{
                  margin: '10px',
                  alignSelf: 'flex-start',
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  color: '#f5f3ec',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 2,
                }}
              >
                <div style={{ width: '6px', height: '6px', backgroundColor: 'var(--alarm)' }} />
                PRIMARY FAILING · CH-27
              </div>

              {/* Bottom Moving Caption Bar */}
              <div
                data-testid="ch27-caption"
                style={{
                  backgroundColor: 'rgba(8, 6, 4, 0.94)',
                  color: 'var(--alarm)',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderTop: '2.5px solid var(--alarm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  zIndex: 2,
                }}
              >
                <div className="animate-pulse" style={{ width: '7px', height: '7px', backgroundColor: 'var(--alarm)' }} />
                ⚠ [FROZEN] {sintelCaptionText}
              </div>
            </div>

            {/* Right Status Pill */}
            <div
              data-testid="ch27-status-pill"
              style={{
                marginTop: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '20px',
                border: '2px solid var(--alarm)',
                backgroundColor: 'var(--ink)',
                color: '#f5f3ec',
                fontFamily: 'var(--font-mono)',
                fontSize: '8.5px',
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              <div style={{ width: '6px', height: '6px', backgroundColor: 'var(--alarm)' }} />
              {ch27Degraded ? 'DEGRADED + FLAGGED · CAPACITY EXHAUSTED' : 'CAPTIONS FROZEN · ALARM'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SINGLE CHANNEL MODE (01–08): Clean PGM vs Viewer Stream
  return (
    <div
      style={{
        width: '100%',
        backgroundColor: 'var(--panel-hi)',
        padding: '18px 20px 16px 20px',
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
        {/* LEFT COLUMN: WHAT MOST PEOPLE SEE */}
        <div style={{ paddingRight: '14px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8.5px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--text-60)',
              marginBottom: '8px',
            }}
          >
            WHAT MOST PEOPLE SEE
          </div>

          {/* Left Real Video Element */}
          <div
            style={{
              height: '320px',
              borderRadius: '8px',
              border: '2.5px solid var(--ink)',
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
              data-testid="left-video"
              src={sourceVideoUrl}
              muted
              loop
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
            />

            {/* Source Chip Overlay */}
            <div
              style={{
                margin: '10px',
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                color: '#f5f3ec',
                fontFamily: 'var(--font-mono)',
                fontSize: '8px',
                padding: '4px 10px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                zIndex: 2,
              }}
            >
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--nominal)' }} />
              PGM 1 · MAIN
            </div>

            {/* Bottom Real Moving Caption Overlay Bar */}
            <div
              data-testid="left-caption-text"
              style={{
                backgroundColor: 'rgba(22, 20, 15, 0.90)',
                color: '#f5f3ec',
                padding: '10px 14px',
                fontFamily: 'var(--font-grotesk)',
                fontSize: '12px',
                textAlign: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                zIndex: 2,
              }}
            >
              {leftCaptionText}
            </div>
          </div>

          {/* Left Status Pill */}
          <div
            data-testid="left-status-pill"
            style={{
              marginTop: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '20px',
              border: '1.5px solid var(--nominal)',
              backgroundColor: 'var(--panel-hi)',
              fontFamily: 'var(--font-mono)',
              fontSize: '8.5px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              color: 'var(--nominal-ink)',
            }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--nominal)' }} />
            CAPTIONS LIVE · IN SYNC
          </div>
        </div>

        {/* RIGHT COLUMN: WHAT THIS VIEWER GETS */}
        <div style={{ borderLeft: '2.5px dashed var(--ink)', paddingLeft: '14px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8.5px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: rightState === 'frozen' ? 'var(--alarm-ink)' : 'var(--text-60)',
              marginBottom: '8px',
            }}
          >
            WHAT THIS VIEWER GETS
          </div>

          {/* Right Video Tile */}
          <div
            className={rightState === 'frozen' ? 'hatch-alarm' : rightState === 'blind' ? 'hatch-no-data animate-flicker' : ''}
            style={{
              height: '320px',
              borderRadius: '8px',
              border:
                rightState === 'frozen'
                  ? '3.5px solid var(--alarm)'
                  : rightState === 'restored'
                  ? '2.5px solid var(--ink)'
                  : rightState === 'blind'
                  ? '3px dashed var(--ghost-3)'
                  : '2.5px solid var(--ink)',
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
                data-testid="right-video"
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
                margin: '10px',
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                color: '#f5f3ec',
                fontFamily: 'var(--font-mono)',
                fontSize: '8px',
                padding: '4px 10px',
                borderRadius: '4px',
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
              {rightState === 'restored' ? 'BACKUP FEED ACTIVE' : rightState === 'frozen' ? 'SAME STREAM' : 'SAME STREAM'}
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

            {/* Frozen / Restored / Normal Bottom Moving Caption Overlay Bar */}
            {rightState === 'frozen' && (
              <div
                data-testid="right-caption-text"
                style={{
                  backgroundColor: 'rgba(8, 6, 4, 0.94)',
                  color: '#f5f3ec',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderTop: '2.5px solid var(--alarm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  zIndex: 2,
                }}
              >
                <div className="animate-pulse" style={{ width: '7px', height: '7px', backgroundColor: 'var(--alarm)' }} />
                ⚠ [FROZEN] {rightCaptionText}
              </div>
            )}

            {rightState === 'restored' && (
              <div
                data-testid="right-caption-text"
                style={{
                  backgroundColor: 'var(--surface)',
                  color: 'var(--ink)',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderTop: '2.5px solid var(--ink)',
                  zIndex: 2,
                }}
              >
                ✓ {rightCaptionText}
              </div>
            )}

            {(rightState === 'clean' || rightState === 'fine') && (
              <div
                data-testid="right-caption-text"
                style={{
                  backgroundColor: 'rgba(22, 20, 15, 0.88)',
                  color: '#f5f3ec',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-grotesk)',
                  fontSize: '12px',
                  textAlign: 'center',
                  borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                  zIndex: 2,
                }}
              >
                {rightCaptionText}
              </div>
            )}
          </div>

          {/* Right Status Pill */}
          <div
            data-testid="right-status-pill"
            style={{
              marginTop: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
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
              fontSize: '8.5px',
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
