import React from 'react';
import { Mode } from '../api/agentClient';

interface DemoControlHeaderProps {
  mode: Mode;
  onSetMode: (m: Mode) => void;
  currentStage: string;
  isWorking: boolean;
  isDesaturated: boolean;
  onToggleDesaturate: () => void;
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
  isDesaturated,
  onToggleDesaturate,
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
        maxWidth: '1200px',
        backgroundColor: '#0f0e0b',
        color: '#f5f3ec',
        padding: '12px 18px',
        borderRadius: '13px 13px 0 0',
        border: '2.5px solid var(--ink)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Top Bar: Mode Switcher & Muted Gate Check */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', color: 'var(--accent)' }}>
            DEMO OPERATOR CONTROL
          </span>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
            <button
              onClick={() => onSetMode('deterministic')}
              style={{
                padding: '4px 10px',
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
                padding: '4px 10px',
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

        {/* 640px Muted Gate Toggle */}
        <button
          onClick={onToggleDesaturate}
          style={{
            padding: '4px 10px',
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
          640px Muted Gate: {isDesaturated ? 'ON (grayscale)' : 'OFF'}
        </button>
      </div>

      {/* Action Buttons Pipeline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={onReset}
          disabled={isWorking}
          style={{
            padding: '6px 12px',
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
          01 Reset (At Rest)
        </button>

        <button
          onClick={onInjectFault}
          disabled={isWorking}
          style={{
            padding: '6px 12px',
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
          02 Inject Freeze Fault
        </button>

        <button
          onClick={onInvestigate}
          disabled={isWorking}
          style={{
            padding: '6px 12px',
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
          03 Investigate (Query MCP)
        </button>

        <button
          onClick={onVerifyBackup}
          disabled={isWorking}
          style={{
            padding: '6px 12px',
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
          04 Verify Backup (ffprobe)
        </button>

        <button
          onClick={onAuthorize}
          disabled={isWorking}
          style={{
            padding: '6px 12px',
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
          05/06 Authorize Failover
        </button>

        <button
          onClick={onContention}
          disabled={isWorking}
          style={{
            padding: '6px 12px',
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
          09–12 Contention Scenario
        </button>

        <button
          onClick={onBlind}
          disabled={isWorking}
          style={{
            padding: '6px 12px',
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

      {/* Working / Loading Banner */}
      {isWorking && (
        <div
          style={{
            backgroundColor: 'var(--accent)',
            color: '#f5f3ec',
            padding: '5px 10px',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)',
            fontSize: '8.5px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div className="animate-spin" style={{ width: '12px', height: '12px', border: '1.5px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
          WORKING... ({mode === 'real' ? 'Executing real Grafana Cloud query + Gemini ADK reasoning' : 'Processing deterministic server state'})
        </div>
      )}
    </div>
  );
};
