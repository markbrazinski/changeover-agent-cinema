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
      {/* Primary Always-Visible Row: Run Demo + Mode + Corner Manual Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        {/* Left Side: Prominent Run Demo & Replay Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isPlayingAutoplay ? (
            <button
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
              ▶ RUN DEMO (NARRATED)
            </button>
          )}

          <button
            onClick={onRunAutoplay}
            disabled={isPlayingAutoplay}
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

          {/* Mode Switcher */}
          <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden', marginLeft: '6px' }}>
            <button
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

        {/* Right Side: Muted Gate Check + Manual Step Buttons Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 640px Muted Gate Toggle */}
          <button
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

      {/* Manual Controls Panel (Hidden by Default, Revealed by 'H' or Gear Toggle) */}
      {isManualOpen && (
        <div
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
            onClick={onReset}
            disabled={isWorking || isPlayingAutoplay}
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
            onClick={onInjectFault}
            disabled={isWorking || isPlayingAutoplay}
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
            onClick={onInvestigate}
            disabled={isWorking || isPlayingAutoplay}
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
            onClick={onVerifyBackup}
            disabled={isWorking || isPlayingAutoplay}
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
            onClick={onAuthorize}
            disabled={isWorking || isPlayingAutoplay}
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
            onClick={onContention}
            disabled={isWorking || isPlayingAutoplay}
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
            onClick={onBlind}
            disabled={isWorking || isPlayingAutoplay}
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
