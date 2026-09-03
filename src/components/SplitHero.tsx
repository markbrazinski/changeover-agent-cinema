import React, { useRef, useEffect, useState } from 'react';
import { TEARS_OF_STEEL_CUES, SINTEL_CUES, getCueForTime } from '../data/vttParser';
import { EndingSlide } from './EndingSlide';

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
  isContentionBaseline?: boolean;
  ch14Restored?: boolean;
  ch27Degraded?: boolean;
  currentStage?: string;
  isPlayingWalkthrough?: boolean;
  walkthroughElapsedSec?: number;
}

export const SplitHero: React.FC<SplitHeroProps> = ({
  rightState = 'frozen',
  channelName = 'TEARS OF STEEL',
  sourceVideoUrl = '/media/tos_source.mp4',
  backupVideoUrl = '/media/tos_backup.mp4',
  captionsVttUrl = '/media/captions_tos.vtt',
  isFaultInjected = false,
  isContention = false,
  isContentionBaseline = false,
  ch14Restored = false,
  ch27Degraded = false,
  currentStage,
  isPlayingWalkthrough = false,
  walkthroughElapsedSec = 0,
}) => {
  const leftVideoRef = useRef<HTMLVideoElement>(null);
  const rightVideoRef = useRef<HTMLVideoElement>(null);

  // Frame-synced timecode playhead ref
  const savedPlayheadRef = useRef<number>(0.0);

  // Moving caption states
  const [leftTime, setLeftTime] = useState<number>(0.0);
  const [rightTime, setRightTime] = useState<number>(0.0);

  // Single-channel frozen cue (Tears of Steel)
  const [frozenRightCue, setFrozenRightCue] = useState<string | null>(null);
  const frozenRightCueRef = useRef<string | null>(null);

  // Contention frozen cue (Sintel)
  const [frozenSintelCue, setFrozenSintelCue] = useState<string | null>(null);
  const frozenSintelCueRef = useRef<string | null>(null);

  // Reset ref locks and seek playheads on stage resets
  useEffect(() => {
    if (currentStage === '01_at_rest') {
      const left = leftVideoRef.current;
      const right = rightVideoRef.current;
      if (left && right) {
        left.currentTime = 0.0;
        right.currentTime = 0.0;
        savedPlayheadRef.current = 0.0;
        setLeftTime(0.0);
        setRightTime(0.0);
      }
      frozenRightCueRef.current = null;
      setFrozenRightCue(null);
    }

    if (currentStage === '08a_refusal_baseline' || currentStage === '08_refusal_stale_evidence') {
      const left = leftVideoRef.current;
      const right = rightVideoRef.current;
      if (left && right) {
        left.currentTime = 0.0;
        right.currentTime = 116.5;
        savedPlayheadRef.current = 0.0;
        setLeftTime(0.0);
        setRightTime(116.5);
      }
      // Lock Sintel cue to the refusal line from before
      const sintelLockedCue = "— SHAMAN: This blade has a dark past. It has shed much innocent blood... —";
      frozenRightCueRef.current = sintelLockedCue;
      setFrozenRightCue(sintelLockedCue);
    }

    if (currentStage === '09a_contention_baseline') {
      const left = leftVideoRef.current;
      const right = rightVideoRef.current;
      if (left && right) {
        left.currentTime = 0.0;
        right.currentTime = 0.0;
        savedPlayheadRef.current = 0.0;
        setLeftTime(0.0);
        setRightTime(0.0);
      }
      frozenRightCueRef.current = null;
      setFrozenRightCue(null);
      frozenSintelCueRef.current = null;
      setFrozenSintelCue(null);
    }

    if (rightState !== 'frozen' && !currentStage?.startsWith('08') && !(isContention && !ch14Restored && !isContentionBaseline)) {
      frozenRightCueRef.current = null;
      setFrozenRightCue(null);
    }
    if (!isContention) {
      frozenSintelCueRef.current = null;
      setFrozenSintelCue(null);
    }
  }, [rightState, isContention, ch14Restored, isContentionBaseline, currentStage]);

  // Sync video playback and track currentTime for frame-accurate failover cutover
  useEffect(() => {
    const left = leftVideoRef.current;
    const right = rightVideoRef.current;
    let animationFrameId: number;

    if (left && right) {
      const activeTime = savedPlayheadRef.current;
      if (left.currentTime === 0 && activeTime > 0) {
        left.currentTime = activeTime;
      }
      if (right.currentTime === 0 && activeTime > 0) {
        right.currentTime = activeTime;
      }

      left.play().catch(() => {});
      right.play().catch(() => {});

      const updateTimes = () => {
        if (left) {
          setLeftTime(left.currentTime);
          savedPlayheadRef.current = left.currentTime;
        }

        if (right) {
          if (rightState === 'frozen' || (isContention && !ch14Restored && !isContentionBaseline)) {
            // Lock frozen cue mid-line on fault injection (Act I)
            if (!frozenRightCueRef.current && left && !currentStage?.startsWith('08')) {
              const liveCue = getCueForTime(TEARS_OF_STEEL_CUES, left.currentTime);
              const cueToFreeze = liveCue || "— THOM: All right, fine! I'm freaked out! —";
              frozenRightCueRef.current = cueToFreeze;
              setFrozenRightCue(cueToFreeze);
            }
          }

          if (isContention && !ch14Restored && !isContentionBaseline) {
            if (!frozenSintelCueRef.current && right) {
              const liveSintelCue = getCueForTime(SINTEL_CUES, right.currentTime);
              const cueToFreeze = liveSintelCue || "— SHAMAN: This blade has a dark past. It has shed much innocent blood... —";
              frozenSintelCueRef.current = cueToFreeze;
              setFrozenSintelCue(cueToFreeze);
            }
          }

          setRightTime(right.currentTime);
        }

        animationFrameId = requestAnimationFrame(updateTimes);
      };

      animationFrameId = requestAnimationFrame(updateTimes);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [rightState, isContention, ch14Restored, isContentionBaseline]);

  // Get active spoken dialogue caption cues per film
  const isSintelChannel = channelName === 'SINTEL' || sourceVideoUrl.includes('sintel');
  const activeSingleChannelCues = isSintelChannel ? SINTEL_CUES : TEARS_OF_STEEL_CUES;

  const rawLeftCue = getCueForTime(activeSingleChannelCues, leftTime);
  const leftCaptionText = rawLeftCue || '\u00A0';

  const rawRightCue = getCueForTime(activeSingleChannelCues, rightTime);
  const rightCaptionText = frozenRightCue || rawRightCue || '\u00A0';

  const rawSintelCue = getCueForTime(SINTEL_CUES, rightTime);
  const sintelCaptionText = frozenSintelCue || rawSintelCue || '\u00A0';

  // Render Ending & Attribution Slides
  if (currentStage === '13_ending_slide' || currentStage === '14_attribution_slide' || currentStage === '15_completed') {
    return <EndingSlide currentStage={currentStage} />;
  }

  // Render Contention 2-Channel Facility View
  if (isContention) {
    return (
      <div
        data-testid="facility-view"
        style={{
          margin: '14px 18px 10px 18px',
          padding: '16px',
          backgroundColor: '#fcfbf7',
          border: '2.5px solid var(--ink)',
          borderRadius: '10px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          position: 'relative',
        }}
      >
        {/* Contention Header Badge */}
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '20px',
            backgroundColor: isContentionBaseline ? 'var(--ink)' : 'var(--alarm)',
            color: '#f5f3ec',
            fontFamily: 'var(--font-mono)',
            fontSize: '9.5px',
            fontWeight: 700,
            letterSpacing: '2px',
            padding: '3px 14px',
            borderRadius: '12px',
            zIndex: 10,
          }}
        >
          {isContentionBaseline
            ? '2-CHANNEL FACILITY MONITORING · TEARS OF STEEL vs SINTEL'
            : 'CONTENTION SCENARIO · 2 FAILURES vs 1 BACKUP'}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* LEFT COLUMN: CH-14 TEARS OF STEEL (Emergency / Public-Information Tier) */}
          <div style={{ paddingRight: '14px' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>CH-14 · TEARS OF STEEL</span>
              <span
                style={{
                  fontSize: '8.5px',
                  backgroundColor: 'rgba(184, 100, 27, 0.2)',
                  border: '1px solid var(--accent)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontWeight: 700,
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
                border: isContentionBaseline
                  ? '2.5px solid var(--ink)'
                  : ch14Restored
                  ? '3.5px solid var(--restored)'
                  : '3.5px solid var(--alarm)',
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
                  fontSize: '10.5px',
                  padding: '6px 12px',
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
                    backgroundColor: isContentionBaseline
                      ? 'var(--nominal)'
                      : ch14Restored
                      ? 'var(--restored)'
                      : 'var(--alarm)',
                  }}
                />
                {isContentionBaseline
                  ? 'PRIMARY STREAM · LIVE · CH-14'
                  : ch14Restored
                  ? 'BACKUP ACTIVE · CH-14'
                  : 'PRIMARY FAILING · CH-14'}
              </div>

              {/* Bottom Moving Caption Bar */}
              <div
                data-testid="ch14-caption"
                style={{
                  backgroundColor: isContentionBaseline
                    ? 'rgba(22, 20, 15, 0.92)'
                    : ch14Restored
                    ? 'var(--surface)'
                    : 'rgba(8, 6, 4, 0.94)',
                  color: isContentionBaseline
                    ? '#f5f3ec'
                    : ch14Restored
                    ? 'var(--ink)'
                    : 'var(--alarm)',
                  padding: '12px 16px',
                  fontFamily: isContentionBaseline ? 'var(--font-grotesk)' : 'var(--font-mono)',
                  fontSize: isContentionBaseline ? '15px' : '14px',
                  fontWeight: isContentionBaseline ? 600 : 700,
                  textAlign: 'center',
                  borderTop: isContentionBaseline
                    ? '1px solid rgba(255, 255, 255, 0.15)'
                    : ch14Restored
                    ? '2.5px solid var(--ink)'
                    : '2.5px solid var(--alarm)',
                  zIndex: 2,
                }}
              >
                {isContentionBaseline
                  ? leftCaptionText
                  : ch14Restored
                  ? `✓ ${leftCaptionText}`
                  : `⚠ [FROZEN] ${rightCaptionText}`}
              </div>
            </div>

            {/* Left Status Pill */}
            <div
              data-testid="ch14-status-pill"
              style={{
                marginTop: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '20px',
                border: isContentionBaseline
                  ? '1.5px solid var(--nominal)'
                  : ch14Restored
                  ? '2px solid var(--ink)'
                  : '2px solid var(--alarm)',
                backgroundColor: isContentionBaseline
                  ? 'var(--panel-hi)'
                  : ch14Restored
                  ? 'var(--panel-hi)'
                  : 'var(--ink)',
                color: isContentionBaseline
                  ? 'var(--nominal-ink)'
                  : ch14Restored
                  ? 'var(--restored-ink)'
                  : '#f5f3ec',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isContentionBaseline
                    ? 'var(--nominal)'
                    : ch14Restored
                    ? 'var(--restored)'
                    : 'var(--alarm)',
                }}
              />
              {isContentionBaseline
                ? 'CAPTIONS LIVE · IN SYNC'
                : ch14Restored
                ? '✓ PRIORITY RESTORED'
                : 'CAPTIONS FROZEN · ALARM'}
            </div>
          </div>

          {/* RIGHT COLUMN: CH-27 SINTEL (General Entertainment Tier) */}
          <div style={{ borderLeft: '2.5px dashed var(--ink)', paddingLeft: '14px' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                color: isContentionBaseline ? 'var(--text-60)' : 'var(--alarm-ink)',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>CH-27 · SINTEL</span>
              <span
                style={{
                  fontSize: '8.5px',
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(0, 0, 0, 0.2)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontWeight: 700,
                }}
              >
                General Tier
              </span>
            </div>

            {/* Right Movie Player - Sintel */}
            <div
              data-testid="ch27-card"
              className={isContentionBaseline ? '' : 'hatch-alarm'}
              style={{
                height: '320px',
                borderRadius: '8px',
                border: isContentionBaseline ? '2.5px solid var(--ink)' : '3.5px solid var(--alarm)',
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
                src="/media/sintel_source.mp4"
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
                  filter: isContentionBaseline ? 'none' : 'brightness(0.82)',
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
                  fontSize: '10.5px',
                  padding: '6px 12px',
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
                    backgroundColor: isContentionBaseline ? 'var(--nominal)' : 'var(--alarm)',
                  }}
                />
                {isContentionBaseline ? 'PRIMARY STREAM · LIVE · CH-27' : 'PRIMARY FAILING · CH-27'}
              </div>

              {/* Bottom Moving Caption Bar */}
              <div
                data-testid="ch27-caption"
                style={{
                  backgroundColor: isContentionBaseline ? 'rgba(22, 20, 15, 0.92)' : 'rgba(8, 6, 4, 0.94)',
                  color: isContentionBaseline ? '#f5f3ec' : 'var(--alarm)',
                  padding: '12px 16px',
                  fontFamily: isContentionBaseline ? 'var(--font-grotesk)' : 'var(--font-mono)',
                  fontSize: isContentionBaseline ? '15px' : '14px',
                  fontWeight: isContentionBaseline ? 600 : 700,
                  textAlign: 'center',
                  borderTop: isContentionBaseline ? '1px solid rgba(255, 255, 255, 0.15)' : '2.5px solid var(--alarm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  zIndex: 2,
                }}
              >
                {isContentionBaseline ? (
                  sintelCaptionText
                ) : (
                  <>
                    <div className="animate-pulse" style={{ width: '7px', height: '7px', backgroundColor: 'var(--alarm)' }} />
                    ⚠ [FROZEN] {sintelCaptionText}
                  </>
                )}
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
                padding: '7px 14px',
                borderRadius: '20px',
                border: isContentionBaseline
                  ? '1.5px solid var(--nominal)'
                  : '2px solid var(--alarm)',
                backgroundColor: isContentionBaseline ? 'var(--panel-hi)' : 'var(--ink)',
                color: isContentionBaseline ? 'var(--nominal-ink)' : '#f5f3ec',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isContentionBaseline ? 'var(--nominal)' : 'var(--alarm)',
                }}
              />
              {isContentionBaseline
                ? 'CAPTIONS LIVE · IN SYNC'
                : ch27Degraded
                ? 'DEGRADED + FLAGGED · CAPACITY EXHAUSTED'
                : 'CAPTIONS FROZEN · ALARM'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Single-Channel Split View
  return (
    <div
      data-testid="split-hero"
      style={{
        margin: '14px 18px 10px 18px',
        padding: '16px',
        backgroundColor: '#fcfbf7',
        border: '2.5px solid var(--ink)',
        borderRadius: '10px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        position: 'relative',
      }}
    >
      {/* Header Pill */}
      <div
        style={{
          position: 'absolute',
          top: '-12px',
          left: '20px',
          backgroundColor: 'var(--ink)',
          color: '#f5f3ec',
          fontFamily: 'var(--font-mono)',
          fontSize: '9.5px',
          fontWeight: 700,
          letterSpacing: '2px',
          padding: '3px 14px',
          borderRadius: '12px',
          zIndex: 10,
        }}
      >
        THE SPLIT · SINGLE CHANNEL {channelName}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {/* LEFT COLUMN: WHAT MOST PEOPLE SEE */}
        <div style={{ paddingRight: '14px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--text-60)',
              marginBottom: '10px',
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
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0,
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
                fontSize: '10.5px',
                padding: '6px 12px',
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
                backgroundColor: 'rgba(22, 20, 15, 0.92)',
                color: '#f5f3ec',
                padding: '12px 16px',
                fontFamily: 'var(--font-grotesk)',
                fontSize: '15px',
                fontWeight: 600,
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
              padding: '7px 14px',
              borderRadius: '20px',
              border: '1.5px solid var(--nominal)',
              backgroundColor: 'var(--panel-hi)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
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
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: rightState === 'frozen' ? 'var(--alarm-ink)' : 'var(--text-60)',
              marginBottom: '10px',
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
                fontSize: '10.5px',
                padding: '6px 12px',
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
                  padding: '12px 16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
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
                  padding: '12px 16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
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
                  padding: '12px 16px',
                  fontFamily: 'var(--font-grotesk)',
                  fontSize: '15px',
                  fontWeight: 600,
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
              padding: '7px 14px',
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
              fontSize: '11px',
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
              ? '✓ RESTORED · BACKUP ACTIVE'
              : rightState === 'blind'
              ? 'EVIDENCE ABSENT · HOLDING'
              : 'LOOKS FINE · IN SYNC'}
          </div>
        </div>
      </div>

      {/* Live Recording Timecode Counter Overlay */}
      {isPlayingWalkthrough && (
        <div
          data-testid="hero-timecode-overlay"
          style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            zIndex: 100,
            backgroundColor: 'rgba(15, 14, 11, 0.94)',
            border: '1.5px solid #ff9800',
            backdropFilter: 'blur(8px)',
            padding: '6px 14px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'var(--font-mono)',
            color: '#ffffff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          }}
        >
          <span style={{ color: '#ff3d00', fontWeight: 800, fontSize: '11px', letterSpacing: '0.5px' }}>🔴 REC</span>
          <span style={{ fontWeight: 700, fontSize: '13px', color: '#ffb74d', letterSpacing: '0.5px' }}>
            {String(Math.floor(walkthroughElapsedSec / 60)).padStart(2, '0')}:{String(walkthroughElapsedSec % 60).padStart(2, '0')}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>/ 00:55</span>
          <span style={{ color: '#ffcc80', fontSize: '10px', fontWeight: 600, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '8px' }}>
            {walkthroughElapsedSec < 20 && 'HEALTHY BASELINE'}
            {walkthroughElapsedSec >= 20 && walkthroughElapsedSec < 33 && 'ADK INVESTIGATION'}
            {walkthroughElapsedSec >= 33 && walkthroughElapsedSec < 48 && '⏸ OPERATOR GATE (CLICK TARGET: 0:48)'}
            {walkthroughElapsedSec >= 48 && 'FAILOVER RESTORED'}
          </span>
        </div>
      )}
    </div>
  );
};
