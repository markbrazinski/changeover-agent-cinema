import React from 'react';
import { Mode } from '../api/agentClient';

interface DemoControlHeaderProps {
  mode: Mode;
  onSetMode: (m: Mode) => void;
  currentStage: string;
  isWorking: boolean;
  isPlayingAutoplay: boolean;
  onRunAutoplay: () => void;
  onStopAutoplay: () => void;
  isDesaturated: boolean;
  onToggleDesaturate: () => void;
  isManualOpen: boolean;
  onToggleManualOpen: () => void;
  onReset: () => void;
  onInjectFault: () => void;
  onInvestigate: () => void;
  onVerifyBackup: () => void;
  onAuthorize: () => void;
  onContention: () => void;
  onBlind: () => void;
  isPlayingWalkthrough?: boolean;
  walkthroughElapsedSec?: number;
}

export const DemoControlHeader: React.FC<DemoControlHeaderProps> = ({
  mode,
  onSetMode,
  currentStage,
  isWorking,
  isPlayingAutoplay,
  onRunAutoplay,
  onStopAutoplay,
  isDesaturated,
  onToggleDesaturate,
  isManualOpen,
  onToggleManualOpen,
  onReset,
  onInjectFault,
  onInvestigate,
  onVerifyBackup,
  onAuthorize,
  onContention,
  onBlind,
  isPlayingWalkthrough = false,
  walkthroughElapsedSec = 0,
}) => {
  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#0f0e0b',
        color: '#f5f3ec',
        padding: '12px 20px',
        borderRadius: '13px 13px 0 0',
        border: '2.5px solid var(--ink)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Primary Always-Visible Row: Start Demo + Mode + Corner Controls Gear */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        {/* Left Side: Prominent Start Demo & Replay Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isPlayingAutoplay ? (
            <button
              data-testid="start-demo-button"
              onClick={onStopAutoplay}
              style={{
                padding: '8px 18px',
                backgroundColor: 'var(--alarm)',
                color: '#f5f3ec',
                border: 'none',
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(180,35,28,0.4)',
              }}
            >
              ■ PAUSE DEMO
            </button>
          ) : (
            <button
              data-testid="start-demo-button"
              onClick={onRunAutoplay}
              style={{
                padding: '8px 18px',
                backgroundColor: 'var(--nominal)',
                color: '#f5f3ec',
                border: 'none',
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(59,122,75,0.4)',
              }}
            >
              ▶ START DEMO (USE CASE 1)
            </button>
          )}

          <button
            data-testid="replay-button"
            onClick={onRunAutoplay}
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              color: '#f5f3ec',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ↺ REPLAY
          </button>

          {/* Live Recording Timecode Counter Badge */}
          {isPlayingWalkthrough && (
            <div
              data-testid="timecode-counter-badge"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#1a0d00',
                border: '1.5px solid #ff9800',
                padding: '5px 12px',
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                color: '#ffe0b2',
                boxShadow: '0 0 12px rgba(255,152,0,0.3)',
              }}
            >
              <span style={{ color: '#ff3d00', fontSize: '11px' }}>🔴 REC TIMECODE:</span>
              <span style={{ color: '#ffffff', fontSize: '12px', letterSpacing: '0.5px' }}>
                {String(Math.floor(walkthroughElapsedSec / 60)).padStart(2, '0')}:{String(walkthroughElapsedSec % 60).padStart(2, '0')} / 00:55
              </span>
              <span style={{ color: '#ffb74d', fontSize: '10px', textTransform: 'uppercase' }}>
                {walkthroughElapsedSec < 20 && '· HEALTHY BASELINE (0:00–0:20)'}
                {walkthroughElapsedSec >= 20 && walkthroughElapsedSec < 33 && '· CAPTION FREEZE & ADK INVESTIGATION'}
                {walkthroughElapsedSec >= 33 && walkthroughElapsedSec < 48 && '· ⏸ OPERATOR GATE (CLICK TARGET: 0:48)'}
                {walkthroughElapsedSec >= 48 && '· FAILOVER RESTORED (0:48–0:55)'}
              </span>
            </div>
          )}

          {/* Mode Switcher */}
          <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden', marginLeft: '6px' }}>
            <button
              data-testid="mode-deterministic-button"
              onClick={() => onSetMode('deterministic')}
              style={{
                padding: '5px 10px',
                backgroundColor: mode === 'deterministic' ? '#f5f3ec' : 'transparent',
                color: mode === 'deterministic' ? '#16140f' : '#f5f3ec',
                border: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '8.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              DETERMINISTIC
            </button>
            <button
              data-testid="mode-real-button"
              onClick={() => onSetMode('real')}
              style={{
                padding: '5px 10px',
                backgroundColor: mode === 'real' ? 'var(--alarm)' : 'transparent',
                color: '#f5f3ec',
                border: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '8.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              REAL (ADK + GRAFANA)
            </button>
          </div>
        </div>

        {/* Right Side: Muted Gate Check + Manual Step Buttons Gear Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 640px Muted Gate Toggle */}
          <button
            data-testid="muted-gate-button"
            onClick={onToggleDesaturate}
            style={{
              padding: '5px 10px',
              backgroundColor: isDesaturated ? '#f5f3ec' : 'rgba(255, 255, 255, 0.1)',
              color: isDesaturated ? '#16140f' : '#f5f3ec',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '8.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            640px Muted Gate: {isDesaturated ? 'ON' : 'OFF'}
          </button>

          {/* Toggle Manual Step Panel */}
          <button
            data-testid="toggle-manual-controls-button"
            onClick={onToggleManualOpen}
            style={{
              padding: '5px 10px',
              backgroundColor: isManualOpen ? 'rgba(255,255,255,0.25)' : 'rgba(255, 255, 255, 0.08)',
              color: '#f5f3ec',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '8.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ⚙ Manual Controls (Press 'H')
          </button>
        </div>
      </div>

      {/* Manual Step Controls Panel (HIDDEN BY DEFAULT, Revealed by 'H' or Gear Toggle) */}
      {isManualOpen && (
        <div
          data-testid="manual-controls-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            paddingTop: '8px',
            borderTop: '1px dashed rgba(255, 255, 255, 0.18)',
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8.5px', color: 'var(--accent)', fontWeight: 700 }}>
            MANUAL OVERRIDES:
          </span>

          <button
            data-testid="manual-reset-button"
            onClick={onReset}
            disabled={isWorking}
            style={{
              padding: '5px 10px',
              backgroundColor: 'rgba(255,255,255,0.12)',
              color: '#f5f3ec',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '8.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            01 Reset
          </button>

          <button
            data-testid="manual-inject-button"
            onClick={onInjectFault}
            disabled={isWorking}
            style={{
              padding: '5px 10px',
              backgroundColor: 'var(--alarm)',
              color: '#f5f3ec',
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '8.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            02 Inject Fault
          </button>

          <button
            data-testid="manual-investigate-button"
            onClick={onInvestigate}
            disabled={isWorking}
            style={{
              padding: '5px 10px',
              backgroundColor: 'var(--accent)',
              color: '#f5f3ec',
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '8.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            03 Investigate
          </button>

          <button
            data-testid="manual-verify-button"
            onClick={onVerifyBackup}
            disabled={isWorking}
            style={{
              padding: '5px 10px',
              backgroundColor: 'rgba(255,255,255,0.12)',
              color: '#f5f3ec',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '8.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            04 Verify Backup
          </button>

          <button
            data-testid="manual-authorize-button"
            onClick={onAuthorize}
            disabled={isWorking}
            style={{
              padding: '5px 10px',
              backgroundColor: 'var(--nominal)',
              color: '#f5f3ec',
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '8.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            05/06 Authorize
          </button>

          <button
            data-testid="manual-contention-button"
            onClick={onContention}
            disabled={isWorking}
            style={{
              padding: '5px 10px',
              backgroundColor: '#1d6e8c',
              color: '#f5f3ec',
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '8.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            09–12 Contention
          </button>

          <button
            data-testid="manual-blind-button"
            onClick={onBlind}
            disabled={isWorking}
            style={{
              padding: '5px 10px',
              backgroundColor: '#3b3a34',
              color: '#f5f3ec',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '8.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            08 Blind Refusal
          </button>
        </div>
      )}
    </div>
  );
};
