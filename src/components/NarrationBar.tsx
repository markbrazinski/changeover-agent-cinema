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
        backgroundColor: isPausedForHuman ? '#221908' : '#0c0b08',
        color: '#ffffff',
        padding: '14px 20px',
        borderTop: isPausedForHuman ? '3px solid var(--accent)' : '3px solid var(--ink)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Subtitle Badge Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 12px',
          borderRadius: '5px',
          backgroundColor: isPausedForHuman ? 'var(--accent)' : isPlaying ? 'var(--nominal)' : 'rgba(255, 255, 255, 0.15)',
          color: '#ffffff',
          fontFamily: 'var(--font-mono)',
          fontSize: '10.5px',
          fontWeight: 700,
          letterSpacing: '1.2px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          boxShadow: isPausedForHuman ? '0 0 12px rgba(184, 100, 27, 0.5)' : 'none',
        }}
      >
        <div
          className={isPlaying || isPausedForHuman ? 'animate-pulse' : ''}
          style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#fff' }}
        />
        {isPausedForHuman ? '⏸ OPERATOR ACTION REQUIRED' : isPlaying ? 'DEMO NARRATION' : 'NARRATION'}
      </div>

      {/* Narration Text Content - Bumped Size & Contrast */}
      <div
        data-testid="narration-text"
        style={{
          fontFamily: 'var(--font-grotesk)',
          fontSize: '14.5px',
          fontWeight: 600,
          color: '#ffffff',
          letterSpacing: '0.2px',
          lineHeight: 1.4,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
        }}
      >
        "{text}"
      </div>
    </div>
  );
};
