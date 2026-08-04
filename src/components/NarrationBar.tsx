import React from 'react';

interface NarrationBarProps {
  text: string;
  isPlaying?: boolean;
  isPausedForHuman?: boolean;
}

export const NarrationBar: React.FC<NarrationBarProps> = ({ text, isPlaying = false, isPausedForHuman = false }) => {
  if (!text) return null;

  return (
    <div
      data-testid="narration-bar"
      style={{
        width: '100%',
        backgroundColor: isPausedForHuman ? '#1a1408' : '#110f0c',
        color: '#f5f3ec',
        padding: '12px 18px',
        borderTop: isPausedForHuman ? '2.5px solid var(--accent)' : '2.5px solid var(--ink)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Subtitle Badge Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '4px',
          backgroundColor: isPausedForHuman ? 'var(--accent)' : isPlaying ? 'var(--nominal)' : 'rgba(255, 255, 255, 0.12)',
          color: '#f5f3ec',
          fontFamily: 'var(--font-mono)',
          fontSize: '9.5px',
          fontWeight: 700,
          letterSpacing: '1px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <div
          className={isPlaying || isPausedForHuman ? 'animate-pulse' : ''}
          style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fff' }}
        />
        {isPausedForHuman ? '⏸ WAITING FOR HUMAN OPERATOR' : isPlaying ? 'DEMO NARRATION' : 'NARRATION'}
      </div>

      {/* Narration Text Content */}
      <div
        style={{
          fontFamily: 'var(--font-grotesk)',
          fontSize: '13px',
          fontWeight: 600,
          color: '#f5f3ec',
          letterSpacing: '0.2px',
          lineHeight: 1.35,
        }}
      >
        "{text}"
      </div>
    </div>
  );
};
