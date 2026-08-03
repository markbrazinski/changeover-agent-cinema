import React from 'react';
import { SCREEN_STATES } from '../data/traceModule';

interface LeftNavProps {
  activeStateId: string;
  onSelectState: (id: string) => void;
  isDesaturated: boolean;
  onToggleDesaturate: () => void;
}

export const LeftNav: React.FC<LeftNavProps> = ({
  activeStateId,
  onSelectState,
  isDesaturated,
  onToggleDesaturate,
}) => {
  const incidentStates = ['00', '01', '02', '03', '04', '05', '06', '07', '08'];
  const contentionStates = ['09', '10', '11', '12'];

  return (
    <nav
      style={{
        width: '262px',
        backgroundColor: '#16140f',
        color: '#f5f3ec',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        borderRadius: '13px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        height: 'fit-content',
        position: 'sticky',
        top: '24px',
      }}
    >
      {/* Header */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, letterSpacing: '2px' }}>
          CHANGEOVER
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', opacity: 0.6, marginTop: '2px' }}>
          13-state broadcast harm view
        </div>
      </div>

      {/* Muted-Gate Check Toggle */}
      <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '12px' }}>
        <button
          onClick={onToggleDesaturate}
          style={{
            width: '100%',
            padding: '8px 10px',
            backgroundColor: isDesaturated ? '#f5f3ec' : 'rgba(255,255,255,0.08)',
            color: isDesaturated ? '#16140f' : '#f5f3ec',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '8px',
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>640px Muted Gate Check</span>
          <span>{isDesaturated ? 'ON (grayscale)' : 'OFF'}</span>
        </button>
      </div>

      {/* Incident Path Section */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', fontWeight: 700, letterSpacing: '1px', opacity: 0.5, marginBottom: '8px' }}>
          INCIDENT PATH (SINGLE CHANNEL)
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {incidentStates.map((id) => {
            const state = SCREEN_STATES[id];
            const isActive = activeStateId === id;
            return (
              <button
                key={id}
                onClick={() => onSelectState(id)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: isActive ? '#f5f3ec' : 'transparent',
                  color: isActive ? '#16140f' : '#f5f3ec',
                  border: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  fontWeight: isActive ? 700 : 400,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{state.title}</span>
                {state.refusalType && (
                  <span style={{ fontSize: '7px', backgroundColor: 'var(--alarm)', color: '#fff', padding: '1px 4px', borderRadius: '3px' }}>
                    REFUSE
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contention Section */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', fontWeight: 700, letterSpacing: '1px', opacity: 0.5, marginBottom: '8px' }}>
          CONTENTION (FACILITY VIEW)
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {contentionStates.map((id) => {
            const state = SCREEN_STATES[id];
            const isActive = activeStateId === id;
            return (
              <button
                key={id}
                onClick={() => onSelectState(id)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: isActive ? '#f5f3ec' : 'transparent',
                  color: isActive ? '#16140f' : '#f5f3ec',
                  border: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  fontWeight: isActive ? 700 : 400,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{state.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Navigation Tip */}
      <div style={{ marginTop: 'auto', borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '10px', fontFamily: 'var(--font-mono)', fontSize: '7px', opacity: 0.5, lineHeight: 1.4 }}>
        use list above or ←→ keys to walk screens · desaturate proves alarm survives grayscale
      </div>
    </nav>
  );
};
